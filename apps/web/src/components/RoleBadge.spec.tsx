import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RoleBadge from "./RoleBadge";

describe("RoleBadge", () => {
  it("shows mentee label", () => {
    render(<RoleBadge role="MENTEE" />);
    expect(screen.getByText(/mentee/i)).toBeInTheDocument();
  });

  it("applies custom class name", () => {
    render(<RoleBadge role="MENTOR" className="custom-class" />);
    expect(screen.getByText(/mentor/i)).toHaveClass("custom-class");
  });
});
