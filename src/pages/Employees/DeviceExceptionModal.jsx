import { App, Button, Form, Input, List, Modal, Tag, Alert } from 'antd';
import {
  useApproveDeviceExceptionMutation,
  useCreateDeviceExceptionMutation,
  useGetDeviceExceptionsQuery,
  useRejectDeviceExceptionMutation,
} from '../../store/api/deviceExceptionApi.js';
import { getErrorRecovery } from '../../utils/errorHandler.js';

export default function DeviceExceptionModal({ open, employee, onClose }) {
  const { message, notification } = App.useApp();
  const [form] = Form.useForm();
  const { data, isLoading } = useGetDeviceExceptionsQuery(
    { empId: employee?.id },
    { skip: !employee?.id || !open }
  );
  const [createDeviceException, { isLoading: isCreating }] = useCreateDeviceExceptionMutation();
  const [approveDeviceException, { isLoading: isApproving }] = useApproveDeviceExceptionMutation();
  const [rejectDeviceException, { isLoading: isRejecting }] = useRejectDeviceExceptionMutation();

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await createDeviceException({
        empId: employee.id,
        tempDeviceId: values.tempDeviceId,
        reason: values.reason,
        approveNow: values.approveNow !== false,
      }).unwrap();
      message.success('Device exception created');
      form.resetFields();
    } catch (error) {
      if (error?.errorFields) {
        return;
      }
      const recovery = getErrorRecovery(error);
      notification.error({
        message: error?.data?.error?.message || 'Unable to create device exception',
        description: recovery.description,
        duration: 0,
      });
    }
  };

  const exceptions = data?.exceptions || [];

  return (
    <Modal
      open={open}
      title={`Device Exception - ${employee?.name || 'Employee'}`}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button key="create" type="primary" onClick={handleCreate} loading={isCreating}>
          Create Exception
        </Button>,
      ]}
      width={720}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ approveNow: true }}
      >
        <Form.Item
          name="tempDeviceId"
          label="Temporary Device ID"
          rules={[{ required: true, message: 'Temporary device id is required' }]}
        >
          <Input placeholder="Paste the employee temporary device id from the mobile app" />
        </Form.Item>
        <Form.Item
          name="reason"
          label="Reason"
          rules={[{ required: true, message: 'Reason is required' }]}
        >
          <Input.TextArea rows={3} placeholder="Reason for allowing this one-time device exception" />
        </Form.Item>
      </Form>

      <List
        loading={isLoading}
        dataSource={exceptions}
        header="Recent Device Exceptions"
        renderItem={(item) => (
          <List.Item
            actions={[
              item.status === 'pending' ? (
                <Button
                  key="approve"
                  type="link"
                  onClick={() => approveDeviceException({ id: item.id })}
                  loading={isApproving}
                >
                  Approve
                </Button>
              ) : null,
              item.status === 'pending' || item.status === 'approved' ? (
                <Button
                  key="reject"
                  danger
                  type="link"
                  onClick={() => rejectDeviceException({ id: item.id })}
                  loading={isRejecting}
                >
                  Reject
                </Button>
              ) : null,
            ].filter(Boolean)}
          >
            <List.Item.Meta
              title={
                <span>
                  <Tag color={item.status === 'approved' ? 'green' : item.status === 'used' ? 'blue' : item.status === 'expired' ? 'red' : 'gold'}>
                    {item.status}
                  </Tag>
                  {item.tempDeviceId}
                </span>
              }
              description={`${item.reason || 'No reason'}${item.expiresAt ? ` • Expires ${new Date(item.expiresAt).toLocaleString()}` : ''}`}
            />
          </List.Item>
        )}
      />
    </Modal>
  );
}
