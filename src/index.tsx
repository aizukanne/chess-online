import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import { store } from './store';

// Log environment variables on startup
console.log('Environment variables on startup:');
console.log('REACT_APP_LAMBDA_API_ENDPOINT:', process.env.REACT_APP_LAMBDA_API_ENDPOINT);
console.log('REACT_APP_DEBUG:', process.env.REACT_APP_DEBUG);
console.log('NODE_ENV:', process.env.NODE_ENV);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
