import https from 'https';

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Using v1 endpoint with your specified model
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// CORS configuration
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://code-server.home:3000', 'http://code-server.home:3000/game'];

// Enable debug logging
const DEBUG = process.env.DEBUG === 'true' || true;

// System prompts for different personas
const SYSTEM_PROMPTS = {
  kasparov: {
    persona: `You are Garry Kasparov, a world-class chess grandmaster with particular expertise in the Sicilian Defense Najdorf Variation.
              As a grandmaster, you have:
              - Deep understanding of complex interplay between tactical opportunities and long-term strategic considerations
              - Expertise in pattern recognition and positional evaluation
              - Knowledge of recent theoretical developments from 2020-2024 top-level tournament play
              - Ability to analyze psychological aspects of choosing specific variations`,

    algorithm: `When analyzing positions or suggesting moves, use the Minimax algorithm with Alpha-Beta pruning:
              1. Evaluate material balance using standard piece values (pawn=100, knight=320, bishop=330, rook=500, queen=900)
              2. Consider piece-square tables for positional evaluation (piece placement quality)
              3. Evaluate positions based on:
                - Material balance
                - Piece activity and coordination
                - Pawn structure
                - King safety
                - Control of key squares and center
                - Development and tempo`,

    moveRules: `Rules for suggesting moves:
              1. Provide only a single move in the format "e2e4" (from square to square).
              2. If it's a pawn promotion, add the promotion piece at the end, like "e7e8q" for queen promotion.
              3. The move must be legal according to chess rules.
              4. For beginner difficulty, make instructive moves that teach good principles rather than completely random moves.
              5. For intermediate difficulty, play solid positional chess with occasional tactical opportunities.
              6. For advanced difficulty, play strong tactical and strategic moves considering long-term plans.
              7. For master difficulty, provide the strongest tournament-level move you can find, as if playing in a world championship match.`,

    analysisRules: `Rules for position analysis:
              1. Analyze the position based on the difficulty level.
              2. For beginner difficulty, use simple language and focus on basic concepts (2-3 sentences).
              3. For intermediate difficulty, provide a balanced analysis of material, position, and basic tactics (3-5 sentences).
              4. For advanced difficulty, include concrete variations and deeper strategic themes (5-7 sentences).
              5. For master difficulty, provide tournament-level analysis with precise variations, including:
                - Detailed evaluation of the position with numerical assessments
                - Key tactical motifs and pattern recognition
                - Strategic themes and middlegame plans
                - Critical pawn structures and their implications
                - Typical piece placement and coordination
                - Potential endgame scenarios
              6. Use proper chess notation and provide evaluations using both traditional symbols (±, =, ∓) and numerical assessments where appropriate.
              7. Explain the reasoning behind critical moves rather than just listing them.`,

    chatRules: `Rules for chat responses:
              1. You are ADVISING the player, not playing against them. The difficulty level refers to the player's skill level you're advising.
              2. Respond in a helpful, concise manner (1-3 sentences for beginners, more detailed for advanced players).
              3. If the player asks for a hint or help, provide analysis appropriate to their difficulty level.
              4. When describing chess moves, always explain them in plain English first, followed by the notation in parentheses.
                Example: "Moving your knight to attack the queen (Nf3)" or "Capturing the pawn with your bishop (Bxe5)"
              5. Stay in character as Kasparov, the chess grandmaster.
              6. If the player asks something unrelated to chess, politely redirect to the game.
              7. When discussing concrete variations, use proper chess notation and provide evaluations.
              8. Maintain continuity with the conversation history - refer back to previous exchanges when relevant.`
  }
  // Additional personas could be added here in the future
};

/**
 * Build the system instruction based on request type and difficulty
 * @param {string} requestType - The type of request (move, analysis, chat)
 * @param {string} difficulty - The difficulty level
 * @returns {string} - The system instruction
 */
