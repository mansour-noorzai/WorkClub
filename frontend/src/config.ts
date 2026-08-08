type RuntimeConfig = {
  apiUrl: string;
};

declare global {
  interface Window {
    __WORKCLUB_CONFIG__?: RuntimeConfig;
  }
}

/**
 * Load /config.json at runtime and store it on window.__WORKCLUB_CONFIG__.
 * Falls back to VITE_API_URL or '/api' if the fetch fails.
 */
export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  try {
    const res = await fetch("/config.json", { cache: "no-store" });
    if (!res.ok) throw new Error("config.json not found");
    const cfg = (await res.json()) as RuntimeConfig;
    window.__WORKCLUB_CONFIG__ = cfg;
    return cfg;
  } catch {
    const fallback = {
      apiUrl: (import.meta.env.VITE_API_URL as string) || "/api",
    };
    window.__WORKCLUB_CONFIG__ = fallback;
    return fallback;
  }
}

export function getApiUrl(): string {
  return (
    window.__WORKCLUB_CONFIG__?.apiUrl || (import.meta.env.VITE_API_URL as string) || "/api"
  );
}
