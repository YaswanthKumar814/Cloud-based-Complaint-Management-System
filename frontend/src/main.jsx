import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from 'react-oidc-context';
import { cognitoAuthConfig } from './auth/cognitoConfig.js';
import App from './App.jsx';
import './index.css';

/**
 * AuthProvider stores the Cognito session in the browser (sessionStorage by default in oidc-client-ts).
 * Wrap the whole app so any component can use useAuth().
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
