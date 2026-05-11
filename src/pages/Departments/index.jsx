/**
 * @module DepartmentsPage
 * @description Department hierarchy management.
 */
import { useMemo, useState } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  Drawer,
  Input,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  ApartmentOutlined,
  BranchesOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import PageHeader from '../../components/common/PageHeader.jsx';
import DepartmentTree from './DepartmentTree.jsx';
import DepartmentForm from './DepartmentForm.jsx';
import {
  useGetDepartmentsQuery,
  useGetDepartmentEmployeesQuery,
  useGetDepartmentStatsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} from '../../store/api/departmentApi.js';
import { useGetEmployeesQuery } from '../../store/api/employeeApi.js';
import { parseApiError } from '../../utils/errorHandler.js';

const filterOptions = [
  { label: 'All departments', value: 'all' },
  { label: 'Root only', value: 'root' },
  { label: 'With employees', value: 'with_employees' },
  { label: 'Without employees', value: 'without_employees' },
  { label: 'Without head', value: 'without_head' },
];

function flattenDepartments(departments = [], level = 0) {
  return departments.flatMap((department) => [
    { ...department, level },
    ...flattenDepartments(department.children || [], level + 1),
  ]);
}

function cloneWithFilteredChildren(departments, predicate) {
  return departments
    .map((department) => {
      const children = cloneWithFilteredChildren(department.children || [], predicate);
      const selfMatches = predicate(department);

      if (!selfMatches && children.length === 0) {
        return null;
      }

      return {
        ...department,
        children,
      };
    })
    .filter(Boolean);
}

