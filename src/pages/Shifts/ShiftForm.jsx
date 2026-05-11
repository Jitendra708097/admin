import { useEffect, useMemo } from 'react';
import { Alert, Button, Checkbox, Col, Drawer, Form, Input, InputNumber, Row, Space, TimePicker, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);

const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

const DEFAULT_SHIFT = {
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
};

function numberField(name, label, tooltip, min = 0) {
  return (
    <Form.Item
      name={name}
      label={<Tooltip title={tooltip}>{label}</Tooltip>}
      rules={[{ required: true, message: `${label} is required` }]}
    >
      <InputNumber min={min} style={{ width: '100%' }} />
    </Form.Item>
  );
}

function parseTime(value) {
  if (!value) {
    return null;
  }

  if (dayjs.isDayjs(value)) {
    return value;
  }

  return dayjs(value, ['HH:mm:ss', 'HH:mm']);
}

function getShiftMinutes(startTime, endTime, crossesMidnight) {
  const start = parseTime(startTime);
  let end = parseTime(endTime);

  if (!start?.isValid() || !end?.isValid()) {
    return 0;
  }

  if (crossesMidnight || end.isBefore(start)) {
    end = end.add(1, 'day');
  }

  return Math.max(end.diff(start, 'minute'), 0);
}

function formatDuration(minutes) {
  const total = Number(minutes || 0);
  return `${Math.floor(total / 60)}h ${total % 60}m`;
}

function addMinutes(time, minutes) {
  const value = parseTime(time);
  return value?.isValid() ? value.add(Number(minutes || 0), 'minute').format('HH:mm') : '-';
}

export default function ShiftForm({ open, shift, initialValues, onClose, onSubmit, loading }) {
  const [form] = Form.useForm();
  const values = Form.useWatch([], form) || {};
  const shiftMinutes = getShiftMinutes(values.startTime, values.endTime, values.crossesMidnight);
  const expectedWorkMinutes = Math.max(shiftMinutes - Number(values.breakMins || 0), 0);
  const autoCrossesMidnight = values.startTime && values.endTime && parseTime(values.endTime)?.isBefore(parseTime(values.startTime));

  useEffect(() => {
    if (!open) {
      return;
    }

    const source = shift || initialValues;
    if (source) {
      form.setFieldsValue({
        ...DEFAULT_SHIFT,
        ...source,
        startTime: parseTime(source.startTime),
        endTime: parseTime(source.endTime),
      });
      return;
    }

    form.setFieldsValue(DEFAULT_SHIFT);
  }, [form, initialValues, open, shift]);

  useEffect(() => {
    if (open && autoCrossesMidnight && !values.crossesMidnight) {
      form.setFieldValue('crossesMidnight', true);
    }
  }, [autoCrossesMidnight, form, open, values.crossesMidnight]);

  const thresholdSummary = useMemo(() => {
    if (!values.startTime || !values.endTime) {
      return null;
    }

    return {
      duration: formatDuration(shiftMinutes),
      expectedWork: formatDuration(expectedWorkMinutes),
      lateAfter: addMinutes(values.startTime, values.graceCheckIn),
      checkoutGrace: `${values.graceCheckOut || 0}m`,
    };
  }, [expectedWorkMinutes, shiftMinutes, values.endTime, values.graceCheckIn, values.graceCheckOut, values.startTime]);

  const handleSubmit = async () => {
    const nextValues = await form.validateFields();
    const duration = getShiftMinutes(nextValues.startTime, nextValues.endTime, nextValues.crossesMidnight);

    if (Number(nextValues.absentAfter) > Number(nextValues.halfDayAfter)) {
      form.setFields([{ name: 'absentAfter', errors: ['Absent Below must be less than or equal to Present After.'] }]);
      return;
    }

    if (Number(nextValues.halfDayAfter) > Number(nextValues.otAfter)) {
      form.setFields([{ name: 'halfDayAfter', errors: ['Present After must be less than or equal to Overtime After.'] }]);
      return;
    }

    if (Number(nextValues.minSessionMins) > duration) {
      form.setFields([{ name: 'minSessionMins', errors: ['Minimum session cannot exceed shift duration.'] }]);
      return;
    }

    const formattedValues = {
      ...nextValues,
      startTime: nextValues.startTime.format('HH:mm:ss'),
      endTime: nextValues.endTime.format('HH:mm:ss'),
      crossesMidnight: Boolean(nextValues.crossesMidnight || nextValues.endTime.isBefore(nextValues.startTime)),
    };
    await onSubmit(formattedValues);
  };

  return (
    <Drawer
      title={shift ? 'Edit Shift' : 'Add Shift'}
      placement="right"
      onClose={onClose}
      open={open}
      width={620}
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
          <Checkbox>Crosses midnight</Checkbox>
        </Form.Item>

        {thresholdSummary ? (
          <Alert
            type="info"
            showIcon
            className="mb-4"
            message="Shift preview"
            description={
              <Space direction="vertical" size={2}>
                <Typography.Text>Duration: {thresholdSummary.duration}; expected work after break: {thresholdSummary.expectedWork}</Typography.Text>
                <Typography.Text>Late after {thresholdSummary.lateAfter}; checkout grace {thresholdSummary.checkoutGrace}</Typography.Text>
              </Space>
            }
          />
        ) : null}

        <Form.Item name="workDays" label="Work Days" rules={[{ required: true, message: 'Select work days' }]}>
          <Checkbox.Group options={DAYS} />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={12}>{numberField('graceCheckIn', 'Late grace', 'Minutes after start time before late is flagged.')}</Col>
          <Col xs={12}>{numberField('graceCheckOut', 'Checkout grace', 'Minutes after planned end time before incomplete checkout handling.')}</Col>
        </Row>
        <Row gutter={16}>
          <Col xs={12}>{numberField('halfDayAfter', 'Present after', 'Worked minutes required before the day counts as present.')}</Col>
          <Col xs={12}>{numberField('absentAfter', 'Absent below', 'Below this worked-minute threshold the employee is absent.')}</Col>
        </Row>
        <Row gutter={16}>
          <Col xs={12}>{numberField('otAfter', 'Overtime after', 'Worked minutes after which overtime becomes eligible.')}</Col>
          <Col xs={12}>{numberField('minOtMins', 'Minimum overtime', 'Minimum overtime minutes required before counting overtime.')}</Col>
        </Row>
        <Row gutter={16}>
          <Col xs={12}>{numberField('breakMins', 'Break minutes', 'Default break duration deducted from the shift.')}</Col>
          <Col xs={12}>{numberField('minSessionMins', 'Minimum session', 'Minimum allowed work session length.')}</Col>
        </Row>
        <Row gutter={16}>
          <Col xs={12}>{numberField('sessionCooldownMins', 'Session cooldown', 'Wait time before another attendance session may begin.')}</Col>
          <Col xs={12}>{numberField('maxSessionsPerDay', 'Max sessions/day', 'Maximum number of sessions an employee can open in one day.', 1)}</Col>
        </Row>
      </Form>
    </Drawer>
  );
}
