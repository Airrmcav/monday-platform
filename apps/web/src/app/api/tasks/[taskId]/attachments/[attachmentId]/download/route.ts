import { NextResponse } from "next/server";

import { getTaskAttachmentDownloadUrl } from "@/features/tasks/tasks.service";

type DownloadAttachmentRouteProps = {
  params: Promise<{
    taskId: string;
    attachmentId: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: DownloadAttachmentRouteProps,
) {
  const { taskId, attachmentId } = await params;

  const result = await getTaskAttachmentDownloadUrl(taskId, attachmentId);

  switch (result.status) {
    case "success":
      return NextResponse.redirect(result.url);

    case "unauthenticated":
      return NextResponse.redirect(new URL("/login", request.url));

    case "forbidden":
    case "not-found":
      return new NextResponse("Archivo no disponible.", {
        status: 404,
      });

    case "unavailable":
      return new NextResponse("No pudimos preparar la descarga del archivo.", {
        status: 503,
      });
  }
}
