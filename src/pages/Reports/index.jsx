/**
 * @module ReportsPage
 * @description Report generation and download.
 */
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Alert, Button, Card, Col, DatePicker, Form, Popconfirm, Row, Select, Space, Table, message } from 'antd';
import { CloseCircleOutlined, DeleteOutlined, DownloadOutlined, FileExcelOutlined, ReloadOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader.jsx';
import ReportJobStatus from './ReportJobStatus.jsx';
import {
  useGenerateReportMutation,
  useCancelReportJobMutation,
  useDeleteReportJobMutation,
  useGetReportJobStatusQuery,
  useGetReportJobsQuery,
  useLazyDownloadReportQuery,
} from '../../store/api/reportApi.js';
import { useGetBranchesQuery } from '../../store/api/branchApi.js';
import { useGetDepartmentsQuery } from '../../store/api/departmentApi.js';
import { useGetEmployeesQuery } from '../../store/api/employeeApi.js';
import { parseApiError } from '../../utils/errorHandler.js';
import { formatDateTime } from '../../utils/formatters.js';

const { RangePicker } = DatePicker;

const REPORT_TYPES = [
  { label: 'Attendance Detail', value: 'attendance' },
  { label: 'Monthly Summary', value: 'monthly_summary' },
  { label: 'Employee-wise Attendance', value: 'employee' },
  { label: 'Late Coming', value: 'late' },
  { label: 'Absent', value: 'absent' },
  { label: 'Leave', value: 'leave' },
  { label: 'Overtime', value: 'overtime' },
  { label: 'Payroll Export', value: 'payroll' },
];

const STATUS_OPTIONS = [
  'pending',
  'present',
  'absent',
  'half_day',
  'half_day_early',
  'on_leave',
  'holiday',
  'weekend',
  'incomplete',
  'not_marked',
  'regularisation_pending',
].map((value) => ({ label: value.replace(/_/g, ' '), value }));

function getRows(data, key) {
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.[key])) {
    return data[key];
  }
  if (Array.isArray(data?.rows)) {
    return data.rows;
  }
  return [];
}

