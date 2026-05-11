/**
 * @module Header
 * @description Top header bar with notifications, profile, admin info, and theme toggle.
 */
import { useState, useEffect } from 'react';
import { Layout, Dropdown, Badge, Space, Button, Avatar, Tag } from 'antd';
import { LogoutOutlined, SettingOutlined, LockOutlined, BellOutlined, BgColorsOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { logout } from '../../store/authSlice.js';
import NotificationBell from './NotificationBell.jsx';

const { Header } = Layout;

export default function AppHeader() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setIsDarkMode(savedTheme === 'dark');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const handleThemeToggle = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const profileMenu = {
    items: [
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Settings',
        onClick: () => navigate('/settings'),
      },
      {
        key: 'password',
        icon: <LockOutlined />,
        label: 'Change Password',
        onClick: () => navigate('/settings?tab=password'),
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        onClick: () => {
          dispatch(logout());
          navigate('/login');
        },
      },
    ],
  };

  return (
    <Header className="flex h-auto shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
      <div>
        <Space>
          <h2 className="m-0 text-lg font-semibold text-gray-900">AttendEase Admin</h2>
          {user?.isImpersonated ? <Tag color="warning">Superadmin Support Mode</Tag> : null}
        </Space>
      </div>

      <Space size="large">
        <NotificationBell />

        <Button
          type="text"
          size="large"
          icon={<BgColorsOutlined />}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          onClick={handleThemeToggle}
        />

        <Dropdown menu={profileMenu} trigger={['click']}>
          <Button type="text" size="large">
            <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
              {user?.name?.[0]?.toUpperCase()}
            </Avatar>
            <span className="ml-2">{user?.name}</span>
          </Button>
        </Dropdown>
      </Space>
    </Header>
  );
}
