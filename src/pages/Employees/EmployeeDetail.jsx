import { Button, Card, Descriptions, Row, Col, Statistic } from 'antd';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import DeviceExceptionModal from './DeviceExceptionModal.jsx';
import {
  useGetEmployeeDetailQuery,
  useGetEmployeeAttendanceSummaryQuery,
} from '../../store/api/employeeApi.js';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const [showDeviceException, setShowDeviceException] = useState(false);
  const { data: employee } = useGetEmployeeDetailQuery(id);
  const { data: summary } = useGetEmployeeAttendanceSummaryQuery(id);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={employee?.name || 'Employee Profile'}
        subtitle={`Employee ID: ${id}`}
        actions={[
          <Button key="device-exception" onClick={() => setShowDeviceException(true)}>
            Device Exception
          </Button>,
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
