import "server-only";

import { createClient } from "@/lib/supabase/server";

type ApiClient =
  | {
      status: "success";
      baseUrl: string;
      request: (
        path: string | URL,
        init?: RequestInit,
        timeoutMs?: number,
      ) => Promise<Response>;
    }
  | { status: "unauthenticated" };

export async function createApiClient(
  accessToken?: string,
): Promise<ApiClient> {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  let token = accessToken;

  if (token === undefined) {
    const supabase = await createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      return { status: "unauthenticated" };
    }

    token = session.access_token;
  }

  const baseUrl = apiUrl.replace(/\/+$/, "");

  return {
    status: "success",
    baseUrl,
    request(path, init = {}, timeoutMs = 10_000) {
      const headers = new Headers(init.headers);

      if (!headers.has("Accept")) {
        headers.set("Accept", "application/json");
      }

      if (init.body !== undefined && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      headers.set("Authorization", `Bearer ${token}`);

      const url =
        path instanceof URL || path.startsWith(baseUrl)
          ? path
          : `${baseUrl}${path}`;

      return fetch(url, {
        ...init,
        headers,
        cache: init.cache ?? "no-store",
        redirect: init.redirect ?? "error",
        signal: init.signal ?? AbortSignal.timeout(timeoutMs),
      });
    },
  };
}
