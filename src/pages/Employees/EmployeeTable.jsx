import { Avatar, Button, Dropdown, Space, Table, Tooltip, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, MailOutlined, MoreOutlined } from '@ant-design/icons';
import RoleBadge from '../../components/common/RoleBadge.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';

export default function EmployeeTable({
  data,
  loading,
  onEdit,
  onDelete,
  onResendInvite,
  onPageChange,
  onSelectionChange,
  pagination,
  selectedRowKeys,
}) {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      render: (name, record) => (
        <Space size={12}>
          <Avatar style={{ backgroundColor: '#0f766e', color: '#f8fafc' }}>
            {name?.charAt(0) || 'E'}
          </Avatar>
          <div>
            <Typography.Text strong>{name || 'Unnamed employee'}</Typography.Text>
            <div>
              <Typography.Text type="secondary">{record.email || 'No email added'}</Typography.Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Emp Code',
      dataIndex: 'empCode',
      key: 'empCode',
      width: 160,
      render: (value) => (
        <Tooltip title={value || 'Auto-generated after save'}>
          <Typography.Text ellipsis style={{ maxWidth: 140, display: 'inline-block' }}>
            {value || 'Pending'}
          </Typography.Text>
        </Tooltip>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'departmentName',
      key: 'departmentName',
      render: (value) => value || 'Unassigned',
    },
    {
      title: 'Shift',
      dataIndex: 'shiftName',
      key: 'shiftName',
      render: (value) => value || 'Not set',
    },
    {
      title: 'Branch',
      dataIndex: 'branchName',
      key: 'branchName',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <RoleBadge role={role} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit',
                onClick: () => onEdit(record),
              },
              {
                key: 'resend',
                icon: <MailOutlined />,
                label: 'Resend Invite',
                onClick: () => onResendInvite?.(record.id),
              },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: 'Delete',
                danger: true,
                onClick: () => onDelete(record.id),
              },
            ],
          }}
        >
          <Tooltip title="More actions">
            <Button type="text" icon={<MoreOutlined />} />
          </Tooltip>
        </Dropdown>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      rowSelection={{
        selectedRowKeys,
        onChange: onSelectionChange,
      }}
      pagination={{
        ...pagination,
        showSizeChanger: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} employees`,
        onChange: onPageChange,
      }}
      scroll={{ x: 1100 }}
      locale={{
        emptyText: 'No employees match the current search and filters.',
      }}
    />
  );
}
