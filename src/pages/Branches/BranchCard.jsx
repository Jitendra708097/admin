import { Badge, Button, Card, Col, Popconfirm, Row, Space, Statistic, Tag, Tooltip, Typography } from 'antd';
import {
  BarChartOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  TeamOutlined,
} from '@ant-design/icons';

function getGeofenceBadge(branch) {
  if (branch.isRemote) {
    return { color: 'blue', text: 'Remote branch' };
  }

  if (branch.geofenceQuality === 'valid' || branch.hasGeofence) {
    return { color: 'success', text: 'Geofence ready' };
  }

  if (branch.geofenceQuality === 'too_few_points') {
    return { color: 'warning', text: 'Geofence incomplete' };
  }

  return { color: 'error', text: 'Geofence missing' };
}

export default function BranchCard({
  branch,
  onEdit,
  onSetGeofence,
  onDelete,
  onViewEmployees,
  onViewStats,
}) {
  const geofenceBadge = getGeofenceBadge(branch);
  const employeeCount = branch.employeeCount || 0;
  const canDelete = branch.canDelete !== false && employeeCount === 0;

  return (
    <Card
      title={
        <Space direction="vertical" size={2}>
          <Typography.Text strong>{branch.name}</Typography.Text>
          <Space size={6} wrap>
            <Tag color={branch.isRemote ? 'blue' : 'green'}>{branch.isRemote ? 'Remote' : 'Office'}</Tag>
            <Tag color={geofenceBadge.color}>{geofenceBadge.text}</Tag>
          </Space>
        </Space>
      }
      extra={
        <Space>
          <Tooltip title="Edit branch">
            <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(branch)} />
          </Tooltip>
          <Tooltip title="Set geofence">
            <Button type="text" icon={<EnvironmentOutlined />} onClick={() => onSetGeofence(branch)} />
          </Tooltip>
          <Popconfirm
            title="Delete branch?"
            description={
              canDelete
                ? 'This branch will be removed.'
                : 'Reassign employees before deleting this branch.'
            }
            okButtonProps={{ danger: true, disabled: !canDelete }}
            okText="Delete"
            onConfirm={() => {
              if (canDelete) {
                onDelete(branch.id);
              }
            }}
          >
            <Tooltip title={canDelete ? 'Delete branch' : 'Branch has assigned employees'}>
              <Button type="text" danger icon={<DeleteOutlined />} disabled={!canDelete} />
            </Tooltip>
          </Popconfirm>
        </Space>
      }
      style={{ height: '100%' }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
          <EnvironmentOutlined /> {branch.address || 'No address provided'}
        </Typography.Paragraph>

        <Row gutter={[12, 12]}>
          <Col span={12}>
            <Statistic title="Employees" value={employeeCount} prefix={<TeamOutlined />} />
          </Col>
          <Col span={12}>
            <Statistic title="Polygon points" value={branch.polygonPointCount || 0} />
          </Col>
        </Row>

        <div
          style={{
            padding: 12,
            borderRadius: 8,
            border: `1px solid ${branch.hasGeofence || branch.isRemote ? '#bbf7d0' : '#fed7aa'}`,
            background: branch.hasGeofence || branch.isRemote ? '#f0fdf4' : '#fff7ed',
          }}
        >
          <Badge
            status={geofenceBadge.color === 'error' ? 'error' : branch.hasGeofence || branch.isRemote ? 'success' : 'warning'}
            text={geofenceBadge.text}
          />
          <Typography.Text type="secondary" style={{ display: 'block', marginTop: 6 }}>
            {branch.isRemote
              ? 'Remote branch does not require a fixed office polygon.'
              : branch.hasGeofence
                ? 'Attendance can validate GPS inside this branch boundary.'
                : 'Draw the branch boundary before using location-restricted attendance.'}
          </Typography.Text>
        </div>

        <Space wrap>
          <Button icon={<EnvironmentOutlined />} onClick={() => onSetGeofence(branch)}>
            {branch.hasGeofence ? 'Edit Geofence' : 'Set Geofence'}
          </Button>
          <Button icon={<TeamOutlined />} onClick={() => onViewEmployees(branch)}>
            Employees
          </Button>
          <Button icon={<BarChartOutlined />} onClick={() => onViewStats(branch)}>
            Today
          </Button>
        </Space>
      </Space>
    </Card>
  );
}