const buildSystemInstruction = (requestType, difficulty) => {
  const systemPrompt = SYSTEM_PROMPTS.kasparov;
  
  // System prompt includes persona, algorithm and request-specific rules
  let prompt = `${systemPrompt.persona}\n\n${systemPrompt.algorithm}\n\n`;
  
  // Add look-ahead depth based on difficulty
  const lookAhead = difficulty === 'beginner' ? '1-2' :
                    difficulty === 'intermediate' ? '2-3' :
                    difficulty === 'advanced' ? '3-4' : '4-5';
  prompt += `For this ${difficulty} level request, look ahead ${lookAhead} moves.\n\n`;
  
  // Add randomization instructions based on difficulty
  if (difficulty === 'beginner') {
    prompt += 'Occasionally (30-40% chance) choose a suboptimal but instructive move.\n\n';
  } else if (difficulty === 'intermediate') {
    prompt += 'Occasionally (10-20% chance) choose a slightly suboptimal move.\n\n';
  } else if (difficulty === 'advanced') {
    prompt += 'Rarely (5-10% chance) choose a slightly suboptimal move.\n\n';
  } else {
    prompt += 'Always choose the objectively strongest move.\n\n';
  }
  
  // Add request-type specific rules
  if (requestType === 'move') {
    prompt += `${systemPrompt.moveRules}\n\n`;
  } else if (requestType === 'analysis') {
    prompt += `${systemPrompt.analysisRules}\n\n`;
  } else if (requestType === 'chat') {
    prompt += `${systemPrompt.chatRules}\n\n`;
  }
  
  return prompt;
};

/**
 * Make a request to the Gemini API with correct systemInstruction format
 * @param {string} userPrompt - The user's prompt to send to the API
 * @param {string} systemInstruction - The system instructions for the AI
 * @param {number} temperature - The temperature parameter for the API
 * @returns {Promise<string>} - The response from the API
 */
