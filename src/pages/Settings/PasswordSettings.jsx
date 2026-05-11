/**
 * @module PasswordSettings
 * @description Change password form.
 */
import { Button, Card, Form, Input, Progress, Space, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';

function getPasswordScore(password = '') {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (/[A-Z]/.test(password)) score += 25;
  if (/[0-9]/.test(password)) score += 25;
  if (/[^A-Za-z0-9]/.test(password)) score += 25;
  return score;
}

function getScoreStatus(score) {
  if (score >= 75) return 'success';
  if (score >= 50) return 'normal';
  return 'exception';
}

export default function PasswordSettings({ onSubmit, loading }) {
  const [form] = Form.useForm();
  const password = Form.useWatch('newPassword', form) || '';
  const score = getPasswordScore(password);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
    form.resetFields();
  };

  return (
    <Card title="Password & Security">
      <Form form={form} layout="vertical" requiredMark>
        <Form.Item
          name="currentPassword"
          label="Current Password"
          rules={[{ required: true, message: 'Current password is required' }]}
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="New Password"
          rules={[
            { required: true, message: 'New password is required' },
            { min: 8, message: 'New password must be at least 8 characters' },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>

        <Progress percent={score} status={getScoreStatus(score)} showInfo={false} />
        <Typography.Paragraph type="secondary" className="mt-2">
          Use at least 8 characters with uppercase letters, numbers, and a symbol.
        </Typography.Paragraph>

        <Form.Item
          name="confirmPassword"
          label="Confirm Password"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Please confirm your password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>

        <Space>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            Update Password
          </Button>
          <Button onClick={() => form.resetFields()}>Reset</Button>
        </Space>
      </Form>
    </Card>
  );
}
