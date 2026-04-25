# Pre-battle Time Limit Updates

## Plan Implementation Steps

### 1. Update app/map.tsx [x] Done
- Add `timePerQuestion` to LEVELS array:
  | Level | Time |
  |-------|------|
  | 1     | 15s |
  | 2     | 18s |
  | 3     | 19s |
  | 4     | 20s |
  | 5     | 21s |
  | 6     | 22s |
  | 7     | 25s (dynamic base) |
- Pass `timePerQuestion: level.timePerQuestion` in router.push params to pre-battle.

### 2. Update app/pre-battle.tsx [x] Done
- Read `timePerQuestion` from useLocalSearchParams()
- Dynamic TIME LIMIT display: `${timePerQuestion}s / Q` (lv7: "22-27s / Q (dynamic)")
- Pass `timePerQuestion` in params to battle.

### 3. Update app/battle.tsx [x] Done
- Read `timePerQuestion` from params, use if provided else LEVEL_TIMES[level]
- For level===7: make dynamic e.g. `baseTime = 20 + Math.floor(Math.random() * 8)` (22-27s range)
- Ensure gear bonus applies to dynamic base.

### 4. Testing
- Navigate map -> pre-battle: verify dynamic display per level
- Start battle: verify timer starts with correct initialTime + gear bonus
- Lv7: verify random time each battle

### 5. Completion
- Update this TODO with [x] marks
- attempt_completion
