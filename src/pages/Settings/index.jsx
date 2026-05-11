/**
 * @module SettingsPage
 * @description Organization settings including profile, attendance config, and password.
 */
import { App as AntdApp, Alert, Card, Col, Modal, Row, Space, Statistic, Tabs, Tag, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router';
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader.jsx';
import ProfileSettings from './ProfileSettings.jsx';
import AttendanceSettings from './AttendanceSettings.jsx';
import PasswordSettings from './PasswordSettings.jsx';
import {
  useGetOrgSettingsQuery,
  useGetOrgStatsQuery,
  useGetSettingsHealthQuery,
  useUpdateOrgProfileMutation,
  useUploadOrgLogoMutation,
  useRemoveOrgLogoMutation,
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
  const [dirtyTabs, setDirtyTabs] = useState({});
  const { data, isLoading } = useGetOrgSettingsQuery();
  const { data: stats } = useGetOrgStatsQuery();
  const { data: health } = useGetSettingsHealthQuery();
  const [updateProfile, { isLoading: isProfileUpdating }] = useUpdateOrgProfileMutation();
  const [uploadOrgLogo, { isLoading: isLogoUploading }] = useUploadOrgLogoMutation();
  const [removeOrgLogo, { isLoading: isLogoRemoving }] = useRemoveOrgLogoMutation();
  const [updateSettings, { isLoading: isSettingsUpdating }] = useUpdateOrgSettingsMutation();
  const [changePassword, { isLoading: isPasswordUpdating }] = useChangePasswordMutation();
  const requestedTab = searchParams.get('tab');
  const activeTab = ['attendance', 'password'].includes(requestedTab) ? requestedTab : 'profile';

  useEffect(() => {
    if (data?.org) {
      dispatch(setOrgInfo(data.org));
    }
  }, [data?.org, dispatch]);

  const setTabDirty = useCallback((tab, isDirty) => {
    setDirtyTabs((current) => {
      if (current[tab] === isDirty) {
        return current;
      }

      return { ...current, [tab]: isDirty };
    });
  }, []);

  const changeTab = (key) => {
    if (dirtyTabs[activeTab]) {
      Modal.confirm({
        title: 'Discard unsaved changes?',
        content: 'You have unsaved settings changes on this tab.',
        okText: 'Discard',
        onOk: () => {
          setTabDirty(activeTab, false);
          setSearchParams(key === 'profile' ? {} : { tab: key });
        },
      });
      return;
    }

    setSearchParams(key === 'profile' ? {} : { tab: key });
  };

  const handleProfileSubmit = async (values) => {
    try {
      const response = await updateProfile(normalizeProfilePayload(values)).unwrap();
      dispatch(setOrgInfo(response));
      setTabDirty('profile', false);
      message.success('Organization profile updated');
    } catch (error) {
      message.error(parseApiError(error));
    }
  };

  const handleAttendanceSubmit = async (values) => {
    try {
      await updateSettings(values).unwrap();
      setTabDirty('attendance', false);
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

  const handleLogoRemove = async () => {
    try {
      const response = await removeOrgLogo().unwrap();
      dispatch(setOrgInfo(response));
      message.success('Organization logo removed');
      return response;
    } catch (error) {
      message.error(parseApiError(error));
      throw error;
    }
  };

  const items = [
    {
      key: 'profile',
      label: dirtyTabs.profile ? 'Organization Profile *' : 'Organization Profile',
      children: (
        <ProfileSettings
          org={data?.org}
          onSubmit={handleProfileSubmit}
          onLogoUpload={handleLogoUpload}
          onLogoRemove={handleLogoRemove}
          loading={isLoading || isProfileUpdating}
          logoUploading={isLogoUploading}
          logoRemoving={isLogoRemoving}
          onDirtyChange={(value) => setTabDirty('profile', value)}
        />
      ),
    },
    {
      key: 'attendance',
      label: dirtyTabs.attendance ? 'Attendance & Security *' : 'Attendance & Security',
      children: (
        <AttendanceSettings
          settings={data?.attendanceSettings}
          securitySettings={data?.securitySettings}
          notificationSettings={data?.notificationSettings}
          onSubmit={handleAttendanceSubmit}
          loading={isLoading || isSettingsUpdating}
          onDirtyChange={(value) => setTabDirty('attendance', value)}
        />
      ),
    },
    {
      key: 'password',
      label: 'Password',
      children: <PasswordSettings onSubmit={handlePasswordSubmit} loading={isPasswordUpdating} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage organization profile, attendance policy, and security controls" />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="Organisation" value={data?.org?.isActive ? 'Active' : 'Inactive'} prefix={<CheckCircleOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="Plan" value={data?.org?.plan || '-'} prefix={<ApartmentOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="Active employees" value={stats?.activeEmployeeCount || 0} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="Timezone" value={data?.org?.timezone || '-'} prefix={<ClockCircleOutlined />} /></Card>
        </Col>
      </Row>

      <Card title="Configuration Health">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Statistic
              title="Issues"
              value={health?.summary?.issues || 0}
              valueStyle={{ color: health?.summary?.issues ? '#d97706' : undefined }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Col>
          <Col xs={24} md={18}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {(health?.checks || []).map((check) => (
                <Alert
                  key={check.key}
                  type={check.status === 'ok' ? 'success' : 'warning'}
                  showIcon
                  message={
                    <Space>
                      <Typography.Text strong>{check.title}</Typography.Text>
                      <Tag color={check.status === 'ok' ? 'green' : 'orange'}>{check.status.toUpperCase()}</Tag>
                    </Space>
                  }
                  description={check.message}
                />
              ))}
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs activeKey={activeTab} items={items} onChange={changeTab} />
      </Card>
    </div>
  );
}
