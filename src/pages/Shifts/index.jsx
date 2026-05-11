import { useMemo, useState } from 'react';
import { App as AntdApp, Button, Card, Drawer, Empty, Input, Select, Space, Statistic, Table, Tag } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader.jsx';
import ShiftCard from './ShiftCard.jsx';
import ShiftForm from './ShiftForm.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import {
  useGetShiftsQuery,
  useGetShiftEmployeesQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
} from '../../store/api/shiftApi.js';

function isNightShift(shift) {
  return Boolean(shift.crossesMidnight);
}

function shiftMatchesSearch(shift, search) {
  const normalized = search.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [
    shift.name,
    shift.startTime,
    shift.endTime,
    String(shift.employeeCount || 0),
  ].some((value) => String(value || '').toLowerCase().includes(normalized));
}

export default function ShiftsPage() {
  const { message } = AntdApp.useApp();
  const [selectedShift, setSelectedShift] = useState(null);
  const [draftShift, setDraftShift] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [employeeShift, setEmployeeShift] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data, isLoading } = useGetShiftsQuery();
  const { data: shiftEmployeesData, isLoading: isLoadingEmployees } = useGetShiftEmployeesQuery(employeeShift?.id, {
    skip: !employeeShift?.id,
  });
  const [createShift, { isLoading: isCreating }] = useCreateShiftMutation();
  const [updateShift, { isLoading: isUpdating }] = useUpdateShiftMutation();
  const [deleteShift, { isLoading: isDeleting }] = useDeleteShiftMutation();

  const shifts = data?.shifts || [];
  const filteredShifts = useMemo(() => shifts.filter((shift) => {
    if (!shiftMatchesSearch(shift, search)) {
      return false;
    }

    if (filter === 'day') {
      return !isNightShift(shift);
    }

    if (filter === 'night') {
      return isNightShift(shift);
    }

    if (filter === 'unassigned') {
      return Number(shift.employeeCount || 0) === 0;
    }

    return true;
  }), [filter, search, shifts]);

  const stats = useMemo(() => ({
    total: shifts.length,
    night: shifts.filter(isNightShift).length,
    assignedEmployees: shifts.reduce((sum, shift) => sum + Number(shift.employeeCount || 0), 0),
    unassigned: shifts.filter((shift) => Number(shift.employeeCount || 0) === 0).length,
  }), [shifts]);

  const employeeColumns = [
    {
      title: 'Employee',
      dataIndex: 'name',
      key: 'name',
      render: (value, record) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-gray-500">{record.empCode || record.email || '-'}</div>
        </div>
      ),
    },
    { title: 'Department', dataIndex: 'departmentName', key: 'departmentName', render: (value) => value || '-' },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (value) => <Tag>{value}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (value) => <StatusBadge status={value} /> },
  ];

  const openCreate = () => {
    setSelectedShift(null);
    setDraftShift(null);
    setShowForm(true);
  };

  const openDuplicate = (shift) => {
    setSelectedShift(null);
    setDraftShift({
      ...shift,
      name: `Copy of ${shift.name}`,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteShift(id).unwrap();
      message.success('Shift deleted');
    } catch (error) {
      message.error(error?.data?.error?.message || 'Unable to delete shift');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (selectedShift?.id) {
        await updateShift({ id: selectedShift.id, ...values }).unwrap();
        message.success('Shift updated');
      } else {
        await createShift(values).unwrap();
        message.success('Shift created');
      }
      setShowForm(false);
      setDraftShift(null);
    } catch (error) {
      message.error(error?.data?.error?.message || 'Unable to save shift');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shifts"
        subtitle="Manage attendance windows, thresholds, sessions, and work days"
        actions={[
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add Shift
          </Button>,
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card bordered={false}><Statistic title="Total Shifts" value={stats.total} /></Card>
        <Card bordered={false}><Statistic title="Night Shifts" value={stats.night} /></Card>
        <Card bordered={false}><Statistic title="Assigned Employees" value={stats.assignedEmployees} /></Card>
        <Card bordered={false}><Statistic title="Unassigned Shifts" value={stats.unassigned} /></Card>
      </div>

      <Card bordered={false}>
        <Space wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search shifts"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ width: 260 }}
          />
          <Select
            value={filter}
            onChange={setFilter}
            style={{ width: 180 }}
            options={[
              { label: 'All shifts', value: 'all' },
              { label: 'Day shifts', value: 'day' },
              { label: 'Night shifts', value: 'night' },
              { label: 'Unassigned', value: 'unassigned' },
            ]}
          />
        </Space>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Card key={item} loading bordered={false} />
          ))}
        </div>
      ) : filteredShifts.length === 0 ? (
        <Card bordered={false}>
          <Empty
            description={shifts.length === 0 ? 'No shifts configured yet' : 'No shifts match the current filter'}
          >
            {shifts.length === 0 ? <Button type="primary" onClick={openCreate}>Create first shift</Button> : null}
          </Empty>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredShifts.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              onEdit={(record) => {
                setDraftShift(null);
                setSelectedShift(record);
                setShowForm(true);
              }}
              onDelete={handleDelete}
              onDuplicate={openDuplicate}
              onViewEmployees={setEmployeeShift}
            />
          ))}
        </div>
      )}

      <ShiftForm
        open={showForm}
        shift={selectedShift}
        initialValues={draftShift}
        onClose={() => {
          setShowForm(false);
          setDraftShift(null);
        }}
        onSubmit={handleSubmit}
        loading={isCreating || isUpdating || isLoading}
      />

      <Drawer
        title={employeeShift ? `${employeeShift.name} employees` : 'Shift employees'}
        open={Boolean(employeeShift)}
        onClose={() => setEmployeeShift(null)}
        width={720}
      >
        <Table
          rowKey="id"
          columns={employeeColumns}
          dataSource={shiftEmployeesData?.employees || []}
          loading={isLoadingEmployees || isDeleting}
          pagination={false}
          scroll={{ x: 640 }}
        />
      </Drawer>
    </div>
  );
}
