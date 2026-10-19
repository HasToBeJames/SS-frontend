import { describe, expect, it } from "vitest";
import { hasAdminRole } from "../adminAuth";

function token(payload: object) {
  return `header.${btoa(JSON.stringify(payload)).replace(/=/g, "")}.signature`;
}

describe("hasAdminRole", () => {
  it("only accepts an admin role claim", () => {
    expect(hasAdminRole(token({ role: "admin" }))).toBe(true);
    expect(hasAdminRole(token({ role: "investor" }))).toBe(false);
    expect(hasAdminRole(null)).toBe(false);
  });
});
