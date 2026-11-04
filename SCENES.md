# Scene selection and restoration

The active experience is selected in `src/scene-choice.ts`.

- `room`: the warm dining room and interactive birthday cake.
- `space`: the preserved complete lunar/planetary experience, including the original visuals, companions, minimaps, spacewalk, sparkles, destinations, and descent.

When the user asks to bring the universe back (for example, “우주 불러와줘”), change ACTIVE_SCENE to `space` and restore the space title, theme-color and description in index.html. Build and deploy as usual. Do not rebuild or redesign the archived space scene.

The space source is `src/space.ts`, with its unchanged stylesheet in `src/space.css`. It was preserved from commit c18be69; only its stylesheet import path changed. Its other modules and assets remain in place. The room uses an independent stylesheet; styles do not leak between scenes.

The dining room opens a blank “누구인가요?” entry form for one person's own name on every entry; names are not prefilled or saved. One character, chair and nameplate are created for that person. The room creator also sees the initial candle-count field (0–30, default 0 for new rooms) and, after entry, a separate candle settings dialog with no name field. Invitees see only the name entry and inherit the creator's candle count from the invitation URL.

A new root visit creates a room ID in the URL fragment; creator status is stored under a per-room localStorage key in that browser. The creator can copy an invitation link. Creator ownership is still a browser-local UI role. Live multi-device membership and shared actions now use `src/room-presence.ts`: two redundant MQTT-over-WebSocket relays (EMQX and Shiftr public brokers), AES-GCM encrypted payloads keyed from the unguessable room invitation ID, no retained user records, periodic presence, and last-will departure cleanup. Names, chairs and characters update on entry/exit; candle actions and lamp/room lights are synchronized, and the creator supplies the latest room snapshot to new or reconnecting guests. A connection status is shown instead of silently implying remote synchronization.

The current relay infrastructure is public/shared and has no uptime guarantee. Creator authorization is a client UI role, not server-enforced authentication against a malicious invited participant. For a production service with stronger identity and availability requirements, replace the relays with an owned room service. Browser refresh requires entering one's own name again, with a new participant session ID.

## Confirmed gathering preference

The user selected invite-only gatherings on 2026-11-04. Future multi-user presence must be scoped to invited rooms, not a shared public room for everyone visiting the site. Invite links now connect actual remote participants; do not replace live membership with manually entered names or a fake local visitor count.


## Mobile room navigation

Portrait phones use a wider camera view and fitted starting distance. One pointer orbits, two pointers pinch to zoom and pan the view; the reset-view button restores the fitted composition. Touch actions are separate from lamp taps. Safe-area spacing, 44px phone controls and a landscape layout are defined in `src/room.css`. Only the room scene changed; the archived space scene remains intact.

New rooms start with zero candles. Zero is a valid shared setting; the cake has no visible candles or candle light, and blowing/relighting is disabled until the creator adds at least one. The creator entry form always starts at zero, including old room URLs and browsers that previously saved a nonzero count. Old saved candle keys are removed on creator entry. Settings chosen after entry stay active during that visit and are sent to invitees; guests inherit the configured link/live room count.
