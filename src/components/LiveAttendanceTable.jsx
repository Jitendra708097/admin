import { Avatar, Table, Tag } from 'antd';
import dayjs from 'dayjs';

function renderStatus(status, isCheckedIn) {
  if (isCheckedIn) {
    return <Tag color="green">Checked In</Tag>;
  }

  return <Tag color={status === 'absent' ? 'red' : 'blue'}>{status}</Tag>;
}

export default function LiveAttendanceTable({ data = [], loading = false }) {
  const columns = [
    {
      title: 'Employee',
      dataIndex: 'empName',
      key: 'empName',
      render: (value) => <span style={{ fontWeight: 600 }}>{value}</span>,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => renderStatus(record.status, record.isCheckedIn),
    },
    {
      title: 'Time',
      key: 'time',
      render: (_, record) => (record.time ? dayjs(record.time).format('DD MMM, HH:mm') : '-'),
    },
    {
      title: 'Worked',
      key: 'worked',
      render: (_, record) => `${Math.round((record.totalWorkedMins || 0) / 60)}h ${Number(record.totalWorkedMins || 0) % 60}m`,
    },
    {
      title: 'Selfie',
      key: 'selfie',
      render: (_, record) =>
        record.selfieUrl ? <Avatar shape="square" src={record.selfieUrl} size={44} /> : <Tag>Pending</Tag>,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey={(record) => record.attendanceId || `${record.empId}-${record.time}`}
      pagination={false}
      size="middle"
    />
  );
}
