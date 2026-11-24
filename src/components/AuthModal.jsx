import React, { useState } from 'react';
import {
  X,
  Shield,
  Eye,
  Lock,
  User,
  KeyRound,
  LogOut,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import {
  loginWithCredentials,
  updateAccountCredentials
} from '../utils/storageHelper';
import './AuthModal.css';

export default function AuthModal({
  currentUser,
  onAuthChange,
  onLogout,
  onClose
}) {
  const isAdmin = currentUser?.role === 'admin';
  const [activeTab, setActiveTab] = useState(isAdmin ? 'manage' : 'login'); // 'login' | 'manage'

  // Login form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manage accounts state (Admin only)
  const [targetRole, setTargetRole] = useState('admin');
  const [newUsername, setNewUsername] = useState(
    currentUser?.accountsInfo?.adminUsername || 'admin'
  );
  const [newPassword, setNewPassword] = useState('');
  const [manageFeedback, setManageFeedback] = useState(null); // { type: 'success' | 'error', text }

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    const result = await loginWithCredentials(username, password);
    setIsSubmitting(false);

    if (!result.ok) {
      setLoginError(result.error || 'Invalid credentials');
      return;
    }

    onAuthChange({
      username: result.username || username,
      role: result.role || 'viewer',
      isDefaultViewer: false
    });
    onClose();
  };

  const handleRoleTargetSwitch = (role) => {
    setTargetRole(role);
    setManageFeedback(null);
    setNewPassword('');
    if (role === 'admin') {
      setNewUsername(currentUser?.accountsInfo?.adminUsername || 'admin');
    } else {
      setNewUsername(currentUser?.accountsInfo?.viewerUsername || 'viewer');
    }
  };

  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    setManageFeedback(null);
    if (!newPassword || newPassword.length < 4) {
      setManageFeedback({
        type: 'error',
        text: 'New password must be at least 4 characters.'
      });
      return;
    }

    setIsSubmitting(true);
    const res = await updateAccountCredentials(
      targetRole,
      newUsername,
      newPassword
    );
    setIsSubmitting(false);

    if (!res.ok) {
      setManageFeedback({
        type: 'error',
        text: res.error || 'Failed to update credentials'
      });
      return;
    }

    setNewPassword('');
    setManageFeedback({
      type: 'success',
      text: res.message || 'Credentials updated!'
    });

    if (targetRole === 'admin') {
      onAuthChange({
        ...currentUser,
        username: newUsername,
        accountsInfo: res.accountsInfo || currentUser.accountsInfo
      });
    } else if (res.accountsInfo) {
      onAuthChange({
        ...currentUser,
        accountsInfo: res.accountsInfo
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-panel auth-modal animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="auth-modal-title"
      >
        <div className="modal-header">
          <div className="auth-header-title">
            {isAdmin ? (
              <Shield size={20} className="auth-icon-admin" />
            ) : (
              <Lock size={20} className="auth-icon-viewer" />
            )}
            <div>
              <h2 id="auth-modal-title">User Access &amp; Accounts</h2>
              <p className="auth-header-sub">
                Currently browsing as{' '}
                <strong>
                  {isAdmin ? `Admin (${currentUser.username})` : 'Viewer (Read-Only)'}
                </strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-close" title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Role Explanation Banner */}
        <div className="auth-roles-strip">
          <div
            className={`role-info-pill ${!isAdmin ? 'active-role' : ''}`}
            onClick={() => {
              if (!isAdmin) {
                setUsername('viewer');
                setActiveTab('login');
              }
            }}
          >
            <Eye size={15} className="role-pill-icon viewer" />
            <div>
              <span className="role-pill-name">Viewer Access (Default)</span>
              <span className="role-pill-desc">
                Can explore the tree, search, and read personal pages. Cannot add, edit, or delete members.
              </span>
            </div>
          </div>

          <div
            className={`role-info-pill ${isAdmin ? 'active-role admin' : ''}`}
            onClick={() => {
              if (!isAdmin) {
                setUsername('admin');
                setActiveTab('login');
              }
            }}
          >
            <Shield size={15} className="role-pill-icon admin" />
            <div>
              <span className="role-pill-name">Admin Access</span>
              <span className="role-pill-desc">
                Full permission to add, edit, delete, import, pin defaults, and edit personal pages.
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs when Admin is logged in */}
        {isAdmin && (
          <div className="auth-tabs-bar">
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
              onClick={() => setActiveTab('manage')}
            >
              <KeyRound size={14} />
              <span>Manage Account Passwords</span>
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              <User size={14} />
              <span>Switch Account</span>
            </button>
          </div>
        )}

        <div className="auth-modal-body">
          {/* TAB 1: SIGN IN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="auth-form">
              <div className="account-quick-pick">
                <span className="quick-pick-label">Account Type:</span>
                <div className="quick-pick-btns">
                  <button
                    type="button"
                    className={`pick-role-btn ${
                      username.toLowerCase() === 'admin' ? 'active' : ''
                    }`}
                    onClick={() => {
                      setUsername(
                        currentUser?.accountsInfo?.adminUsername || 'admin'
                      );
                      setLoginError('');
                    }}
                  >
                    <Shield size={13} />
                    <span>Admin Account</span>
                  </button>
                  <button
                    type="button"
                    className={`pick-role-btn ${
                      username.toLowerCase() === 'viewer' ? 'active' : ''
                    }`}
                    onClick={() => {
                      setUsername(
                        currentUser?.accountsInfo?.viewerUsername || 'viewer'
                      );
                      setLoginError('');
                    }}
                  >
                    <Eye size={13} />
                    <span>Viewer Account</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="auth-username">Username</label>
                <div className="input-with-icon">
                  <User size={15} className="field-icon" />
                  <input
                    id="auth-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin or viewer"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="auth-password">Password</label>
                <div className="input-with-icon">
                  <KeyRound size={15} className="field-icon" />
                  <input
                    id="auth-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    autoComplete="current-password"
                    autoFocus
                  />
                </div>
              </div>

              {loginError && (
                <div className="auth-alert error">
                  <AlertTriangle size={15} />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="auth-form-actions">
                {isAdmin && (
                  <button
                    type="button"
                    className="btn-danger flex-center"
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                  >
                    <LogOut size={15} style={{ marginRight: 6 }} />
                    Switch Back to Default Viewer
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-center auth-submit-btn"
                >
                  <Shield size={15} style={{ marginRight: 6 }} />
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MANAGE CREDENTIALS (ADMIN ONLY) */}
          {activeTab === 'manage' && isAdmin && (
            <form onSubmit={handleUpdateCredentials} className="auth-form">
              <div className="account-quick-pick">
                <span className="quick-pick-label">Account to Update:</span>
                <div className="quick-pick-btns">
                  <button
                    type="button"
                    className={`pick-role-btn ${
                      targetRole === 'admin' ? 'active' : ''
                    }`}
                    onClick={() => handleRoleTargetSwitch('admin')}
                  >
                    <Shield size={13} />
                    <span>Admin Credentials</span>
                  </button>
                  <button
                    type="button"
                    className={`pick-role-btn ${
                      targetRole === 'viewer' ? 'active' : ''
                    }`}
                    onClick={() => handleRoleTargetSwitch('viewer')}
                  >
                    <Eye size={13} />
                    <span>Viewer Credentials</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="manage-username">
                  {targetRole === 'admin' ? 'Admin' : 'Viewer'} Username
                </label>
                <div className="input-with-icon">
                  <User size={15} className="field-icon" />
                  <input
                    id="manage-username"
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="manage-password">
                  New {targetRole === 'admin' ? 'Admin' : 'Viewer'} Password *
                </label>
                <div className="input-with-icon">
                  <KeyRound size={15} className="field-icon" />
                  <input
                    id="manage-password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 4 chars)..."
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {manageFeedback && (
                <div className={`auth-alert ${manageFeedback.type}`}>
                  {manageFeedback.type === 'success' ? (
                    <CheckCircle size={15} />
                  ) : (
                    <AlertTriangle size={15} />
                  )}
                  <span>{manageFeedback.text}</span>
                </div>
              )}

              <div className="auth-form-actions">
                <button
                  type="button"
                  className="btn-danger flex-center"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                >
                  <LogOut size={15} style={{ marginRight: 6 }} />
                  Logout to Viewer Mode
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-center"
                >
                  {isSubmitting ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
