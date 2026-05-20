import { useAuth } from 'react-oidc-context';
import LogoutButton from './LogoutButton.jsx';
import { getUserEmail, isAdminUser } from '../auth/roles.js';

/** Top bar: title, email, role badge, logout */
export default function UserHeader({ title, subtitle }) {
  const auth = useAuth();
  const email = getUserEmail(auth);
  const admin = isAdminUser(email);

  return (
    <header className="user-header">
      <div>
        <h1 className="dashboard-title">{title}</h1>
        <p className="dashboard-subtitle">
          {subtitle ?? (
            <>
              Signed in as <strong>{email}</strong>
            </>
          )}
        </p>
        <span className={`role-badge ${admin ? 'role-admin' : 'role-user'}`}>
          {admin ? 'Admin' : 'User'}
        </span>
      </div>
      <LogoutButton />
    </header>
  );
}
