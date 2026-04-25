/**
 * @module AppLayout
 * @description Main layout wrapper with sidebar, header, and content area.
 */
import { Outlet } from 'react-router';
import { useSelector } from 'react-redux';
import { Alert, Layout } from 'antd';
import OrgSidebar from '../OrgSidebar.jsx';
import TopNav from '../TopNav.jsx';

const { Content } = Layout;

export default function AppLayout() {
  const user = useSelector((state) => state.auth.user);

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
              message="Support session active"
              description="This admin portal is being accessed through a time-limited superadmin impersonation session."
            />
          ) : null}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
