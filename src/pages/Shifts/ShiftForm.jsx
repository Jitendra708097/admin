import { useEffect } from 'react';
import { Drawer, Form, Input, Button, Space, TimePicker, Checkbox, Row, Col, Tooltip, InputNumber } from 'antd';
import dayjs from 'dayjs';

const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

function numberField(name, label, tooltip, required = true) {
  return (
    <Form.Item
      name={name}
      label={<Tooltip title={tooltip}>{label}</Tooltip>}
      rules={required ? [{ required: true, message: `${label} is required` }] : []}
    >
      <InputNumber min={0} style={{ width: '100%' }} />
    </Form.Item>
  );
}

export default function ShiftForm({ open, shift, onClose, onSubmit, loading }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) {
      return;
    }

    if (shift) {
      form.setFieldsValue({
        ...shift,
        startTime: dayjs(shift.startTime, 'HH:mm:ss'),
        endTime: dayjs(shift.endTime, 'HH:mm:ss'),
      });
      return;
    }

    form.setFieldsValue({
      workDays: [1, 2, 3, 4, 5],
      graceCheckIn: 15,
      graceCheckOut: 60,
      halfDayAfter: 240,
      absentAfter: 120,
      otAfter: 480,
      minOtMins: 30,
      breakMins: 60,
      minSessionMins: 30,
      sessionCooldownMins: 15,
      maxSessionsPerDay: 3,
      crossesMidnight: false,
    });
  }, [form, open, shift]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const formattedValues = {
      ...values,
      startTime: values.startTime.format('HH:mm:ss'),
      endTime: values.endTime.format('HH:mm:ss'),
      crossesMidnight: values.crossesMidnight || values.endTime.isBefore(values.startTime),
    };
    onSubmit(formattedValues);
  };

  return (
    <Drawer
      title={shift ? 'Edit Shift' : 'Add Shift'}
      placement="right"
      onClose={onClose}
      open={open}
      width={560}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            Save
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="Shift Name" rules={[{ required: true, message: 'Shift name is required' }]}>
          <Input placeholder="Morning Shift" />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={12}>
            <Form.Item name="startTime" label="Start Time" rules={[{ required: true, message: 'Start time is required' }]}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12}>
            <Form.Item name="endTime" label="End Time" rules={[{ required: true, message: 'End time is required' }]}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="crossesMidnight" valuePropName="checked">
          <Checkbox>Crosses Midnight</Checkbox>
        </Form.Item>

        <Form.Item name="workDays" label="Work Days" rules={[{ required: true, message: 'Select work days' }]}>
          <Checkbox.Group options={DAYS} />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={12}>{numberField('graceCheckIn', 'Grace Check-in', 'Minutes allowed before late check-in is flagged.')}</Col>
          <Col xs={12}>{numberField('graceCheckOut', 'Grace Check-out', 'Minutes allowed after planned end time before forcing checkout.')}</Col>
        </Row>
        <Row gutter={16}>
          <Col xs={12}>{numberField('halfDayAfter', 'Half Day After', 'Worked minutes required before the day counts as present.')}</Col>
          <Col xs={12}>{numberField('absentAfter', 'Absent After', 'Below this worked-minute threshold the employee is absent.')}</Col>
        </Row>
        <Row gutter={16}>
          <Col xs={12}>{numberField('otAfter', 'Overtime After', 'Worked minutes after which overtime becomes eligible.')}</Col>
          <Col xs={12}>{numberField('minOtMins', 'Min Overtime', 'Minimum overtime minutes required before counting overtime.')}</Col>
        </Row>
        <Row gutter={16}>
          <Col xs={12}>{numberField('breakMins', 'Break Minutes', 'Default break duration deducted from the shift.')}</Col>
          <Col xs={12}>{numberField('minSessionMins', 'Min Session Minutes', 'Minimum allowed work session length.')}</Col>
        </Row>
        <Row gutter={16}>
          <Col xs={12}>{numberField('sessionCooldownMins', 'Cooldown Minutes', 'Wait time before another attendance session may begin.')}</Col>
          <Col xs={12}>{numberField('maxSessionsPerDay', 'Max Sessions/Day', 'Maximum number of sessions an employee can open in one day.')}</Col>
        </Row>
      </Form>
    </Drawer>
  );
}
