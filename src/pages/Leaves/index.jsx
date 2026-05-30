/**
 * @module LeavesPage
 * @description Leave requests management with filters, stats, balances, leave types, and calendar.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import dayjs from 'dayjs';
import {
  App as AntdApp,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import { CalendarOutlined, EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader.jsx';
import LeaveTable from './LeaveTable.jsx';
import LeaveApprovalModal from './LeaveApprovalModal.jsx';
import LeaveCalendar from './LeaveCalendar.jsx';
import { useGetDepartmentsQuery } from '../../store/api/departmentApi.js';
import {
  useApproveLeaveMutation,
  useGetLeaveBalancesQuery,
  useGetLeaveCalendarQuery,
  useGetLeaveContextQuery,
  useGetLeavesQuery,
  useGetLeaveTypesQuery,
  useGetLeavePoliciesQuery,
  useUpsertLeavePolicyMutation,
  useGetLeaveLedgerQuery,
  useGetLeavePayrollReportQuery,
  useApproveLeaveCancellationMutation,
  useRejectLeaveMutation,
} from '../../store/api/leaveApi.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { useGetBranchesQuery } from '../../store/api/branchApi.js';
import { useGetEmployeesQuery } from '../../store/api/employeeApi.js';

const { RangePicker } = DatePicker;

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Manager Approved', value: 'manager_approved' },
  { label: 'Approved', value: 'approved' },
  { label: 'Cancel Pending', value: 'cancellation_pending' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Cancelled', value: 'cancelled' },
];

function flattenDepartments(departments = [], level = 0) {
  return departments.flatMap((department) => [
    { label: `${'-- '.repeat(level)}${department.name}`, value: department.id },
    ...flattenDepartments(department.children || [], level + 1),
  ]);
}

export default function LeavesPage() {
  const { message } = AntdApp.useApp();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');
  const employeeId = searchParams.get('employeeId');
  const requestedView = searchParams.get('view');
  const openedRequestRef = useRef(null);
  const [view, setView] = useState('pending');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [detailLeave, setDetailLeave] = useState(null);
  const [modalAction, setModalAction] = useState('review');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [search, setSearch] = useState('');
  const [type, setType] = useState();
  const [departmentId, setDepartmentId] = useState();
  const [status, setStatus] = useState();
  const [dateRange, setDateRange] = useState([]);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [policyForm] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const debouncedSearch = useDebounce(search);
  const { data: typeData, isLoading: typesLoading } = useGetLeaveTypesQuery();
  const leaveTypes = typeData?.types || [];
  const typeOptions = leaveTypes.map((item) => ({ label: item.label, value: item.type }));
  const { data: policyData, isLoading: policiesLoading } = useGetLeavePoliciesQuery(undefined, { skip: view !== 'policies' });
  const [upsertLeavePolicy, { isLoading: savingPolicy }] = useUpsertLeavePolicyMutation();
  const effectiveStatus = view === 'pending' ? 'pending' : status;
  const params = {
    page: pagination.current,
    limit: pagination.pageSize,
    search: debouncedSearch || undefined,
    type,
    departmentId,
    status: effectiveStatus || undefined,
    requestId: requestId || undefined,
    employeeId: employeeId || undefined,
    dateFrom: dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : undefined,
    dateTo: dateRange?.[1] ? dateRange[1].format('YYYY-MM-DD') : undefined,
  };

  const { data, isLoading, refetch } = useGetLeavesQuery(params);
  const { data: calendarData, isLoading: calendarLoading } = useGetLeaveCalendarQuery(
    { departmentId, type, dateFrom: params.dateFrom, dateTo: params.dateTo },
    { skip: view !== 'calendar' }
  );
  const { data: departmentData } = useGetDepartmentsQuery();
  const { data: branchData } = useGetBranchesQuery(undefined, { skip: view !== 'policies' });
  const { data: employeeData } = useGetEmployeesQuery({ limit: 200 }, { skip: view !== 'policies' });
  const { data: balanceData, isLoading: balancesLoading } = useGetLeaveBalancesQuery(
    { departmentId },
    { skip: view !== 'balances' }
  );
  const { data: ledgerData, isLoading: ledgerLoading } = useGetLeaveLedgerQuery(
    { departmentId, type },
    { skip: view !== 'ledger' }
  );
  const { data: payrollData, isLoading: payrollLoading } = useGetLeavePayrollReportQuery(
    { dateFrom: params.dateFrom, dateTo: params.dateTo },
    { skip: view !== 'payroll' }
  );
  const { data: contextData, isFetching: contextLoading } = useGetLeaveContextQuery(
    selectedLeave?.id || detailLeave?.id,
    { skip: !(selectedLeave?.id || detailLeave?.id) }
  );
  const [approveLeave, { isLoading: approving }] = useApproveLeaveMutation();
  const [rejectLeave, { isLoading: rejecting }] = useRejectLeaveMutation();
  const [approveLeaveCancellation, { isLoading: approvingCancellation }] = useApproveLeaveCancellationMutation();

  const leaves = data?.leaves || [];
  const stats = data?.stats || {};
  const departments = flattenDepartments(departmentData?.departments || []);
  const balances = balanceData?.balances || [];
  const policies = policyData?.policies || [];
  const workflows = policyData?.workflows || [];
  const branches = branchData?.branches || branchData?.data?.branches || [];
  const employees = employeeData?.employees || [];
  const showRequests = view === 'pending' || view === 'all';

  const viewButtons = [
    { key: 'pending', label: 'Pending Leaves' },
    { key: 'all', label: 'All Requests' },
    { key: 'calendar', label: 'Calendar' },
    { key: 'balances', label: 'Leave Balance' },
    { key: 'ledger', label: 'Ledger' },
    { key: 'types', label: 'Leave Types' },
    { key: 'policies', label: 'Leave Policies' },
    { key: 'payroll', label: 'Payroll Report' },
  ];

  const resetFilters = () => {
    setSearch('');
    setType(undefined);
    setDepartmentId(undefined);
    setStatus(undefined);
    setDateRange([]);
    setPagination({ current: 1, pageSize: 10 });
  };

  const openReview = (leave, action = 'review') => {
    setSelectedLeave(leave);
    setModalAction(action);
    setShowApprovalModal(true);
  };

  const openPolicyModal = (policy = null) => {
    setEditingPolicy(policy);
    policyForm.setFieldsValue({
      id: policy?.id,
      name: policy?.name || '',
      scopeType: policy?.scopeType || 'org',
      scopeId: policy?.scopeId || undefined,
      effectiveFrom: policy?.effectiveFrom ? dayjs(policy.effectiveFrom) : dayjs().startOf('year'),
      effectiveTo: policy?.effectiveTo ? dayjs(policy.effectiveTo) : null,
      accrualFrequency: policy?.accrualFrequency || 'yearly',
      approvalWorkflowId: policy?.approvalWorkflowId || workflows[0]?.id,
      isActive: policy?.isActive ?? true,
      entitlements: leaveTypes.reduce((accumulator, typeItem) => {
        accumulator[typeItem.type] = Number(policy?.entitlements?.[typeItem.type] ?? typeItem.yearlyDefaultBalance ?? 0);
        return accumulator;
      }, {}),
      settings: {
        halfDayAllowed: policy?.settings?.halfDayAllowed ?? true,
        includeWeekends: policy?.settings?.includeWeekends ?? false,
        includeHolidays: policy?.settings?.includeHolidays ?? false,
        allowNegativeBalance: policy?.settings?.allowNegativeBalance ?? false,
        noticeDays: policy?.settings?.noticeDays ?? 0,
        maxConsecutiveDays: policy?.settings?.maxConsecutiveDays ?? null,
        requiresDocumentAfterDays: policy?.settings?.requiresDocumentAfterDays ?? null,
      },
    });
    setPolicyModalOpen(true);
  };

  const submitPolicy = async () => {
    const values = await policyForm.validateFields();
    await upsertLeavePolicy({
      id: editingPolicy?.id,
      ...values,
      effectiveFrom: values.effectiveFrom?.format('YYYY-MM-DD'),
      effectiveTo: values.effectiveTo ? values.effectiveTo.format('YYYY-MM-DD') : null,
    }).unwrap();
    message.success('Leave policy saved');
    setPolicyModalOpen(false);
    setEditingPolicy(null);
  };

  const balanceColumns = useMemo(() => [
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary">{record.employeeCode || record.departmentName || '-'}</Typography.Text>
        </Space>
      ),
    },
    { title: 'Department', dataIndex: 'departmentName', key: 'departmentName', render: (value) => value || '-' },
    ...leaveTypes.map((option) => ({
      title: option.label.replace(' Leave', ''),
      key: option.type,
      render: (_, record) => {
        const total = Number(record.balance?.[option.type] || 0);
        return <Tag color={total <= 2 ? 'orange' : 'green'}>{total}</Tag>;
      },
    })),
  ], [leaveTypes]);

  const typeColumns = [
    { title: 'Type', dataIndex: 'label', key: 'label' },
    { title: 'Key', dataIndex: 'type', key: 'type' },
    { title: 'Half-day', dataIndex: 'halfDayAllowed', key: 'halfDayAllowed', render: (value) => (value ? 'Allowed' : 'No') },
    { title: 'Paid', dataIndex: 'paid', key: 'paid', render: (value) => (value ? 'Paid' : 'Unpaid') },
    { title: 'Default Balance', dataIndex: 'yearlyDefaultBalance', key: 'yearlyDefaultBalance' },
  ];
  const ledgerColumns = [
    { title: 'Employee', dataIndex: 'employeeName', render: (value) => value || '-' },
    { title: 'Type', dataIndex: 'leaveType' },
    { title: 'Action', dataIndex: 'transactionType' },
    { title: 'Days', dataIndex: 'days' },
    { title: 'Balance After', dataIndex: 'balanceAfter' },
    { title: 'Reason', dataIndex: 'reason', render: (value) => value || '-' },
    { title: 'Date', dataIndex: 'effectiveDate' },
  ];
  const payrollColumns = [
    { title: 'Employee', dataIndex: 'employeeName', render: (value, record) => value || record.employeeCode || '-' },
    { title: 'Type', dataIndex: 'leaveType' },
    { title: 'Paid', dataIndex: 'paid', render: (value) => (value ? 'Paid' : 'Unpaid') },
    { title: 'From', dataIndex: 'fromDate' },
    { title: 'To', dataIndex: 'toDate' },
    { title: 'Days', dataIndex: 'days' },
    { title: 'LOP Days', dataIndex: 'lopDays' },
  ];
  const policyColumns = [
    { title: 'Policy', dataIndex: 'name', render: (value, record) => (
      <Space direction="vertical" size={0}>
        <Typography.Text strong>{value}</Typography.Text>
        <Typography.Text type="secondary">{record.isDefault ? 'Default organisation policy' : record.approvalWorkflowName || 'Workflow assigned'}</Typography.Text>
      </Space>
    ) },
    { title: 'Scope', render: (_, record) => `${record.scopeType}${record.scopeId ? `: ${record.scopeId}` : ''}` },
    { title: 'Effective', render: (_, record) => `${record.effectiveFrom || '-'} to ${record.effectiveTo || 'ongoing'}` },
    { title: 'Status', dataIndex: 'isActive', render: (value) => <Tag color={value ? 'green' : 'default'}>{value ? 'Active' : 'Inactive'}</Tag> },
    { title: 'Types', render: (_, record) => Object.entries(record.entitlements || {}).map(([key, value]) => <Tag key={key}>{key}: {value}</Tag>) },
    { title: 'Actions', render: (_, record) => <Button size="small" onClick={() => openPolicyModal(record)}>Edit</Button> },
  ];

  useEffect(() => {
    if (!requestId) {
      openedRequestRef.current = null;
      return;
    }
    resetFilters();
    setView(requestedView === 'pending' || requestedView === 'all' ? requestedView : 'all');
  }, [requestId, requestedView]);

  useEffect(() => {
    if (!employeeId || requestId) return;
    setView('all');
    resetFilters();
  }, [employeeId, requestId]);

  useEffect(() => {
    if (!requestId || openedRequestRef.current === requestId || leaves.length === 0) return;
    const matchedLeave = leaves.find((leave) => String(leave.id) === String(requestId));
    if (matchedLeave) {
      openedRequestRef.current = requestId;
      openReview(matchedLeave, 'review');
    }
  }, [requestId, leaves]);

  return (
    <div className="space-y-6">
      <PageHeader title="Leaves" subtitle="Manage employee leave requests, balances, calendar, and leave policy" />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={4}><Card bordered={false}><Statistic title="Pending" value={stats.pending || 0} valueStyle={{ color: '#d97706' }} /></Card></Col>
        <Col xs={24} sm={12} xl={4}><Card bordered={false}><Statistic title="Approved" value={stats.approved || 0} valueStyle={{ color: '#0f766e' }} /></Card></Col>
        <Col xs={24} sm={12} xl={4}><Card bordered={false}><Statistic title="Rejected" value={stats.rejected || 0} valueStyle={{ color: '#dc2626' }} /></Card></Col>
        <Col xs={24} sm={12} xl={4}><Card bordered={false}><Statistic title="On Leave Today" value={stats.employeesOnLeaveToday || 0} /></Card></Col>
        <Col xs={24} sm={12} xl={4}><Card bordered={false}><Statistic title="Pending Days" value={stats.pendingDays || 0} /></Card></Col>
        <Col xs={24} sm={12} xl={4}><Card bordered={false}><Statistic title="Approved Days" value={stats.approvedDays || 0} /></Card></Col>
      </Row>

      <Card bordered={false}>
        <Space wrap>
          {viewButtons.map((item) => (
            <Button key={item.key} type={view === item.key ? 'primary' : 'default'} onClick={() => setView(item.key)}>
              {item.label}
            </Button>
          ))}
        </Space>
      </Card>

      <Card bordered={false}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12} xl={6}>
            <Input placeholder="Search employee" prefix={<SearchOutlined />} value={search} onChange={(event) => setSearch(event.target.value)} />
          </Col>
          <Col xs={24} md={12} xl={4}>
            <Select allowClear placeholder="Type" value={type} onChange={setType} options={typeOptions} style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={12} xl={5}>
            <Select allowClear showSearch optionFilterProp="label" placeholder="Department" value={departmentId} onChange={setDepartmentId} options={departments} style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={12} xl={5}>
            <RangePicker value={dateRange} onChange={(value) => setDateRange(value || [])} style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={12} xl={4}>
            <Select allowClear disabled={view === 'pending'} placeholder="Status" value={effectiveStatus} onChange={setStatus} options={STATUS_OPTIONS} style={{ width: '100%' }} />
          </Col>
        </Row>
        <Space className="mt-4">
          <Button icon={<ReloadOutlined />} onClick={resetFilters}>Clear Filters</Button>
          <Button onClick={() => refetch()}>Refresh</Button>
        </Space>
      </Card>

      {showRequests ? (
        <Card bordered={false}>
          <LeaveTable
            data={leaves}
            loading={isLoading}
            onView={setDetailLeave}
            onApprove={(leave) => openReview(leave, 'approve')}
            onReject={(leave) => openReview(leave, 'reject')}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: data?.total || 0,
              showSizeChanger: true,
              onChange: (current, pageSize) => setPagination({ current, pageSize }),
            }}
          />
        </Card>
      ) : null}

      {view === 'calendar' ? (
        <Card bordered={false} loading={calendarLoading} title={<Space><CalendarOutlined /> Team Leave Calendar</Space>}>
          <LeaveCalendar leaves={calendarData?.leaves || []} />
        </Card>
      ) : null}

      {view === 'balances' ? (
        <Card bordered={false}>
          <Table rowKey="employeeId" columns={balanceColumns} dataSource={balances} loading={balancesLoading} scroll={{ x: 900 }} />
        </Card>
      ) : null}

      {view === 'types' ? (
        <Card bordered={false}>
          <Table rowKey="type" columns={typeColumns} dataSource={leaveTypes} loading={typesLoading} pagination={false} />
        </Card>
      ) : null}

      {view === 'policies' ? (
        <Card
          bordered={false}
          title="Leave Policies"
          extra={<Button type="primary" onClick={() => openPolicyModal()}>New Policy</Button>}
        >
          <Table rowKey="id" columns={policyColumns} dataSource={policies} loading={policiesLoading || typesLoading} scroll={{ x: 1100 }} />
        </Card>
      ) : null}

      {view === 'ledger' ? (
        <Card bordered={false}>
          <Table rowKey="id" columns={ledgerColumns} dataSource={ledgerData?.entries || []} loading={ledgerLoading} scroll={{ x: 900 }} />
        </Card>
      ) : null}

      {view === 'payroll' ? (
        <Card
          bordered={false}
          loading={payrollLoading}
          title={`Paid ${payrollData?.summary?.paidDays || 0} days - LOP ${payrollData?.summary?.lopDays || 0} days`}
        >
          <Table rowKey={(record) => `${record.employeeId}-${record.leaveType}-${record.fromDate}`} columns={payrollColumns} dataSource={payrollData?.rows || []} scroll={{ x: 900 }} />
        </Card>
      ) : null}

      <Drawer title="Leave Request Details" open={Boolean(detailLeave)} onClose={() => setDetailLeave(null)} width={760}>
        {detailLeave ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Employee">{detailLeave.employeeName}</Descriptions.Item>
              <Descriptions.Item label="Department">{detailLeave.departmentName || '-'}</Descriptions.Item>
              <Descriptions.Item label="Type">{detailLeave.leaveType}</Descriptions.Item>
              <Descriptions.Item label="Dates">{detailLeave.fromDate} to {detailLeave.toDate}</Descriptions.Item>
              <Descriptions.Item label="Days">{detailLeave.days}</Descriptions.Item>
              <Descriptions.Item label="Status"><StatusBadge status={detailLeave.status} /></Descriptions.Item>
              <Descriptions.Item label="Reason">{detailLeave.reason || '-'}</Descriptions.Item>
              <Descriptions.Item label="Approver">{detailLeave.approverName || '-'}</Descriptions.Item>
              <Descriptions.Item label="Rejection Reason">{detailLeave.rejectionReason || '-'}</Descriptions.Item>
            </Descriptions>
            {contextData?.overlaps?.length ? <Tag color="warning">{contextData.overlaps.length} overlapping team leaves</Tag> : null}
            {detailLeave.status === 'pending' ? (
              <Space>
                <Button type="primary" onClick={() => openReview(detailLeave, 'approve')}>Approve</Button>
                <Button danger onClick={() => openReview(detailLeave, 'reject')}>Reject</Button>
              </Space>
            ) : null}
            <Card title="Recent Employee Leave History" loading={contextLoading}>
              <Table
                size="small"
                rowKey="id"
                dataSource={contextData?.recentHistory || []}
                pagination={false}
                columns={[
                  { title: 'Type', dataIndex: 'leaveType' },
                  { title: 'Dates', render: (_, record) => `${record.fromDate} to ${record.toDate}` },
                  { title: 'Status', dataIndex: 'status', render: (value) => <StatusBadge status={value} /> },
                ]}
              />
            </Card>
          </Space>
        ) : null}
      </Drawer>

      <LeaveApprovalModal
        open={showApprovalModal}
        leave={selectedLeave}
        context={contextData}
        action={modalAction}
        onApprove={async (id) => {
          if (selectedLeave?.status === 'cancellation_pending') {
            await approveLeaveCancellation({ id }).unwrap();
            message.success('Leave cancellation approved');
          } else {
            await approveLeave({ id }).unwrap();
            message.success('Leave approved');
          }
          setShowApprovalModal(false);
          setSelectedLeave(null);
        }}
        onReject={async (id, note) => {
          await rejectLeave({ id, reason: note }).unwrap();
          message.success('Leave rejected');
          setShowApprovalModal(false);
          setSelectedLeave(null);
        }}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedLeave(null);
        }}
        approving={approving || approvingCancellation}
        rejecting={rejecting}
        contextLoading={contextLoading}
      />

      <Modal
        title={editingPolicy ? 'Edit Leave Policy' : 'New Leave Policy'}
        open={policyModalOpen}
        onCancel={() => {
          setPolicyModalOpen(false);
          setEditingPolicy(null);
        }}
        onOk={submitPolicy}
        confirmLoading={savingPolicy}
        width={860}
        forceRender
        destroyOnHidden
      >
        <Form form={policyForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="name" label="Policy Name" rules={[{ required: true, message: 'Policy name is required' }]}>
                <Input placeholder="Default Leave Policy" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="scopeType" label="Scope" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: 'Organisation', value: 'org' },
                    { label: 'Branch', value: 'branch' },
                    { label: 'Department', value: 'department' },
                    { label: 'Employee', value: 'employee' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item noStyle shouldUpdate={(prev, next) => prev.scopeType !== next.scopeType}>
                {({ getFieldValue }) => {
                  const scopeType = getFieldValue('scopeType');
                  const options = scopeType === 'branch'
                    ? branches.map((branch) => ({ label: branch.name, value: branch.id }))
                    : scopeType === 'department'
                      ? departments
                      : scopeType === 'employee'
                        ? employees.map((employee) => ({ label: `${employee.name} (${employee.empCode || employee.email || 'employee'})`, value: employee.id }))
                        : [];

                  return (
                    <Form.Item
                      name="scopeId"
                      label="Scope Target"
                      rules={scopeType === 'org' ? [] : [{ required: true, message: 'Scope target is required' }]}
                    >
                      <Select
                        allowClear
                        showSearch
                        disabled={scopeType === 'org'}
                        optionFilterProp="label"
                        placeholder={scopeType === 'org' ? 'All employees' : 'Select target'}
                        options={options}
                      />
                    </Form.Item>
                  );
                }}
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="effectiveFrom" label="Effective From" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="effectiveTo" label="Effective To">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="approvalWorkflowId" label="Approval Workflow">
                <Select options={workflows.map((workflow) => ({ label: workflow.name, value: workflow.id }))} />
              </Form.Item>
            </Col>
          </Row>

          <Card size="small" title="Entitlements" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              {leaveTypes.map((typeItem) => (
                <Col xs={12} md={6} key={typeItem.type}>
                  <Form.Item name={['entitlements', typeItem.type]} label={typeItem.label}>
                    <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              ))}
            </Row>
          </Card>

          <Card size="small" title="Rules">
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item name={['settings', 'halfDayAllowed']} label="Half-day">
                  <Select options={[{ label: 'Allowed', value: true }, { label: 'Blocked', value: false }]} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name={['settings', 'includeWeekends']} label="Weekends">
                  <Select options={[{ label: 'Exclude', value: false }, { label: 'Include', value: true }]} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name={['settings', 'includeHolidays']} label="Holidays">
                  <Select options={[{ label: 'Exclude', value: false }, { label: 'Include', value: true }]} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name={['settings', 'noticeDays']} label="Notice Days">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name={['settings', 'maxConsecutiveDays']} label="Max Consecutive Days">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name={['settings', 'requiresDocumentAfterDays']} label="Document After Days">
                  <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name={['settings', 'allowNegativeBalance']} label="Negative Balance">
                  <Select options={[{ label: 'Blocked', value: false }, { label: 'Allowed', value: true }]} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="accrualFrequency" label="Accrual">
                  <Select options={[
                    { label: 'None', value: 'none' },
                    { label: 'Monthly', value: 'monthly' },
                    { label: 'Quarterly', value: 'quarterly' },
                    { label: 'Yearly', value: 'yearly' },
                  ]} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="isActive" label="Status">
                  <Select options={[{ label: 'Active', value: true }, { label: 'Inactive', value: false }]} />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Form>
      </Modal>
    </div>
  );
}
