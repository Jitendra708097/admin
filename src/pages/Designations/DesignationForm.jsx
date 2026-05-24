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
      description: designation?.description || '',
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

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={4} maxLength={500} showCount placeholder="Optional internal note" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
