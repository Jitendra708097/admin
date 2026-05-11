import { Button, Card, Col, Popconfirm, Row, Space, Statistic, Tag, Tooltip, Typography } from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);

const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

function formatTime(value) {
  return value ? dayjs(value, 'HH:mm:ss').format('HH:mm') : '--:--';
}

function minutesBetween(startTime, endTime, crossesMidnight) {
  const start = dayjs(startTime, 'HH:mm:ss');
  let end = dayjs(endTime, 'HH:mm:ss');
  if (!start.isValid() || !end.isValid()) {
    return 0;
  }

  if (crossesMidnight || end.isBefore(start)) {
    end = end.add(1, 'day');
  }

  return Math.max(end.diff(start, 'minute'), 0);
}

function addMinutes(time, minutes) {
  const value = dayjs(time, 'HH:mm:ss');
  return value.isValid() ? value.add(Number(minutes || 0), 'minute').format('HH:mm') : '-';
}

function formatDuration(minutes) {
  const total = Number(minutes || 0);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours}h ${mins}m`;
}

export default function ShiftCard({ shift, onEdit, onDelete, onDuplicate, onViewEmployees }) {
  const workDays = new Set(shift.workDays || []);
  const grossMinutes = minutesBetween(shift.startTime, shift.endTime, shift.crossesMidnight);
  const expectedWorkMinutes = Math.max(grossMinutes - Number(shift.breakMins || 0), 0);
  const hasEmployees = Number(shift.employeeCount || 0) > 0;

  return (
    <Card
      title={
        <Space direction="vertical" size={2}>
          <Typography.Text strong>{shift.name}</Typography.Text>
          <Typography.Text type="secondary" className="text-xs">
            {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
            {shift.crossesMidnight ? ' - Night shift' : ''}
          </Typography.Text>
        </Space>
      }
      extra={
        <Space>
          <Tooltip title="View assigned employees">
            <Button type="text" icon={<TeamOutlined />} onClick={() => onViewEmployees(shift)} />
          </Tooltip>
          <Tooltip title="Duplicate shift">
            <Button type="text" icon={<CopyOutlined />} onClick={() => onDuplicate(shift)} />
          </Tooltip>
          <Tooltip title="Edit shift">
            <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(shift)} />
          </Tooltip>
          <Popconfirm
            title="Delete shift?"
            description={
              hasEmployees
                ? `This shift has ${shift.employeeCount} assigned employee(s). Reassign them before deleting.`
                : 'This shift will be removed.'
            }
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, disabled: hasEmployees }}
            onConfirm={() => onDelete(shift.id)}
          >
            <Tooltip title={hasEmployees ? 'Reassign employees before deleting' : 'Delete shift'}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      }
      bordered={false}
      className="h-full"
    >
      <Space wrap className="mb-4">
        {shift.crossesMidnight ? <Tag color="purple">Crosses midnight</Tag> : <Tag color="green">Same day</Tag>}
        <Tag icon={<UserOutlined />}>{shift.employeeCount || 0} employees</Tag>
        <Tag>{formatDuration(expectedWorkMinutes)} expected work</Tag>
      </Space>

      <div className="mb-4 flex gap-1">
        {DAYS.map((day) => (
          <div
            key={day.value}
            className={`flex h-8 w-9 items-center justify-center rounded border text-xs font-medium ${
              workDays.has(day.value) ? 'border-[#1677ff] bg-[#e6f4ff] text-[#0958d9]' : 'border-gray-200 text-gray-400'
            }`}
          >
            {day.label}
          </div>
        ))}
      </div>

      <Row gutter={[12, 12]}>
        <Col xs={12}>
          <Statistic title="Late After" value={addMinutes(shift.startTime, shift.graceCheckIn)} />
        </Col>
        <Col xs={12}>
          <Statistic title="Checkout Grace" value={`${shift.graceCheckOut || 0}m`} />
        </Col>
        <Col xs={12}>
          <Statistic title="Present After" value={formatDuration(shift.halfDayAfter)} />
        </Col>
        <Col xs={12}>
          <Statistic title="Absent Below" value={formatDuration(shift.absentAfter)} />
        </Col>
        <Col xs={12}>
          <Statistic title="Overtime After" value={formatDuration(shift.otAfter)} />
        </Col>
        <Col xs={12}>
          <Statistic title="Sessions / Day" value={shift.maxSessionsPerDay || 0} />
        </Col>
      </Row>
    </Card>
  );
}
