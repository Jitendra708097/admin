/**
 * @module LeaveBalanceModal
 * @description Modal to adjust employee leave balance.
 */
import { Modal, Form, Input, Button, Row, Col, Card, Statistic, Select } from 'antd';

export default function LeaveBalanceModal({ open, employee, onClose, onSubmit, loading }) {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit({
        employeeId: employee?.id,
        leaveType: values.leaveType,
        days: Number(values.days || 0),
        reason: values.reason,
      });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={`Leave Balance - ${employee?.name}`}
      open={open}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          Update
        </Button>,
      ]}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {Object.entries(employee?.leaveBalance || {}).slice(0, 4).map(([type, value]) => (
          <Col xs={12} key={type}>
            <Card size="small">
              <Statistic title={type.replace(/_/g, ' ')} value={Number(value || 0)} />
            </Card>
          </Col>
        ))}
      </Row>

      <Form form={form} layout="vertical" initialValues={{ leaveType: 'casual' }}>
        <Form.Item name="leaveType" label="Leave Type" rules={[{ required: true, message: 'Leave type is required' }]}>
          <Select
            options={Object.keys(employee?.leaveBalance || { casual: 0, sick: 0, earned: 0 }).map((type) => ({
              label: type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
              value: type,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="days"
          label="Adjustment Days"
          extra="Use positive days to add balance and negative days to deduct balance."
          rules={[{ required: true, message: 'Adjustment days are required' }]}
        >
          <Input type="number" step="0.5" />
        </Form.Item>

        <Form.Item name="reason" label="Reason" rules={[{ required: true, message: 'Reason is required' }]}>
          <Input.TextArea rows={3} placeholder="Reason for adjustment" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
