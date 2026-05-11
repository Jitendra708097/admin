/**
 * @module AttendancePage
 * @description Attendance list with filters, date range picker, and export options.
 */
import { useMemo, useState } from 'react';
import { Card, Button, Row, Col, DatePicker, Select, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router';
import axiosInstance from '../../api/axiosInstance.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import AttendanceTable from './AttendanceTable.jsx';
import AttendanceDetail from './AttendanceDetail.jsx';
import ExportModal from './ExportModal.jsx';
import { useGetAttendanceQuery, useGetAttendanceDetailQuery } from '../../store/api/attendanceApi.js';
import { useGetBranchesQuery } from '../../store/api/branchApi.js';
import { useGetEmployeesQuery } from '../../store/api/employeeApi.js';

const STATUS_OPTIONS = [
  { label: 'Present', value: 'present' },
  { label: 'Pending', value: 'pending' },
  { label: 'Absent', value: 'absent' },
  { label: 'Half Day', value: 'half_day' },
  { label: 'Half Day Early', value: 'half_day_early' },
  { label: 'On Leave', value: 'on_leave' },
  { label: 'Incomplete', value: 'incomplete' },
  { label: 'Holiday', value: 'holiday' },
  { label: 'Weekend', value: 'weekend' },
  { label: 'Not Marked', value: 'not_marked' },
];

function getFilenameFromDisposition(headerValue, fallback) {
  const match = /filename="?([^"]+)"?/i.exec(headerValue || '');
  return match ? match[1] : fallback;
}

function getFallbackExportFilename(contentType, baseName) {
  return contentType?.includes('spreadsheetml')
    ? `${baseName}.xlsx`
    : `${baseName}.csv`;
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function AttendancePage() {
  const [searchParams] = useSearchParams();
  const notificationDate = searchParams.get('date');
  const [filters, setFilters] = useState({
    dateRange: notificationDate ? [dayjs(notificationDate), dayjs(notificationDate)] : null,
    branch: searchParams.get('branch') || undefined,
    status: searchParams.get('status') || undefined,
    employeeId: searchParams.get('employeeId') || undefined,
    isLate: searchParams.get('isLate') || undefined,
  });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const { data, isLoading } = useGetAttendanceQuery({
    page: pagination.current,
    limit: pagination.pageSize,
    branch: filters.branch,
    status: filters.status,
    isLate: filters.isLate,
    employeeId: filters.employeeId,
    dateFrom: filters.dateRange?.[0] ? dayjs(filters.dateRange[0]).format('YYYY-MM-DD') : undefined,
    dateTo: filters.dateRange?.[1] ? dayjs(filters.dateRange[1]).format('YYYY-MM-DD') : undefined,
  });
  const { data: attendanceDetail, isLoading: isDetailLoading } = useGetAttendanceDetailQuery(selectedRecord?.id, {
    skip: !selectedRecord?.id || !showDetail || selectedRecord?.isSyntheticNotMarked,
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
  const selectedAttendanceDetail = attendanceDetail
    ? {
        ...attendanceDetail,
        employee: selectedRecord?.employee || null,
      }
    : selectedRecord;

  const handleFilterChange = (nextFilters) => {
    setFilters((current) => ({ ...current, ...nextFilters }));
    setPagination((current) => ({ ...current, current: 1 }));
  };

  const handleExport = async (values) => {
    const [fromDate, toDate] = values.dateRange || [];
    try {
      setExporting(true);
      const response = await axiosInstance.get('/attendance/export', {
        params: {
          branch: values.branch,
          employeeId: values.employeeId,
          status: filters.status,
          dateFrom: fromDate ? dayjs(fromDate).format('YYYY-MM-DD') : undefined,
          dateTo: toDate ? dayjs(toDate).format('YYYY-MM-DD') : undefined,
          format: values.format || 'csv',
        },
        responseType: 'blob',
      });

      downloadBlob(
        response.data,
        getFilenameFromDisposition(
          response.headers['content-disposition'],
          getFallbackExportFilename(response.headers['content-type'], 'attendance-export')
        )
      );
      setShowExport(false);
      message.success('Attendance export downloaded');
    } catch (error) {
      message.error(error.response?.data?.error?.message || 'Attendance export failed');
    } finally {
      setExporting(false);
    }
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
              onChange={(value) => handleFilterChange({ status: value, isLate: undefined })}
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
        data={selectedAttendanceDetail}
        loading={isDetailLoading}
        onClose={() => setShowDetail(false)}
      />

      <ExportModal
        open={showExport}
        loading={exporting}
        onExport={handleExport}
        onCancel={() => setShowExport(false)}
        branchOptions={branchOptions}
        employeeOptions={employeeOptions}
        initialValues={{
          branch: filters.branch,
          employeeId: filters.employeeId,
          dateRange: filters.dateRange,
          format: 'csv',
        }}
      />
    </div>
  );
}
