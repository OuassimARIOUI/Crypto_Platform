import { describe, expect, it } from "vitest";
import {
  buildRedirectUrl,
  getAuthActionBaseParams,
  getAuthActionInput,
  getFastRedirectPathname,
} from "../firebaseActionLink";

describe("firebaseActionLink", () => {
  it("extracts oobCode from aliases in priority order", () => {
    const sp = new URLSearchParams({
      oobcode: "lower",
      oob_code: "snake",
      code: "generic",
      oobCode: "standard",
    });

    const out = getAuthActionInput(sp);
    expect(out.oobCode).toBe("standard");
  });

  it("extracts oobCode from `code` when oobCode is missing", () => {
    const sp = new URLSearchParams({ code: "abc123" });
    const out = getAuthActionInput(sp);
    expect(out.oobCode).toBe("abc123");
  });

  it("builds base params and includes continueUrl only when present", () => {
    expect(getAuthActionBaseParams({ oobCode: "X", continueUrl: "" })).toEqual({ oobCode: "X" });
    expect(getAuthActionBaseParams({ oobCode: "X", continueUrl: "https://example.com" })).toEqual({
      oobCode: "X",
      continueUrl: "https://example.com",
    });
  });

  it("maps mode to fast redirect pathname", () => {
    expect(getFastRedirectPathname("verifyEmail")).toBe("/verify-email");
    expect(getFastRedirectPathname("resetPassword")).toBe("/reset-password");
    expect(getFastRedirectPathname("unknown")).toBe("");
  });

  it("buildRedirectUrl appends query string when params exist", () => {
    const url = buildRedirectUrl("/verify-email", { oobCode: "X", continueUrl: "https://c" });
    expect(url).toContain("/verify-email?");
    expect(url).toContain("oobCode=X");
    expect(url).toContain("continueUrl=");
  });
});
