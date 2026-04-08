/**
 * @module SettingsPage
 * @description Organization settings including profile, attendance config, and password.
 */
import { Tabs } from 'antd';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import ProfileSettings from './ProfileSettings.jsx';
import AttendanceSettings from './AttendanceSettings.jsx';
import PasswordSettings from './PasswordSettings.jsx';
import { useGetOrgSettingsQuery, useUpdateSettingsMutation } from '../../store/api/orgApi.js';

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading } = useGetOrgSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateSettingsMutation();
  const requestedTab = searchParams.get('tab');
  const activeTab = ['attendance', 'password'].includes(requestedTab) ? requestedTab : 'profile';

  const items = [
    {
      key: 'profile',
      label: 'Organization Profile',
      children: (
        <ProfileSettings
          org={data?.org}
          onSubmit={(values) => updateSettings(values)}
          loading={isUpdating}
        />
      ),
    },
    {
      key: 'attendance',
      label: 'Attendance Settings',
      children: (
        <AttendanceSettings
          settings={data?.attendanceSettings}
          onSubmit={(values) => updateSettings(values)}
          loading={isUpdating}
        />
      ),
    },
    {
      key: 'password',
      label: 'Password & Security',
      children: (
        <PasswordSettings
          onSubmit={(values) => updateSettings(values)}
          loading={isUpdating}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Settings" subtitle="Manage organization settings" />

      <div className="px-6 py-6 max-w-7xl mx-auto">
        <Tabs
          activeKey={activeTab}
          items={items}
          onChange={(key) => {
            if (key === 'profile') {
              setSearchParams({});
              return;
            }

            setSearchParams({ tab: key });
          }}
        />
      </div>
    </div>
  );
}
