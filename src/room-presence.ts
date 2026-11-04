import mqtt from 'mqtt'
import type { MqttClient } from 'mqtt'

export type RoomParticipant = { id: string; name: string; joinedAt: number; isHost: boolean }
export type RoomAction = { type: 'blow' | 'relight' | 'lamp' | 'lights' | 'candles' | 'state'; value?: number | boolean; state?: {candles:number;lit:boolean;lamp:boolean;lights:boolean} }
type Envelope = { v: 1; eventId: string; kind: 'hello' | 'offline' | 'bye' | 'action'; participant: RoomParticipant; action?: RoomAction; sentAt: number }
type Options = { roomId: string; self: RoomParticipant; onParticipants: (people: RoomParticipant[]) => void; onStatus: (connected: boolean) => void; onAction: (action: RoomAction, actor: RoomParticipant) => void; onStateRequest?: () => void }
const relays = [{url:'wss://broker.emqx.io:8084/mqtt',username:undefined,password:undefined},{url:'wss://public.cloud.shiftr.io',username:'public',password:'public'}]
const encoder = new TextEncoder(), decoder = new TextDecoder()

// Only ciphertext is sent to the relay. The unguessable invitation ID is the room capability.
export async function createRoomPresence(options: Options) {
  const keyBytes = await crypto.subtle.digest('SHA-256', encoder.encode(`little-table:key:v1:${options.roomId}`))
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt'])
  const topicBytes = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(`little-table:topic:v1:${options.roomId}`)))
  const topic = `neon-little-table/v1/${Array.from(topicBytes, b => b.toString(16).padStart(2, '0')).join('')}`
  async function seal(message: Envelope) {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(message))))
    const bytes = new Uint8Array(12 + encrypted.length); bytes.set(iv); bytes.set(encrypted, 12)
    return btoa(String.fromCharCode(...bytes))
  }
  async function open(payload: string): Promise<Envelope | null> {
    if (payload.length > 10000) return null
    try {
      const bytes = Uint8Array.from(atob(payload), char => char.charCodeAt(0)); if (bytes.length < 29) return null
      const decoded = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, key, bytes.slice(12))
      const message = JSON.parse(decoder.decode(decoded)) as Envelope, person = message.participant
      if (message.v !== 1 || typeof message.eventId !== 'string' || !person || typeof person.id !== 'string' || person.id.length > 80 || typeof person.name !== 'string' || !person.name.trim() || [...person.name].length > 20 || !Number.isFinite(person.joinedAt) || typeof person.isHost !== 'boolean') return null
      if (!['hello', 'offline', 'bye', 'action'].includes(message.kind)) return null
      return message
    } catch { return null }
  }
  const clients: MqttClient[] = [], connected = new Set<number>()
  const people = new Map<string, { participant: RoomParticipant; channels: Map<number, number> }>()
  const seen = new Map<string, number>()
  let stopped = false
  const envelope = (kind: Envelope['kind'], action?: RoomAction): Envelope => ({ v: 1, eventId: crypto.randomUUID(), kind, participant: options.self, action, sentAt: Date.now() })
  function roster() {
    const participants = [options.self, ...Array.from(people.values(), entry => entry.participant)]
    participants.sort((a, b) => Number(b.isHost) - Number(a.isHost) || a.joinedAt - b.joinedAt || a.id.localeCompare(b.id))
    options.onParticipants(participants)
  }
  async function send(kind: Envelope['kind'], action?: RoomAction, onlyRelay?: number) {
    if (stopped) return
    const payload = await seal(envelope(kind, action)); if (stopped) return
    clients.forEach((client, index) => { if (client.connected && (onlyRelay === undefined || index === onlyRelay)) client.publish(topic, payload, { qos: 0, retain: false }) })
  }
  async function receive(payload: string, relay: number) {
    const message = await open(payload)
    if (!message || stopped || message.participant.id === options.self.id) return
    const id = message.participant.id
    if (message.kind === 'offline') {
      const entry = people.get(id); if (!entry) return; entry.channels.delete(relay)
      if (!entry.channels.size) { people.delete(id); roster() }
      return
    }
    if (message.kind === 'bye') { if (people.delete(id)) roster(); return }
    const existing = people.get(id)
    const entry = existing || { participant: message.participant, channels: new Map<number, number>() }
    entry.channels.set(relay, Date.now()); entry.participant = message.participant; people.set(id, entry)
    if (!existing) { roster(); void send('hello', undefined, relay) }
    if (seen.has(message.eventId)) return
    seen.set(message.eventId, Date.now())
    if(message.kind==='hello'&&options.self.isHost)options.onStateRequest?.()
    if (message.kind === 'action' && message.action) {
      const action = message.action
      if(action.type==='state'){const latestCreator=[options.self,...Array.from(people.values(),entry=>entry.participant)].filter(person=>person.isHost).sort((a,b)=>b.joinedAt-a.joinedAt||b.id.localeCompare(a.id))[0];if(latestCreator&&latestCreator.id!==message.participant.id)return}
      if (action.type === 'candles' && (!message.participant.isHost || !Number.isInteger(action.value) || Number(action.value) < 0 || Number(action.value) > 30)) return
      if ((action.type === 'lamp' || action.type === 'lights') && typeof action.value !== 'boolean') return
      if(action.type==='state'&&(!message.participant.isHost||!action.state||!Number.isInteger(action.state.candles)||action.state.candles<0||action.state.candles>30||typeof action.state.lit!=='boolean'||typeof action.state.lamp!=='boolean'||typeof action.state.lights!=='boolean'))return
      if (['blow', 'relight', 'lamp', 'lights', 'candles','state'].includes(action.type)) options.onAction(action, message.participant)
    }
  }
  const willPayload = await seal(envelope('offline'))
  relays.forEach(({url,username,password}, index) => {
    const client = mqtt.connect(url, { username,password,clientId: `nt_${options.self.id.replaceAll('-', '').slice(0, 16)}_${index}`, clean: true, keepalive: 20, reconnectPeriod: 3000, connectTimeout: 12000, queueQoSZero: false, will: { topic, payload: willPayload, qos: 0, retain: false } })
    clients.push(client)
    client.on('connect', () => {
      if (stopped) return
      client.subscribe(topic, { qos: 0 }, error => { if (!error) { connected.add(index); options.onStatus(true); void send('hello', undefined, index) } })
    })
    client.on('message', (_topic, payload) => { void receive(payload.toString(), index) })
    const disconnect = () => { connected.delete(index); if (!stopped) options.onStatus(connected.size > 0) }
    client.on('close', disconnect); client.on('offline', disconnect); client.on('error', disconnect)
  })
  roster(); options.onStatus(false)
  const heartbeat = setInterval(() => {
    void send('hello')
    const now = Date.now(); let changed = false
    for (const [id, entry] of people) { for (const [channel, lastSeen] of entry.channels) if (now - lastSeen > 75000) entry.channels.delete(channel); if (!entry.channels.size) { people.delete(id); changed = true } }
    for (const [id, at] of seen) if (now - at > 120000) seen.delete(id)
    if (changed) roster()
  }, 8000)
  // MQTT last-will also handles abrupt tab/network closure; no retained guest records.
  const goodbye = await seal(envelope('bye'))
  function stop() {
    if (stopped) return
    stopped = true; clearInterval(heartbeat)
    for (const client of clients) { if (client.connected) client.publish(topic, goodbye, { qos: 0, retain: false }); client.end(false) }
  }
  window.addEventListener('pagehide', event => { if (!event.persisted) stop() })
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !stopped) void send('hello') })
  return { sendAction(action: RoomAction) { return send('action', action) }, announce() { return send('hello') }, stop }
}
