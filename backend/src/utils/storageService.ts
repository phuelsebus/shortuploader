import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import logger from "./logger";

function getS3Client(): S3Client {
  const region = process.env.AWS_REGION;
  if (!region) throw new Error("AWS_REGION environment variable is not set");
  return new S3Client({ region });
}

function getBucket(): string {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error("AWS_S3_BUCKET environment variable is not set");
  return bucket;
}

/**
 * Uploads a local file to S3 and returns its public HTTPS URL.
 * The object key is: uploads/<basename>
 *
 * Prerequisites:
 * - The S3 bucket must allow public read (or use a bucket policy / CloudFront).
 * - AWS credentials must be available via env vars or IAM role.
 */
export async function uploadToS3(filePath: string): Promise<string> {
  const client = getS3Client();
  const bucket = getBucket();
  const key = `uploads/${path.basename(filePath)}`;

  const fileBuffer = fs.readFileSync(filePath);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: "video/mp4",
      // ACL is intentionally omitted — use a bucket policy for public read access
    }),
  );

  const region = process.env.AWS_REGION!;
  const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  logger.info({ message: "Uploaded video to S3", key, publicUrl });
  return publicUrl;
}

/**
 * Deletes an object from S3 by key.
 * The key must match the one used in uploadToS3 (i.e. "uploads/<basename>").
 */
export async function deleteFromS3(filePath: string): Promise<void> {
  const client = getS3Client();
  const bucket = getBucket();
  const key = `uploads/${path.basename(filePath)}`;

  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    logger.info({ message: "Deleted video from S3", key });
  } catch (err) {
    // Non-fatal — log and continue; Instagram has already published.
    logger.warn({ message: "Failed to delete video from S3", key, err });
  }
}
