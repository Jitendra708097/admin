/**
 * @module Sidebar
 * @description Main navigation sidebar with menu items.
 */
import { Badge, Button, Layout, Menu, Tooltip } from 'antd';
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
  LogoutOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { useGetOrgSettingsQuery } from '../../store/api/orgApi.js';
import { useLogoutMutation } from '../../store/api/authApi.js';
import { useNotifications } from '../../hooks/useNotifications.js';
import { logout } from '../../store/authSlice.js';
import { setSidebarCollapsed } from '../../store/uiSlice.js';
import styles from './sidebar.module.css';

const { Sider } = Layout;

function getSelectedKey(pathname) {
  const routeKeys = [
    '/attendance/live',
    '/device-exceptions',
    '/regularisations',
    '/notifications',
    '/departments',
    '/attendance',
    '/employees',
    '/branches',
    '/holidays',
    '/reports',
    '/billing',
    '/settings',
    '/dashboard',
    '/shifts',
    '/leaves',
  ];

  return routeKeys.find((key) => pathname === key || pathname.startsWith(`${key}/`)) || '/dashboard';
}

function SidebarLabel({ label, badge }) {
  return (
    <span className="flex min-w-0 items-center justify-between gap-2">
      <span className="truncate">{label}</span>
      {badge ? <Badge count={badge} size="small" /> : null}
    </span>
  );
}

export default function Sidebar() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarCollapsed = useSelector((state) => state.ui?.sidebarCollapsed || false);
  const orgInfo = useSelector((state) => state.auth?.orgInfo || {});
  const { data } = useGetOrgSettingsQuery();
  const { unreadCount } = useNotifications();
  const [logoutRequest, { isLoading: isLoggingOut }] = useLogoutMutation();
  const org = data?.org || orgInfo || {};

  const navigateTo = (path) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await logoutRequest().unwrap().catch(() => {});
    dispatch(logout());
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <SidebarLabel label="Dashboard" />,
      title: 'Dashboard',
      onClick: () => navigateTo('/dashboard'),
    },
    {
      key: '/attendance/live',
      icon: <BgColorsOutlined />,
      label: <SidebarLabel label="Live Board" />,
      title: 'Live Board',
      onClick: () => navigateTo('/attendance/live'),
    },
    {
      key: '/attendance',
      icon: <CalendarOutlined />,
      label: <SidebarLabel label="Attendance" />,
      title: 'Attendance',
      onClick: () => navigateTo('/attendance'),
    },
    {
      key: '/employees',
      icon: <UserOutlined />,
      label: <SidebarLabel label="Employees" />,
      title: 'Employees',
      onClick: () => navigateTo('/employees'),
    },
    {
      key: '/leaves',
      icon: <CheckOutlined />,
      label: <SidebarLabel label="Leave Management" />,
      title: 'Leave Management',
      onClick: () => navigateTo('/leaves'),
    },
    {
      key: '/regularisations',
      icon: <ReloadOutlined />,
      label: <SidebarLabel label="Regularisations" />,
      title: 'Regularisations',
      onClick: () => navigateTo('/regularisations'),
    },
    {
      key: '/shifts',
      icon: <ClockCircleOutlined />,
      label: <SidebarLabel label="Shifts" />,
      title: 'Shifts',
      onClick: () => navigateTo('/shifts'),
    },
    {
      key: '/branches',
      icon: <BankOutlined />,
      label: <SidebarLabel label="Branches" />,
      title: 'Branches',
      onClick: () => navigateTo('/branches'),
    },
    {
      key: '/departments',
      icon: <FolderOutlined />,
      label: <SidebarLabel label="Departments" />,
      title: 'Departments',
      onClick: () => navigateTo('/departments'),
    },
    {
      key: '/holidays',
      icon: <GiftOutlined />,
      label: <SidebarLabel label="Holidays" />,
      title: 'Holidays',
      onClick: () => navigateTo('/holidays'),
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: <SidebarLabel label="Reports" />,
      title: 'Reports',
      onClick: () => navigateTo('/reports'),
    },
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: <SidebarLabel label="Notifications" badge={unreadCount} />,
      title: 'Notifications',
      onClick: () => navigateTo('/notifications'),
    },
    {
      key: '/device-exceptions',
      icon: <PhoneOutlined />,
      label: <SidebarLabel label="Device Exceptions" />,
      title: 'Device Exceptions',
      onClick: () => navigateTo('/device-exceptions'),
    },
    {
      key: '/billing',
      icon: <CreditCardOutlined />,
      label: <SidebarLabel label="Billing" />,
      title: 'Billing',
      onClick: () => navigateTo('/billing'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: <SidebarLabel label="Settings" />,
      title: 'Settings',
      onClick: () => navigateTo('/settings'),
    },
  ];

  return (
    <Sider
      collapsible
      collapsed={sidebarCollapsed}
      collapsedWidth={56}
      width={208}
      onCollapse={(collapsed) => dispatch(setSidebarCollapsed(collapsed))}
      className={`h-screen overflow-hidden ${styles.sider}`}
    >
      <div className="flex h-full flex-col">
        <div className={`mb-3 flex items-center justify-center px-3 text-center text-white ${styles.brand}`}>
          {org?.logo ? (
            <div className="flex flex-col items-center gap-2">
              <img
                src={org.logo}
                alt={org?.name || 'Organization logo'}
                className={`${sidebarCollapsed ? 'h-8 w-8' : 'h-12 w-12'} rounded-lg bg-white object-cover p-1`}
              />
              {!sidebarCollapsed ? (
                <h2 className="m-0 max-w-full truncate text-sm font-semibold">
                  {org?.name || 'AttendEase'}
                </h2>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-400/30 bg-blue-400/10 text-sm font-bold text-blue-200">
                AE
              </div>
              {!sidebarCollapsed ? (
                <div className="min-w-0 text-left">
                  <h2 className="m-0 truncate text-sm font-semibold">AttendEase</h2>
                  <p className="m-0 mt-0.5 text-[10px] uppercase tracking-[0.12em] text-gray-400">Admin</p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4">
          <Menu
            theme="dark"
            mode="inline"
            items={menuItems}
            selectedKeys={[getSelectedKey(location.pathname)]}
            className={styles.menu}
            inlineCollapsed={sidebarCollapsed}
          />
        </div>

        <div className={`p-3 text-xs text-white ${styles.footer}`}>
          {!sidebarCollapsed && (
            <div className="mb-3 min-w-0">
              <p className="m-0 truncate font-semibold">{org?.name || 'Organisation workspace'}</p>
              <p className="m-0 mt-1 text-gray-400">Admin portal</p>
            </div>
          )}
          <Tooltip title={sidebarCollapsed ? 'Logout' : ''} placement="right">
            <Button
              type="text"
              danger
              block
              loading={isLoggingOut}
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className={sidebarCollapsed ? 'flex items-center justify-center px-0' : 'flex items-center'}
            >
              {!sidebarCollapsed ? 'Logout' : null}
            </Button>
          </Tooltip>
        </div>
      </div>
    </Sider>
  );
}
