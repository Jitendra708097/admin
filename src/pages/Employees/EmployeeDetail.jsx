import { Button, Card, Descriptions, Row, Col, Statistic, Tag, message, Popconfirm } from 'antd';
import { useState } from 'react';
import { useParams } from 'react-router';
import PageHeader from '../../components/common/PageHeader.jsx';
import DeviceExceptionModal from './DeviceExceptionModal.jsx';
import {
  useGetEmployeeDetailQuery,
  useGetEmployeeAttendanceSummaryQuery,
  useGetEmployeeFaceStatusQuery,
  useResetEmployeeFaceEnrollmentMutation,
} from '../../store/api/employeeApi.js';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const [showDeviceException, setShowDeviceException] = useState(false);
  const { data: employee } = useGetEmployeeDetailQuery(id);
  const { data: summary } = useGetEmployeeAttendanceSummaryQuery(id);
  const { data: faceStatus } = useGetEmployeeFaceStatusQuery(id);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={employee?.name || 'Employee Profile'}
        subtitle={`Employee ID: ${id}`}
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
      <Card className="m-6">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Email">{employee?.email}</Descriptions.Item>
          <Descriptions.Item label="Emp Code">{employee?.empCode}</Descriptions.Item>
          <Descriptions.Item label="Branch">{employee?.branchName}</Descriptions.Item>
          <Descriptions.Item label="Department">{employee?.departmentName || '-'}</Descriptions.Item>
          <Descriptions.Item label="Shift">{employee?.shiftName}</Descriptions.Item>
          <Descriptions.Item label="Role">{employee?.role}</Descriptions.Item>
          <Descriptions.Item label="Face Status">
            <Tag color={faceStatusColor}>{faceStatus?.status || 'not_enrolled'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Face Enrolled">{faceStatus?.enrolled ? 'Yes' : 'No'}</Descriptions.Item>
        </Descriptions>

        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={8}>
            <Statistic title="Total Days" value={summary?.total || 0} />
          </Col>
          <Col span={8}>
            <Statistic title="Present" value={summary?.present || 0} />
          </Col>
          <Col span={8}>
            <Statistic title="Absent" value={summary?.absent || 0} />
          </Col>
        </Row>
      </Card>

      <DeviceExceptionModal
        open={showDeviceException}
        employee={employee}
        onClose={() => setShowDeviceException(false)}
      />
    </div>
  );
}
