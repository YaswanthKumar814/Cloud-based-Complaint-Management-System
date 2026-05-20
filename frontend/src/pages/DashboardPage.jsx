import { useAuth } from 'react-oidc-context';
import LogoutButton from '../components/LogoutButton.jsx';

/**
 * Shown after successful login.
 * Displays user email and ID token (JWT) for learning/debugging.
 */
export default function DashboardPage() {
  const auth = useAuth();
  const user = auth.user;

  // profile comes from OpenID "userinfo" / ID token claims
  const email = user?.profile?.email ?? '(no email in token)';
  const idToken = user?.id_token ?? '';

  return (
    <div>
      <h1>Dashboard</h1>
      <p>You are logged in.</p>

      <div className="info">
        <strong>Email:</strong> {email}
      </div>

      <div>
        <strong>ID token (JWT):</strong>
        <div className="token-box">{idToken || '(no token)'}</div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <LogoutButton />
      </div>
    </div>
  );
}
