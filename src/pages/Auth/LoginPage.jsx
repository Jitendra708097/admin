import { useEffect, useState } from 'react';
import { App as AntdApp, Form, Input, Button, Card, Row, Col, Checkbox } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router';
import { useDispatch } from 'react-redux';
import { useExchangeImpersonationCodeMutation, useLoginMutation } from '../../store/api/authApi.js';
import { setAuth } from '../../store/authSlice.js';
import { parseApiError } from '../../utils/errorHandler.js';
import styles from './auth.module.css';

export default function LoginPage() {
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loginError, setLoginError] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const [exchangeImpersonationCode] = useExchangeImpersonationCodeMutation();

  useEffect(() => {
    const hash = window.location.hash || '';

    if (!hash.startsWith('#impersonationCode=')) {
      return;
    }

    const code = decodeURIComponent(hash.slice('#impersonationCode='.length));

    const startSupportSession = async () => {
      try {
        const decodedPayload = await exchangeImpersonationCode({ code }).unwrap();

        if (!decodedPayload?.accessToken || !decodedPayload?.user) {
          throw new Error('Invalid impersonation handoff');
        }

        dispatch(
          setAuth({
            user: decodedPayload.user,
            accessToken: decodedPayload.accessToken,
            refreshToken: null,
            org: decodedPayload.org || { id: decodedPayload.user.orgId, name: decodedPayload.user.orgName },
          })
        );

        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        message.success('Support session active');
        navigate('/dashboard', { replace: true });
      } catch (error) {
        const parsedError = parseApiError(error);
        message.error(parsedError || 'Unable to start support session');
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };

    startSupportSession();
  }, [dispatch, exchangeImpersonationCode, message, navigate]);

  const onFinish = async (values) => {
    setLoginError('');
    try {
      const response = await login({
        email: values.email,
        password: values.password,
      }).unwrap();

      const authPayload = response?.employee
        ? response
        : response?.user && response?.accessToken && response?.refreshToken
          ? { ...response, employee: response.user }
          : response?.data;

      if (!authPayload?.employee || !authPayload?.accessToken || !authPayload?.refreshToken) {
        throw new Error('Invalid login response');
      }

      if (!['admin', 'manager', 'superadmin'].includes(authPayload.employee.role)) {
        throw new Error('This account does not have admin portal access');
      }

      dispatch(
        setAuth({
          user: authPayload.employee,
          accessToken: authPayload.accessToken,
          refreshToken: authPayload.refreshToken,
          org: { id: authPayload.employee.orgId },
        })
      );

      message.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      const parsedError = parseApiError(error);
      setLoginError(parsedError);
      message.error(parsedError);
    }
  };

  return (
    <Row justify="center" align="middle" className={styles.authShell}>
      <Col xs={22} sm={20} md={12} lg={8}>
        <Card className={styles.loginCard}>
          <div className={styles.logoSection}>
            <h1>AttendEase</h1>
            <p>Admin Portal</p>
          </div>

          {loginError ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {loginError}
            </div>
          ) : null}

          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="admin@company.com" size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked" initialValue={false}>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isLoading} block size="large">
                Sign In
              </Button>
            </Form.Item>

            <div className={styles.footer}>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
}
