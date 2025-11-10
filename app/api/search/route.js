// File: app/api/search/route.js

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

// This handles GET requests to /api/search?q=...
export async function GET(request) {
  // Get the search query 'q' from the URL
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Search query 'q' is required" }, { status: 400 });
  }

  // 1. Search DynamoDB
  // Note: Scan is inefficient for large tables. For production, use a GSI.
  const scanCommand = new ScanCommand({
    TableName: process.env.DYNAMODB_TABLE_NAME,
    FilterExpression: "contains(labels, :query)",
    ExpressionAttributeValues: {
      ":query": { S: query.toLowerCase() },
    },
  });

  try {
    const dynamoResponse = await dynamoDBClient.send(scanCommand);
    const items = dynamoResponse.Items;

    // 2. For each matching item, get a pre-signed S3 URL to view it
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
        labels: item.labels.SS, // Return labels for debugging/display
      });
    }

    return NextResponse.json(imageResults, { status: 200 });

  } catch (error)
 {
    console.error("Error searching:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}