import { Card, Button, Space, Badge, Statistic, Row, Col, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, EnvironmentOutlined } from '@ant-design/icons';

export default function BranchCard({ branch, onEdit, onSetGeofence, onDelete }) {
  return (
    <Card
      title={branch.name}
      extra={
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(branch)} />
          <Button type="text" icon={<EnvironmentOutlined />} onClick={() => onSetGeofence(branch)} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onDelete(branch.id)} />
        </Space>
      }
      style={{ height: '100%' }}
    >
      <p>
        <EnvironmentOutlined /> {branch.address || 'No address provided'}
      </p>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12}>
          <Statistic title="Employees" value={branch.employeeCount || 0} />
        </Col>
        <Col xs={12}>
          {branch.hasGeofence ? (
            <Badge status="success" text="Geofence Set" />
          ) : (
            <Badge status="error" text="No Geofence" />
          )}
        </Col>
      </Row>

      <div
        style={{
          marginTop: 18,
          padding: 14,
          borderRadius: 14,
          background: branch.hasGeofence ? 'linear-gradient(135deg, #ecfdf3 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
          border: `1px solid ${branch.hasGeofence ? '#86efac' : '#fdba74'}`,
        }}
      >
        <Typography.Text strong style={{ display: 'block', marginBottom: 6, color: '#111827' }}>
          {branch.hasGeofence ? 'Geofence is ready' : 'Set branch geofence'}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          {branch.hasGeofence
            ? 'Update the polygon anytime to refine the branch attendance zone.'
            : 'Draw the branch boundary on the map so attendance only works inside the allowed area.'}
        </Typography.Text>
        <Button type="primary" icon={<EnvironmentOutlined />} onClick={() => onSetGeofence(branch)}>
          {branch.hasGeofence ? 'Edit Geofence' : 'Set Geofence'}
        </Button>
      </div>

      {branch.isRemote ? <Badge color="blue" text="Remote Office" style={{ marginTop: 8 }} /> : null}
    </Card>
  );
}
