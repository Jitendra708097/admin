import { useEffect, useState } from 'react';
import { App as AntdApp, Button, Card, Form, Input, Row, Col, Typography } from 'antd';
import { ArrowLeftOutlined, LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router';
import { useForgotPasswordMutation, useResetPasswordMutation } from '../../store/api/authApi.js';
import { parseApiError } from '../../utils/errorHandler.js';
import styles from './auth.module.css';

const RESEND_COOLDOWN_SECONDS = 60;

export default function ResetPasswordPage() {
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [forgotPassword, { isLoading: isResending }] = useForgotPasswordMutation();
  const [resendSeconds, setResendSeconds] = useState(location.state?.resendCooldownSeconds ?? 0);

  const prefilledEmail = location.state?.email || '';
  const expiresInMinutes = location.state?.expiresInMinutes ?? 10;

  useEffect(() => {
    if (resendSeconds <= 0) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [resendSeconds]);

  const onFinish = async (values) => {
    try {
      await resetPassword({
        email: values.email,
        otp: values.otp,
        newPassword: values.newPassword,
      }).unwrap();

      message.success('Password reset successful. Please sign in with your new password.');
      navigate('/login');
    } catch (error) {
      message.error(parseApiError(error));
    }
  };

  const handleResendOtp = async () => {
    try {
      const values = await form.validateFields(['email']);
      const response = await forgotPassword({
        email: values.email,
      }).unwrap();

      message.success(response?.emailSent ? 'A fresh OTP has been sent to your email address' : 'If the account exists, an OTP has been sent');
      setResendSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      if (error?.errorFields) {
        return;
      }

      if (error?.data?.error?.code === 'AUTH_018') {
        setResendSeconds(RESEND_COOLDOWN_SECONDS);
      }
      message.error(parseApiError(error));
    }
  };

  const resendDisabled = isResending || resendSeconds > 0;

  return (
    <Row justify="center" align="middle" className={styles.authShell}>
      <Col xs={22} sm={20} md={12} lg={8}>
        <Card className={styles.loginCard}>
          <div className={styles.logoSection}>
            <Typography.Title level={2}>Set a new password</Typography.Title>
            <Typography.Paragraph className={styles.subtitle}>
              Use the 6-digit OTP from your email. The code expires in about {expiresInMinutes} minutes.
            </Typography.Paragraph>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ email: prefilledEmail }}
          >
            <Form.Item
              name="email"
              label="Admin email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="admin@company.com" size="large" autoComplete="email" />
            </Form.Item>

            <Form.Item
              name="otp"
              label="OTP"
              rules={[
                { required: true, message: 'Please enter the OTP' },
                { pattern: /^\d{6}$/, message: 'OTP must be a 6-digit code' },
              ]}
            >
              <Input prefix={<SafetyOutlined />} placeholder="Enter 6-digit OTP" size="large" maxLength={6} inputMode="numeric" />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="New password"
              rules={[
                { required: true, message: 'Please enter a new password' },
                { min: 8, message: 'Password must be at least 8 characters' },
              ]}
              hasFeedback
            >
              <Input.Password prefix={<LockOutlined />} placeholder="New password" size="large" autoComplete="new-password" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm password"
              dependencies={['newPassword']}
              hasFeedback
              rules={[
                { required: true, message: 'Please confirm your new password' },
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
              <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" size="large" autoComplete="new-password" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isLoading} block size="large">
                Reset Password
              </Button>
            </Form.Item>

            <div className={styles.authLinksRow}>
              <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/login')} className={styles.inlineLinkButton}>
                Back to login
              </Button>
              <Button
                type="link"
                onClick={handleResendOtp}
                disabled={resendDisabled}
                loading={isResending}
                className={styles.inlineLinkButton}
              >
                {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}
              </Button>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
}
