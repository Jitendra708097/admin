import { useMemo, useState } from 'react';
import { App, Button, Card, Col, Input, Popconfirm, Row, Select, Space, Statistic, Typography } from 'antd';
import { PlusOutlined, ReloadOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmployeeTable from './EmployeeTable.jsx';
import EmployeeForm from './EmployeeForm.jsx';
import BulkUpload from './BulkUpload.jsx';
import LeaveBalanceModal from './LeaveBalanceModal.jsx';
import { useGetBranchesQuery } from '../../store/api/branchApi.js';
import { useGetDepartmentsQuery } from '../../store/api/departmentApi.js';
import {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useDeleteEmployeesMutation,
  useResendInviteMutation,
  useUpdateLeaveBalanceMutation,
  useBulkUploadEmployeesMutation,
} from '../../store/api/employeeApi.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { parseApiError } from '../../utils/errorHandler.js';
import styles from './employees.module.css';

export default function EmployeesPage() {
  const { message } = App.useApp();
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkUploadResults, setBulkUploadResults] = useState(null);
  const [showLeaveBalance, setShowLeaveBalance] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [branch, setBranch] = useState();
  const [department, setDepartment] = useState();
  const [status, setStatus] = useState();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const debouncedSearch = useDebounce(search);
  const { data, isLoading, refetch } = useGetEmployeesQuery({
    search: debouncedSearch,
    branch,
    dept: department,
    status,
    page: pagination.current,
    limit: pagination.pageSize,
  });
  const { data: branches } = useGetBranchesQuery();
  const { data: departments } = useGetDepartmentsQuery();
  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();
  const [deleteEmployee] = useDeleteEmployeeMutation();
  const [deleteEmployees, { isLoading: isDeletingMany }] = useDeleteEmployeesMutation();
  const [resendInvite] = useResendInviteMutation();
  const [updateLeaveBalance] = useUpdateLeaveBalanceMutation();
  const [bulkUploadEmployees, { isLoading: isUploading }] = useBulkUploadEmployeesMutation();
  const employees = data?.employees || [];

  const stats = useMemo(() => {
    return {
      total: data?.pagination?.count || 0,
      active: employees.filter((employee) => employee.status === 'active').length,
      adminsAndManagers: employees.filter((employee) => ['admin', 'manager'].includes(employee.role)).length,
      setupPending: employees.filter((employee) => employee.requiresPasswordChange).length,
    };
  }, [data?.pagination?.count, employees]);

  const resetFilters = () => {
    setSearch('');
    setBranch(undefined);
    setDepartment(undefined);
    setStatus(undefined);
    setPagination((current) => ({ ...current, current: 1 }));
  };

  const handleBulkDelete = async () => {
    await deleteEmployees(selectedRowKeys).unwrap();
    setSelectedRowKeys([]);
    message.success(`${selectedRowKeys.length} employees deleted`);
  };

  const handleToggleStatus = async (employee) => {
    const nextIsActive = employee.status !== 'active';

    try {
      await updateEmployee({
        id: employee.id,
        isActive: nextIsActive,
      }).unwrap();

      message.success(`${employee.name} ${nextIsActive ? 'activated' : 'suspended'} successfully`);
    } catch (error) {
      message.error(parseApiError(error));
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Employees"
        subtitle="Manage onboarding, roles, and workforce structure from one clean workspace."
        actions={[
          <Button key="bulk" size="large" icon={<UploadOutlined />} onClick={() => setShowBulk(true)}>
            Bulk Upload
          </Button>,
          <Button
            key="add"
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedEmployee(null);
              setShowForm(true);
            }}
          >
            Add Employee
          </Button>,
        ]}
      />

      <Row gutter={[16, 16]} className={styles.statsGrid}>
        <Col xs={24} sm={12} xl={6}>
          <Card className={styles.statCard} bordered={false}>
            <Statistic title="Employees in view" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className={styles.statCard} bordered={false}>
            <Statistic title="Active employees" value={stats.active} valueStyle={{ color: '#0f766e' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className={styles.statCard} bordered={false}>
            <Statistic title="Admins + managers" value={stats.adminsAndManagers} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className={styles.statCard} bordered={false}>
            <Statistic title="Need first login" value={stats.setupPending} valueStyle={{ color: '#d97706' }} />
          </Card>
        </Col>
      </Row>

      <Card className={styles.filterCard} bordered={false}>
        <div className={styles.filterHeader}>
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Search and narrow the list
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ margin: '6px 0 0 0' }}>
              Filter by branch, department, status, or search across name, email, and employee code.
            </Typography.Paragraph>
          </div>
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={resetFilters}>
              Clear Filters
            </Button>
            <Button onClick={() => refetch()}>Refresh</Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <Input
              size="large"
              placeholder="Search by name, email, or employee code"
              prefix={<SearchOutlined />}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPagination((current) => ({ ...current, current: 1 }));
              }}
            />
          </Col>
          <Col xs={24} md={8} lg={5}>
            <Select
              size="large"
              placeholder="Branch"
              style={{ width: '100%' }}
              allowClear
              showSearch
              optionFilterProp="label"
              value={branch}
              onChange={(value) => {
                setBranch(value);
                setPagination((current) => ({ ...current, current: 1 }));
              }}
              options={branches?.branches?.map((item) => ({ label: item.name, value: item.id })) || []}
            />
          </Col>
          <Col xs={24} md={8} lg={5}>
            <Select
              size="large"
              placeholder="Department"
              style={{ width: '100%' }}
              allowClear
              showSearch
              optionFilterProp="label"
              value={department}
              onChange={(value) => {
                setDepartment(value);
                setPagination((current) => ({ ...current, current: 1 }));
              }}
              options={departments?.departments?.map((item) => ({ label: item.name, value: item.id })) || []}
            />
          </Col>
          <Col xs={24} md={8} lg={4}>
            <Select
              size="large"
              placeholder="Status"
              style={{ width: '100%' }}
              allowClear
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPagination((current) => ({ ...current, current: 1 }));
              }}
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      <Card className={styles.tableCard} bordered={false}>
        <div className={styles.tableHeader}>
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Employee directory
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ margin: '6px 0 0 0' }}>
              Review employee records, resend invites, or make quick profile updates.
            </Typography.Paragraph>
          </div>
          {selectedRowKeys.length > 0 ? (
            <Space>
              <Typography.Text strong>{selectedRowKeys.length} selected</Typography.Text>
              <Popconfirm
                title="Delete selected employees?"
                description="This will soft delete all selected employee records."
                okText="Delete"
                okButtonProps={{ danger: true, loading: isDeletingMany }}
                onConfirm={handleBulkDelete}
              >
                <Button danger>Delete Selected</Button>
              </Popconfirm>
            </Space>
          ) : null}
        </div>
        <EmployeeTable
          data={employees}
          loading={isLoading}
          onEdit={(employee) => {
            setSelectedEmployee(employee);
            setShowForm(true);
          }}
          onDelete={(id) => deleteEmployee(id)}
          onToggleStatus={handleToggleStatus}
          onResendInvite={(id) => resendInvite(id)}
          onPageChange={(page, pageSize) => setPagination({ current: page, pageSize })}
          onSelectionChange={setSelectedRowKeys}
          selectedRowKeys={selectedRowKeys}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: data?.pagination?.count || 0,
          }}
        />
      </Card>

      <EmployeeForm
        open={showForm}
        employee={selectedEmployee}
        onClose={() => setShowForm(false)}
        onSubmit={async (values) => {
          if (selectedEmployee?.id) {
            await updateEmployee({ id: selectedEmployee.id, ...values });
            message.success('Employee updated successfully');
          } else {
            await createEmployee(values);
            message.success('Employee created successfully');
          }

          setShowForm(false);
        }}
        loading={isCreating || isUpdating}
      />

      <BulkUpload
        open={showBulk}
        loading={isUploading}
        onUpload={async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          const response = await bulkUploadEmployees(formData).unwrap();
          setBulkUploadResults(response);
          message.success('Bulk upload processed');
        }}
        onClose={() => {
          setShowBulk(false);
          setBulkUploadResults(null);
        }}
        results={bulkUploadResults}
      />

      <LeaveBalanceModal
        open={showLeaveBalance}
        employee={selectedEmployee}
        onClose={() => setShowLeaveBalance(false)}
        onSubmit={async (values) => {
          await updateLeaveBalance(values);
          setShowLeaveBalance(false);
        }}
        loading={false}
      />
    </div>
  );
}
