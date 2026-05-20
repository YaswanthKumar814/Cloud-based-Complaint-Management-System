/**
 * AWS Cognito + Hosted UI settings for react-oidc-context.
 *
 * authority = Cognito User Pool issuer (used to load OpenID metadata)
 * signinRedirect() sends the user to Cognito Hosted UI login page
 * redirect_uri must EXACTLY match a URL in Cognito App Client settings
 */

const region = import.meta.env.VITE_AWS_REGION || 'ap-south-1';
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
import { getAppBaseUrl } from './cognitoLogout.js';

const appUrl = getAppBaseUrl();

// Issuer URL format required by Cognito User Pools
const authority = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

export const cognitoAuthConfig = {
  authority,
  client_id: clientId,
  redirect_uri: `${appUrl}/callback`,
  post_logout_redirect_uri: appUrl,
  response_type: 'code',
  scope: 'openid email profile',
  // After login, Cognito redirects to /callback?code=... — clean the URL for beginners
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, '/');
  },
};
