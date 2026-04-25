# Task: Versus skill cooldown (usable once every 5 turns per player)

## Plan Steps
- [ ] 1. Replace one-time skill flags usage logic with per-player cooldown counters in `app/versus-battle.tsx`
- [ ] 2. Update `activateSkill()` guard + apply cooldown on use
- [ ] 3. Decrement only the active player's cooldown when their turn starts in `nextTurn()`
- [ ] 4. Update skill badge disable state and label to show cooldown `(CD: X)`
- [ ] 5. Verify flow with type-safe checks / quick validation

Current progress: Starting step 1.
