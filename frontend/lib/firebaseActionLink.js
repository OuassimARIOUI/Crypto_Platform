function getParam(source, key) {
  if (!source) return "";
  if (typeof source.get === "function") {
    return source.get(key) || "";
  }
  const val = source[key];
  return val == null ? "" : String(val);
}

export function getAuthActionInput(searchParams) {
  const mode = getParam(searchParams, "mode");

  const oobCode =
    getParam(searchParams, "oobCode") ||
    getParam(searchParams, "oobcode") ||
    getParam(searchParams, "oob_code") ||
    getParam(searchParams, "code");

  const continueUrl = getParam(searchParams, "continueUrl");

  return { mode, oobCode, continueUrl };
}

export function buildRedirectUrl(pathname, params) {
  const qs = new URLSearchParams(params);
  return qs.toString() ? `${pathname}?${qs.toString()}` : pathname;
}

export function getAuthActionBaseParams({ oobCode, continueUrl }) {
  const params = { oobCode };
  if (continueUrl) params.continueUrl = continueUrl;
  return params;
}

export function getFastRedirectPathname(mode) {
  if (mode === "verifyEmail") return "/verify-email";
  if (mode === "resetPassword") return "/reset-password";
  return "";
}
