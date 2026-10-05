import { createClient } from "@/lib/supabase/client";
import { LoginState } from "./login-action";
import { redirect } from "next/navigation";

export async function logout(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut({
    scope: "local",
  });

  if (error) {
    return {
      error: "No se pudo cerrar la sesión. Intenta nuevamente.",
    };
  }

  redirect("/login");
}
