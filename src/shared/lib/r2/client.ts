import { S3Client } from "@aws-sdk/client-s3";

let r2Client: S3Client | null = null;

function requireR2Env(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing Cloudflare R2 environment variable: ${name}`);
  }

  return value;
}

export function getR2Client() {
  if (r2Client) {
    return r2Client;
  }

  r2Client = new S3Client({
    region: "auto",
    endpoint: requireR2Env("R2_ENDPOINT"),
    credentials: {
      accessKeyId: requireR2Env("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireR2Env("R2_SECRET_ACCESS_KEY"),
    },
  });

  return r2Client;
}

export function getR2BucketName() {
  return requireR2Env("R2_BUCKET_NAME");
}
