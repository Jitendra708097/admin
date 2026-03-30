import { Card, Button, Space, Statistic, Row, Col, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ShiftCard({ shift, onEdit, onDelete }) {
  const workDays = DAYS.filter((_, index) => shift.workDays?.includes(index + 1) || shift.workDays?.includes(index));

  return (
    <Card
      title={shift.name}
      extra={
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(shift)} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onDelete(shift.id)} />
        </Space>
      }
      style={{ height: '100%' }}
    >
      <p>
        <strong>Time:</strong> {shift.startTime} - {shift.endTime}
      </p>
      <p>
        <strong>Work Days:</strong>{' '}
        {workDays.map((day) => (
          <Tag key={day}>{day}</Tag>
        ))}
      </p>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12}>
          <Statistic title="Grace In" value={shift.graceCheckIn} suffix="min" />
        </Col>
        <Col xs={12}>
          <Statistic title="Grace Out" value={shift.graceCheckOut} suffix="min" />
        </Col>
        <Col xs={12}>
          <Statistic title="Half Day" value={shift.halfDayAfter} suffix="min" />
        </Col>
        <Col xs={12}>
          <Statistic title="Absent" value={shift.absentAfter} suffix="min" />
        </Col>
        <Col xs={12}>
          <Statistic title="OT After" value={shift.otAfter} suffix="min" />
        </Col>
        <Col xs={12}>
          <Statistic title="Max Sessions" value={shift.maxSessionsPerDay} />
        </Col>
      </Row>
    </Card>
  );
}
