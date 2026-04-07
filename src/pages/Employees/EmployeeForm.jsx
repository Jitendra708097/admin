/**
 * @module EmployeeForm
 * @description Create/edit employee drawer form.
 */
import { useEffect } from 'react';
import { Button, Divider, Drawer, Form, Input, Select, Space, Typography } from 'antd';
import { useGetBranchesQuery } from '../../store/api/branchApi.js';
import { useGetShiftsQuery } from '../../store/api/shiftApi.js';
import { useGetDepartmentsQuery } from '../../store/api/departmentApi.js';

const ROLES = [
  { label: 'Employee', value: 'employee' },
  { label: 'Manager', value: 'manager' },
  { label: 'Admin', value: 'admin' },
];

export default function EmployeeForm({ open, employee, onClose, onSubmit, loading }) {
  const [form] = Form.useForm();
  const { data: branches } = useGetBranchesQuery();
  const { data: shifts } = useGetShiftsQuery();
  const { data: departments } = useGetDepartmentsQuery();

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue(employee || { role: 'employee' });
  }, [employee, form, open]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
    } catch (error) {
      return error;
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      title={employee ? 'Edit Employee' : 'Add Employee'}
      placement="right"
      onClose={handleClose}
      open={open}
      width={560}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            Save
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ role: 'employee' }}
      >
        <Typography.Title level={5} style={{ marginBottom: 4 }}>
          Basic details
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
          Start with the employee profile and login email. A temporary password will be generated automatically.
        </Typography.Paragraph>

        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
          <Input size="large" placeholder="Employee name" />
        </Form.Item>

        <Form.Item name="email" label="Work Email" rules={[{ required: true, type: 'email', message: 'Enter a valid email address' }]}>
          <Input size="large" placeholder="employee@company.com" />
        </Form.Item>

        <Form.Item name="phone" label="Phone">
          <Input size="large" placeholder="+91 90000 00000" />
        </Form.Item>

        <Form.Item name="empCode" label="Employee Code">
          <Input size="large" placeholder="Leave blank to auto-generate" />
        </Form.Item>

        <Divider style={{ margin: '8px 0 20px' }} />
        <Typography.Title level={5} style={{ marginBottom: 4 }}>
          Access and reporting
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
          Assign the right role, branch, shift, and optional department to place the employee correctly in reports and attendance flows.
        </Typography.Paragraph>

        <Form.Item name="role" label="Role" rules={[{ required: true }]}>
          <Select size="large" options={ROLES} />
        </Form.Item>

        <Form.Item name="branchId" label="Branch" rules={[{ required: true }]}>
          <Select
            size="large"
            placeholder="Select branch"
            showSearch
            optionFilterProp="label"
            options={branches?.branches?.map((b) => ({ label: b.name, value: b.id })) || []}
          />
        </Form.Item>

        <Form.Item name="shiftId" label="Shift" rules={[{ required: true }]}>
          <Select
            size="large"
            placeholder="Select shift"
            showSearch
            optionFilterProp="label"
            options={shifts?.shifts?.map((s) => ({ label: s.name, value: s.id })) || []}
          />
        </Form.Item>

        <Form.Item name="departmentId" label="Department">
          <Select
            size="large"
            placeholder="Select department"
            allowClear
            showSearch
            optionFilterProp="label"
            options={departments?.departments?.map((d) => ({ label: d.name, value: d.id })) || []}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
