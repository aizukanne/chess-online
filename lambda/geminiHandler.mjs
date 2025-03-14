import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Get the directory name using ES module approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

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

/**
 * Make a request to the Gemini API
 * @param {string} prompt - The prompt to send to the API
 * @param {number} temperature - The temperature parameter for the API
 * @returns {Promise<string>} - The response from the API
 */
const callGeminiAPI = (prompt, temperature = 0.7) => {
  return new Promise((resolve, reject) => {
    // Log the request
    logMessage(`REQUEST:\nPrompt: ${prompt}\nTemperature: ${temperature}`);
    
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
        // Log the response
        logMessage(`RESPONSE:\nStatus: ${res.statusCode}\nData: ${responseData}`);
        
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
      logMessage(`ERROR: ${error.message}`);
      reject(error);
    });
    
    req.write(requestData);
    req.end();
  });
};

/**
 * Lambda handler function
 * @param {Object} event - The Lambda event
 * @param {Object} context - The Lambda context
 * @returns {Promise<Object>} - The Lambda response
 */
export const handler = async (event, context) => {
  // Log the Lambda invocation
  logMessage(`LAMBDA INVOCATION:\nEvent: ${JSON.stringify(event)}`);
  
  try {
    // Parse the request body
    const body = JSON.parse(event.body);
    const { prompt, temperature, difficulty, requestType, fen, message } = body;
    
    // Log the request details
    logMessage(`REQUEST DETAILS:\nType: ${requestType}\nDifficulty: ${difficulty}\nFEN: ${fen}\nMessage: ${message || 'N/A'}`);
    
    // Call the Gemini API
    const response = await callGeminiAPI(prompt, temperature);
    
    // Return the response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        content: response,
        success: true
      })
    };
  } catch (error) {
    // Log the error
    logMessage(`ERROR: ${error.message}`);
    
    // Return the error
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        error: error.message,
        success: false
      })
    };
  }
};