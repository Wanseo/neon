export const ANIMAL_SPECIES = ['cat', 'rabbit', 'bear', 'dog', 'fox', 'sheep', 'penguin', 'frog', 'deer'] as const
export type AnimalSpecies = typeof ANIMAL_SPECIES[number]
export type AnimalStyle = { kind: 'animal'; species: AnimalSpecies; label: string; fur: string; detail: string; outfit: string; accent: string }
export type RoomAvatarStyle = AnimalStyle | { kind: 'human'; role: 'dad' | 'mom' | 'daughter'; label: string; outfit: string; hair: string }
const animals: Record<AnimalSpecies, Omit<AnimalStyle, 'kind' | 'species'>> = {
  cat: { label: '살구 고양이', fur: '#d8ae86', detail: '#f3dfc1', outfit: '#8ca59b', accent: '#c9af82' },
  rabbit: { label: '라벤더 토끼', fur: '#c2b4ce', detail: '#ead2d5', outfit: '#92a794', accent: '#e4d5b4' },
  bear: { label: '꿀빛 곰', fur: '#ad8a6a', detail: '#dfc5a0', outfit: '#8da5b2', accent: '#d9c28d' },
  dog: { label: '오트밀 강아지', fur: '#d7cdb8', detail: '#8d8176', outfit: '#b394a5', accent: '#e0c9a6' },
  fox: { label: '노을 여우', fur: '#c69177', detail: '#f1dfc5', outfit: '#ac9b78', accent: '#cfb3a5' },
  sheep: { label: '구름 양', fur: '#e4ddcf', detail: '#b4a79b', outfit: '#9caabb', accent: '#d8c6ab' },
  penguin: { label: '안개 펭귄', fur: '#7d949e', detail: '#eee4cc', outfit: '#a6ae92', accent: '#c9a574' },
  frog: { label: '이끼 개구리', fur: '#a5bba7', detail: '#e1d9bd', outfit: '#b09b87', accent: '#c9b5ca' },
  deer: { label: '헤이즐 사슴', fur: '#b69f8f', detail: '#e4cfb5', outfit: '#ada1ba', accent: '#c5ae85' }
}

export function resolveRoomAvatar(name: string, participantId: string): RoomAvatarStyle {
  const normalized = name.trim().normalize('NFKC')
  if (normalized === '아빠') return { kind: 'human', role: 'dad', label: '아빠', outfit: '#adc5a8', hair: '#76513a' }
  if (normalized === '엄마') return { kind: 'human', role: 'mom', label: '엄마', outfit: '#eee4cc', hair: '#3b362f' }
  if (normalized === '딸') return { kind: 'human', role: 'daughter', label: '딸', outfit: '#e4a0bb', hair: '#693e2e' }
  // The session ID is random, but every device derives the same animal for that guest.
  let hash = 2166136261
  for (const char of participantId) hash = Math.imul(hash ^ char.codePointAt(0)!, 16777619) >>> 0
  const species = ANIMAL_SPECIES[hash % ANIMAL_SPECIES.length]
  return { kind: 'animal', species, ...animals[species] }
}
