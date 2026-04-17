import { App as AntdApp, Button, Card, Form, Input, Row, Col, Typography } from 'antd';
import { ArrowLeftOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router';
import { useForgotPasswordMutation } from '../../store/api/authApi.js';
import { parseApiError } from '../../utils/errorHandler.js';
import styles from './auth.module.css';

export default function ForgotPasswordPage() {
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const onFinish = async (values) => {
    try {
      const response = await forgotPassword({
        email: values.email,
      }).unwrap();

      message.success(response?.emailSent ? 'OTP sent to your email address' : 'If the account exists, an OTP has been sent');
      navigate('/reset-password', {
        state: {
          email: values.email,
          expiresInMinutes: response?.expiresInMinutes ?? 10,
        },
      });
    } catch (error) {
      message.error(parseApiError(error));
    }
  };

  return (
    <Row justify="center" align="middle" className={styles.authShell}>
      <Col xs={22} sm={20} md={12} lg={8}>
        <Card className={styles.loginCard}>
          <div className={styles.logoSection}>
            <Typography.Title level={2}>Reset admin password</Typography.Title>
            <Typography.Paragraph className={styles.subtitle}>
              Enter your admin email and we&apos;ll send a 6-digit OTP to continue.
            </Typography.Paragraph>
          </div>

          <Form form={form} layout="vertical" onFinish={onFinish}>
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

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isLoading} block size="large">
                Send OTP
              </Button>
            </Form.Item>

            <div className={styles.authLinksRow}>
              <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/login')} className={styles.inlineLinkButton}>
                Back to login
              </Button>
              <Link to="/reset-password">Already have an OTP?</Link>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
}
