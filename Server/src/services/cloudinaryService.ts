import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";

/**
 * Uploads an in-memory PDF buffer directly to Cloudinary.
 * @returns The secure HTTPS URL of the hosted PDF.
 */
export async function uploadPdfToCloudinary(buffer: Buffer, originalFilename: string): Promise<string> {
    return new Promise((resolve, reject) => {

        const cleanName = originalFilename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");

        //Uses uploadStream as Upload in cloudinary expects file to be saved in hard drive and upload_stream streams bytes directly from memory to cloudinary.
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "image",
                folder: "brainly_pdfs",
                public_id: `${Date.now()}_${cleanName}`,
                format: "pdf",
            },
            (error, result) => {
                if (error || !result) {
                    return reject(error || new Error("Failed to upload PDF to Cloudinary"));
                }
                resolve(result.secure_url);
            }
        );

        // Convert Buffer to Stream and pipe to Cloudinary
        Readable.from(buffer).pipe(uploadStream);
    });
}
