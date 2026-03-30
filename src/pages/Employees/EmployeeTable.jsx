import { Table, Space, Button, Dropdown, Avatar } from 'antd';
import { EditOutlined, DeleteOutlined, MailOutlined, MoreOutlined } from '@ant-design/icons';
import RoleBadge from '../../components/common/RoleBadge.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';

export default function EmployeeTable({ data, loading, onEdit, onDelete, onResendInvite, pagination }) {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => (
        <Space>
          <Avatar>{name?.charAt(0) || 'E'}</Avatar>
          {name}
        </Space>
      ),
    },
    {
      title: 'Emp Code',
      dataIndex: 'empCode',
      key: 'empCode',
    },
    {
      title: 'Department',
      dataIndex: 'departmentName',
      key: 'departmentName',
    },
    {
      title: 'Shift',
      dataIndex: 'shiftName',
      key: 'shiftName',
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
          <Button type="text" icon={<MoreOutlined />} />
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
      pagination={pagination}
      scroll={{ x: 1100 }}
    />
  );
}
