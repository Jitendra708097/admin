/**
 * @module PlanCard
 * @description Subscription plan display card.
 */
import { Card, Button, List } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import Skeleton from '../../components/common/Skeleton.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

export default function PlanCard({ plan, onUpgrade, loading }) {
  const features = plan?.features || [];

  if (loading) {
    return (
      <Card title="Current Plan">
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  return (
    <Card title="Current Plan">
      <div className="mb-4">
        <h3 className="text-xl font-semibold">{plan?.name || 'Plan'}</h3>
        <p className="text-2xl font-bold text-blue-600">
          {formatCurrency(plan?.price || 0, plan?.currency || 'INR')}/{plan?.billingUnit || 'month'}
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Active employees: {plan?.employeeCount || 0}
        </p>
        <p className="text-sm text-gray-600">
          Current bill: {formatCurrency(plan?.monthlyAmount || 0, plan?.currency || 'INR')}
        </p>
        {plan?.trialEndsAt && (
          <p className="text-sm text-orange-600">Trial ends on {formatDate(plan.trialEndsAt)}</p>
        )}
      </div>

      <List
        dataSource={features}
        renderItem={(feature) => (
          <List.Item>
            <CheckOutlined className="mr-2 text-green-600" />
            {feature}
          </List.Item>
        )}
      />

      <Button type="primary" className="mt-4" onClick={onUpgrade}>
        Contact Billing
      </Button>
    </Card>
  );
}
