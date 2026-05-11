/**
 * @module DepartmentForm
 * @description Form to create/edit departments.
 */
import { Form, Input, Modal, Select } from 'antd';
import { useEffect, useMemo } from 'react';

function flattenDepartments(departments = [], level = 0, blockedIds = new Set()) {
  return departments.flatMap((department) => {
    const isBlocked = blockedIds.has(department.id);
    const current = isBlocked
      ? []
      : [
          {
            label: `${'-- '.repeat(level)}${department.name}`,
            value: department.id,
          },
        ];

    return [
      ...current,
      ...flattenDepartments(department.children || [], level + 1, blockedIds),
    ];
  });
}

function collectDescendantIds(department) {
  const ids = new Set();

  function visit(node) {
    (node?.children || []).forEach((child) => {
      ids.add(child.id);
      visit(child);
    });
  }

  visit(department);
  return ids;
}

export default function DepartmentForm({
  open,
  department,
  departments,
  employees,
  onClose,
  onSubmit,
  loading,
}) {
  const [form] = Form.useForm();
  const blockedParentIds = useMemo(() => {
    const ids = new Set();
    if (department?.id) {
      ids.add(department.id);
      collectDescendantIds(department).forEach((id) => ids.add(id));
    }
    return ids;
  }, [department]);
  const parentOptions = useMemo(
    () => flattenDepartments(departments, 0, blockedParentIds),
    [blockedParentIds, departments]
  );
  const employeeOptions = useMemo(
    () =>
      (employees || []).map((employee) => ({
        label: `${employee.name}${employee.empCode ? ` (${employee.empCode})` : ''}`,
        value: employee.id,
      })),
    [employees]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (department) {
      form.setFieldsValue({
        name: department.name || '',
        parentId: department.parentId || undefined,
        headEmpId: department.headEmpId || undefined,
      });
    } else {
      form.resetFields();
    }
  }, [department, form, open]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
    } catch (error) {
      return error;
    }
  };

  return (
    <Modal
      title={department?.id ? 'Edit Department' : 'Add Department'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Department Name"
          rules={[{ required: true, message: 'Please enter department name' }]}
        >
          <Input placeholder="Department name" />
        </Form.Item>
        <Form.Item name="parentId" label="Parent Department">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            options={parentOptions}
            placeholder="Top level department"
          />
        </Form.Item>
        <Form.Item name="headEmpId" label="Department Head">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            options={employeeOptions}
            placeholder="Select department head"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
