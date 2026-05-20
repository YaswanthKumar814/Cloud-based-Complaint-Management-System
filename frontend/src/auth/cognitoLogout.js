/**
 * Cognito Hosted UI logout (beginner-friendly).
 *
 * AWS Cognito uses: /logout?client_id=...&logout_uri=...
 * (not the generic OIDC post_logout_redirect_uri parameter name)
 *
 * logout_uri must EXACTLY match an "Allowed sign-out URL" in the App Client.
 */

export function getAppBaseUrl() {
  // No trailing slash — must match Cognito sign-out URL entry
  const url = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
  return url.replace(/\/$/, '');
}

export function buildCognitoLogoutUrl() {
  const domain = import.meta.env.VITE_COGNITO_DOMAIN?.replace(/\/$/, '');
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
  const logoutUri = getAppBaseUrl();

  if (!domain || !clientId) {
    throw new Error('Missing VITE_COGNITO_DOMAIN or VITE_COGNITO_CLIENT_ID in .env');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    logout_uri: logoutUri,
  });

  return `${domain}/logout?${params.toString()}`;
}
