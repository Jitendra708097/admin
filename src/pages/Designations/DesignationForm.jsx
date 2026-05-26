import { Button, Drawer, Form, Input } from 'antd';
import { useEffect } from 'react';

export default function DesignationForm({ open, designation, loading, onClose, onSubmit }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue({
      name: designation?.name || '',
      code: designation?.code || '',
    });
  }, [designation, form, open]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      title={designation ? 'Edit Designation' : 'New Designation'}
      placement="right"
      open={open}
      onClose={handleClose}
      width={480}
      destroyOnHidden
      extra={
        <Button type="primary" loading={loading} onClick={handleSubmit}>
          Save
        </Button>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Designation Name"
          rules={[
            { required: true, message: 'Designation name is required' },
            { max: 120, message: 'Designation name is too long' },
          ]}
        >
          <Input size="large" placeholder="Professor, HR, Registrar" />
        </Form.Item>

        <Form.Item
          name="code"
          label="Designation Code"
          rules={[
            { required: true, message: 'Designation code is required' },
            { max: 40, message: 'Designation code is too long' },
            { pattern: /^[A-Za-z0-9-]+$/, message: 'Use letters, numbers, and hyphens only' },
          ]}
        >
          <Input size="large" placeholder="PROFESSOR, HR, REGISTRAR" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
