import { type NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
  getResourceTypeFromFilename,
} from "@/lib/cloudinary";

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

    return NextResponse.json(attachments);
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

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name || "unnamed";
    const fileSize = file.size;
    const mimeType = file.type || "application/octet-stream";

    // Upload file to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const resourceType = getResourceTypeFromFilename(fileName);

    const cloudinaryResult = await uploadToCloudinary(buffer, {
      folder: `task-attachments/${params.id}`,
      public_id: `${Date.now()}-${fileName.replace(/\.[^/.]+$/, "")}`,
      resource_type: resourceType,
    });

    const attachment = await prisma.attachment.create({
      data: {
        taskId: params.id,
        fileName,
        filePath: cloudinaryResult.secure_url,
        fileSize,
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

    console.log("✅ File uploaded successfully to Cloudinary:", {
      fileName,
      fileSize,
      mimeType,
      cloudinaryUrl: cloudinaryResult.secure_url,
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

    // Delete from Cloudinary first
    const publicId = extractPublicId(attachment.filePath);
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId);
        console.log("✅ File deleted from Cloudinary:", publicId);
      } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    // Delete from database
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
