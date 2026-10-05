"use client";

import { createTaskAttachmentUploadIntentsAction } from "../actions/create-task-attachment-upload-intents-action";
import { createClient } from "@/lib/supabase/client";

type UploadTaskAttachmentsResult =
  | {
      success: true;
      attachmentIds: string[];
    }
  | {
      success: false;
      error: string;
    };

export async function uploadTaskAttachments(
  taskId: string,
  files: File[],
): Promise<UploadTaskAttachmentsResult> {
  if (files.length === 0) {
    return {
      success: true,
      attachmentIds: [],
    };
  }

  const intentsResult = await createTaskAttachmentUploadIntentsAction(taskId, {
    files: files.map((file) => ({
      originalName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
    })),
  });

  if (!intentsResult.success) {
    return intentsResult;
  }

  if (intentsResult.attachments.length !== files.length) {
    return {
      success: false,
      error:
        "No pudimos preparar todos los archivos seleccionados. Intenta nuevamente.",
    };
  }

  const supabase = createClient();
  const attachmentIds: string[] = [];

  for (let index = 0; index < files.length; index += 3) {
    const batch = files.slice(index, index + 3);
    const intents = intentsResult.attachments.slice(index, index + 3);

    const results = await Promise.all(
      batch.map(async (file, batchIndex) => {
        const intent = intents[batchIndex];

        const { error } = await supabase.storage
          .from(intent.bucket)
          .uploadToSignedUrl(intent.storagePath, intent.uploadToken, file, {
            contentType: intent.contentType,
          });

        if (error) {
          return {
            success: false as const,
            error: `No pudimos subir “${file.name}”.`,
          };
        }

        return {
          success: true as const,
          attachmentId: intent.attachmentId,
        };
      }),
    );

    const failedUpload = results.find((result) => !result.success);

    if (failedUpload && !failedUpload.success) {
      return failedUpload;
    }

    for (const result of results) {
      if (result.success) {
        attachmentIds.push(result.attachmentId);
      }
    }
  }

  return {
    success: true,
    attachmentIds,
  };
}
