/**
 * @module ProfileSettings
 * @description Organization profile settings.
 */
import { App as AntdApp, Button, Card, Col, Form, Image, Input, Popconfirm, Row, Select, Space, Upload, Typography } from 'antd';
import { DeleteOutlined, LoadingOutlined, ReloadOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { useEffect } from 'react';

const TIMEZONE_OPTIONS = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'America/New_York',
].map((value) => ({ label: value, value }));

export default function ProfileSettings({
  org,
  onSubmit,
  onLogoUpload,
  onLogoRemove,
  loading,
  logoUploading,
  logoRemoving,
  onDirtyChange,
}) {
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();
  const currentLogo = Form.useWatch('logo', form) || org?.logo || '';

  useEffect(() => {
    if (org) {
      form.setFieldsValue(org);
      onDirtyChange?.(false);
    }
  }, [org, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
    onDirtyChange?.(false);
  };

  const resetForm = () => {
    form.setFieldsValue(org || {});
    onDirtyChange?.(false);
  };

  const handleLogoUpload = async ({ file, onSuccess, onError }) => {
    try {
      const response = await onLogoUpload(file);
      form.setFieldsValue({ logo: response?.logo || '' });
      onDirtyChange?.(true);
      onSuccess?.(response);
    } catch (error) {
      message.error(error?.data?.error?.message || error?.message || 'Failed to upload logo');
      onError?.(error);
    }
  };

  const removeLogo = async () => {
    const response = await onLogoRemove();
    form.setFieldsValue({ logo: response?.logo || '' });
    onDirtyChange?.(false);
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="Organisation Identity">
        <Form form={form} layout="vertical" initialValues={org || {}} onValuesChange={() => onDirtyChange?.(true)}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="name" label="Organisation Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Slug">
                <Input value={org?.slug || ''} disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Plan">
                <Input value={org?.plan || ''} disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="timezone" label="Timezone" rules={[{ required: true }]}>
                <Select showSearch options={TIMEZONE_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          <Card type="inner" title="Contact Information" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="phone"
                  label="Phone"
                  rules={[{ pattern: /^[0-9+\-\s()]{7,20}$/, message: 'Enter a valid phone number' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="address" label="Address">
                  <Input.TextArea rows={3} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card type="inner" title="Branding">
            <Form.Item name="logo" hidden>
              <Input />
            </Form.Item>
            <Space align="start" size={16} wrap>
              {currentLogo ? (
                <Image
                  src={currentLogo}
                  alt="Organisation logo"
                  width={96}
                  height={96}
                  className="rounded-lg border border-gray-200 object-cover"
                  preview={false}
                  fallback=""
                />
              ) : null}
              <Space direction="vertical">
                <Typography.Text type="secondary">
                  Upload a square image under 5 MB. PNG, JPG, and WebP are supported.
                </Typography.Text>
                <Space>
                  <Upload accept="image/*" maxCount={1} showUploadList={false} customRequest={handleLogoUpload}>
                    <Button icon={logoUploading ? <LoadingOutlined /> : <UploadOutlined />} loading={logoUploading}>
                      {currentLogo ? 'Replace Logo' : 'Upload Logo'}
                    </Button>
                  </Upload>
                  {currentLogo ? (
                    <Popconfirm title="Remove organisation logo?" onConfirm={removeLogo}>
                      <Button danger icon={<DeleteOutlined />} loading={logoRemoving}>
                        Remove
                      </Button>
                    </Popconfirm>
                  ) : null}
                </Space>
              </Space>
            </Space>
          </Card>

          <div className="mt-4 flex gap-2">
            <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSubmit}>
              Save Changes
            </Button>
            <Button icon={<ReloadOutlined />} onClick={resetForm}>
              Reset
            </Button>
          </div>
        </Form>
      </Card>
    </Space>
  );
}
