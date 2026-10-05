"use client";

import { type ChangeEvent, useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  FileText,
  LoaderCircle,
  MessageSquarePlus,
  Paperclip,
  Send,
  X,
} from "lucide-react";

import {
  createTaskCommentAction,
  type CreateTaskCommentState,
} from "../actions/create-task-comment-action";
import { uploadTaskAttachments } from "../lib/upload-task-attachments";
import { cancelTaskAttachmentUploadAction } from "../actions/cancel-task-attachment-upload-action";

type CreateTaskCommentFormProps = {
  taskId: string;
};

type UploadedAttachment = {
  id: string;
  originalName: string;
  sizeBytes: number;
};

const initialState: CreateTaskCommentState = {
  error: "",
};

const acceptedFileTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
].join(",");

export default function CreateTaskCommentForm({
  taskId,
}: CreateTaskCommentFormProps) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [removingAttachmentId, setRemovingAttachmentId] = useState<
    string | null
  >(null);

  const [state, formAction] = useActionState(
    createTaskCommentAction.bind(null, taskId),
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      setContent("");
      setAttachments([]);
      setUploadError("");
    }
  }, [state.success]);

  const contentError = state.fieldErrors?.content?.join(" ");
  const attachmentError =
    uploadError || state.fieldErrors?.attachmentIds?.join(" ");

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    if (attachments.length + files.length > 10) {
      setUploadError("Puedes adjuntar hasta 10 archivos por comentario.");
      return;
    }

    setUploadError("");
    setIsUploading(true);

    try {
      const result = await uploadTaskAttachments(taskId, files);

      if (!result.success) {
        setUploadError(result.error);
        return;
      }

      setAttachments((currentAttachments) => [
        ...currentAttachments,
        ...files.map((file, index) => ({
          id: result.attachmentIds[index],
          originalName: file.name,
          sizeBytes: file.size,
        })),
      ]);
    } catch {
      setUploadError(
        "No pudimos subir los archivos. Intenta seleccionarlos nuevamente.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemoveAttachment(attachmentId: string) {
    setUploadError("");
    setRemovingAttachmentId(attachmentId);

    try {
      const result = await cancelTaskAttachmentUploadAction(
        taskId,
        attachmentId,
      );

      if (!result.success) {
        setUploadError(result.error);
        return;
      }

      setAttachments((currentAttachments) =>
        currentAttachments.filter(
          (attachment) => attachment.id !== attachmentId,
        ),
      );
    } catch {
      setUploadError("No pudimos retirar el archivo. Intenta nuevamente.");
    } finally {
      setRemovingAttachmentId(null);
    }
  }

  return (
    <form
      action={formAction}
      className="rounded-xl border border-border/70 bg-surface-muted/40 p-4"
    >
      {attachments.map((attachment) => (
        <input
          key={attachment.id}
          type="hidden"
          name="attachmentIds"
          value={attachment.id}
        />
      ))}

      <label
        htmlFor="task-comment-content"
        className="flex items-center gap-2 text-sm font-semibold"
      >
        <MessageSquarePlus
          aria-hidden="true"
          size={18}
          className="text-primary"
        />
        Registrar avance o comentario
      </label>

      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Comparte avances, acuerdos, dudas o información útil para el equipo.
      </p>

      <textarea
        id="task-comment-content"
        name="content"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={4}
        maxLength={5000}
        placeholder="Escribe un comentario para el equipo..."
        aria-invalid={Boolean(contentError)}
        aria-describedby={
          contentError
            ? "task-comment-content-help task-comment-content-error"
            : "task-comment-content-help"
        }
        className="mt-4 w-full resize-y rounded-xl border border-input-border bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label
          htmlFor="task-comment-attachments"
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
        >
          {isUploading ? (
            <LoaderCircle
              aria-hidden="true"
              size={16}
              className="animate-spin text-primary"
            />
          ) : (
            <Paperclip aria-hidden="true" size={16} className="text-primary" />
          )}

          {isUploading ? "Subiendo archivos..." : "Adjuntar archivos"}
        </label>

        <input
          id="task-comment-attachments"
          type="file"
          multiple
          accept={acceptedFileTypes}
          disabled={isUploading}
          onChange={handleFilesSelected}
          className="sr-only"
        />

        <p className="text-xs text-muted-foreground">
          PDF, imágenes, Word y Excel. Máximo 50 MB por archivo.
        </p>
      </div>

      {attachments.length > 0 && (
        <ul className="mt-3 space-y-2" aria-label="Archivos adjuntos">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
            >
              <FileText
                aria-hidden="true"
                size={16}
                className="shrink-0 text-primary"
              />

              <span className="min-w-0 flex-1 truncate">
                {attachment.originalName}
              </span>

              <span className="shrink-0 text-xs text-muted-foreground">
                {formatFileSize(attachment.sizeBytes)}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(attachment.id)}
                disabled={isUploading || removingAttachmentId !== null}
                aria-label={`Retirar ${attachment.originalName}`}
                className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded p-1 text-muted-foreground transition hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
              >
                {removingAttachmentId === attachment.id ? (
                  <LoaderCircle
                    aria-hidden="true"
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <X aria-hidden="true" size={16} />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center justify-between gap-4">
        <p
          id="task-comment-content-help"
          className="text-xs text-muted-foreground"
        >
          {content.length.toLocaleString("es-MX")} / 5,000 caracteres
        </p>

        <SubmitButton disabled={content.trim().length === 0 || isUploading} />
      </div>

      {contentError && (
        <p
          id="task-comment-content-error"
          role="alert"
          className="mt-3 text-sm text-danger"
        >
          {contentError}
        </p>
      )}

      {attachmentError && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {attachmentError}
        </p>
      )}

      {state.error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      {state.success && (
        <p role="status" className="mt-3 text-sm text-success">
          {state.success}
        </p>
      )}
    </form>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex cursor-pointer shrink-0 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Send aria-hidden="true" size={16} />
      {pending ? "Publicando..." : "Publicar"}
    </button>
  );
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.ceil(sizeBytes / 1024)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
