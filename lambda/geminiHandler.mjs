import https from 'https';
import fs from 'fs';
import path from 'path';

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Log file configuration
const LOG_DIR = process.env.LOG_DIR || '/tmp/chess-online-logs';
const LOG_FILE = path.join(LOG_DIR, 'gemini-api.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Log a message to the log file
 * @param {string} message - The message to log
 */
const logMessage = (message) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  try {
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
};

// CORS configuration
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://code-server.home:3000', 'http://code-server.home:3000/game'];

// Enable debug logging
const DEBUG = process.env.DEBUG === 'true' || true;

/**
 * Make a request to the Gemini API
 * @param {string} prompt - The prompt to send to the API
 * @param {number} temperature - The temperature parameter for the API
 * @returns {Promise<string>} - The response from the API
 */
const callGeminiAPI = (prompt, temperature = 0.7) => {
  return new Promise((resolve, reject) => {
    // Log the request (truncate long prompts for readability)
    const truncatedPrompt = prompt.length > 500 ? prompt.substring(0, 500) + '... [truncated]' : prompt;
    console.log(`REQUEST PROMPT (truncated):\n${truncatedPrompt}\nTemperature: ${temperature}`);
    logMessage(`REQUEST PROMPT (truncated):\n${truncatedPrompt}\nTemperature: ${temperature}`);
    
    // Save full prompt to a separate log file for debugging
    try {
      const fullPromptLogFile = path.join(LOG_DIR, 'full-prompts.log');
      fs.appendFileSync(fullPromptLogFile, `\n\n[${new Date().toISOString()}] FULL PROMPT:\n${prompt}\n`);
    } catch (error) {
      console.error('Error writing full prompt to log file:', error);
    }
    
    // Prepare the request data
    // More aggressive sanitization to ensure it doesn't contain any characters that could break JSON
    const sanitizedPrompt = prompt
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\\(?!["\\/bfnrt])/g, '\\\\') // Escape backslashes not followed by valid escape chars
      .replace(/"/g, '\\"') // Escape double quotes
      .replace(/\n/g, '\\n') // Replace newlines with escaped newlines
      .replace(/\r/g, '\\r') // Replace carriage returns with escaped carriage returns
      .replace(/\t/g, '\\t') // Replace tabs with escaped tabs
      .replace(/[\u2028\u2029]/g, ''); // Remove line/paragraph separators
    
    const requestObject = {
      contents: [
        {
          parts: [
            {
              text: sanitizedPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024
      }
    };
    
    // Create the JSON string that will be sent to Gemini API
    let requestData = JSON.stringify(requestObject);
    
    // Validate the JSON string to ensure it's valid
    try {
      // Try to parse the JSON string to ensure it's valid
      JSON.parse(requestData);
      logMessage(`JSON VALIDATION: Valid JSON`);
    } catch (error) {
      // If the JSON is invalid, log the error and create a simplified request
      logMessage(`JSON VALIDATION ERROR: ${error.message}`);
      console.error(`Invalid JSON detected: ${error.message}`);
      
      // Create a simplified request with minimal content
      const fallbackRequest = JSON.stringify({
        contents: [{ parts: [{ text: "Please provide a chess move or analysis" }] }],
        generationConfig: { temperature, maxOutputTokens: 1024 }
      });
      
      logMessage(`USING FALLBACK REQUEST: ${fallbackRequest}`);
      requestData = fallbackRequest;
    }
    
    // Log the exact JSON string that will be sent to Gemini API (no formatting, no truncation)
    logMessage(`EXACT REQUEST JSON: ${requestData}`);
    
    // Also log the raw request object for debugging
    logMessage(`RAW REQUEST OBJECT: ${JSON.stringify(requestObject)}`);
    
    // Prepare the request options
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': requestData.length
      }
    };
    
    // Make the request
    const req = https.request(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        // Log the complete response without truncation
        console.log(`Response status: ${res.statusCode}`);
        console.log(`COMPLETE RESPONSE DATA: ${responseData}`);
        
        // Log the exact response to the log file
        logMessage(`EXACT RESPONSE:\nStatus: ${res.statusCode}\nData: ${responseData}`);
        
        // Save raw response to a separate log file for debugging
        try {
          const rawResponseLogFile = path.join(LOG_DIR, 'raw-responses.log');
          fs.appendFileSync(rawResponseLogFile, `\n\n[${new Date().toISOString()}] RAW RESPONSE:\nStatus: ${res.statusCode}\n${responseData}\n`);
        } catch (error) {
          console.error('Error writing raw response to log file:', error);
        }
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedResponse = JSON.parse(responseData);
            if (parsedResponse.candidates && parsedResponse.candidates.length > 0) {
              const text = parsedResponse.candidates[0].content.parts[0].text;
              resolve(text);
            } else {
              logMessage(`ERROR: No candidates in response: ${responseData}`);
              reject(new Error('No candidates in response'));
            }
          } catch (error) {
            logMessage(`ERROR: JSON parsing error: ${error.message}\nResponse: ${responseData}`);
            reject(error);
          }
        } else {
          logMessage(`ERROR: API request failed with status ${res.statusCode}: ${responseData}`);
          reject(new Error(`API request failed with status ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      // Log detailed error information
      console.error('Request error:', error);
      logMessage(`ERROR DETAILS:\nMessage: ${error.message}\nStack: ${error.stack}\nCode: ${error.code || 'N/A'}`);
      
      // Save error to a separate log file for debugging
      try {
        const errorLogFile = path.join(LOG_DIR, 'error.log');
        fs.appendFileSync(errorLogFile, `\n\n[${new Date().toISOString()}] REQUEST ERROR:\n${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}\n`);
      } catch (logError) {
        console.error('Error writing to error log file:', logError);
      }
      
      reject(error);
    });
    
    req.write(requestData);
    req.end();
  });
};

/**
 * Get CORS headers based on the origin
 * @param {string} origin - The origin from the request headers
 * @returns {Object} - CORS headers
 */
const getCorsHeaders = (origin) => {
  // Check if the origin is allowed
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : null;
  
  // Log the CORS check
  console.log(`CORS Check: Origin: ${origin}, Allowed: ${allowedOrigin ? 'Yes' : 'No'}`);
  
  // Return CORS headers
  return {
    'Access-Control-Allow-Origin': allowedOrigin || 'null', // Only allow specific origins
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-api-key',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
    'Content-Type': 'application/json; charset=utf-8'
  };
};
/**
 * Basic validation for a chess move format
 * @param {string} moveText - The move text in the format "e2e4" or "e7e8q"
 * @returns {boolean} - True if the move format is valid, false otherwise
 */
const validateMoveFormat = (moveText) => {
  try {
    // Check if the move text has the correct length
    if (moveText.length < 4 || moveText.length > 5) {
      console.log(`Invalid move format length: ${moveText}`);
      return false;
    }
    
    // Parse the move text
    const from = moveText.substring(0, 2);
    const to = moveText.substring(2, 4);
    const promotion = moveText.length > 4 ? moveText.substring(4, 5) : undefined;
    
    // Check if the from and to squares are valid chess squares
    const isValidSquare = (square) => {
      return square.length === 2 &&
             'abcdefgh'.includes(square[0]) &&
             '12345678'.includes(square[1]);
    };
    
    if (!isValidSquare(from) || !isValidSquare(to)) {
      console.log(`Invalid square in move: ${moveText}`);
      return false;
    }
    
    // Check if the promotion piece is valid (if present)
    if (promotion && !'qrbnQRBN'.includes(promotion)) {
      console.log(`Invalid promotion piece: ${promotion}`);
      return false;
    }
    
    console.log(`Move format is valid: ${moveText}`);
    return true;
  } catch (error) {
    console.error(`Error validating move format: ${error.message}`);
    return false;
  }
};

/**
 * Lambda handler function
 * @param {Object} event - The Lambda event
 * @param {Object} context - The Lambda context
 * @returns {Promise<Object>} - The Lambda response
 */
export const handler = async (event, context) => {
  // Log the Lambda invocation
  console.log(`LAMBDA INVOCATION: ${event.httpMethod} request received`);
  
  if (DEBUG) {
    // Log event details in debug mode, but truncate to avoid huge logs
    const eventStr = JSON.stringify(event);
    console.log(`Event details: ${eventStr.length > 200 ? eventStr.substring(0, 200) + '...' : eventStr}`);
  }
  
  // Get the origin from the request headers
  const origin = event.headers?.origin || event.headers?.Origin || '';
  console.log(`Request Origin: ${origin}`);
  
  // Get CORS headers
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request (CORS preflight)');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify('CORS preflight successful')
    };
  }
  
  // Handle POST request
  if (event.httpMethod === 'POST') {
    // Check if origin is allowed
    if (!ALLOWED_ORIGINS.includes(origin)) {
      console.log(`Blocked request from disallowed origin: ${origin}`);
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Forbidden: Origin not allowed',
          success: false
        })
      };
    }
    
    try {
      // Parse the request body
      const body = JSON.parse(event.body);
      const { prompt, temperature, difficulty, requestType, fen, message, chatHistory } = body;
      
      // Log the exact request body without any formatting or truncation
      console.log(`EXACT REQUEST BODY: ${event.body}`);
      logMessage(`EXACT REQUEST BODY: ${event.body}`);
      
      // Log the parsed body as raw JSON string
      const rawBodyString = JSON.stringify(body);
      logMessage(`RAW PARSED BODY: ${rawBodyString}`);
      
      // Log basic request details to console
      console.log(`REQUEST TYPE: ${requestType}, DIFFICULTY: ${difficulty}`);
      
      // Call the Gemini API
      const response = await callGeminiAPI(prompt, temperature);
      
      // For move requests, validate the move format before returning
      if (requestType === 'move') {
        const moveText = response.trim();
        console.log(`Validating move format: ${moveText}`);
        
        const isValidFormat = validateMoveFormat(moveText);
        
        if (!isValidFormat) {
          console.log(`Invalid move format returned by Gemini: ${moveText}`);
          
          // Try to get a valid move by retrying with a more explicit prompt
          const retryPrompt = `
${prompt}

CRITICAL: Your previous move "${moveText}" was invalid. Please provide a move in the correct format.
The format should be exactly like "e2e4" (from square to square).
For pawn promotion, add the promotion piece at the end, like "e7e8q" for queen promotion.

Respond with ONLY a valid move in the format "e2e4" or "e7e8q" for promotion.
`;
          
          console.log('Retrying with more explicit prompt');
          const retryResponse = await callGeminiAPI(retryPrompt, temperature);
          const retryMoveText = retryResponse.trim();
          
          const retryIsValidFormat = validateMoveFormat(retryMoveText);
          
          if (!retryIsValidFormat) {
            console.log(`Retry also produced invalid move format: ${retryMoveText}`);
            
            // Return an error indicating the move format was invalid
            return {
              statusCode: 400,
              headers: corsHeaders,
              body: JSON.stringify({
                error: `Invalid move format: ${moveText}. Retry also invalid: ${retryMoveText}`,
                success: false
              })
            };
          }
          
          console.log(`Retry produced valid move format: ${retryMoveText}`);
          
          // Return the valid move from the retry
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
              content: retryMoveText,
              success: true
            })
          };
        }
        
        console.log(`Move format validated successfully: ${moveText}`);
      }
      
      // Return the response
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          content: response,
          success: true
        })
      };
    } catch (error) {
      // Log detailed error information
      console.error('Lambda handler error:', error);
      logMessage(`LAMBDA ERROR DETAILS:\nMessage: ${error.message}\nStack: ${error.stack}\nCode: ${error.code || 'N/A'}`);
      
      // Save error to a separate log file for debugging
      try {
        const errorLogFile = path.join(LOG_DIR, 'lambda-errors.log');
        fs.appendFileSync(errorLogFile, `\n\n[${new Date().toISOString()}] LAMBDA ERROR:\n${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}\n`);
      } catch (logError) {
        console.error('Error writing to lambda error log file:', logError);
      }
      
      // Return the error with detailed information
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: error.message,
          errorDetails: {
            stack: error.stack,
            code: error.code || 'N/A',
            name: error.name || 'Error'
          },
          success: false
        })
      };
    }
  }
  
  // Handle unsupported methods
  console.log(`Unsupported method: ${event.httpMethod}`);
  return {
    statusCode: 405,
    headers: corsHeaders,
    body: JSON.stringify({
      error: 'Method not allowed',
      success: false
    })
  };
};