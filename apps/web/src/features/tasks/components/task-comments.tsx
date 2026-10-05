import { ArrowLeft, ArrowRight, MessageSquareText } from "lucide-react";
import { TaskCommentsResponse } from "../schemas/task-comments.schema";
import Link from "next/link";
import CreateTaskCommentForm from "./create-task-comment-form";
import TaskCommentsList from "./task-comments-list";

type TaskCommentsProps = {
  taskId: string;
  currentUserId: string;
  result: TaskCommentsResponse;
  page: number;
};

export default function TaskComments({
  taskId,
  currentUserId,
  result,
  page,
}: TaskCommentsProps) {
  const { data: comments, pagination } = result;
  const lastPage = Math.max(1, pagination.totalPages);

  const firstComment =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1;

  const lastComment = Math.min(
    pagination.page * pagination.pageSize,
    pagination.total,
  );
  const getPageHref = (targetPage: number) =>
    `/tasks/${taskId}?commentsPage=${targetPage}&commentsPageSize=${pagination.pageSize}#task-comments`;

  return (
    <section
      id="task-comments"
      aria-labelledby="task-comments-title"
      className="overflow-hidden rounded-2xl border border-border/70 bg-surface"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4">
        <div>
          <h2
            id="task-comments-title"
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <MessageSquareText
              aria-hidden="true"
              size={18}
              className="text-primary"
            />
            Comentarios y avances
          </h2>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Conversación y contexto compartido con los participantes.
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
          {pagination.total}{" "}
          {pagination.total === 1 ? "comentario" : "comentarios"}
        </span>
      </div>

      <div className="space-y-6 p-5">
        <CreateTaskCommentForm taskId={taskId} />

        <TaskCommentsList comments={comments} currentUserId={currentUserId} />

        {pagination.total > 0 && (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
            <p className="text-xs text-muted-foreground">
              Mostrando {firstComment}–{lastComment} de {pagination.total}
            </p>

            {lastPage > 1 && (
              <nav
                aria-label="Paginación de comentarios"
                className="flex items-center gap-2"
              >
                {page > 1 ? (
                  <Link
                    href={getPageHref(page - 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium transition hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <ArrowLeft aria-hidden="true" size={15} />
                    Más recientes
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground opacity-50"
                  >
                    <ArrowLeft aria-hidden="true" size={15} />
                    Más recientes
                  </span>
                )}

                <span className="px-1 text-xs text-muted-foreground">
                  Página {page} de {lastPage}
                </span>

                {page < lastPage ? (
                  <Link
                    href={getPageHref(page + 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium transition hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    Anteriores
                    <ArrowRight aria-hidden="true" size={15} />
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground opacity-50"
                  >
                    Anteriores
                    <ArrowRight aria-hidden="true" size={15} />
                  </span>
                )}
              </nav>
            )}
          </footer>
        )}
      </div>
    </section>
  );
}
