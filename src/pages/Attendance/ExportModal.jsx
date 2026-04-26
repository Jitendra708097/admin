/**
 * @module ExportModal
 * @description Modal for exporting attendance to CSV.
 */
import { Modal, Form, Button, Space, DatePicker, Select, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

export default function ExportModal({
  open,
  loading,
  onExport,
  onCancel,
  branchOptions = [],
  employeeOptions = [],
  initialValues = {},
}) {
  const [form] = Form.useForm();

  const handleExport = async () => {
    try {
      const values = await form.validateFields();
      await onExport(values);
    } catch (error) {
      if (!error?.errorFields) {
        message.error(error?.message || 'Export failed');
      }
    }
  };

  return (
    <Modal
      title="Export Attendance"
      open={open}
      onCancel={onCancel}
      width={500}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="export" type="primary" loading={loading} onClick={handleExport} icon={<DownloadOutlined />}>
          Export CSV
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        key={open ? 'open' : 'closed'}
      >
        <Form.Item
          name="dateRange"
          label="Date Range"
          rules={[{ required: true, message: 'Select date range' }]}
        >
          <DatePicker.RangePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="branch" label="Branch">
          <Select placeholder="All branches" options={branchOptions} allowClear showSearch optionFilterProp="label" />
        </Form.Item>

        <Form.Item name="employeeId" label="Employee">
          <Select placeholder="All employees" options={employeeOptions} allowClear showSearch optionFilterProp="label" />
        </Form.Item>

        <Form.Item name="format" label="Format" initialValue="csv">
          <Select options={[{ label: 'CSV', value: 'csv' }, { label: 'Excel', value: 'xlsx' }]} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
