/**
 * @module SettingsPage
 * @description Organization settings including profile, attendance config, and password.
 */
import { App as AntdApp, Tabs } from 'antd';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router';
import PageHeader from '../../components/common/PageHeader.jsx';
import ProfileSettings from './ProfileSettings.jsx';
import AttendanceSettings from './AttendanceSettings.jsx';
import PasswordSettings from './PasswordSettings.jsx';
import {
  useGetOrgSettingsQuery,
  useUpdateOrgProfileMutation,
  useUploadOrgLogoMutation,
  useUpdateOrgSettingsMutation,
} from '../../store/api/orgApi.js';
import { useChangePasswordMutation } from '../../store/api/authApi.js';
import { setOrgInfo } from '../../store/authSlice.js';
import { parseApiError } from '../../utils/errorHandler.js';

function normalizeProfilePayload(values = {}) {
  return {
    name: values.name,
    email: values.email,
    phone: values.phone,
    address: values.address,
    timezone: values.timezone,
    logo: typeof values.logo === 'string' ? values.logo : undefined,
  };
}

export default function SettingsPage() {
  const { message } = AntdApp.useApp();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading } = useGetOrgSettingsQuery();
  const [updateProfile, { isLoading: isProfileUpdating }] = useUpdateOrgProfileMutation();
  const [uploadOrgLogo, { isLoading: isLogoUploading }] = useUploadOrgLogoMutation();
  const [updateSettings, { isLoading: isSettingsUpdating }] = useUpdateOrgSettingsMutation();
  const [changePassword, { isLoading: isPasswordUpdating }] = useChangePasswordMutation();
  const requestedTab = searchParams.get('tab');
  const activeTab = ['attendance', 'password'].includes(requestedTab) ? requestedTab : 'profile';

  useEffect(() => {
    if (data?.org) {
      dispatch(setOrgInfo(data.org));
    }
  }, [data?.org, dispatch]);

  const handleProfileSubmit = async (values) => {
    try {
      const response = await updateProfile(normalizeProfilePayload(values)).unwrap();
      dispatch(setOrgInfo(response));
      message.success('Organization profile updated');
    } catch (error) {
      message.error(parseApiError(error));
    }
  };

  const handleAttendanceSubmit = async (values) => {
    try {
      await updateSettings(values).unwrap();
      message.success('Attendance settings updated');
    } catch (error) {
      message.error(parseApiError(error));
    }
  };

  const handlePasswordSubmit = async (values) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap();
      message.success('Password updated');
    } catch (error) {
      message.error(parseApiError(error));
    }
  };

  const handleLogoUpload = async (file) => {
    try {
      const response = await uploadOrgLogo(file).unwrap();
      dispatch(setOrgInfo(response));
      message.success('Organization logo uploaded');
      return response;
    } catch (error) {
      message.error(parseApiError(error));
      throw error;
    }
  };

  const items = [
    {
      key: 'profile',
      label: 'Organization Profile',
      children: (
        <ProfileSettings
          org={data?.org}
          onSubmit={handleProfileSubmit}
          onLogoUpload={handleLogoUpload}
          loading={isLoading || isProfileUpdating}
          logoUploading={isLogoUploading}
        />
      ),
    },
    {
      key: 'attendance',
      label: 'Attendance Settings',
      children: (
        <AttendanceSettings
          settings={data?.attendanceSettings}
          onSubmit={handleAttendanceSubmit}
          loading={isLoading || isSettingsUpdating}
        />
      ),
    },
    {
      key: 'password',
      label: 'Password & Security',
      children: (
        <PasswordSettings
          onSubmit={handlePasswordSubmit}
          loading={isPasswordUpdating}
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
