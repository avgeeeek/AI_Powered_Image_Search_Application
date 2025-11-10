import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

// Create S3 and DynamoDB clients
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// This handles GET requests to /api/images
export async function GET(request) {
  // 1. Scan DynamoDB for all items
  // WARNING: A Scan operation is inefficient on large tables.
  // This is fine for a small project, but not for large-scale production.
  const scanCommand = new ScanCommand({
    TableName: process.env.DYNAMODB_TABLE_NAME,
  });

  try {
    const dynamoResponse = await dynamoDBClient.send(scanCommand);
    const items = dynamoResponse.Items;

    // 2. For each item, get a pre-signed S3 URL to view it
    const imageResults = [];
    for (const item of items) {
      const s3_key = item.s3_key.S;
      
      const getObjectCommand = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: s3_key,
      });
      
      // Get a viewable URL valid for 1 hour
      const viewUrl = await getSignedUrl(s3Client, getObjectCommand, {
        expiresIn: 3600,
      });
      
      imageResults.push({
        s3_key: s3_key,
        url: viewUrl,
        labels: item.labels?.SS || [], // Use optional chaining in case labels don't exist
      });
    }

    // Sort by key (filename) to get a consistent order
    imageResults.sort((a, b) => a.s3_key.localeCompare(b.s3_key));

    return NextResponse.json(imageResults, { status: 200 });

  } catch (error) {
    console.error("Error fetching all images:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}