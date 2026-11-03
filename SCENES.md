# Scene selection and restoration

The active experience is selected in `src/scene-choice.ts`.

- `room`: the warm dining room and interactive birthday cake.
- `space`: the preserved complete lunar/planetary experience, including the original visuals, companions, minimaps, spacewalk, sparkles, destinations, and descent.

When the user asks to bring the universe back (for example, “우주 불러와줘”), change ACTIVE_SCENE to `space` and restore the space title, theme-color and description in index.html. Build and deploy as usual. Do not rebuild or redesign the archived space scene.

The space source is `src/space.ts`, with its unchanged stylesheet in `src/space.css`. It was preserved from commit c18be69; only its stylesheet import path changed. Its other modules and assets remain in place. The room uses an independent stylesheet; styles do not leak between scenes.

The dining room opens a blank “누구인가요?” entry form for one person's own name on every entry; names are not prefilled or saved. One character, chair and nameplate are created for that person. The room creator also sees the initial candle-count field (1–30) and, after entry, a separate candle settings dialog with no name field. Invitees see only the name entry and inherit the creator's candle count from the invitation URL.

A new root visit creates a room ID in the URL fragment; creator status and candle settings are stored under per-room localStorage keys in that browser. The creator can copy an invitation link. These are local UI roles and portable initial cake settings, not server-enforced authentication or synchronized multi-device presence. Remote multi-user presence and server-authoritative room settings remain unconnected.

## Confirmed gathering preference

The user selected invite-only gatherings on 2026-11-04. Future multi-user presence must be scoped to invited rooms, not a shared public room for everyone visiting the site. Invitation links and remote presence are not part of the initial single-user scene.
