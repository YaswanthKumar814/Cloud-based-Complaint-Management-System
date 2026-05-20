import { useAuth } from 'react-oidc-context';
import LogoutButton from './LogoutButton.jsx';

/** Top bar: logged-in email + logout */
export default function UserHeader() {
  const auth = useAuth();
  const email = auth.user?.profile?.email ?? 'Admin';

  return (
    <header className="user-header">
      <div>
        <h1 className="dashboard-title">Complaint Admin Dashboard</h1>
        <p className="dashboard-subtitle">Signed in as <strong>{email}</strong></p>
      </div>
      <LogoutButton />
    </header>
  );
}
