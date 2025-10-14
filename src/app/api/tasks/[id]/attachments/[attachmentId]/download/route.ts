import { type NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getSignedUrl,
  isCloudinaryUrl,
  getResourceTypeFromFilename,
} from "@/lib/cloudinary";

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

    if (!attachment.filePath) {
      return NextResponse.json(
        { error: "File path not found" },
        { status: 404 }
      );
    }

    // If it's a Cloudinary URL, handle the download properly
    if (isCloudinaryUrl(attachment.filePath)) {
      // For raw files (like .docx, .pdf, etc.), fetch and serve with proper headers
      const resourceType = getResourceTypeFromFilename(attachment.fileName);

      if (resourceType === "raw") {
        try {
          // Fetch the file from Cloudinary
          const response = await fetch(attachment.filePath);
          if (!response.ok) {
            throw new Error("Failed to fetch file from Cloudinary");
          }

          const fileBuffer = await response.arrayBuffer();

          // Return the file with proper download headers
          return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
              "Content-Type": attachment.mimeType,
              "Content-Disposition": `attachment; filename="${attachment.fileName}"`,
              "Content-Length": attachment.fileSize.toString(),
              "Cache-Control": "no-cache",
            },
          });
        } catch (error) {
          console.error("Error fetching file from Cloudinary:", error);
          return NextResponse.json(
            { error: "Failed to download file" },
            { status: 500 }
          );
        }
      } else {
        // For images and videos, redirect to Cloudinary URL
        return NextResponse.redirect(attachment.filePath);
      }
    }

    // Fallback for non-Cloudinary URLs (shouldn't happen though)
    return NextResponse.json({ error: "Invalid file path" }, { status: 404 });
  } catch (error) {
    console.error("Error downloading attachment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
