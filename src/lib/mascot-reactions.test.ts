import { describe, expect, it } from "vitest";
import { nextPoke } from "./mascot-reactions";

describe("mascot poke threshold", () => {
  it("recoils without crying for the first three clicks", () => {
    expect([0, 1, 2].map((count) => nextPoke(count).cries)).toEqual([false, false, false]);
  });
  it("cries after more than three clicks", () => {
    expect(nextPoke(3)).toEqual({ clicks: 4, cries: true });
  });
});