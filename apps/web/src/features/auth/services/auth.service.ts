import "server-only";

import { createClient } from "@/lib/supabase/server";
import { type Profile, profileSchema } from "../schemas/profile.schema";
import {
  type UserTaskSummary,
  userTaskSummarySchema,
} from "@/features/users/schemas/users.schemas";

export type ProfileResult =
  | {
      status: "authenticated";
      user: Profile & { taskSummary: UserTaskSummary | null };
    }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "unavailable" };

export async function getProfile(accessToken: string): Promise<ProfileResult> {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  let response: Response;

  try {
    response = await fetch(`${apiUrl.replace(/\/+$/, "")}/auth/me`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return { status: "unavailable" };
  }

  if (response.status === 401) {
    return { status: "unauthenticated" };
  }

  if (response.status === 403) {
    return { status: "forbidden" };
  }

  if (!response.ok) {
    return { status: "unavailable" };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return { status: "unavailable" };
  }

  const validation = profileSchema.safeParse(payload);

  if (!validation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "authenticated",
    user: {
      ...validation.data,
      taskSummary: null,
    },
  };
}

export async function getCurrentProfile(): Promise<ProfileResult> {
  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return { status: "unauthenticated" };
  }

  const profile = await getProfile(session.access_token);

  if (profile.status !== "authenticated") {
    return profile;
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/users/me/task-summary`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      return profile;
    }

    const validation = userTaskSummarySchema.safeParse(await response.json());

    return {
      ...profile,
      user: {
        ...profile.user,
        taskSummary: validation.success ? validation.data : null,
      },
    };
  } catch {
    return profile;
  }
}
