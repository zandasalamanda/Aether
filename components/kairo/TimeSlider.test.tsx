// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { TimeSlider } from "./TimeSlider";

// The Today time input is a continuous slider, not a handful of preset stops.
// The demo server hands Today an empty goals list, so the planner never mounts
// in the in-browser demo; this covers the slider's contract directly.

describe("TimeSlider", () => {
  it("spans 30 minutes to 12 hours in quarter-hour steps", () => {
    const onMinutes = vi.fn();
    render(<TimeSlider minutes={120} onMinutes={onMinutes} />);
    const slider = screen.getByRole("slider");

    expect(slider.getAttribute("aria-valuemin")).toBe("30");
    expect(slider.getAttribute("aria-valuemax")).toBe("720");
    expect(slider.getAttribute("aria-valuenow")).toBe("120");

    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onMinutes).toHaveBeenLastCalledWith(135); // 15-minute step, not a preset jump

    fireEvent.keyDown(slider, { key: "End" });
    expect(onMinutes).toHaveBeenLastCalledWith(720); // 12h reachable

    fireEvent.keyDown(slider, { key: "PageUp" });
    expect(onMinutes).toHaveBeenLastCalledWith(180); // 1h coarse step

    cleanup();
  });

  it("clamps at both ends and lands on every quarter hour from a drag position", () => {
    const onMinutes = vi.fn();
    render(<TimeSlider minutes={30} onMinutes={onMinutes} />);
    const slider = screen.getByRole("slider");

    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(onMinutes).toHaveBeenLastCalledWith(30); // floor holds

    // A drag lands on arbitrary quarter hours: the pointer maths rounds to 15.
    slider.getBoundingClientRect = () =>
      ({ left: 0, width: 690, top: 0, height: 44, right: 690, bottom: 44, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    fireEvent.pointerDown(slider, { clientX: 345, pointerId: 1 });
    // halfway across a 690px track over a 690-minute range = minute 375
    expect(onMinutes).toHaveBeenLastCalledWith(375);
    expect(onMinutes.mock.lastCall?.[0] % 15).toBe(0);
    cleanup();
  });
});
