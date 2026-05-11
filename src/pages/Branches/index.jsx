import { useMemo, useState } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
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
  CheckCircleOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import PageHeader from '../../components/common/PageHeader.jsx';
import BranchCard from './BranchCard.jsx';
import BranchForm from './BranchForm.jsx';
import GeoFenceDrawer from './GeoFenceDrawer.jsx';
import {
  useGetBranchesQuery,
  useGetBranchEmployeesQuery,
  useGetBranchTodayStatsQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} from '../../store/api/branchApi.js';
import { parseApiError } from '../../utils/errorHandler.js';

const geofenceFilters = [
  { label: 'All branches', value: 'all' },
  { label: 'Office only', value: 'office' },
  { label: 'Remote only', value: 'remote' },
  { label: 'Geofence ready', value: 'ready' },
  { label: 'Missing geofence', value: 'missing' },
];

export default function BranchesPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [employeeBranch, setEmployeeBranch] = useState(null);
  const [statsBranch, setStatsBranch] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showGeofence, setShowGeofence] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data, isLoading, isFetching } = useGetBranchesQuery();
  const { data: employeeData, isFetching: isEmployeesFetching } = useGetBranchEmployeesQuery(employeeBranch?.id, {
    skip: !employeeBranch?.id,
  });
  const { data: todayStats, isFetching: isStatsFetching } = useGetBranchTodayStatsQuery(statsBranch?.id, {
    skip: !statsBranch?.id,
  });
  const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();
  const [deleteBranch] = useDeleteBranchMutation();

  const branches = data?.branches || [];

  const stats = useMemo(
    () => ({
      total: branches.length,
      remote: branches.filter((branch) => branch.isRemote).length,
      missingGeofence: branches.filter((branch) => !branch.isRemote && !branch.hasGeofence).length,
      assignedEmployees: branches.reduce((sum, branch) => sum + (branch.employeeCount || 0), 0),
    }),
    [branches]
  );

  const filteredBranches = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return branches.filter((branch) => {
      const matchesSearch =
        !searchTerm ||
        branch.name?.toLowerCase().includes(searchTerm) ||
        branch.address?.toLowerCase().includes(searchTerm);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'office' && !branch.isRemote) ||
        (filter === 'remote' && branch.isRemote) ||
        (filter === 'ready' && (branch.hasGeofence || branch.isRemote)) ||
        (filter === 'missing' && !branch.isRemote && !branch.hasGeofence);

      return matchesSearch && matchesFilter;
    });
  }, [branches, filter, search]);

  const handleDelete = async (id) => {
    try {
      await deleteBranch(id).unwrap();
      message.success('Branch deleted');
    } catch (error) {
      message.error(parseApiError(error) || 'Failed to delete branch');
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
    {
      title: 'Department',
      dataIndex: ['department', 'name'],
      render: (value) => value || 'Unassigned',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (value) => <Tag>{value}</Tag>,
    },
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
        title="Branches"
        subtitle="Manage office branches, remote locations, employees, and geofence readiness"
        actions={[
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedBranch(null);
              setShowForm(true);
            }}
          >
            Add Branch
          </Button>,
        ]}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Total branches" value={stats.total} prefix={<EnvironmentOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Assigned employees" value={stats.assignedEmployees} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Remote branches" value={stats.remote} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Missing geofence"
              value={stats.missingGeofence}
              prefix={stats.missingGeofence > 0 ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />}
              valueStyle={{ color: stats.missingGeofence > 0 ? '#d97706' : '#16a34a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={14}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search branch name or address"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Col>
          <Col xs={24} md={10}>
            <Select style={{ width: '100%' }} value={filter} onChange={setFilter} options={geofenceFilters} />
          </Col>
        </Row>
      </Card>

      {isLoading || isFetching ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3].map((item) => (
            <Col xs={24} md={12} xl={8} key={item}>
              <Card>
                <Skeleton active paragraph={{ rows: 5 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : filteredBranches.length > 0 ? (
        <Row gutter={[16, 16]}>
          {filteredBranches.map((branch) => (
            <Col xs={24} md={12} xl={8} key={branch.id}>
              <BranchCard
                branch={branch}
                onEdit={(record) => {
                  setSelectedBranch(record);
                  setShowForm(true);
                }}
                onSetGeofence={(record) => {
                  setSelectedBranch(record);
                  setShowGeofence(true);
                }}
                onDelete={handleDelete}
                onViewEmployees={setEmployeeBranch}
                onViewStats={setStatsBranch}
              />
            </Col>
          ))}
        </Row>
      ) : (
        <Card>
          <Empty
            description={branches.length === 0 ? 'No branches created yet' : 'No branch matches these filters'}
          />
        </Card>
      )}

      <BranchForm
        open={showForm}
        branch={selectedBranch}
        onClose={() => setShowForm(false)}
        onSubmit={async (values) => {
          try {
            if (selectedBranch?.id) {
              await updateBranch({ id: selectedBranch.id, ...values }).unwrap();
              message.success('Branch updated');
            } else {
              const createdBranch = await createBranch(values).unwrap();
              message.success('Branch created. Set the geofence next.');
              setSelectedBranch(createdBranch);
              setShowGeofence(true);
            }
            setShowForm(false);
          } catch (error) {
            message.error(parseApiError(error) || 'Failed to save branch');
          }
        }}
        loading={isCreating || isUpdating}
      />

      <GeoFenceDrawer
        open={showGeofence}
        branch={selectedBranch}
        onClose={() => setShowGeofence(false)}
      />

      <Drawer
        title={employeeBranch ? `${employeeBranch.name} employees` : 'Branch employees'}
        open={Boolean(employeeBranch)}
        onClose={() => setEmployeeBranch(null)}
        width={880}
        extra={
          employeeBranch ? (
            <Button onClick={() => navigate(`/employees?branch=${employeeBranch.id}`)}>Open Employees</Button>
          ) : null
        }
      >
        <Table
          rowKey="id"
          loading={isEmployeesFetching}
          columns={employeeColumns}
          dataSource={employeeData?.employees || []}
          pagination={{ pageSize: 8 }}
        />
      </Drawer>

      <Drawer
        title={statsBranch ? `${statsBranch.name} today` : 'Today stats'}
        open={Boolean(statsBranch)}
        onClose={() => setStatsBranch(null)}
        width={620}
        extra={
          statsBranch ? (
            <Button onClick={() => navigate(`/attendance?branch=${statsBranch.id}`)}>Open Attendance</Button>
          ) : null
        }
      >
        <Skeleton active loading={isStatsFetching}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card>
                <Statistic title="Active employees" value={todayStats?.employeeCount || 0} />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic title="Checked in" value={todayStats?.checkedInCount || 0} />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic title="Present" value={todayStats?.presentCount || 0} />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic title="Late" value={todayStats?.lateCount || 0} />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic title="Absent" value={todayStats?.absentCount || 0} />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic title="Not marked" value={todayStats?.notMarkedCount || 0} />
              </Card>
            </Col>
          </Row>
        </Skeleton>
      </Drawer>
    </div>
  );
}
