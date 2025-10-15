import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: string;
  bytes: number;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  resource_type?: "auto" | "image" | "video" | "raw";
  transformation?: any;
  public_id?: string;
}

/**
 * Upload a file to Cloudinary
 * @param file - File buffer or base64 string
 * @param options - Upload options
 * @returns Promise with upload result
 */
export async function uploadToCloudinary(
  file: Buffer | string,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  try {
    const uploadOptions = {
      folder: options.folder || "task-attachments",
      resource_type: options.resource_type || "auto",
      ...options,
    };
    console.log(uploadOptions);
    const result = await cloudinary.uploader.upload(
      file instanceof Buffer
        ? `data:application/octet-stream;base64,${file.toString("base64")}`
        : (file as string),
      uploadOptions
    );

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload file to Cloudinary");
  }
}

/**
 * Delete a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 * @param resourceType - The resource type (image, video, raw, etc.)
 * @returns Promise with deletion result
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: string = "auto"
): Promise<{ result: string }> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete file from Cloudinary");
  }
}

/**
 * Get a signed URL for secure access to a Cloudinary resource
 * @param publicId - The public ID of the file
 * @param options - Options for URL generation
 * @returns Signed URL
 */
export function getSignedUrl(
  publicId: string,
  options: {
    resource_type?: string;
    transformation?: any;
    expires_at?: number;
  } = {}
): string {
  try {
    return cloudinary.url(publicId, {
      resource_type: options.resource_type || "auto",
      transformation: options.transformation,
      expires_at: options.expires_at,
      sign_url: true,
    });
  } catch (error) {
    console.error("Cloudinary signed URL error:", error);
    throw new Error("Failed to generate signed URL");
  }
}

/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary URL
 * @returns Public ID or null if invalid URL
 */
export function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/v\d+\/(.+)\./);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
}

/**
 * Check if a string is a Cloudinary URL
 * @param url - URL to check
 * @returns boolean
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes("cloudinary.com") || url.includes("res.cloudinary.com");
}

/**
 * Get resource type from file extension
 * @param filename - File name with extension
 * @returns Resource type
 */
export function getResourceTypeFromFilename(
  filename: string
): "auto" | "image" | "video" | "raw" {
  const extension = filename.split(".").pop()?.toLowerCase();

  const imageExtensions = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "svg",
    "bmp",
    "ico",
  ];
  const videoExtensions = ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"];
  const documentExtensions = [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "txt",
    "rtf",
    "odt",
    "ods",
    "odp",
  ];

  if (imageExtensions.includes(extension || "")) {
    return "image";
  } else if (videoExtensions.includes(extension || "")) {
    return "video";
  } else if (documentExtensions.includes(extension || "")) {
    return "raw";
  } else {
    return "raw";
  }
}
