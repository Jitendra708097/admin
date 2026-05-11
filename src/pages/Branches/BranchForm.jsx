import { Checkbox, Form, Input, Modal, Typography } from 'antd';
import { useEffect } from 'react';

function parseBssids(value) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

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
        wifiVerificationEnabled: branch.wifiVerificationEnabled,
        allowedBssids: (branch.allowedBssids || []).join(', '),
      });
      return;
    }

    form.resetFields();
  }, [branch, form, open]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    onSubmit({
      ...values,
      allowedBssids: parseBssids(values.allowedBssids),
    });
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

        <Form.Item name="wifiVerificationEnabled" valuePropName="checked">
          <Checkbox>Enable WiFi verification</Checkbox>
        </Form.Item>

        <Form.Item name="allowedBssids" label="Allowed WiFi BSSIDs">
          <Input.TextArea rows={2} placeholder="Comma separated BSSID values" />
        </Form.Item>

        <Typography.Text type="secondary">
          Geofence is configured after creating the branch. WiFi BSSIDs are optional and can be used as an extra
          verification signal later.
        </Typography.Text>
      </Form>
    </Modal>
  );
}
