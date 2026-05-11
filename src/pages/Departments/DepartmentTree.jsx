/**
 * @module DepartmentTree
 * @description Department hierarchy tree.
 */
import { Button, Empty, Popconfirm, Space, Tag, Tooltip, Tree, Typography } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';

function toTreeData(departments, handlers) {
  return (departments || []).map((department) => {
    const employeeCount = department.directEmployeeCount ?? department.employeeCount ?? 0;
    const totalEmployees = department.totalEmployeeCountIncludingChildren ?? employeeCount;
    const childCount = department.childCount ?? department.children?.length ?? 0;
    const canDelete = department.canDelete !== false && employeeCount === 0 && childCount === 0;

    return {
      key: department.id,
      title: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 12 }}>
          <Space size={8} wrap>
            <Typography.Text strong>{department.name}</Typography.Text>
            <Tag icon={<TeamOutlined />} color={employeeCount > 0 ? 'blue' : 'default'}>
              {employeeCount} direct
            </Tag>
            <Tag color={totalEmployees > employeeCount ? 'cyan' : 'default'}>
              {totalEmployees} total
            </Tag>
            <Tag color={childCount > 0 ? 'purple' : 'default'}>{childCount} child</Tag>
            {department.headEmployee ? (
              <Tag icon={<UserOutlined />} color="green">
                {department.headEmployee.name}
              </Tag>
            ) : (
              <Tag color="warning">No head</Tag>
            )}
          </Space>
          <Space onClick={(event) => event.stopPropagation()}>
            <Tooltip title="View details">
              <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handlers.onView(department)} />
            </Tooltip>
            <Tooltip title="Add sub-department">
              <Button type="text" size="small" icon={<PlusOutlined />} onClick={() => handlers.onAdd(department)} />
            </Tooltip>
            <Tooltip title="Edit department">
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handlers.onEdit(department)} />
            </Tooltip>
            <Popconfirm
              title="Delete department?"
              description={
                canDelete
                  ? 'This department will be removed.'
                  : 'Move child departments and reassign employees before deleting.'
              }
              okText="Delete"
              okButtonProps={{ danger: true, disabled: !canDelete }}
              onConfirm={() => {
                if (canDelete) {
                  handlers.onDelete(department.id);
                }
              }}
            >
              <Tooltip title={canDelete ? 'Delete department' : 'Department is in use'}>
                <Button type="text" size="small" danger icon={<DeleteOutlined />} disabled={!canDelete} />
              </Tooltip>
            </Popconfirm>
          </Space>
        </div>
      ),
      children: toTreeData(department.children || [], handlers),
    };
  });
}

export default function DepartmentTree({ data, onAdd, onEdit, onDelete, onView, onCreateFirst }) {
  if (!data || data.length === 0) {
    return (
      <Empty description="No departments yet" className="py-12">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreateFirst}>
          Create First Department
        </Button>
      </Empty>
    );
  }

  return (
    <Tree
      treeData={toTreeData(data, { onAdd, onEdit, onDelete, onView })}
      defaultExpandAll
      blockNode
      showLine
    />
  );
}
