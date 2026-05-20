import { useAuth } from 'react-oidc-context';

/**
 * Shown when the user is not logged in.
 * Login button redirects to AWS Cognito Hosted UI (sign up + sign in there).
 */
export default function LoginPage() {
  const auth = useAuth();

  const handleLogin = () => {
    // Opens Cognito Hosted UI in the browser (authorization code flow)
    auth.signinRedirect();
  };

  return (
    <div>
      <h1>Complaint Management</h1>
      <p>Sign in with AWS Cognito to continue.</p>
      <button type="button" onClick={handleLogin}>
        Login with Cognito
      </button>
      <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#555' }}>
        You will be redirected to the Cognito login page. New users can sign up there.
      </p>
    </div>
  );
}
