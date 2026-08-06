import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env.js";

const s3 = env.S3_UPLOADS_BUCKET
  ? new S3Client({ region: env.AWS_REGION })
  : null;

const bucket = env.S3_UPLOADS_BUCKET;

type UploadResult = { key: string; url: string };

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string
): Promise<UploadResult> {
  if (!s3 || !bucket) {
    throw new Error("S3 not configured");
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return { key, url: `https://${bucket}.s3.${env.AWS_REGION}.amazonaws.com/${key}` };
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  if (!s3 || !bucket) {
    throw new Error("S3 not configured");
  }

  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  if (!s3 || !bucket) {
    throw new Error("S3 not configured");
  }

  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn }
  );
}

export async function deleteFromS3(key: string): Promise<void> {
  if (!s3 || !bucket) return;

  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export function isS3Configured(): boolean {
  return !!s3;
}
