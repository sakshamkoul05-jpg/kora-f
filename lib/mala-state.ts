/**
 * The mala rail's traversal rule, extracted as a pure state machine so the
 * load-bearing invariant can actually be tested rather than eyeballed.
 *
 * THE INVARIANT: the guru bead is never crossed. A mala is counted up to the
 * guru bead and then the strand is REVERSED — it is never counted past it and
 * never wrapped around to the start. So `active` must never step from the last
 * index directly to 0 (or vice versa) as though the strand were a ring.
 *
 * See lib/mala-state.test.ts, which asserts exactly that.
 */

export type Pass = "outward" | "return";

export type RailState = {
  active: number;
  pass: Pass;
  /** True during the pause at the guru bead, before the strand turns. */
  turning: boolean;
};

export const initialRailState: RailState = {
  active: 0,
  pass: "outward",
  turning: false,
};

export type Transition = {
  state: RailState;
  /** Caller should start the guru-bead pause timer, then call `completeTurn`. */
  scheduleTurn: boolean;
};

/** Advance the rail to whichever section is now in view. */
export function railTransition(
  state: RailState,
  nextIndex: number,
  lastIndex: number
): Transition {
  if (nextIndex === state.active) return { state, scheduleTurn: false };

  const next: RailState = { ...state, active: nextIndex };

  // Reached the guru bead on an outward pass: hold, then reverse.
  if (nextIndex === lastIndex && state.pass === "outward") {
    return { state: { ...next, turning: true }, scheduleTurn: true };
  }

  // Back at the origin after a return pass: a fresh circuit begins.
  if (nextIndex === 0 && state.pass === "return") {
    return { state: { ...next, pass: "outward" }, scheduleTurn: false };
  }

  return { state: next, scheduleTurn: false };
}

/** Called when the pause at the guru bead elapses. The strand is now reversed. */
export function completeTurn(state: RailState): RailState {
  return { ...state, pass: "return", turning: false };
}
