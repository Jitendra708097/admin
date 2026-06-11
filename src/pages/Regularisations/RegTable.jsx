import { Button, Space, Table, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import StatusBadge from '../../components/common/StatusBadge.jsx';

function formatTime(value) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RegTable({
  data,
  loading,
  onView,
  canReview = () => false,
  pagination = {},
  onPaginationChange = () => {},
}) {
  const columns = [
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Evidence',
      dataIndex: 'evidenceType',
      key: 'evidenceType',
      render: (value) => <Tag>{value || 'other'}</Tag>,
    },
    {
      title: 'Requested Times',
      key: 'requestedTimes',
      render: (_, record) => {
        const parts = [];

        if (record.requestedCheckIn) {
          parts.push(`IN ${formatTime(record.requestedCheckIn)}`);
        }

        if (record.requestedCheckOut) {
          parts.push(`OUT ${formatTime(record.requestedCheckOut)}`);
        }

        return parts.length > 0 ? parts.join(' | ') : 'No change submitted';
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      render: (level) => <Tag color={level === 'admin_review' ? 'blue' : 'gold'}>{level}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => onView(record)}>
            {canReview(record) ? 'Review' : 'View'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      pagination={pagination}
      onChange={onPaginationChange}
      scroll={{ x: 960 }}
    />
  );
}
