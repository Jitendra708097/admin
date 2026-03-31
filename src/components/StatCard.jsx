import { Card, Statistic } from 'antd';

export default function StatCard({ title, value, prefix = null, suffix = null, valueStyle = null }) {
  return (
    <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}>
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={valueStyle || undefined}
      />
    </Card>
  );
}
