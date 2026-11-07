import { describe, expect, it } from "vitest";
import { clampWidgetSize } from "./widget-size";

describe("expanded widget sizing", () => {
  it("keeps the composer and voice content usable at the minimum size", () => {
    expect(clampWidgetSize(100, 100, 1280, 1800)).toEqual({ width: 320, height: 420 });
  });
  it("keeps the resized window inside the viewport", () => {
    expect(clampWidgetSize(2000, 2000, 375, 812)).toEqual({ width: 351, height: 764 });
  });
  it("preserves a chosen size within the available space", () => {
    expect(clampWidgetSize(600, 580, 1069, 675)).toEqual({ width: 600, height: 580 });
  });
});