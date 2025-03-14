# Lambda Function Deployment Guide

This guide explains how to deploy the Gemini API Lambda function to AWS and configure it with your API key.

## Prerequisites

1. AWS Account
2. AWS CLI installed and configured
3. Google Gemini API key

## Deployment Steps

### 1. Create a Lambda Function

1. Go to the AWS Lambda console
2. Click "Create function"
3. Choose "Author from scratch"
4. Enter a function name (e.g., `chess-online-gemini-handler`)
5. Select Node.js 18.x (or later) as the runtime
6. Choose or create an execution role with basic Lambda permissions
7. Click "Create function"

### 2. Configure Environment Variables

1. In the Lambda function configuration, go to the "Configuration" tab
2. Click on "Environment variables"
3. Add the following environment variables:
   - Key: `GEMINI_API_KEY`, Value: Your Google Gemini API key
   - Key: `LOG_DIR`, Value: `/tmp/chess-online-logs` (or another writable directory)
4. Click "Save"

### 3. Upload the Function Code

1. Zip the `geminiHandler.js` file:
   ```
   zip gemini-function.zip geminiHandler.js
   ```

2. Upload the zip file to Lambda:
   ```
   aws lambda update-function-code --function-name chess-online-gemini-handler --zip-file fileb://gemini-function.zip
   ```

   Alternatively, you can upload the zip file through the Lambda console.

### 4. Configure Function Settings

1. Set the handler to `geminiHandler.handler`
2. Increase the timeout to at least 10 seconds
3. Increase the memory to at least 256 MB

### 5. Create an API Gateway

1. Go to the API Gateway console
2. Create a new REST API
3. Create a resource (e.g., `/gemini`)
4. Create a POST method for the resource
5. Set the integration type to "Lambda Function"
6. Select your Lambda function
7. Enable CORS for the resource
8. Deploy the API to a stage (e.g., "prod")
9. Note the API endpoint URL

### 6. Update the Frontend Configuration

1. Create a `.env` file in the root of your React project with the following content:
   ```
   REACT_APP_LAMBDA_API_ENDPOINT=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod
   ```

2. Rebuild and deploy your frontend application

## Logging Configuration

The Lambda function logs all Gemini API requests and responses to a file in the specified `LOG_DIR`. By default, this is set to `/tmp/chess-online-logs/gemini-api.log`.

To view the logs:

1. Use CloudWatch Logs to view the Lambda function logs
2. The Gemini API requests and responses will be logged to the file specified in the `LOG_DIR` environment variable

## Troubleshooting

### CORS Issues

If you encounter CORS issues, make sure you've properly configured CORS in API Gateway:

1. Go to your API in the API Gateway console
2. Select the resource
3. Click on "Actions" and select "Enable CORS"
4. Make sure to include the following headers:
   - Access-Control-Allow-Origin: '*' (or your specific domain)
   - Access-Control-Allow-Methods: 'POST, OPTIONS'
   - Access-Control-Allow-Headers: 'Content-Type'
5. Redeploy your API

### Lambda Execution Issues

If the Lambda function fails to execute:

1. Check the CloudWatch Logs for error messages
2. Verify that the `GEMINI_API_KEY` environment variable is set correctly
3. Make sure the Lambda function has internet access (it should be in a VPC with internet access or not in a VPC at all)

### API Gateway Issues

If the API Gateway is not working:

1. Make sure the integration with the Lambda function is correct
2. Check that the resource and method are properly configured
3. Verify that the API has been deployed to a stage
4. Check the API Gateway logs in CloudWatch

## Security Considerations

1. The Gemini API key is stored as an environment variable in Lambda, which is more secure than storing it in the frontend code
2. All requests to the Gemini API are logged for debugging purposes
3. Consider using AWS Secrets Manager for storing the API key in a production environment
4. In a production environment, restrict the CORS settings to only allow requests from your domain