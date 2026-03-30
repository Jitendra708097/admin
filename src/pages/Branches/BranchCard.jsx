import { Card, Button, Space, Badge, Statistic, Row, Col } from 'antd';
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

      {branch.isRemote ? <Badge color="blue" text="Remote Office" style={{ marginTop: 8 }} /> : null}
    </Card>
  );
}
