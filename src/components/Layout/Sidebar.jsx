/**
 * @module Sidebar
 * @description Main navigation sidebar with menu items.
 */
import { Layout, Menu, Badge } from 'antd';
import {
  DashboardOutlined,
  BgColorsOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  BankOutlined,
  FolderOutlined,
  GiftOutlined,
  FileTextOutlined,
  BellOutlined,
  PhoneOutlined,
  CreditCardOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import { useGetOrgSettingsQuery } from '../../store/api/orgApi.js';

const { Sider } = Layout;

export default function Sidebar() {
  const navigate = useNavigate();
  const sidebarCollapsed = useSelector((state) => state.ui?.sidebarCollapsed || false);
  const orgInfo = useSelector((state) => state.auth?.orgInfo || {});
  const { data } = useGetOrgSettingsQuery();
  const org = data?.org || orgInfo || {};

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: '/attendance/live',
      icon: <BgColorsOutlined />,
      label: 'Live Board',
      badge: 0,
      onClick: () => navigate('/attendance/live'),
    },
    {
      key: '/attendance',
      icon: <CalendarOutlined />,
      label: 'Attendance',
      onClick: () => navigate('/attendance'),
    },
    {
      key: '/employees',
      icon: <UserOutlined />,
      label: 'Employees',
      onClick: () => navigate('/employees'),
    },
    {
      key: '/leaves',
      icon: <CheckOutlined />,
      label: 'Leave Requests',
      badge: 0,
      onClick: () => navigate('/leaves'),
    },
    {
      key: '/regularisations',
      icon: <ReloadOutlined />,
      label: 'Regularisations',
      badge: 0,
      onClick: () => navigate('/regularisations'),
    },
    {
      key: '/shifts',
      icon: <ClockCircleOutlined />,
      label: 'Shifts',
      onClick: () => navigate('/shifts'),
    },
    {
      key: '/branches',
      icon: <BankOutlined />,
      label: 'Branches',
      onClick: () => navigate('/branches'),
    },
    {
      key: '/departments',
      icon: <FolderOutlined />,
      label: 'Departments',
      onClick: () => navigate('/departments'),
    },
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: 'Notifications',
      badge: 0,
      onClick: () => navigate('/notifications'),
    },
    {
      key: '/device-exceptions',
      icon: <PhoneOutlined />,
      label: 'Device Exceptions',
      badge: 0,
      onClick: () => navigate('/device-exceptions'),
    },
    {
      key: '/billing',
      icon: <CreditCardOutlined />,
      label: 'Billing',
      onClick: () => navigate('/billing'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
  ];

  return (
    <Sider
      collapsible
      collapsed={sidebarCollapsed}
      width={250}
      className="h-screen overflow-hidden bg-gray-900"
    >
      <div className="flex h-full flex-col">
        <div className="mb-4 border-b border-gray-700 p-4 text-center text-white">
          {org?.logo ? (
            <div className="flex flex-col items-center gap-2">
              <img
                src={org.logo}
                alt={org?.name || 'Organization logo'}
                className={`${sidebarCollapsed ? 'h-10 w-10' : 'h-16 w-16'} rounded-xl bg-white object-cover p-1`}
              />
              {!sidebarCollapsed ? (
                <h2 className="m-0 text-base font-semibold">
                  {org?.name || 'AttendEase'}
                </h2>
              ) : null}
            </div>
          ) : (
            <h2 className="m-0 text-base font-semibold">
              {sidebarCollapsed ? 'AE' : 'AttendEase'}
            </h2>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4">
          <Menu
            theme="dark"
            mode="inline"
            items={menuItems}
            style={{ border: 'none' }}
          />
        </div>

        <div className="border-t border-gray-700 p-4 text-xs text-white">
          {!sidebarCollapsed && (
            <>
              <p className="m-0 mb-2 font-semibold">{org?.name}</p>
            </>
          )}
        </div>
      </div>
    </Sider>
  );
}
