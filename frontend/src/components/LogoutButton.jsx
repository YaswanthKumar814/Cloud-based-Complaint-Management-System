import { useAuth } from 'react-oidc-context';
import { buildCognitoLogoutUrl } from '../auth/cognitoLogout.js';

/**
 * 1) Clears local tokens (sessionStorage)
 * 2) Redirects to Cognito Hosted UI logout
 * 3) Cognito sends user back to http://localhost:5173 → login screen
 */
export default function LogoutButton() {
  const auth = useAuth();

  const handleLogout = async () => {
    try {
      // Clear browser session first so Dashboard does not flash after return
      await auth.removeUser();

      // Cognito logout page, then redirect to Allowed sign-out URL
      window.location.assign(buildCognitoLogoutUrl());
    } catch (err) {
      console.error('Logout failed:', err);
      // Fallback: at least clear local session and show login
      await auth.removeUser();
      window.location.assign('/');
    }
  };

  return (
    <button type="button" onClick={() => void handleLogout()}>
      Logout
    </button>
  );
}
