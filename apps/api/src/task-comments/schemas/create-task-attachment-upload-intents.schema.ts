import { z } from 'zod';

export const TASK_ATTACHMENT_MAX_SIZE_BYTES = 50 * 1024 * 1024;

const TASK_ATTACHMENT_MAX_BATCH_SIZE_BYTES = 250 * 1024 * 1024;

const DWG_CONTENT_TYPES: ReadonlySet<string> = new Set([
  'image/vnd.dwg',
  'image/x-dwg',
  'application/acad',
  'application/x-acad',
  'application/dwg',
  'application/x-dwg',
]);

const XML_CONTENT_TYPES: ReadonlySet<string> = new Set([
  'application/xml',
  'text/xml',
]);

const GENERIC_BINARY_CONTENT_TYPE = 'application/octet-stream';

export const taskAttachmentContentTypeSchema = z.enum(
  [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

    'image/vnd.dwg',
    'image/x-dwg',
    'application/acad',
    'application/x-acad',
    'application/dwg',
    'application/x-dwg',

    'application/xml',
    'text/xml',

    'application/octet-stream',
  ],
  {
    error: 'El tipo de archivo no está permitido.',
  },
);

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');

  return dotIndex === -1 ? '' : fileName.slice(dotIndex + 1).toLowerCase();
}

export const taskAttachmentUploadFileSchema = z
  .strictObject({
    originalName: z
      .string({
        error: 'El nombre del archivo debe ser un texto.',
      })
      .trim()
      .min(1, 'El archivo debe tener un nombre.')
      .max(255, 'El nombre del archivo no puede superar los 255 caracteres.'),

    contentType: taskAttachmentContentTypeSchema,

    sizeBytes: z
      .number({
        error: 'El tamaño del archivo debe ser un número.',
      })
      .int('El tamaño del archivo debe ser un número entero.')
      .positive('El archivo no puede estar vacío.')
      .max(
        TASK_ATTACHMENT_MAX_SIZE_BYTES,
        'Cada archivo puede pesar hasta 50 MB.',
      ),
  })
  .superRefine((file, context) => {
    const extension = getFileExtension(file.originalName);

    const mustBeDwg =
      DWG_CONTENT_TYPES.has(file.contentType) ||
      file.contentType === GENERIC_BINARY_CONTENT_TYPE;

    if (mustBeDwg && extension !== 'dwg') {
      context.addIssue({
        code: 'custom',
        path: ['originalName'],
        message: 'El archivo debe tener extensión .dwg.',
      });
    }

    if (XML_CONTENT_TYPES.has(file.contentType) && extension !== 'xml') {
      context.addIssue({
        code: 'custom',
        path: ['originalName'],
        message: 'El archivo debe tener extensión .xml.',
      });
    }
  });

export const createTaskAttachmentUploadIntentsSchema = z
  .strictObject({
    files: z
      .array(taskAttachmentUploadFileSchema)
      .min(1, 'Selecciona al menos un archivo.')
      .max(10, 'Puedes cargar hasta 10 archivos a la vez.'),
  })
  .superRefine((data, context) => {
    const totalSize = data.files.reduce(
      (total, file) => total + file.sizeBytes,
      0,
    );

    if (totalSize > TASK_ATTACHMENT_MAX_BATCH_SIZE_BYTES) {
      context.addIssue({
        code: 'custom',
        path: ['files'],
        message:
          'El total de archivos seleccionados no puede superar los 250 MB.',
      });
    }
  });

export type CreateTaskAttachmentUploadIntentsInput = z.infer<
  typeof createTaskAttachmentUploadIntentsSchema
>;
