import { Button, Space, Table, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import StatusBadge from '../../components/common/StatusBadge.jsx';

export default function RegTable({ data, loading, onView }) {
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
          parts.push(`IN ${new Date(record.requestedCheckIn).toLocaleTimeString()}`);
        }

        if (record.requestedCheckOut) {
          parts.push(`OUT ${new Date(record.requestedCheckOut).toLocaleTimeString()}`);
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
            Review
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
      pagination={{ pageSize: 10 }}
      scroll={{ x: 960 }}
    />
  );
}
