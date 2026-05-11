/**
 * @module AttendanceSettings
 * @description Attendance, security, and notification policy settings.
 */
import { Alert, Button, Card, Checkbox, Col, Form, InputNumber, Row, Space, Typography } from 'antd';
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { useEffect } from 'react';

const recommendedDefaults = {
  allowRemoteCheckIn: false,
  requireGeofence: true,
  requireFaceRecognition: true,
  toleranceMinutes: 15,
  kioskModeEnabled: false,
  kioskRequiresOfficeGeofence: true,
  faceMatchThreshold: 0.84,
  requireLiveness: true,
  allowEmployeeDeviceExceptionFlow: true,
  requireWifiVerification: false,
  checkoutReminderEnabled: true,
  autoAbsentEnabled: true,
  failedLoginAlertEnabled: true,
  billingOverrideAlertEnabled: true,
  orgConfigChangeAlertEnabled: true,
  leaveRequests: true,
  regularisation: true,
  billing: true,
  deviceExceptions: true,
  attendanceAnomalies: true,
};

function SettingCheck({ name, children }) {
  return (
    <Form.Item name={name} valuePropName="checked" style={{ marginBottom: 10 }}>
      <Checkbox>{children}</Checkbox>
    </Form.Item>
  );
}

export default function AttendanceSettings({ settings, securitySettings, notificationSettings, onSubmit, loading, onDirtyChange }) {
  const [form] = Form.useForm();

  useEffect(() => {
    const nextValues = {
      ...recommendedDefaults,
      ...(settings || {}),
      ...(securitySettings || {}),
      ...(notificationSettings || {}),
    };
    form.setFieldsValue(nextValues);
    onDirtyChange?.(false);
  }, [form, notificationSettings, securitySettings, settings]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
    onDirtyChange?.(false);
  };

  const resetForm = () => {
    form.setFieldsValue({
      ...recommendedDefaults,
      ...(settings || {}),
      ...(securitySettings || {}),
      ...(notificationSettings || {}),
    });
    onDirtyChange?.(false);
  };

  const useRecommended = () => {
    form.setFieldsValue(recommendedDefaults);
    onDirtyChange?.(true);
  };

  return (
    <Form form={form} layout="vertical" onValuesChange={() => onDirtyChange?.(true)}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="Attendance security policy"
          description="Disabling geofence, face recognition, or liveness makes attendance easier but weakens fraud prevention."
        />

        <Card title="Attendance Rules">
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <SettingCheck name="allowRemoteCheckIn">Allow remote check-in</SettingCheck>
              <SettingCheck name="requireGeofence">Require branch geofence</SettingCheck>
              <SettingCheck name="requireFaceRecognition">Require face recognition</SettingCheck>
              <SettingCheck name="requireLiveness">Require liveness check</SettingCheck>
              <SettingCheck name="requireWifiVerification">Require WiFi verification when branch enables it</SettingCheck>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="toleranceMinutes" label="Late tolerance minutes" rules={[{ type: 'number', min: 0, max: 180 }]}>
                <InputNumber min={0} max={180} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="faceMatchThreshold" label="Face match threshold" rules={[{ type: 'number', min: 0.5, max: 0.99 }]}>
                <InputNumber min={0.5} max={0.99} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
              <Typography.Text type="secondary">
                Recommended threshold is 0.84. Raise it for stricter matching, lower it only after testing.
              </Typography.Text>
            </Col>
          </Row>
        </Card>

        <Card title="Kiosk And Automation">
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <SettingCheck name="kioskModeEnabled">Enable kiosk mode</SettingCheck>
              <SettingCheck name="kioskRequiresOfficeGeofence">Kiosk requires office geofence</SettingCheck>
              <SettingCheck name="allowEmployeeDeviceExceptionFlow">Allow employee device exception flow</SettingCheck>
            </Col>
            <Col xs={24} md={12}>
              <SettingCheck name="checkoutReminderEnabled">Checkout reminder enabled</SettingCheck>
              <SettingCheck name="autoAbsentEnabled">Auto absent marking enabled</SettingCheck>
            </Col>
          </Row>
        </Card>

        <Card title="Security Alerts">
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <SettingCheck name="failedLoginAlertEnabled">Failed login alerts</SettingCheck>
              <SettingCheck name="billingOverrideAlertEnabled">Billing override alerts</SettingCheck>
              <SettingCheck name="orgConfigChangeAlertEnabled">Organisation config change alerts</SettingCheck>
            </Col>
          </Row>
        </Card>

        <Card title="Admin Notification Preferences">
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <SettingCheck name="leaveRequests">Leave requests</SettingCheck>
              <SettingCheck name="regularisation">Regularisation requests</SettingCheck>
              <SettingCheck name="deviceExceptions">Device exceptions</SettingCheck>
            </Col>
            <Col xs={24} md={12}>
              <SettingCheck name="billing">Billing alerts</SettingCheck>
              <SettingCheck name="attendanceAnomalies">Attendance anomalies</SettingCheck>
            </Col>
          </Row>
        </Card>

        <Space>
          <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSubmit}>
            Save Settings
          </Button>
          <Button icon={<ReloadOutlined />} onClick={resetForm}>
            Reset
          </Button>
          <Button onClick={useRecommended}>Recommended Defaults</Button>
        </Space>
      </Space>
    </Form>
  );
}
