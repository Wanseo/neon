# Scene selection and restoration

The active experience is selected in `src/scene-choice.ts`.

- `room`: the warm dining room and interactive birthday cake.
- `space`: the preserved complete lunar/planetary experience, including the original visuals, companions, minimaps, spacewalk, sparkles, destinations, and descent.

When the user asks to bring the universe back (for example, “우주 불러와줘”), change ACTIVE_SCENE to `space` and restore the space title, theme-color and description in index.html. Build and deploy as usual. Do not rebuild or redesign the archived space scene.

The space source is `src/space.ts`, with its unchanged stylesheet in `src/space.css`. It was preserved from commit c18be69; only its stylesheet import path changed. Its other modules and assets remain in place. The room uses an independent stylesheet; styles do not leak between scenes.

The dining room opens an entry form for names (up to 8, comma/newline separated) and candle count (1–30). `setGuests` in `src/room.ts` creates/removes one named character, chair and place setting per manually entered participant. The first participant is the local user. Setup is saved in localStorage and editable via the table setup button. Remote multi-device presence is not yet connected; manually entered names represent the planned gathering, not live remote connections.

## Confirmed gathering preference

The user selected invite-only gatherings on 2026-11-04. Future multi-user presence must be scoped to invited rooms, not a shared public room for everyone visiting the site. Invitation links and remote presence are not part of the initial single-user scene.
