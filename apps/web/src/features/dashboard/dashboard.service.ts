import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  DashboardSummary,
  dashboardSummarySchema,
} from "./schemas/dashboard.schema";

export type GetDashboardSummaryResult =
  | {
      status: "success";
      result: DashboardSummary;
    }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "unavailable" };

export async function getDashboardSummary(): Promise<GetDashboardSummaryResult> {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return { status: "unauthenticated" };
  }

  let response: Response;

  try {
    response = await fetch(`${apiUrl.replace(/\/+$/, "")}/dashboard/summary`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
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

  if (response.status !== 200) {
    return { status: "unavailable" };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return { status: "unavailable" };
  }

  const validation = dashboardSummarySchema.safeParse(payload);

  if (!validation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    result: validation.data,
  };
}
