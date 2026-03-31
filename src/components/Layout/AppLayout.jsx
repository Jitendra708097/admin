/**
 * @module AppLayout
 * @description Main layout wrapper with sidebar, header, and content area.
 */
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import OrgSidebar from '../OrgSidebar.jsx';
import TopNav from '../TopNav.jsx';

const { Content } = Layout;

export default function AppLayout() {
  return (
    <Layout className="min-h-screen bg-gray-50">
      <OrgSidebar />
      <Layout className="flex flex-col">
        <TopNav />
        <Content className="flex-1 p-6 overflow-auto bg-gray-50">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
