/**
 * @module LeaveTable
 * @description Paginated leave requests table with filters.
 */
import { Button, Space, Table, Tag, Typography } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import Skeleton from '../../components/common/Skeleton.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';

export default function LeaveTable({ data, loading, onView, onApprove, onReject, pagination }) {
  const columns = [
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (name, record) => (
        <div>
          <Typography.Text strong>{name || 'Unknown'}</Typography.Text>
          <div>
            <Typography.Text type="secondary">{record.employeeCode || record.departmentName || '-'}</Typography.Text>
          </div>
        </div>
      ),
    },
    { title: 'Department', dataIndex: 'departmentName', key: 'departmentName', render: (value) => value || '-' },
    {
      title: 'Type',
      dataIndex: 'leaveType',
      key: 'leaveType',
      render: (type) => <Tag>{String(type || '').toUpperCase()}</Tag>,
    },
    { title: 'From', dataIndex: 'fromDate', key: 'fromDate' },
    { title: 'To', dataIndex: 'toDate', key: 'toDate' },
    {
      title: 'Duration',
      dataIndex: 'days',
      key: 'days',
      width: 130,
      render: (days, record) => (
        <Space>
          <Tag color={record.isHalfDay ? 'purple' : 'blue'}>{days} day{Number(days) === 1 ? '' : 's'}</Tag>
          {record.isHalfDay ? <Tag>{record.halfDayPeriod}</Tag> : null}
        </Space>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (value) => <Typography.Text type="secondary">{value || '-'}</Typography.Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
    },
    { title: 'Approver', dataIndex: 'approverName', key: 'approverName', render: (value) => value || '-' },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => onView(record)} />
          {record.status === 'pending' ? (
            <>
              <Button type="text" icon={<CheckOutlined />} size="small" onClick={() => onApprove(record)} />
              <Button type="text" danger icon={<CloseOutlined />} size="small" onClick={() => onReject(record)} />
            </>
          ) : null}
        </Space>
      ),
    },
  ];

  return loading ? (
    <Skeleton />
  ) : (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      pagination={pagination}
      scroll={{ x: 1200 }}
      rowClassName={(record) => (record.status === 'pending' ? 'bg-amber-50' : '')}
    />
  );
}
