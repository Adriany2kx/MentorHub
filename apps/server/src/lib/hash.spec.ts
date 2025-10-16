import { describe, expect, it } from "vitest";
import { generateToken, hashPassword, hashToken, verifyPassword } from "./hash.js";

describe("hash helpers", () => {
  it("hashes and verifies passwords", async () => {
    const password = "VeryStrongPassword123!";
    const hashed = await hashPassword(password);

    expect(hashed).not.toBe(password);
    await expect(verifyPassword(hashed, password)).resolves.toBe(true);
    await expect(verifyPassword(hashed, "WrongPassword")).resolves.toBe(false);
  });

  it("generates random token and deterministic token hash", () => {
    const token = generateToken();
    const tokenHashA = hashToken(token);
    const tokenHashB = hashToken(token);

    expect(token).toHaveLength(64);
    expect(tokenHashA).toHaveLength(64);
    expect(tokenHashA).toBe(tokenHashB);
  });
});
