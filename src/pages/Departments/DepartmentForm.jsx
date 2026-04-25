/**
 * @module DepartmentForm
 * @description Form to create/edit departments.
 */
import { Form, Input, Modal, Select } from 'antd';
import { useEffect, useMemo } from 'react';

function flattenDepartments(departments = [], level = 0) {
  return departments.flatMap((department) => [
    {
      label: `${'-- '.repeat(level)}${department.name}`,
      value: department.id,
    },
    ...flattenDepartments(department.children || [], level + 1),
  ]);
}

export default function DepartmentForm({ open, department, departments, onClose, onSubmit, loading }) {
  const [form] = Form.useForm();
  const parentOptions = useMemo(() => flattenDepartments(departments), [departments]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (department) {
      form.setFieldsValue({
        name: department.name || '',
        parentId: department.parentId || undefined,
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
      title={department ? 'Edit Department' : 'Add Department'}
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
          <Input />
        </Form.Item>
        <Form.Item name="parentId" label="Parent Department">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            options={parentOptions.filter((option) => option.value !== department?.id)}
            placeholder="Top level department"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
