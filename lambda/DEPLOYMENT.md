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
   - Key: `ALLOWED_ORIGINS`, Value: A comma-separated list of allowed origins (e.g., `http://localhost:3000,https://your-domain.com`)
   - Key: `DEBUG`, Value: `true` to enable detailed logging (optional)
4. Click "Save"

> **Important**: The `ALLOWED_ORIGINS` environment variable is critical for CORS security. Only requests from these origins will be allowed to access the Lambda function. Make sure to include all domains where your frontend will be hosted.

### 3. Upload the Function Code

1. Zip the `geminiHandler.mjs` file:
   ```
   zip gemini-function.zip geminiHandler.mjs
   ```

2. Upload the zip file to Lambda:
   ```
   aws lambda update-function-code --function-name chess-online-gemini-handler --zip-file fileb://gemini-function.zip
   ```

   Alternatively, you can upload the zip file through the Lambda console.

### 4. Configure Function Settings

1. Set the handler to `geminiHandler.handler`
2. Set the runtime to Node.js 18.x or later
3. Make sure the "ES module" setting is enabled (this is important for .mjs files)
4. Increase the timeout to at least 10 seconds
5. Increase the memory to at least 256 MB

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

The Lambda function now logs all Gemini API requests and responses directly to CloudWatch Logs using `console.log` statements.

To view the logs:

1. Go to the AWS CloudWatch console
2. Navigate to Log Groups
3. Find the log group for your Lambda function (usually /aws/lambda/your-function-name)
4. View the log streams for detailed execution logs

The logs include:
- Lambda invocation details
- CORS checks and origin validation
- Request details (truncated to avoid excessive log size)
- Response status and data (truncated)
- Any errors that occur

You can enable more detailed logging by setting the `DEBUG` environment variable to `true`.

## Troubleshooting

### CORS Issues

The Lambda function now includes proper CORS handling, but you might still encounter CORS issues. Here's how to troubleshoot them:

1. **Check the Lambda logs** in CloudWatch for CORS-related messages:
   - Look for "CORS Check" log entries
   - Verify if your origin is being recognized and allowed

2. **Verify your ALLOWED_ORIGINS environment variable**:
   - Make sure it includes all domains where your frontend is hosted
   - Include `http://localhost:3000` for local development
   - Check for typos or missing protocols (http:// or https://)

3. **Check the browser console** for specific CORS error messages:
   - They will indicate which origin was blocked
   - They will show which headers or methods are not allowed

4. **Test with curl** to isolate browser-specific issues:
   ```bash
   curl -X OPTIONS -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: POST" https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod/gemini
   ```

5. **API Gateway configuration**:
   - The Lambda function handles CORS directly, but API Gateway might still need configuration
   - Go to your API in the API Gateway console
   - Select the resource
   - Click on "Actions" and select "Enable CORS"
   - Make sure to include the appropriate headers
   - Redeploy your API

6. **Check for proxy issues**:
   - If you're using a proxy or CDN, it might be modifying the Origin header
   - Verify the headers being sent to the Lambda function in the logs

### Lambda Execution Issues

If the Lambda function fails to execute:

1. Check the CloudWatch Logs for error messages
2. Verify that the `GEMINI_API_KEY` environment variable is set correctly
3. Make sure the Lambda function has internet access (it should be in a VPC with internet access or not in a VPC at all)

#### ES Module Issues

If you see an error like `require is not defined in ES module scope`:

1. Make sure your Lambda function file has the `.mjs` extension (not `.js`)
2. Verify that you're using ES module syntax (`import` instead of `require`)
3. In the Lambda console, ensure that:
   - The handler is correctly set to `geminiHandler.handler`
   - The runtime is Node.js 18.x or later
   - The "ES module" setting is enabled in the Runtime settings
4. If you're still having issues, try renaming the file to `index.mjs` and setting the handler to `index.handler`

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