"use client";
import { useActionState } from "react";
import { logout } from "../actions/logout-action";

export default function LogoutButton() {
  const [state, formAction, isPending] = useActionState(logout, {
    error: "",
  });

  return (
    <form action={formAction} aria-busy={isPending}>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg cursor-pointer border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Cerrando sesión…" : "Cerrar sesión"}
      </button>

      {state.error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
