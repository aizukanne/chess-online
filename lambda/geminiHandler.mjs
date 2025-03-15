import https from 'https';

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// CORS configuration
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'https://chess-online.example.com'];

// Enable debug logging
const DEBUG = process.env.DEBUG === 'true' || true;

/**
 * Log a message with timestamp
 * @param {string} message - The message to log
 */
const logMessage = (message) => {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }
};

/**
 * Make a request to the Gemini API
 * @param {string} prompt - The prompt to send to the API
 * @param {number} temperature - The temperature parameter for the API
 * @returns {Promise<string>} - The response from the API
 */
const callGeminiAPI = (prompt, temperature = 0.7) => {
  return new Promise((resolve, reject) => {
    // Log the request
    console.log(`REQUEST:\nPrompt: ${prompt.substring(0, 100)}...\nTemperature: ${temperature}`);
    
    // Prepare the request data
    const requestData = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
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
    });
    
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
        // Log the response status
        console.log(`RESPONSE:\nStatus: ${res.statusCode}`);
        
        // Log a truncated version of the response data to avoid cluttering logs
        if (DEBUG) {
          const truncatedResponse = responseData.length > 200
            ? responseData.substring(0, 200) + '...'
            : responseData;
          console.log(`Response data: ${truncatedResponse}`);
        }
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedResponse = JSON.parse(responseData);
            if (parsedResponse.candidates && parsedResponse.candidates.length > 0) {
              const text = parsedResponse.candidates[0].content.parts[0].text;
              resolve(text);
            } else {
              reject(new Error('No candidates in response'));
            }
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`API request failed with status ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`ERROR: ${error.message}`);
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
      const { prompt, temperature, difficulty, requestType, fen, message } = body;
      
      // Log the request details
      console.log(`REQUEST DETAILS: Type: ${requestType}, Difficulty: ${difficulty}`);
      if (DEBUG) {
        console.log(`FEN: ${fen}`);
        console.log(`Message: ${message || 'N/A'}`);
      }
      
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
      // Log the error
      console.error(`ERROR: ${error.message}`);
      
      // Return the error
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: error.message,
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