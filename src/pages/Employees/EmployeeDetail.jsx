import { Button, Card, Col, Descriptions, Empty, Image, List, Popconfirm, Row, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import PageHeader from '../../components/common/PageHeader.jsx';
import DeviceExceptionModal from './DeviceExceptionModal.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { useGetAttendanceQuery } from '../../store/api/attendanceApi.js';
import { useGetDeviceExceptionsQuery } from '../../store/api/deviceExceptionApi.js';
import {
  useGetEmployeeDetailQuery,
  useGetEmployeeAttendanceSummaryQuery,
  useGetEmployeeFaceStatusQuery,
  useResetEmployeeFaceEnrollmentMutation,
} from '../../store/api/employeeApi.js';
import { useGetLeavesQuery } from '../../store/api/leaveApi.js';
import { formatDateTime, formatDuration } from '../../utils/formatters.js';

const LEAVE_TYPES = ['annual', 'sick', 'casual', 'earned', 'optional'];

function formatMaybeDateTime(value) {
  return value ? formatDateTime(value) : '-';
}

function getAttendancePercent(summary) {
  const total = Number(summary?.total || 0);
  if (!total) {
    return 0;
  }

  return Math.round((Number(summary?.present || 0) / total) * 100);
}

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const [showDeviceException, setShowDeviceException] = useState(false);
  const { data: employee } = useGetEmployeeDetailQuery(id);
  const { data: summary } = useGetEmployeeAttendanceSummaryQuery(id);
  const { data: faceStatus } = useGetEmployeeFaceStatusQuery(id);
  const { data: attendanceData, isLoading: attendanceLoading } = useGetAttendanceQuery({
    employeeId: id,
    page: 1,
    limit: 10,
  });
  const { data: leavesData, isLoading: leavesLoading } = useGetLeavesQuery({
    employeeId: id,
    page: 1,
    limit: 8,
  });
  const { data: deviceExceptionsData, isLoading: deviceExceptionsLoading } = useGetDeviceExceptionsQuery({
    empId: id,
  });
  const [resetFaceEnrollment, { isLoading: isResettingFace }] = useResetEmployeeFaceEnrollmentMutation();

  const handleResetFace = async () => {
    try {
      await resetFaceEnrollment(id).unwrap();
      message.success('Face enrollment reset. Employee must enroll again.');
    } catch (error) {
      message.error(error?.data?.error?.message || 'Unable to reset face enrollment.');
    }
  };

  const faceStatusColor =
    faceStatus?.status === 'enrolled'
      ? 'green'
      : faceStatus?.status === 'pending'
        ? 'gold'
        : faceStatus?.status === 'failed'
          ? 'red'
          : 'default';
  const attendanceRows = attendanceData?.attendance || [];
  const leaveRows = leavesData?.leaves || [];
  const deviceExceptions = deviceExceptionsData?.exceptions || [];
  const leaveBalance = employee?.leaveBalance || {};
  const registeredFaceUrl = faceStatus?.registeredFaceUrl || employee?.registeredFaceUrl || null;
  const latestAttendance = attendanceRows[0] || null;
  const pendingLeaves = leaveRows.filter((leave) => leave.status === 'pending').length;
  const pendingDeviceExceptions = deviceExceptions.filter((exception) => exception.status === 'pending').length;
  const attendancePercent = getAttendancePercent(summary);

  const attendanceColumns = useMemo(() => [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (value) => (value ? dayjs(value).format('DD MMM YYYY') : '-'),
    },
    {
      title: 'In',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      render: (value) => (value ? dayjs(value).format('HH:mm') : '-'),
    },
    {
      title: 'Out',
      dataIndex: 'checkOutTime',
      key: 'checkOutTime',
      render: (value) => (value ? dayjs(value).format('HH:mm') : '-'),
    },
    {
      title: 'Worked',
      dataIndex: 'totalWorkedMins',
      key: 'totalWorkedMins',
      render: (value) => formatDuration(Number(value || 0)),
    },
    {
      title: 'Sessions',
      dataIndex: 'sessionsToday',
      key: 'sessionsToday',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      title: 'Flags',
      key: 'flags',
      render: (_, record) => (
        <Space wrap>
          {record.isLate ? <Tag color="gold">Late</Tag> : null}
          {record.isAnomaly ? <Tag color="red">Anomaly</Tag> : null}
          {!record.isLate && !record.isAnomaly ? '-' : null}
        </Space>
      ),
    },
  ], []);

  const leaveColumns = useMemo(() => [
    {
      title: 'Type',
      dataIndex: 'leaveType',
      key: 'leaveType',
      render: (value) => <Tag>{String(value || '-').toUpperCase()}</Tag>,
    },
    { title: 'From', dataIndex: 'fromDate', key: 'fromDate' },
    { title: 'To', dataIndex: 'toDate', key: 'toDate' },
    { title: 'Days', dataIndex: 'days', key: 'days', width: 80 },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
    },
  ], []);

  return (
    <div className="min-h-screen bg-gray-50 space-y-6">
      <PageHeader
        title={employee?.name || 'Employee Profile'}
        subtitle={`${employee?.empCode || 'Employee'} - ${employee?.branchName || 'No branch'}`}
        actions={[
          <Button key="device-exception" onClick={() => setShowDeviceException(true)}>
            Device Exception
          </Button>,
          <Popconfirm
            key="reset-face"
            title="Reset face enrollment?"
            description="The employee will need to complete face enrollment again before attendance use."
            okText="Reset"
            cancelText="Cancel"
            onConfirm={handleResetFace}
            disabled={!faceStatus?.enrolled}
          >
            <Button danger disabled={!faceStatus?.enrolled} loading={isResettingFace}>
              Reset Face Enrollment
            </Button>
          </Popconfirm>,
        ]}
      />

      <Row gutter={[16, 16]} className="mx-6">
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false}>
            <Statistic title="Attendance %" value={attendancePercent} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false}>
            <Statistic title="Present Days" value={summary?.present || 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false}>
            <Statistic title="Absent Days" value={summary?.absent || 0} valueStyle={{ color: '#dc2626' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false}>
            <Statistic title="Pending Items" value={pendingLeaves + pendingDeviceExceptions} />
          </Card>
        </Col>
      </Row>

      <Card className="mx-6" bordered={false}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Email">{employee?.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">{employee?.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="Emp Code">{employee?.empCode}</Descriptions.Item>
          <Descriptions.Item label="Status"><StatusBadge status={employee?.status || 'inactive'} /></Descriptions.Item>
          <Descriptions.Item label="Branch">{employee?.branchName}</Descriptions.Item>
          <Descriptions.Item label="Department">{employee?.departmentName || '-'}</Descriptions.Item>
          <Descriptions.Item label="Shift">{employee?.shiftName}</Descriptions.Item>
          <Descriptions.Item label="Role">{employee?.role}</Descriptions.Item>
          <Descriptions.Item label="Password Setup">
            {employee?.requiresPasswordChange ? <Tag color="gold">Pending</Tag> : <Tag color="green">Completed</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="Employee ID">{id}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={[16, 16]} className="mx-6">
        <Col xs={24} lg={10}>
          <Card title="Face Enrollment" bordered={false}>
            <div className="mb-4 flex justify-center">
              {registeredFaceUrl ? (
                <Image
                  src={registeredFaceUrl}
                  alt="Registered employee face"
                  width={160}
                  height={160}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 text-center text-sm text-gray-500">
                  No registered face photo
                </div>
              )}
            </div>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Status">
                <Tag color={faceStatusColor}>{faceStatus?.status || 'not_enrolled'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Employee Enrolled Face">
                {faceStatus?.enrolled || employee?.faceEnrolled ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Cloud Face ID">{faceStatus?.faceId || '-'}</Descriptions.Item>
              <Descriptions.Item label="Local Embedding">
                {faceStatus?.localEmbeddingAvailable ? <Tag color="green">Available</Tag> : <Tag>Missing</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Status Updated">{formatMaybeDateTime(faceStatus?.updatedAt)}</Descriptions.Item>
            </Descriptions>
            {!faceStatus?.enrolled && !employee?.faceEnrolled ? (
              <Typography.Text type="danger">
                Face is not enrolled. This employee cannot use kiosk or face attendance until enrollment is complete.
              </Typography.Text>
            ) : null}
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title="Today / Latest Attendance" bordered={false}>
            {latestAttendance ? (
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Date">{dayjs(latestAttendance.date).format('DD MMM YYYY')}</Descriptions.Item>
                <Descriptions.Item label="Status"><StatusBadge status={latestAttendance.status} /></Descriptions.Item>
                <Descriptions.Item label="Check In">{latestAttendance.checkInTime ? dayjs(latestAttendance.checkInTime).format('HH:mm') : '-'}</Descriptions.Item>
                <Descriptions.Item label="Check Out">{latestAttendance.checkOutTime ? dayjs(latestAttendance.checkOutTime).format('HH:mm') : '-'}</Descriptions.Item>
                <Descriptions.Item label="Worked">{formatDuration(Number(latestAttendance.totalWorkedMins || 0))}</Descriptions.Item>
                <Descriptions.Item label="Sessions">{latestAttendance.sessionsToday || 0}</Descriptions.Item>
              </Descriptions>
            ) : (
              <Empty description="No attendance yet" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mx-6">
        <Col xs={24} lg={10}>
          <Card
            title="Leave Balance"
            bordered={false}
            extra={<Link to={`/leaves?employeeId=${id}`}>View leaves</Link>}
          >
            <Row gutter={[12, 12]}>
              {LEAVE_TYPES.map((type) => (
                <Col xs={12} sm={8} key={type}>
                  <Statistic title={`${type.charAt(0).toUpperCase()}${type.slice(1)}`} value={Number(leaveBalance[type] || 0)} />
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title="Device Status"
            bordered={false}
            extra={<Link to={`/device-exceptions?empId=${id}`}>View device requests</Link>}
          >
            {deviceExceptions.length > 0 ? (
              <List
                loading={deviceExceptionsLoading}
                dataSource={deviceExceptions.slice(0, 4)}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Typography.Text strong>{item.tempDeviceId || 'Temporary device'}</Typography.Text>
                          <StatusBadge status={item.status} />
                        </Space>
                      }
                      description={`${item.reason || 'No reason'} - ${formatMaybeDateTime(item.createdAt)}`}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No device exception history" />
            )}
          </Card>
        </Col>
      </Row>

      <Card className="mx-6" title="Recent Attendance" bordered={false}>
        <Table
          columns={attendanceColumns}
          dataSource={attendanceRows}
          loading={attendanceLoading}
          rowKey="id"
          pagination={false}
          scroll={{ x: 900 }}
          size="small"
        />
      </Card>

      <Card className="mx-6 mb-6" title="Recent Leave Requests" bordered={false}>
        <Table
          columns={leaveColumns}
          dataSource={leaveRows}
          loading={leavesLoading}
          rowKey="id"
          pagination={false}
          scroll={{ x: 760 }}
          size="small"
        />
      </Card>

      <DeviceExceptionModal
        open={showDeviceException}
        employee={employee}
        onClose={() => setShowDeviceException(false)}
      />
    </div>
  );
}
