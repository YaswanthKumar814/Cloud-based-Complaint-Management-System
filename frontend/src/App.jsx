import { useAuth } from 'react-oidc-context';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

/**
 * Simple app shell — no router library.
 * - loading: Cognito is processing redirect / silent renew
 * - authenticated: show dashboard
 * - otherwise: show login
 */
export default function App() {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <div className="app">
        <p className="loading">Loading authentication…</p>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="app">
        <h1>Authentication error</h1>
        <p className="error">{auth.error.message}</p>
        <p style={{ fontSize: '0.9rem' }}>
          Check Cognito callback URLs and App Client settings (see docs/COGNITO_FRONTEND.md).
        </p>
        <button type="button" onClick={() => auth.signinRedirect()}>
          Try login again
        </button>
      </div>
    );
  }

  return (
    <div className={`app ${auth.isAuthenticated ? 'app-wide' : ''}`}>
      {auth.isAuthenticated ? <DashboardPage /> : <LoginPage />}
    </div>
  );
}
