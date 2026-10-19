import {
  ExternalLink,
  File as FileIcon,
  FileCode,
  FileSpreadsheet,
  FileText,
  MessageSquareText,
  Paperclip,
  UserRound,
} from "lucide-react";

import { TaskComment } from "../schemas/task-comments.schema";
import { APP_TIME_ZONE_LABEL } from "@/lib/date-time";
import UserAvatar from "@/features/users/components/user-avatar";

type TaskCommentListProps = {
  comments: TaskComment[];
  currentUserId: string;
};

const commentDateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Mexico_City",
});

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.ceil(sizeBytes / 1024)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAttachmentIcon(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "pdf" || extension === "doc" || extension === "docx") {
    return FileText;
  }

  if (extension === "xls" || extension === "xlsx") {
    return FileSpreadsheet;
  }

  if (extension === "xml" || extension === "dwg") {
    return FileCode;
  }

  return FileIcon;
}

export default function TaskCommentsList({
  comments,
  currentUserId,
}: TaskCommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface-muted/40 px-5 py-10 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <MessageSquareText aria-hidden="true" size={22} />
        </span>

        <h3 className="mt-4 text-sm font-semibold">Aún no hay comentarios</h3>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          Registra avances, acuerdos o dudas para que el equipo tenga el
          contexto del trabajo.
        </p>
      </div>
    );
  }

  return (
    <ol className="divide-y divide-border/60">
      {comments.map((comment) => {
        const isCurrentUser = comment.authorId === currentUserId;

        return (
          <li key={comment.id} className="py-5 first:pt-0 last:pb-0">
            <article>
              <header className="flex items-start gap-3">
                <UserAvatar
                  name={comment.authorName}
                  avatarUrl={comment.authorAvatarUrl}
                  userId={comment.authorId}
                  className="size-9 text-[13px]"
                />

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {isCurrentUser ? "Tú" : comment.authorName}
                  </p>

                  <time
                    dateTime={comment.createdAt}
                    title={`${commentDateFormatter.format(
                      new Date(comment.createdAt),
                    )} · ${APP_TIME_ZONE_LABEL}`}
                    className="mt-0.5 block text-xs text-muted-foreground"
                  >
                    {commentDateFormatter.format(new Date(comment.createdAt))}
                  </time>
                </div>
              </header>

              <p className="mt-3 whitespace-pre-wrap wrap-break-word pl-12 text-sm leading-6 text-foreground">
                {comment.content}
              </p>

              {comment.attachments.length > 0 && (
                <section
                  aria-label={`Archivos adjuntos de ${comment.authorName}`}
                  className="mt-4 ml-12"
                >
                  <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Paperclip aria-hidden="true" size={14} />
                    {comment.attachments.length}{" "}
                    {comment.attachments.length === 1
                      ? "archivo adjunto"
                      : "archivos adjuntos"}
                  </p>

                  <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {comment.attachments.map((attachment) => {
                      const downloadUrl = `/api/tasks/${attachment.taskId}/attachments/${attachment.id}/download`;

                      const extension =
                        attachment.originalName
                          .split(".")
                          .pop()
                          ?.toLowerCase() ?? "";

                      const isImage = ["jpg", "jpeg", "png", "webp"].includes(
                        extension,
                      );

                      const Icon = getAttachmentIcon(attachment.originalName);

                      return (
                        <li key={attachment.id} className="min-w-0">
                          <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Abrir ${attachment.originalName}`}
                            title="Abrir archivo"
                            className="group flex min-w-0 items-center gap-3 rounded-xl border border-border/70 bg-background p-3 transition-colors hover:border-primary/50 hover:bg-surface-muted/40 focus-visible:outline-2 focus-visible:outline-ring"
                          >
                            {isImage ? (
                              <div className="h-17 w-19 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-surface-muted">
                                <img
                                  src={downloadUrl}
                                  alt=""
                                  loading="lazy"
                                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                />
                              </div>
                            ) : (
                              <div className="flex h-17 w-19 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-border/60 bg-surface-muted/60 text-primary">
                                <Icon aria-hidden="true" size={25} />
                                <span className="max-w-full truncate px-1 text-[10px] font-semibold uppercase tracking-wide">
                                  {extension || "Archivo"}
                                </span>
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <p
                                title={attachment.originalName}
                                className="line-clamp-2 wrap-break-word text-sm font-medium leading-5 text-foreground"
                              >
                                {attachment.originalName}
                              </p>

                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatFileSize(attachment.sizeBytes)}
                                </span>

                                <span
                                  aria-hidden="true"
                                  className="size-1 rounded-full bg-border"
                                />

                                <span className="text-[11px] uppercase text-muted-foreground">
                                  {extension || "Archivo"}
                                </span>
                              </div>
                            </div>

                            <span
                              aria-hidden="true"
                              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition group-hover:bg-primary-soft group-hover:text-primary"
                            >
                              <ExternalLink size={16} />
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </article>
          </li>
        );
      })}
    </ol>
  );
}
