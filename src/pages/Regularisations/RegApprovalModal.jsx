import { Button, Card, Col, Form, Image, Input, Modal, Row, Tag } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

function formatDateTime(value) {
  if (!value) {
    return 'Not available';
  }

  return new Date(value).toLocaleString();
}

export default function RegApprovalModal({ open, reg, role, onApprove, onReject, onClose, loading }) {
  const [form] = Form.useForm();

  if (!reg) {
    return null;
  }

  const approveLabel = role === 'manager' ? 'Manager Approve' : 'Final Approve';

  const handleApprove = async () => {
    const values = await form.validateFields();
    onApprove(reg.id, values);
  };

  const handleReject = async () => {
    const values = await form.validateFields();
    onReject(reg.id, values);
  };

  return (
    <Modal
      title="Regularisation Review"
      open={open}
      onCancel={onClose}
      width={720}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button key="reject" danger onClick={handleReject} loading={loading} icon={<CloseOutlined />}>
          Reject
        </Button>,
        <Button key="approve" type="primary" onClick={handleApprove} loading={loading} icon={<CheckOutlined />}>
          {approveLabel}
        </Button>,
      ]}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card size="small">
            <p><strong>Employee:</strong> {reg.employeeName || 'Unknown'}</p>
            <p><strong>Date:</strong> {reg.date}</p>
            <p><strong>Status:</strong> <Tag color={reg.status === 'manager_approved' ? 'blue' : 'gold'}>{reg.status}</Tag></p>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small">
            <p><strong>Evidence Type:</strong> {reg.evidenceType || 'other'}</p>
            <p><strong>Current Level:</strong> {reg.level}</p>
          </Card>
        </Col>
      </Row>

      <Card size="small" title="Reason" style={{ marginBottom: 16 }}>
        <p>{reg.reason}</p>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card size="small" title="Original Record">
            <p><strong>Check-in:</strong> {formatDateTime(reg.originalCheckIn)}</p>
            <p><strong>Check-out:</strong> {formatDateTime(reg.originalCheckOut)}</p>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" title="Requested Correction">
            <p><strong>Check-in:</strong> {formatDateTime(reg.requestedCheckIn)}</p>
            <p><strong>Check-out:</strong> {formatDateTime(reg.requestedCheckOut)}</p>
          </Card>
        </Col>
      </Row>

      {reg.evidenceUrl ? (
        <Card size="small" title="Evidence" style={{ marginBottom: 16 }}>
          <Image src={reg.evidenceUrl} width={220} />
        </Card>
      ) : null}

      <Form form={form} layout="vertical">
        <Form.Item name="note" label="Decision Note">
          <Input.TextArea rows={3} placeholder="Add optional approval or rejection notes" />
        </Form.Item>
        <Form.Item name="reason" label="Rejection Reason">
          <Input.TextArea rows={3} placeholder="Required when rejecting" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
