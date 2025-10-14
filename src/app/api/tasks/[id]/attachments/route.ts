import { type NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET all attachments for a task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has access to the task
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        project: {
          workspaceId: user.workspaceId,
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const attachments = await prisma.attachment.findMany({
      where: { taskId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { uploadedAt: "desc" },
    });

    // Process attachments to include base64 encoded file data
    const processedAttachments = attachments.map((attachment) => ({
      ...attachment,
      fileData: attachment.fileData
        ? Buffer.from(attachment.fileData).toString("base64")
        : null,
    }));

    return NextResponse.json(processedAttachments);
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create a new attachment with file upload support
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has access to the task
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        project: {
          workspaceId: user.workspaceId,
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Handle multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileName =
      (formData.get("fileName") as string) || file?.name || "unnamed";
    const fileSize =
      parseInt((formData.get("fileSize") as string) || "0") || file?.size || 0;
    const mimeType =
      (formData.get("mimeType") as string) ||
      file?.type ||
      "application/octet-stream";
    const fileType =
      (formData.get("fileType") as string) ||
      file?.type ||
      "application/octet-stream";
    const fileExtension =
      (formData.get("fileExtension") as string) ||
      file?.name.split(".").pop() ||
      "bin";
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // For now, save file metadata only
    // In production: upload to S3/cloud storage and get URL
    // const uploadedUrl = await uploadToS3(buffer, fileName)

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const attachment = await prisma.attachment.create({
      data: {
        taskId: params.id,
        fileName,
        fileData: buffer,
        fileSize,
        fileType,
        fileExtension,
        mimeType,
        uploadedBy: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log("✅ File uploaded successfully:", {
      fileName,
      fileSize,
      mimeType,
    });
    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("Error creating attachment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE an attachment
export async function DELETE(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get("attachmentId");

    if (!attachmentId) {
      return NextResponse.json(
        { error: "Attachment ID is required" },
        { status: 400 }
      );
    }

    // Verify user has access to the attachment
    const attachment = await prisma.attachment.findFirst({
      where: {
        id: attachmentId,
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

    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({ message: "Attachment deleted successfully" });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
