# Chess Online

A web-based chess application that allows users to play chess against AI opponents or other players. The application is built with React and TypeScript, and is designed to be deployed on AWS using S3 for frontend hosting and various AWS services for the backend.

## Features

- Play chess against AI opponents with multiple difficulty levels
- Google Gemini AI integration for enhanced chess engine capabilities
- Real-time and turn-based multiplayer games
- Social login (Google, Facebook, TikTok)
- Game history and statistics
- Training tools and tutorials for beginners
- Chat functionality during games
- Responsive design for desktop and mobile
## Technology Stack

### Frontend
- React.js with TypeScript
- Redux for state management
- Material-UI for UI components
- chess.js for chess game logic
- react-chessboard for the chess board UI

### Backend (AWS)
- S3 for static website hosting
- Cognito for authentication
- API Gateway for API endpoints
- Lambda for serverless functions
- DynamoDB for database
- Google Gemini API for AI opponents

## Google Gemini AI Integration

The application includes integration with Google's Gemini AI for enhanced chess capabilities:

### Features
- Advanced move calculation and position evaluation
- Natural language analysis of chess positions
- Intelligent chat responses during games
- Personalized training suggestions
- Secure backend API key management
- Request and response logging for debugging

### Setup
1. Obtain a Gemini API key from [Google AI Studio](https://ai.google.dev/)
2. Deploy the Lambda function with your API key (see `lambda/DEPLOYMENT.md`)
3. Configure the frontend to use the Lambda endpoint
4. Toggle the "Use Gemini AI for chess engine" switch in the game page to enable the integration

The application includes a fallback local chess engine that works without the Gemini API, but the AI capabilities are significantly enhanced when Gemini is enabled.

### Backend Integration
For security and debugging purposes, all Gemini API requests are processed through an AWS Lambda function:

- The API key is stored securely in the Lambda environment variables
- All requests and responses are logged to a file for debugging
- The Lambda function handles error cases and provides fallback responses
- CORS is configured to allow requests only from the frontend application

See the `lambda/DEPLOYMENT.md` file for detailed deployment instructions.
- Google Gemini API for AI opponents

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- AWS account (for deployment)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/chess-online.git
   cd chess-online
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   REACT_APP_AWS_REGION=us-east-1
   REACT_APP_COGNITO_USER_POOL_ID=your-user-pool-id
   REACT_APP_COGNITO_CLIENT_ID=your-client-id
   REACT_APP_COGNITO_DOMAIN=your-cognito-domain
   REACT_APP_REDIRECT_SIGN_IN=http://localhost:3000/
   REACT_APP_REDIRECT_SIGN_OUT=http://localhost:3000/
   REACT_APP_API_URL=your-api-gateway-url
   ```

4. Start the development server:
   ```
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

## Deployment

### Frontend Deployment to S3

1. Build the application:
   ```
   npm run build
   ```

2. Create an S3 bucket for hosting:
   ```
   aws s3 mb s3://your-bucket-name
   ```

3. Configure the bucket for static website hosting:
   ```
   aws s3 website s3://your-bucket-name --index-document index.html --error-document index.html
   ```

4. Set bucket policy to allow public access:
   ```
   aws s3api put-bucket-policy --bucket your-bucket-name --policy file://bucket-policy.json
   ```

5. Upload the build files to S3:
   ```
   aws s3 sync build/ s3://your-bucket-name
   ```

### Backend Deployment

The backend services (API Gateway, Lambda, DynamoDB, Cognito) can be deployed using AWS CloudFormation or the AWS CDK. Detailed deployment instructions will be provided in a separate document.

## Project Structure

```
chess-online/
├── public/                  # Public assets
├── src/
│   ├── components/          # React components
│   │   ├── chess/           # Chess-specific components
│   │   ├── auth/            # Authentication components
│   │   └── ui/              # UI components
│   ├── pages/               # Page components
│   ├── services/            # Service modules
│   │   └── api/             # API services
│   ├── store/               # Redux store
│   ├── utils/               # Utility functions
│   ├── config/              # Configuration files
│   ├── assets/              # Assets (images, icons, etc.)
│   ├── App.tsx              # Main App component
│   └── index.tsx            # Entry point
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [chess.js](https://github.com/jhlywa/chess.js) for chess logic
- [react-chessboard](https://github.com/Clariity/react-chessboard) for the chess board UI
- [Material-UI](https://mui.com/) for UI components
