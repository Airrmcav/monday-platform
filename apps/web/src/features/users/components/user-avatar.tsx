import Link from "next/link";

type UserAvatarProps = {
  name: string;
  avatarUrl: string | null;
  className: string;
  userId?: string;
};

export default function UserAvatar({
  name,
  avatarUrl,
  className,
  userId,
}: UserAvatarProps) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => Array.from(part)[0])
      .join("")
      .toLocaleUpperCase("es-MX") || "?";

  const avatar = (
    <span
      role="img"
      aria-label={`Foto de ${name}`}
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}
    >
      <span aria-hidden="true">{initials}</span>
      {avatarUrl && (
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${avatarUrl}")` }}
        />
      )}
    </span>
  );

  if (!userId) {
    return avatar;
  }

  return (
    <Link
      href={`/users/${encodeURIComponent(userId)}`}
      aria-label={`Ver perfil de ${name}`}
      title={`Ver perfil de ${name}`}
      className="inline-flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {avatar}
    </Link>
  );
}
