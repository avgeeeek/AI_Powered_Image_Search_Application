AI-Powered Image Search Application

This repository contains the source code for a full-stack, AI-powered image search application. It allows users to upload images, which are then auto-tagged using machine learning (AWS Rekognition). These tags are stored in a database (AWS DynamoDB) and can be used to search for images.

The project is built on a modern, serverless architecture using Next.js, Vercel, and the AWS ecosystem.

Features

Secure Image Uploads: Implements direct-to-S3 file uploads using pre-signed URLs, ensuring files never pass through the application server.

Automatic AI Tagging: File uploads trigger an AWS Lambda function, which uses AWS Rekognition to analyze image content and generate relevant descriptive tags.

Dynamic Tag-Based Search: A clean search interface queries the DynamoDB table for matching tags and returns a list of relevant images.

Serverless Architecture: Built entirely on serverless principles for high scalability and low operational overhead. The frontend is hosted on Vercel, and all backend logic runs on-demand via AWS Lambda and Next.js API Routes.

Technology Stack & Architecture

This project uses a decoupled, event-driven architecture:

Frontend: Next.js (React) & Tailwind CSS

Deployment: Vercel

Image Storage: AWS S3 (Simple Storage Service)

AI Analysis: AWS Rekognition

Database: AWS DynamoDB

Backend Glue: AWS Lambda & Next.js API Routes

How It Works

Upload Process:

The user selects a file in the browser.

The Next.js frontend calls its internal /api/upload route to request an upload "pass."

This API route, running on the server, uses the AWS SDK to generate a temporary, secure pre-signed S3 URL and sends it back to the client.

The browser uploads the file directly to S3 using this pre-signed URL.

Automatic Tagging Process:

The S3 bucket is configured with an event notification that triggers an AWS Lambda function (process-image-tags) on every new file creation.

The Lambda function receives the event, takes the new image's S3 location, and sends it to AWS Rekognition for analysis.

Rekognition returns a list of detected labels (tags).

The Lambda function writes the image's filename (s3_key) and the array of labels to the DynamoDB table.

Search Process:

The user types a query (e.g., "beach") into the search bar.

The frontend calls the /api/search?q=beach route.

This API route scans the DynamoDB table for all items containing the "beach" tag in their labels attribute.

For each matching s3_key, the server generates a pre-signed S3 URL to view the private file.

The API route returns a list of these secure, viewable URLs, which the frontend renders in a grid.

Local Development Setup

To run this project on your own machine, you must configure the required AWS services.

Prerequisites

An AWS Account

Node.js (v18 or later)

Git

1. AWS Service Configuration

AWS S3:

Create a new, private S3 bucket.

In the "Permissions" tab, add a CORS policy to allow PUT requests from http://localhost:3000.

AWS DynamoDB:

Create a new DynamoDB table (e.g., image-tags).

Set the Partition key to s3_key (String).

AWS IAM:

Create an IAM User for your application. Grant it Programmatic access.

Attach policies: AmazonS3FullAccess, AmazonRekognitionFullAccess, AmazonDynamoDBFullAccess.

Save the generated Access key ID and Secret access key.

AWS Lambda:

Create a new Lambda function (process-image-tags) using a Node.js runtime.

Give its execution role permissions to:

Read from S3 (AmazonS3ReadOnlyAccess)

Use Rekognition (AmazonRekognitionFullAccess)

Write to DynamoDB (AmazonDynamoDBFullAccess)

Add the code for the Lambda function (from your project or the AWS console).

Set the Lambda function's destination as your DynamoDB table.

Connect S3 to Lambda:

In your S3 bucket's "Properties" tab, create an Event notification.

Configure it to trigger your process-image-tags Lambda function on "All object create events".

2. Local Project Setup

Clone the repository:

git clone [https://github.com/YOUR_USERNAME/image-search-app.git](https://github.com/YOUR_USERNAME/image-search-app.git)
cd image-search-app

Install dependencies:

npm install

Create your environment file:

Create a new file in the root of the project named .env.local.

Fill it with your keys from the AWS setup.

# .env.local

# IAM User Keys

AWS_ACCESS_KEY_ID=YOUR_IAM_USER_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_IAM_USER_SECRET_ACCESS_KEY

# S3 Bucket Info

AWS_S3_BUCKET_NAME=your-unique-bucket-name
AWS_REGION=your-bucket-region (e.g., us-east-1)

# DynamoDB Info

DYNAMODB_TABLE_NAME=image-tags

Run the development server:

npm run dev

Open http://localhost:3000 in your browser. You should now be able to upload and search for images.

Deployment Guide

This project is configured for deployment on Vercel.

Push your code to a GitHub repository.

Import the repository into Vercel.

In the Vercel project settings, go to "Environment Variables" and add all the keys from your .env.local file.

Final Step: Add your public Vercel URL (e.g., https://my-app.vercel.app) to your S3 bucket's CORS policy AllowedOrigins list. This is necessary for uploads to work on your live site.