const callGeminiAPI = (userPrompt, systemInstruction, temperature = 0.7) => {
  return new Promise((resolve, reject) => {
    // Log the request information
    console.log(`REQUEST with temperature: ${temperature}`);
    if (DEBUG) {
      console.log(`SYSTEM INSTRUCTION: ${systemInstruction.substring(0, 200)}...`);
      console.log(`USER PROMPT: ${userPrompt.substring(0, 200)}...`);
    }
    
    // Remove any control characters that could break JSON
    const sanitizedSystemInstruction = systemInstruction
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/[\u2028\u2029]/g, ''); // Remove line/paragraph separators
    
    const sanitizedUserPrompt = userPrompt
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/[\u2028\u2029]/g, ''); // Remove line/paragraph separators
    
    // Prepare the request data with correct Gemini API format
    const requestObject = {
      contents: [
        {
          parts: [
            { text: sanitizedUserPrompt }
          ]
        }
      ],
      systemInstruction: { 
        parts: [
          { text: sanitizedSystemInstruction }
        ]
      },
      generationConfig: {
        temperature,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024
      }
    };
    
    // Let JSON.stringify handle proper escaping
    let requestData;
    try {
      requestData = JSON.stringify(requestObject);
      
      // Validate the JSON string to ensure it's valid
      JSON.parse(requestData);
      console.log(`JSON VALIDATION: Valid JSON`);
    } catch (error) {
      // If the JSON is invalid, log detailed error information
      console.error(`JSON VALIDATION ERROR: ${error.message}`);
      
      // Parse the error message to extract the position where JSON parsing failed
      const positionMatch = error.message.match(/position\s+(\d+)/i) || 
                          error.message.match(/at\s+position\s+(\d+)/i) ||
                          error.message.match(/\n(\d+)\n/);
      
      if (positionMatch && positionMatch[1]) {
        const position = parseInt(positionMatch[1]);
        const start = Math.max(0, position - 20);
        const end = Math.min(requestData?.length || 0, position + 20);
        
        // Show the problematic section with markers
        if (requestData) {
          const problematicSection = requestData.substring(start, end);
          const marker = ' '.repeat(Math.min(20, position - start)) + '^';
          
          console.error(`JSON ERROR at position ${position}: ${error.message}`);
          console.error(`Context: ${problematicSection}`);
          console.error(`Position: ${marker}`);
        }
      }
      
      // Create a simplified fallback request
      const fallbackRequest = {
        contents: [
          {
            parts: [{ text: "Please provide a chess move or analysis." }]
          }
        ],
        systemInstruction: {
          parts: [{ text: "You are a chess assistant." }]
        },
        generationConfig: { temperature, maxOutputTokens: 1024 }
      };
      
      requestData = JSON.stringify(fallbackRequest);
      console.log(`USING FALLBACK REQUEST: ${requestData}`);
    }
    
    if (DEBUG) {
      console.log(`EXACT REQUEST JSON: ${requestData.substring(0, 500)}...`);
    }
    
    // Prepare the request options
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
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
        console.log(`Response status: ${res.statusCode}`);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedResponse = JSON.parse(responseData);
            if (parsedResponse.candidates && parsedResponse.candidates.length > 0) {
              const text = parsedResponse.candidates[0].content.parts[0].text;
              resolve(text);
            } else {
              console.error(`ERROR: No candidates in response: ${responseData}`);
              reject(new Error('No candidates in response'));
            }
          } catch (error) {
            console.error(`ERROR: JSON parsing error: ${error.message}\nResponse: ${responseData}`);
            reject(error);
          }
        } else {
          console.error(`ERROR: API request failed with status ${res.statusCode}: ${responseData}`);
          reject(new Error(`API request failed with status ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      // Log detailed error information
      console.error('Request error:', error);
      console.error(`ERROR DETAILS: Message: ${error.message}, Code: ${error.code || 'N/A'}`);
      reject(error);
    });
    
    // Set timeout for the request
    req.setTimeout(30000, () => {
      req.destroy();
      console.error('ERROR: Request timeout after 30 seconds');
      reject(new Error('Request timeout after 30 seconds'));
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
      let body;
      try {
        body = JSON.parse(event.body);
      } catch (parseError) {
        console.error(`Error parsing request body: ${parseError.message}`);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: `Invalid request body: ${parseError.message}`,
            success: false
          })
        };
      }
      
      const { prompt: userPrompt, temperature, difficulty, requestType, fen, message, chatHistory } = body;
      
      if (DEBUG) {
        console.log(`EXACT REQUEST BODY: ${event.body}`);
        console.log(`REQUEST TYPE: ${requestType}, DIFFICULTY: ${difficulty}`);
      }
      
      // Build the system instruction with persona details, algorithms, and rules
      const systemInstruction = buildSystemInstruction(requestType, difficulty);
      
      // Call the Gemini API with proper system instruction format
      const response = await callGeminiAPI(userPrompt, systemInstruction, temperature);
      
      // For move requests, validate the move format before returning
      if (requestType === 'move') {
        const moveText = response.trim();
        console.log(`Validating move format: ${moveText}`);
        
        const isValidFormat = validateMoveFormat(moveText);
        
        if (!isValidFormat) {
          console.log(`Invalid move format returned by Gemini: ${moveText}`);
          
          // Add retry instructions to the user prompt
          const retryUserPrompt = `
${userPrompt}

CRITICAL: Your previous move "${moveText}" was invalid. Please provide a move in the correct format.
The format should be exactly like "e2e4" (from square to square).
For pawn promotion, add the promotion piece at the end, like "e7e8q" for queen promotion.

Respond with ONLY a valid move in the format "e2e4" or "e7e8q" for promotion.
`;
          
          console.log('Retrying with more explicit prompt');
          const retryResponse = await callGeminiAPI(retryUserPrompt, systemInstruction, temperature);
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
