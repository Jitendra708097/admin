/**
 * @module HolidayForm
 * @description Form to create/edit holidays.
 */
import { Checkbox, DatePicker, Form, Input, Modal, Select } from 'antd';
import { useEffect } from 'react';
import dayjs from 'dayjs';

export default function HolidayForm({ open, holiday, branches = [], onClose, onSubmit, loading }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && holiday) {
      form.setFieldsValue({
        ...holiday,
        date: dayjs(holiday.date),
        branchId: holiday.branchId || null,
      });
    } else if (open) {
      form.resetFields();
      form.setFieldsValue({ branchId: null, isRecurring: false });
    }
  }, [holiday, form, open]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await onSubmit({
      ...values,
      branchId: values.branchId || null,
      date: values.date.format('YYYY-MM-DD'),
      isRecurring: Boolean(values.isRecurring),
    });
  };

  return (
    <Modal
      title={holiday ? 'Edit Holiday' : 'Add Holiday'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Holiday Name"
          rules={[{ required: true }]}
        >
          <Input placeholder="Example: Republic Day" />
        </Form.Item>
        <Form.Item
          name="date"
          label="Date"
          rules={[{ required: true }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="branchId" label="Scope">
          <Select
            allowClear
            placeholder="All branches"
            options={[
              { label: 'All branches', value: null },
              ...branches.map((branch) => ({ label: branch.name, value: branch.id })),
            ]}
          />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} placeholder="Optional note for admins" />
        </Form.Item>
        <Form.Item name="isRecurring" valuePropName="checked">
          <Checkbox>Repeats every year</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}
