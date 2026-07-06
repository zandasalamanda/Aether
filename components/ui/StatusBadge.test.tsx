import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";
import { nodeStatusMeta } from "@/lib/kairo/status";

afterEach(cleanup);

describe("StatusBadge", () => {
  it("renders the status label", () => {
    const { container } = render(<StatusBadge meta={nodeStatusMeta.in_motion} />);
    expect(container.textContent).toContain("In Motion");
  });

  it("hides the dot when showDot is false", () => {
    const { container } = render(<StatusBadge meta={nodeStatusMeta.done} showDot={false} />);
    // one span (wrapper) only, no inner dot span
    expect(container.querySelectorAll("span").length).toBe(1);
  });
});