export default function ReportsPage() {
  const [form] = Form.useForm();
  const [jobId, setJobId] = useState(null);
  const [generateReport, { isLoading: isGenerating }] = useGenerateReportMutation();
  const [downloadReport, { isLoading: isDownloading }] = useLazyDownloadReportQuery();
  const [cancelReportJob, { isLoading: isCancelling }] = useCancelReportJobMutation();
  const [deleteReportJob, { isLoading: isDeleting }] = useDeleteReportJobMutation();
  const { data: branchData } = useGetBranchesQuery();
  const { data: departmentData } = useGetDepartmentsQuery();
  const { data: employeeData } = useGetEmployeesQuery({ limit: 500 });
  const { data: jobsData, refetch: refetchJobs } = useGetReportJobsQuery();
  const { data: jobStatus } = useGetReportJobStatusQuery(jobId || '', {
    skip: !jobId,
    pollingInterval: jobId ? 2500 : 0,
  });

  const branches = useMemo(() => getRows(branchData, 'branches'), [branchData]);
  const departments = useMemo(() => getRows(departmentData, 'departments'), [departmentData]);
  const employees = useMemo(() => getRows(employeeData, 'employees'), [employeeData]);
  const recentJobs = useMemo(() => getRows(jobsData, 'jobs'), [jobsData]);

  useEffect(() => {
    if (jobStatus?.status === 'completed' || jobStatus?.status === 'failed') {
      refetchJobs();
    }
  }, [jobStatus?.status, refetchJobs]);

  const handleGenerate = async (values) => {
    const [dateFrom, dateTo] = values.dateRange || [];
    const filters = {
      dateFrom: dateFrom ? dateFrom.format('YYYY-MM-DD') : undefined,
      dateTo: dateTo ? dateTo.format('YYYY-MM-DD') : undefined,
      branchId: values.branchId || undefined,
      departmentId: values.departmentId || undefined,
      employeeId: values.employeeId || undefined,
      status: values.status || undefined,
    };

    try {
      const response = await generateReport({
        reportType: values.reportType,
        filters,
      }).unwrap();

      setJobId(response.jobId);
      message.success('Report generation started');
      refetchJobs();
    } catch (error) {
      message.error(parseApiError(error));
    }
  };

  const handleDownload = async (targetJobId = jobId) => {
    if (!targetJobId) {
      return;
    }

    try {
      const file = await downloadReport(targetJobId).unwrap();
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.filename || 'attendease-report.xlsx';
      link.click();
    } catch (error) {
      message.error(error?.data?.error?.message || parseApiError(error) || 'Report file is not ready yet');
    }
  };

  const handleCancel = async (targetJobId = jobId) => {
    if (!targetJobId) {
      return;
    }

    try {
      await cancelReportJob(targetJobId).unwrap();
      if (targetJobId === jobId) {
        setJobId(null);
      }
      message.success('Report generation cancelled');
      refetchJobs();
    } catch (error) {
      message.error(error?.data?.error?.message || parseApiError(error) || 'Unable to cancel report');
    }
  };

  const handleDelete = async (targetJobId) => {
    if (!targetJobId) {
      return;
    }

    try {
      await deleteReportJob(targetJobId).unwrap();
      if (targetJobId === jobId) {
        setJobId(null);
      }
      message.success('Report removed');
      refetchJobs();
    } catch (error) {
      message.error(error?.data?.error?.message || parseApiError(error) || 'Unable to remove report');
    }
  };

  const columns = [
    {
      title: 'Report',
      dataIndex: ['data', 'reportType'],
      render: (value) => value || 'attendance',
    },
    {
      title: 'Status',
      dataIndex: 'status',
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      render: (value) => `${value || 0}%`,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      render: (value) => (value ? formatDateTime(value) : '-'),
    },
    {
      title: 'Rows',
      dataIndex: ['result', 'rowCount'],
      render: (value) => value ?? '-',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        const canCancel = ['waiting', 'delayed', 'paused'].includes(record.status);

        return (
          <Space>
            <Button
              type="link"
              icon={<DownloadOutlined />}
              disabled={record.status !== 'completed'}
              onClick={() => handleDownload(record.id)}
            >
              Download
            </Button>
            {canCancel ? (
              <Popconfirm
                title="Cancel report generation?"
                okText="Cancel report"
                okButtonProps={{ danger: true, loading: isCancelling }}
                onConfirm={() => handleCancel(record.id)}
              >
                <Button type="link" danger icon={<CloseCircleOutlined />}>
                  Cancel
                </Button>
              </Popconfirm>
            ) : null}
            <Popconfirm
              title="Remove this report?"
              description="This removes the report job and generated file from the queue history."
              okText="Remove"
              okButtonProps={{ danger: true, loading: isDeleting }}
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                Remove
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Generate attendance, leave, overtime, and payroll exports" />

      <Card title="Generate Report" className="bg-white shadow border border-gray-100">
        <Alert
          className="mb-4"
          type="info"
          showIcon
          message="Reports are generated in the background and downloaded as Excel files."
        />

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            reportType: 'attendance',
            dateRange: [dayjs().startOf('month'), dayjs()],
          }}
          onFinish={handleGenerate}
        >
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="reportType" label="Report Type" rules={[{ required: true }]}>
                <Select options={REPORT_TYPES} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="dateRange" label="Date Range" rules={[{ required: true }]}>
                <RangePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="status" label="Attendance Status">
                <Select allowClear options={STATUS_OPTIONS} placeholder="All statuses" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="branchId" label="Branch">
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="All branches"
                  options={branches.map((branch) => ({ label: branch.name, value: branch.id }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="departmentId" label="Department">
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="All departments"
                  options={departments.map((department) => ({ label: department.name, value: department.id }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="employeeId" label="Employee">
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="All employees"
                  options={employees.map((employee) => ({
                    label: `${employee.name}${employee.empCode || employee.emp_code ? ` (${employee.empCode || employee.emp_code})` : ''}`,
                    value: employee.id,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Space>
            <Button type="primary" htmlType="submit" icon={<FileExcelOutlined />} loading={isGenerating}>
              Generate Excel
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => refetchJobs()}>
              Refresh Jobs
            </Button>
          </Space>
        </Form>
      </Card>

      {jobId && (
        <ReportJobStatus
          jobId={jobId}
          status={jobStatus?.status || 'waiting'}
          progress={jobStatus?.progress || 0}
          onDownload={() => handleDownload(jobId)}
          onCancel={() => handleCancel(jobId)}
          loading={isDownloading}
          cancelLoading={isCancelling}
        />
      )}

      <Card title="Recent Report Jobs" className="bg-white shadow border border-gray-100">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={recentJobs}
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
}
