// constants/devMode.ts
// Centralized dev mode gate.
// IS_DEV_BUILD is true during development (expo start) and false in production.
// The actual dev mode activation is controlled by a toggle in the game store.
// The toggle is only visible/available when IS_DEV_BUILD is true.

export const IS_DEV_BUILD = __DEV__;
