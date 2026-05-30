/**
 * @module LeaveApprovalModal
 * @description Modal for approving/rejecting leave requests.
 */
import { Alert, App as AntdApp, Button, Card, Col, Form, Input, Modal, Row, Space, Statistic, Tag, Typography } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import StatusBadge from '../../components/common/StatusBadge.jsx';

function getReviewErrorMessage(error, fallback) {
  return (
    error?.data?.error?.message ||
    error?.error?.message ||
    error?.message ||
    fallback
  );
}

export default function LeaveApprovalModal({
  open,
  leave,
  context,
  action = 'review',
  onApprove,
  onReject,
  onClose,
  approving = false,
  rejecting = false,
  contextLoading = false,
}) {
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();
  const selectedBalance = context?.selectedBalance;
  const canReview = ['pending', 'manager_approved', 'cancellation_pending'].includes(leave?.status);

  const handleApprove = async () => {
    if (!leave?.id) {
      message.error('Leave request not found');
      return;
    }
    try {
      await onApprove(leave.id);
      form.resetFields();
    } catch (error) {
      message.error(getReviewErrorMessage(error, 'Unable to approve leave request.'));
    }
  };

  const handleReject = async () => {
    if (!leave?.id) {
      message.error('Leave request not found');
      return;
    }
    try {
      const values = await form.validateFields();
      if (!String(values.note || '').trim()) {
        message.error('Rejection reason is required');
        return;
      }
      await onReject(leave.id, values.note);
      form.resetFields();
    } catch (error) {
      message.error(getReviewErrorMessage(error, 'Unable to reject leave request.'));
    }
  };

  if (!leave) return null;

  return (
    <Modal
      title="Review Leave Request"
      open={open}
      onCancel={onClose}
      width={760}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        canReview ? (
          <Button key="reject" danger onClick={handleReject} loading={rejecting} disabled={approving || contextLoading} icon={<CloseOutlined />}>
            Reject
          </Button>
        ) : null,
        canReview ? (
          <Button key="approve" type="primary" onClick={handleApprove} loading={approving} disabled={rejecting || contextLoading} icon={<CheckOutlined />}>
            {leave.status === 'cancellation_pending' ? 'Approve Cancellation' : 'Approve'}
          </Button>
        ) : null,
      ].filter(Boolean)}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={12}>
            <Card size="small"><Statistic title="Employee" value={leave.employeeName || '-'} /></Card>
          </Col>
          <Col xs={12}>
            <Card size="small"><Statistic title="Type" value={leave.leaveType || '-'} /></Card>
          </Col>
          <Col xs={12}>
            <Card size="small"><Statistic title="From" value={leave.fromDate || '-'} /></Card>
          </Col>
          <Col xs={12}>
            <Card size="small"><Statistic title="To" value={leave.toDate || '-'} /></Card>
          </Col>
          <Col xs={12}>
            <Card size="small"><Statistic title="Days" value={leave.days || 0} /></Card>
          </Col>
          <Col xs={12}>
            <Card size="small">
              <Typography.Text type="secondary">Status</Typography.Text>
              <div><StatusBadge status={leave.status} /></div>
            </Card>
          </Col>
        </Row>

        <Card size="small" title="Reason">
          <Typography.Paragraph style={{ marginBottom: 0 }}>{leave.reason || '-'}</Typography.Paragraph>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}><Card size="small"><Statistic title="Balance Total" value={selectedBalance?.total ?? 0} /></Card></Col>
          <Col xs={24} md={8}><Card size="small"><Statistic title="Used" value={selectedBalance?.used ?? 0} /></Card></Col>
          <Col xs={24} md={8}><Card size="small"><Statistic title="Remaining" value={selectedBalance?.remaining ?? 0} /></Card></Col>
        </Row>

        {context?.overlaps?.length > 0 ? (
          <Alert
            type="warning"
            showIcon
            message="Team overlap detected"
            description={`${context.overlaps.length} pending/approved leave request overlaps this date range in the same department.`}
          />
        ) : null}

        {leave.rejectionReason ? (
          <Alert type="error" showIcon message="Rejection reason" description={leave.rejectionReason} />
        ) : null}

        {canReview ? (
          <Form form={form} layout="vertical" initialValues={{ note: '' }}>
            <Form.Item
              name="note"
              label="Rejection reason"
            >
              <Input.TextArea rows={3} placeholder="Required when rejecting" />
            </Form.Item>
          </Form>
        ) : null}
      </Space>
    </Modal>
  );
}
