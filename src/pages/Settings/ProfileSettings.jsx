/**
 * @module ProfileSettings
 * @description Organization profile settings.
 */
import { App as AntdApp, Form, Input, Button, Card, Upload, Image, Typography } from 'antd';
import { LoadingOutlined, UploadOutlined } from '@ant-design/icons';
import { useEffect } from 'react';

export default function ProfileSettings({ org, onSubmit, onLogoUpload, loading, logoUploading }) {
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();
  const currentLogo = Form.useWatch('logo', form) || org?.logo || '';

  useEffect(() => {
    if (org) {
      form.setFieldsValue(org);
    }
  }, [org, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleLogoUpload = async ({ file, onSuccess, onError }) => {
    try {
      const response = await onLogoUpload(file);
      form.setFieldsValue({ logo: response?.logo || '' });
      onSuccess?.(response);
    } catch (error) {
      message.error(error?.data?.error?.message || error?.message || 'Failed to upload logo');
      onError?.(error);
    }
  };

  return (
    <Card title="Organization Profile">
      <Form form={form} layout="vertical" initialValues={org || {}}>
        <Form.Item
          name="name"
          label="Organization Name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, type: 'email' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item name="phone" label="Phone">
          <Input />
        </Form.Item>

        <Form.Item name="address" label="Address">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item name="timezone" label="Timezone">
          <Input />
        </Form.Item>

        <Form.Item name="logo" hidden>
          <Input />
        </Form.Item>

        <Form.Item label="Logo">
          <>
            {currentLogo ? (
              <div className="mb-4">
                <Image
                  src={currentLogo}
                  alt="Organization logo"
                  width={96}
                  height={96}
                  className="rounded-lg border border-gray-200 object-cover"
                  preview={false}
                  fallback=""
                />
                <Typography.Paragraph className="mb-0 mt-2 text-xs text-gray-500">
                  This logo appears in the admin sidebar.
                </Typography.Paragraph>
              </div>
            ) : null}

            <Upload
              accept="image/*"
              maxCount={1}
              showUploadList={false}
              customRequest={handleLogoUpload}
            >
              <Button icon={logoUploading ? <LoadingOutlined /> : <UploadOutlined />} loading={logoUploading}>
                {currentLogo ? 'Replace Logo' : 'Upload Logo'}
              </Button>
            </Upload>
          </>
        </Form.Item>

        <Button type="primary" loading={loading} onClick={handleSubmit}>
          Save Changes
        </Button>
      </Form>
    </Card>
  );
}