export default function DepartmentsPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [selectedDept, setSelectedDept] = useState(null);
  const [detailDept, setDetailDept] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data, isLoading, isFetching } = useGetDepartmentsQuery();
  const { data: headEmployees } = useGetEmployeesQuery({ limit: 200, status: 'active' });
  const { data: detailEmployees, isFetching: isEmployeesFetching } = useGetDepartmentEmployeesQuery(detailDept?.id, {
    skip: !detailDept?.id,
  });
  const { data: detailStats, isFetching: isStatsFetching } = useGetDepartmentStatsQuery(detailDept?.id, {
    skip: !detailDept?.id,
  });
  const [createDept, { isLoading: isCreating }] = useCreateDepartmentMutation();
  const [updateDept, { isLoading: isUpdating }] = useUpdateDepartmentMutation();
  const [deleteDept] = useDeleteDepartmentMutation();

  const departments = data?.departments || [];
  const flatDepartments = useMemo(() => flattenDepartments(departments), [departments]);

  const stats = useMemo(
    () => ({
      total: flatDepartments.length,
      root: flatDepartments.filter((department) => !department.parentId).length,
      sub: flatDepartments.filter((department) => department.parentId).length,
      assignedEmployees: flatDepartments.reduce((sum, department) => sum + (department.directEmployeeCount ?? department.employeeCount ?? 0), 0),
      withoutHead: flatDepartments.filter((department) => !department.headEmpId).length,
    }),
    [flatDepartments]
  );

  const filteredDepartments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return cloneWithFilteredChildren(departments, (department) => {
      const employeeCount = department.directEmployeeCount ?? department.employeeCount ?? 0;
      const matchesSearch =
        !term ||
        department.name?.toLowerCase().includes(term) ||
        department.headEmployee?.name?.toLowerCase().includes(term);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'root' && !department.parentId) ||
        (filter === 'with_employees' && employeeCount > 0) ||
        (filter === 'without_employees' && employeeCount === 0) ||
        (filter === 'without_head' && !department.headEmpId);

      return matchesSearch && matchesFilter;
    });
  }, [departments, filter, search]);

  const handleDelete = async (id) => {
    try {
      await deleteDept(id).unwrap();
      message.success('Department deleted successfully');
    } catch (error) {
      message.error(parseApiError(error));
    }
  };

  const employeeColumns = [
    {
      title: 'Employee',
      dataIndex: 'name',
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary">{record.empCode || record.email || 'No code'}</Typography.Text>
        </Space>
      ),
    },
    { title: 'Branch', dataIndex: 'branchName', render: (value) => value || '-' },
    { title: 'Shift', dataIndex: 'shiftName', render: (value) => value || '-' },
    { title: 'Role', dataIndex: 'role', render: (value) => <Tag>{value}</Tag> },
    {
      title: 'Face',
      dataIndex: 'isFaceEnrolled',
      render: (value) => <Tag color={value ? 'success' : 'warning'}>{value ? 'Enrolled' : 'Missing'}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (value) => <Tag color={value === 'active' ? 'success' : 'default'}>{value}</Tag>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        subtitle="Manage hierarchy, heads, staffing, and department health"
        actions={[
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedDept(null);
              setShowForm(true);
            }}
          >
            Add Department
          </Button>,
        ]}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={5}>
          <Card><Statistic title="Departments" value={stats.total} prefix={<ApartmentOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card><Statistic title="Root departments" value={stats.root} prefix={<BranchesOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card><Statistic title="Sub-departments" value={stats.sub} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card><Statistic title="Assigned employees" value={stats.assignedEmployees} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Without head"
              value={stats.withoutHead}
              valueStyle={{ color: stats.withoutHead ? '#d97706' : undefined }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={14}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search department or head"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Col>
          <Col xs={24} md={10}>
            <Select style={{ width: '100%' }} value={filter} onChange={setFilter} options={filterOptions} />
          </Col>
        </Row>
      </Card>

      <Card title="Department Hierarchy">
        {isLoading || isFetching ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <DepartmentTree
            data={filteredDepartments}
            onCreateFirst={() => {
              setSelectedDept(null);
              setShowForm(true);
            }}
            onView={setDetailDept}
            onAdd={(department) => {
              setSelectedDept({ parentId: department.id });
              setShowForm(true);
            }}
            onEdit={(dept) => {
              setSelectedDept(dept);
              setShowForm(true);
            }}
            onDelete={handleDelete}
          />
        )}
      </Card>

      <DepartmentForm
        open={showForm}
        department={selectedDept}
        departments={departments}
        employees={headEmployees?.employees || []}
        onClose={() => {
          setSelectedDept(null);
          setShowForm(false);
        }}
        onSubmit={async (values) => {
          try {
            if (selectedDept?.id) {
              await updateDept({ id: selectedDept.id, ...values }).unwrap();
              message.success('Department updated successfully');
            } else {
              await createDept(values).unwrap();
              message.success('Department created successfully');
            }

            setSelectedDept(null);
            setShowForm(false);
          } catch (error) {
            message.error(parseApiError(error));
          }
        }}
        loading={isCreating || isUpdating}
      />

      <Drawer
        title={detailDept ? detailDept.name : 'Department details'}
        open={Boolean(detailDept)}
        onClose={() => setDetailDept(null)}
        width={920}
        extra={
          detailDept ? (
            <Button onClick={() => navigate(`/employees?dept=${detailDept.id}`)}>Open Employees</Button>
          ) : null
        }
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}><Card><Statistic title="Employees" value={detailStats?.employeeCount || 0} /></Card></Col>
            <Col xs={12} md={6}><Card><Statistic title="Children" value={detailStats?.childCount || 0} /></Card></Col>
            <Col xs={12} md={6}><Card><Statistic title="Present today" value={detailStats?.presentCount || 0} /></Card></Col>
            <Col xs={12} md={6}><Card><Statistic title="Late today" value={detailStats?.lateCount || 0} /></Card></Col>
            <Col xs={12} md={6}><Card><Statistic title="Absent" value={detailStats?.absentCount || 0} /></Card></Col>
            <Col xs={12} md={6}><Card><Statistic title="Not marked" value={detailStats?.notMarkedCount || 0} /></Card></Col>
          </Row>

          <Card title="Department Profile" loading={isStatsFetching}>
            <Space direction="vertical" size={8}>
              <Typography.Text>
                <strong>Parent:</strong> {detailDept?.parentDepartment?.name || 'Top level department'}
              </Typography.Text>
              <Typography.Text>
                <strong>Head:</strong> {detailDept?.headEmployee?.name || 'Not assigned'}
              </Typography.Text>
              <Typography.Text>
                <strong>Total employees including children:</strong> {detailDept?.totalEmployeeCountIncludingChildren || detailDept?.employeeCount || 0}
              </Typography.Text>
              {!detailDept?.headEmpId ? <Tag color="warning" icon={<UserOutlined />}>Head missing</Tag> : null}
            </Space>
          </Card>

          <Card title="Assigned Employees">
            <Table
              rowKey="id"
              columns={employeeColumns}
              dataSource={detailEmployees?.employees || []}
              loading={isEmployeesFetching}
              pagination={{ pageSize: 8 }}
            />
          </Card>
        </Space>
      </Drawer>
    </div>
  );
}
