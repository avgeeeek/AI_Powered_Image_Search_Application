// File: app/api/upload/route.js

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import crypto from "crypto"; // Built-in Node.js module

// Create a new S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// This function handles POST requests to /api/upload
export async function POST(request) {
  const { filename, contentType } = await request.json();

  try {
    // Create a unique file key (e.g., 1a2b3c4d-my-image.jpg)
    const randomBytes = crypto.randomBytes(8);
    const fileKey = `${randomBytes.toString("hex")}-${filename}`;

    // Create the command
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    });

    // Get a pre-signed URL valid for 60 seconds
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60,
    });

    return NextResponse.json({
      url: signedUrl,
      key: fileKey, // Return the key so we know the filename
    }, { status: 200 });

  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json({ error: "Error generating signed URL" }, { status: 500 });
  }
}