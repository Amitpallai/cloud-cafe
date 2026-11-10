import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../config/cloudinary.js";

export function uploadMenuImage(
  buffer: Buffer,
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "cloud-cafe/menu",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Cloudinary upload failed"));

        resolve(result);
      },
    );

    stream.end(buffer);
  });
}

export async function deleteCloudinaryImage(
  publicId: string,
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });
}
