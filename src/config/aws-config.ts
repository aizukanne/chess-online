// AWS Configuration
// This file will be used to configure AWS services when we integrate with them

export const awsConfig = {
  // AWS Region
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
  
  // Cognito
  cognito: {
    userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || 'us-east-1_xxxxxxxxx',
    userPoolWebClientId: process.env.REACT_APP_COGNITO_CLIENT_ID || 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
    oauth: {
      domain: process.env.REACT_APP_COGNITO_DOMAIN || 'your-domain.auth.us-east-1.amazoncognito.com',
      scope: ['email', 'profile', 'openid'],
      redirectSignIn: process.env.REACT_APP_REDIRECT_SIGN_IN || 'http://localhost:3000/',
      redirectSignOut: process.env.REACT_APP_REDIRECT_SIGN_OUT || 'http://localhost:3000/',
      responseType: 'code'
    }
  },
  
  // API Gateway
  api: {
    endpoints: [
      {
        name: 'ChessAPI',
        endpoint: process.env.REACT_APP_API_URL || 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod'
      }
    ]
  },
  
  // DynamoDB (for direct access if needed)
  dynamodb: {
    tables: {
      users: process.env.REACT_APP_DYNAMODB_USERS_TABLE || 'chess-online-users',
      games: process.env.REACT_APP_DYNAMODB_GAMES_TABLE || 'chess-online-games',
      tutorials: process.env.REACT_APP_DYNAMODB_TUTORIALS_TABLE || 'chess-online-tutorials'
    }
  },
  
  // S3 (for storing assets)
  s3: {
    buckets: {
      assets: process.env.REACT_APP_S3_ASSETS_BUCKET || 'chess-online-assets'
    }
  }
};

export default awsConfig;