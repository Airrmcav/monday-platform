import {
  ExternalLink,
  FileText,
  MessageSquareText,
  Paperclip,
  UserRound,
} from "lucide-react";
import { TaskComment } from "../schemas/task-comments.schema";
import { APP_TIME_ZONE_LABEL } from "@/lib/date-time";

type TaskCommentListProps = {
  comments: TaskComment[];
  currentUserId: string;
};
const commentDateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Mexico_City",
});

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
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <UserRound aria-hidden="true" size={18} />
                </span>

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

                  <ul className="mt-2 space-y-2">
                    {comment.attachments.map((attachment) => (
                      <li key={attachment.id}>
                        <a
                          href={`/api/tasks/${attachment.taskId}/attachments/${attachment.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface-muted/40 px-3 py-2 text-sm transition hover:border-primary hover:bg-primary-soft/50 focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          <FileText
                            aria-hidden="true"
                            size={17}
                            className="shrink-0 text-primary"
                          />

                          <span className="min-w-0 flex-1 truncate font-medium">
                            {attachment.originalName}
                          </span>

                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatFileSize(attachment.sizeBytes)}
                          </span>

                          <ExternalLink
                            aria-hidden="true"
                            size={16}
                            className="shrink-0 text-primary"
                          />
                        </a>
                      </li>
                    ))}
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

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.ceil(sizeBytes / 1024)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
