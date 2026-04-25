/**
 * @module DepartmentTree
 * @description Department hierarchy tree.
 */
import { Button, Empty, Space, Tree } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

function toTreeData(departments, onAdd, onEdit, onDelete) {
  return (departments || []).map((department) => ({
    key: department.id,
    title: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 12 }}>
        <span>
          {department.name} ({department.employeeCount || 0} employees)
        </span>
        <Space onClick={(event) => event.stopPropagation()}>
          <Button type="text" size="small" icon={<PlusOutlined />} onClick={() => onAdd(department)} />
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(department)} />
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(department.id)} />
        </Space>
      </div>
    ),
    children: toTreeData(department.children || [], onAdd, onEdit, onDelete),
  }));
}

export default function DepartmentTree({ data, onAdd, onEdit, onDelete }) {
  if (!data || data.length === 0) {
    return <Empty description="No departments yet" className="py-12" />;
  }

  return <Tree treeData={toTreeData(data, onAdd, onEdit, onDelete)} defaultExpandAll blockNode />;
}
