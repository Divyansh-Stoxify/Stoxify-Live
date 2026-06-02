"use client";

const INSTALL_ID_KEY = "stoxify_admin_install_id";

export type AdminDeviceFingerprint = {
  browser: string;
  browser_version: string;
  device_id: string;
  device_type: "WEB";
  install_id: string;
  language: string;
  os: string;
  platform: string;
  screen: string;
  timezone: string;
  user_agent: string;
};

function getInstallId() {
  const existing = window.localStorage.getItem(INSTALL_ID_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  window.localStorage.setItem(INSTALL_ID_KEY, id);
  return id;
}

function detectBrowser(userAgent: string) {
  const rules: Array<[string, RegExp]> = [
    ["Edge", /Edg\/([0-9.]+)/],
    ["Chrome", /Chrome\/([0-9.]+)/],
    ["Firefox", /Firefox\/([0-9.]+)/],
    ["Safari", /Version\/([0-9.]+).*Safari/],
  ];

  for (const [browser, pattern] of rules) {
    const match = userAgent.match(pattern);
    if (match?.[1]) return { browser, version: match[1] };
  }

  return { browser: "Unknown", version: "unknown" };
}

function detectOs(userAgent: string) {
  if (/Windows NT/i.test(userAgent)) return "Windows";
  if (/Mac OS X/i.test(userAgent)) return "macOS";
  if (/Android/i.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Unknown";
}

async function sha256(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function collectAdminDeviceFingerprint(): Promise<AdminDeviceFingerprint> {
  const installId = getInstallId();
  const userAgent = navigator.userAgent;
  const browser = detectBrowser(userAgent);
  const screenValue = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const fingerprintBase = {
    browser: browser.browser,
    browser_version: browser.version,
    install_id: installId,
    language: navigator.language,
    os: detectOs(userAgent),
    platform: navigator.platform,
    screen: screenValue,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    user_agent: userAgent,
  };
  const hash = await sha256(JSON.stringify(fingerprintBase));

  return {
    ...fingerprintBase,
    device_id: `DEV_web_${hash.slice(0, 24)}`,
    device_type: "WEB",
  };
}

export function describeAdminDevice(fingerprint: AdminDeviceFingerprint) {
  return [
    fingerprint.browser,
    fingerprint.browser_version,
    fingerprint.os,
    fingerprint.platform,
    fingerprint.screen,
    fingerprint.timezone,
  ].join(" | ");
}
