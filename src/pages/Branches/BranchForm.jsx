import { Form, Input, Modal, Checkbox } from 'antd';
import { useEffect } from 'react';

export default function BranchForm({ open, branch, onClose, onSubmit, loading }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) {
      return;
    }

    if (branch) {
      form.setFieldsValue({
        name: branch.name,
        address: branch.address,
        isRemote: branch.isRemote,
      });
      return;
    }

    form.resetFields();
  }, [branch, form, open]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    onSubmit(values);
  };

  return (
    <Modal
      title={branch ? 'Edit Branch' : 'Add Branch'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="Branch Name" rules={[{ required: true, message: 'Please enter branch name' }]}>
          <Input />
        </Form.Item>

        <Form.Item name="address" label="Address">
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item name="isRemote" valuePropName="checked">
          <Checkbox>Remote branch</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}
