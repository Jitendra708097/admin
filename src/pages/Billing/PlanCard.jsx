/**
 * @module PlanCard
 * @description Subscription plan display card.
 */
import { Alert, Button, Card, Col, Descriptions, Row, Space, Statistic, Tag, Typography } from 'antd';
import { CheckOutlined, CreditCardOutlined, TeamOutlined } from '@ant-design/icons';
import Skeleton from '../../components/common/Skeleton.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

function getStatusColor(status) {
  if (status === 'paid') return 'success';
  if (status === 'overdue') return 'error';
  return 'warning';
}

export default function PlanCard({ plan, currentInvoice, onUpgrade, loading }) {
  const features = plan?.features || [];
  const invoiceStatus = currentInvoice?.isOverdue ? 'overdue' : currentInvoice?.status || 'due';

  if (loading) {
    return (
      <Card title="Current Plan">
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  return (
    <Card
      title="Current Plan"
      extra={
        <Button type="primary" onClick={onUpgrade}>
          Request Plan Change
        </Button>
      }
    >
      <Space direction="vertical" size={18} style={{ width: '100%' }}>
        {currentInvoice?.isOverdue ? (
          <Alert
            type="warning"
            showIcon
            message="Invoice overdue"
            description="The current invoice is past its due date. Please complete payment to avoid billing follow-up."
          />
        ) : null}

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Statistic title="Plan" value={plan?.name || 'Plan'} prefix={<CheckOutlined />} />
          </Col>
          <Col xs={24} md={8}>
            <Statistic title="Active employees" value={plan?.employeeCount || 0} prefix={<TeamOutlined />} />
          </Col>
          <Col xs={24} md={8}>
            <Statistic
              title="Current bill"
              value={plan?.monthlyAmount || 0}
              formatter={(value) => formatCurrency(value, plan?.currency || 'INR')}
              prefix={<CreditCardOutlined />}
            />
          </Col>
        </Row>

        <Descriptions size="small" column={{ xs: 1, md: 2 }} bordered>
          <Descriptions.Item label="Rate">
            {formatCurrency(plan?.price || 0, plan?.currency || 'INR')} / {plan?.billingUnit || 'employee/month'}
          </Descriptions.Item>
          <Descriptions.Item label="Invoice status">
            <Tag color={getStatusColor(invoiceStatus)}>{String(invoiceStatus).toUpperCase()}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Current invoice">
            {currentInvoice?.invoiceNumber || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Due date">
            {currentInvoice?.dueDate ? formatDate(currentInvoice.dueDate) : '-'}
          </Descriptions.Item>
          {plan?.trialEndsAt ? (
            <Descriptions.Item label="Trial ends">{formatDate(plan.trialEndsAt)}</Descriptions.Item>
          ) : null}
          <Descriptions.Item label="Billing model">{plan?.billingUnit || 'employee/month'}</Descriptions.Item>
        </Descriptions>

        {features.length > 0 ? (
          <div>
            <Typography.Text strong>Included</Typography.Text>
            <div className="mt-2 flex flex-wrap gap-2">
              {features.map((feature) => (
                <Tag key={feature} color="green">
                  <CheckOutlined /> {feature}
                </Tag>
              ))}
            </div>
          </div>
        ) : null}
      </Space>
    </Card>
  );
}
