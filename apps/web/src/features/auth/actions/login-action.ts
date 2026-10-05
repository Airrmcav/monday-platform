"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "../schemas/login.schema";
import { getProfile } from "../services/auth.service";

export type LoginState = {
  error: string;
};

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const validation = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validation.success) {
    return {
      error:
        validation.error.issues[0]?.message ?? "Revisa los datos ingresados.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword(
    validation.data,
  );

  if (error || !data.session) {
    return {
      error: "No se pudo iniciar sesión. Revisa tus datos e intenta de nuevo.",
    };
  }

  const profile = await getProfile(data.session.access_token);

  if (profile.status === "authenticated") {
    redirect("/dashboard");
  }

  await supabase.auth.signOut({ scope: "local" });

  switch (profile.status) {
    case "unauthenticated":
      return {
        error: "No se pudo validar tu sesión. Intenta nuevamente.",
      };

    case "forbidden":
      return {
        error: "No tienes acceso activo a esta plataforma.",
      };

    case "unavailable":
      return {
        error: "El servicio no está disponible. Intenta más tarde.",
      };
  }
}
