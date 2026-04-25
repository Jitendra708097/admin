/**
 * @module AttendancePage
 * @description Attendance list with filters, date range picker, and export options.
 */
import { useMemo, useState } from 'react';
import { Card, Button, Row, Col, DatePicker, Select } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import PageHeader from '../../components/common/PageHeader.jsx';
import AttendanceTable from './AttendanceTable.jsx';
import AttendanceDetail from './AttendanceDetail.jsx';
import ExportModal from './ExportModal.jsx';
import { useGetAttendanceQuery } from '../../store/api/attendanceApi.js';
import { useGetBranchesQuery } from '../../store/api/branchApi.js';
import { useGetEmployeesQuery } from '../../store/api/employeeApi.js';

const STATUS_OPTIONS = [
  { label: 'Present', value: 'present' },
  { label: 'Absent', value: 'absent' },
  { label: 'Half Day', value: 'half_day' },
  { label: 'Half Day Early', value: 'half_day_early' },
  { label: 'On Leave', value: 'on_leave' },
  { label: 'Holiday', value: 'holiday' },
  { label: 'Weekend', value: 'weekend' },
  { label: 'Not Marked', value: 'not_marked' },
];

export default function AttendancePage() {
  const [filters, setFilters] = useState({
    dateRange: null,
    branch: undefined,
    status: undefined,
    employeeId: undefined,
  });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const { data, isLoading } = useGetAttendanceQuery({
    page: pagination.current,
    limit: pagination.pageSize,
    branch: filters.branch,
    status: filters.status,
    employeeId: filters.employeeId,
    dateFrom: filters.dateRange?.[0] ? dayjs(filters.dateRange[0]).format('YYYY-MM-DD') : undefined,
    dateTo: filters.dateRange?.[1] ? dayjs(filters.dateRange[1]).format('YYYY-MM-DD') : undefined,
  });
  const { data: branches } = useGetBranchesQuery();
  const { data: employeesData } = useGetEmployeesQuery({ limit: 100 });

  const branchOptions = useMemo(
    () => branches?.branches?.map((branch) => ({ label: branch.name, value: branch.id })) || [],
    [branches]
  );
  const employeeOptions = useMemo(
    () =>
      employeesData?.employees?.map((employee) => ({
        label: `${employee.name} (${employee.empCode || employee.email})`,
        value: employee.id,
      })) || [],
    [employeesData]
  );

  const handleFilterChange = (nextFilters) => {
    setFilters((current) => ({ ...current, ...nextFilters }));
    setPagination((current) => ({ ...current, current: 1 }));
  };

  const handleExport = (values) => {
    console.log('Exporting with:', values);
    setShowExport(false);
  };

  const actions = [
    <Button key="export" icon={<DownloadOutlined />} onClick={() => setShowExport(true)}>
      Export
    </Button>,
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        subtitle="View and manage employee attendance records"
        actions={actions}
      />

      <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              value={filters.dateRange}
              onChange={(value) => handleFilterChange({ dateRange: value })}
              placeholder={['From', 'To']}
              allowClear
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              placeholder="Branch"
              style={{ width: '100%' }}
              allowClear
              showSearch
              optionFilterProp="label"
              value={filters.branch}
              onChange={(value) => handleFilterChange({ branch: value })}
              options={branchOptions}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              placeholder="Status"
              style={{ width: '100%' }}
              allowClear
              value={filters.status}
              onChange={(value) => handleFilterChange({ status: value })}
              options={STATUS_OPTIONS}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              placeholder="Employee"
              style={{ width: '100%' }}
              allowClear
              showSearch
              optionFilterProp="label"
              value={filters.employeeId}
              onChange={(value) => handleFilterChange({ employeeId: value })}
              options={employeeOptions}
            />
          </Col>
        </Row>
      </div>

      <Card className="bg-white shadow border border-gray-100">
        <AttendanceTable
          data={data?.attendance || []}
          loading={isLoading}
          onViewDetail={(record) => {
            setSelectedRecord(record);
            setShowDetail(true);
          }}
          onFlagAnomaly={(record) => console.log('Flag anomaly:', record)}
          pagination={{
            current: data?.pagination?.page || pagination.current,
            pageSize: data?.pagination?.limit || pagination.pageSize,
            total: data?.pagination?.count || 0,
            showSizeChanger: true,
          }}
          onPaginationChange={(nextPagination) =>
            setPagination({
              current: nextPagination.current,
              pageSize: nextPagination.pageSize,
            })
          }
        />
      </Card>

      <AttendanceDetail
        open={showDetail}
        data={selectedRecord}
        onClose={() => setShowDetail(false)}
      />

      <ExportModal
        open={showExport}
        loading={false}
        onExport={handleExport}
        onCancel={() => setShowExport(false)}
      />
    </div>
  );
}
