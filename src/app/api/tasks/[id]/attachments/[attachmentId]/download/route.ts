import { type NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET download a specific attachment file
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const user = await AuthService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has access to the attachment
    const attachment = await prisma.attachment.findFirst({
      where: {
        id: params.attachmentId,
        taskId: params.id,
        task: {
          project: {
            workspaceId: user.workspaceId,
          },
        },
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    if (!attachment.fileData) {
      return NextResponse.json(
        { error: "File data not found" },
        { status: 404 }
      );
    }

    // Create response with file data
    const response = new NextResponse(Buffer.from(attachment.fileData), {
      status: 200,
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${attachment.fileName}"`,
        "Content-Length": attachment.fileSize.toString(),
      },
    });

    return response;
  } catch (error) {
    console.error("Error downloading attachment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
