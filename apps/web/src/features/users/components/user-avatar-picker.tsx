"use client";

import { Camera, UserRound } from "lucide-react";

type UserAvatarPickerProps = {
  name: string;
  avatarUrl: string | null;
  onFileSelected: (file: File | null) => void;
  disabled?: boolean;
};

export default function UserAvatarPicker({
  name,
  avatarUrl,
  onFileSelected,
  disabled = false,
}: UserAvatarPickerProps) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-background p-4 sm:flex-row sm:items-center">
      <span
        aria-label={avatarUrl ? `Foto de ${name}` : "Sin foto de perfil"}
        role="img"
        className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-lg font-semibold text-primary"
      >
        <span aria-hidden="true">
          {avatarUrl ? <UserRound size={24} /> : initials}
        </span>
        {avatarUrl && (
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${avatarUrl}")` }}
          />
        )}
      </span>

      <div className="min-w-0">
        <p className="text-sm font-medium">Foto de perfil</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          JPG, PNG o WebP. Tamaño máximo: 2 MB.
        </p>
        <label
          htmlFor="user-avatar-file"
          className={`mt-3 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition hover:bg-surface-hover focus-within:outline-2 focus-within:outline-ring ${
            disabled ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <Camera aria-hidden="true" size={16} />
          Seleccionar imagen
        </label>
        <input
          id="user-avatar-file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            onFileSelected(event.currentTarget.files?.[0] ?? null);
            event.currentTarget.value = "";
          }}
        />
      </div>
    </div>
  );
}
