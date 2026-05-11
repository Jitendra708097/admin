/**
 * @module AppLayout
 * @description Main layout wrapper with sidebar, header, and content area.
 */
import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Button, Layout, Space } from 'antd';
import OrgSidebar from '../OrgSidebar.jsx';
import TopNav from '../TopNav.jsx';
import { useExitImpersonationMutation } from '../../store/api/authApi.js';
import { logout } from '../../store/authSlice.js';

const { Content } = Layout;

function useRemainingTimer(expiresAt) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(null);
      return undefined;
    }

    const tick = () => {
      const diffMs = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      const h = Math.floor(diffMs / 3600000);
      const m = Math.floor((diffMs % 3600000) / 60000);
      const s = Math.floor((diffMs % 60000) / 1000);
      setRemaining(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return remaining;
}

export default function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const remaining = useRemainingTimer(user?.impersonationExpiresAt);
  const [exitImpersonation, { isLoading: exiting }] = useExitImpersonationMutation();

  const handleExitSupportSession = async () => {
    try {
      await exitImpersonation().unwrap();
    } catch (_) {
      // Local logout still clears the impersonated admin tab if the session already ended.
    } finally {
      dispatch(logout());
      navigate('/login', { replace: true });
    }
  };

  return (
    <Layout className="h-screen overflow-hidden bg-gray-50">
      <OrgSidebar />
      <Layout className="flex min-h-0 flex-col overflow-hidden">
        <TopNav />
        <Content className="flex-1 min-h-0 overflow-auto bg-gray-50 p-6">
          {user?.isImpersonated ? (
            <Alert
              className="mb-4"
              type="warning"
              showIcon
              message="Superadmin support session active"
              description={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div>
                      This admin portal is being accessed through an audited superadmin impersonation session.
                    </div>
                    <div className="mt-1 text-xs">
                      Session ID: {user.impersonationSessionId || '-'}
                      {remaining ? ` - Expires in ${remaining}` : ''}
                    </div>
                  </div>
                  <Space>
                    <Button size="small" danger loading={exiting} onClick={handleExitSupportSession}>
                      Exit Support Session
                    </Button>
                  </Space>
                </div>
              }
            />
          ) : null}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
