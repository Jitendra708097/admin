/**
 * @module HolidaysPage
 * @description Holiday management with stats, filters, table, calendar, and CSV import.
 */
import { useMemo, useState } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  GlobalOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import PageHeader from '../../components/common/PageHeader.jsx';
import HolidayCalendar from './HolidayCalendar.jsx';
import HolidayForm from './HolidayForm.jsx';
import {
  useBulkImportHolidaysMutation,
  useCreateHolidayMutation,
  useDeleteHolidayMutation,
  useGetHolidaysQuery,
  useUpdateHolidayMutation,
} from '../../store/api/holidayApi.js';
import { useGetBranchesQuery } from '../../store/api/branchApi.js';
import { parseApiError } from '../../utils/errorHandler.js';

function parseCsv(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((value) => value.trim());
    return headers.reduce((row, header, index) => {
      row[header] = values[index] || '';
      return row;
    }, {});
  });
}

function ImportModal({ open, branches = [], loading, onCancel, onSubmit }) {
  const [text, setText] = useState('name,date,branchName,isRecurring,description\nRepublic Day,2026-01-26,,true,National holiday');

  const handleSubmit = () => {
    const rows = parseCsv(text);
    const holidays = rows.map((row) => {
      const branch = row.branchName
        ? branches.find((item) => item.name.toLowerCase() === row.branchName.toLowerCase())
        : null;

      return {
        name: row.name,
        date: row.date,
        branchId: branch?.id || null,
        isRecurring: String(row.isRecurring).toLowerCase() === 'true',
        description: row.description || '',
      };
    });

    onSubmit(holidays);
  };

  return (
    <Modal
      title="Bulk Import Holidays"
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Import"
      width={720}
    >
      <Typography.Paragraph type="secondary">
        Use CSV columns: name, date, branchName, isRecurring, description. Leave branchName empty for all branches.
      </Typography.Paragraph>
      <Input.TextArea rows={10} value={text} onChange={(event) => setText(event.target.value)} />
    </Modal>
  );
}

export default function HolidaysPage() {
  const { message } = App.useApp();
  const currentYear = dayjs().year();
  const [filters, setFilters] = useState({
    year: currentYear,
    month: undefined,
    branchId: undefined,
    scope: undefined,
    isRecurring: undefined,
    search: '',
  });
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const queryParams = {
    ...filters,
    search: filters.search || undefined,
    month: filters.month || undefined,
    branchId: filters.branchId || undefined,
    scope: filters.scope || undefined,
    isRecurring: filters.isRecurring,
  };

  const { data, isLoading, refetch } = useGetHolidaysQuery(queryParams);
  const { data: branchesData } = useGetBranchesQuery();
  const [createHoliday, { isLoading: isCreating }] = useCreateHolidayMutation();
  const [updateHoliday, { isLoading: isUpdating }] = useUpdateHolidayMutation();
  const [deleteHoliday, { isLoading: isDeleting }] = useDeleteHolidayMutation();
  const [bulkImportHolidays, { isLoading: isImporting }] = useBulkImportHolidaysMutation();

  const holidays = data?.holidays || [];
  const stats = data?.stats || {};
  const upcoming = data?.upcoming || [];
  const branches = branchesData?.branches || [];

  const branchOptions = useMemo(
    () => branches.map((branch) => ({ label: branch.name, value: branch.id })),
    [branches]
  );

  const handleSubmit = async (values) => {
    try {
      if (selectedHoliday) {
        await updateHoliday({ id: selectedHoliday.id, ...values }).unwrap();
        message.success('Holiday updated');
      } else {
        await createHoliday(values).unwrap();
        message.success('Holiday created');
      }
      setShowForm(false);
      setSelectedHoliday(null);
    } catch (error) {
      message.error(parseApiError(error));
    }
  };

  const handleDelete = async (holiday) => {
    try {
      await deleteHoliday(holiday.id).unwrap();
      message.success('Holiday deleted');
    } catch (error) {
      message.error(parseApiError(error));
    }
  };

  const handleImport = async (rows) => {
    if (!rows.length) {
      message.warning('No valid CSV rows found');
      return;
    }

    try {
      const response = await bulkImportHolidays({ holidays: rows }).unwrap();
      const errors = response?.results?.filter((result) => result.status === 'error') || [];
      setShowImport(false);
      message.success(`Import completed. ${rows.length - errors.length} added, ${errors.length} failed.`);
    } catch (error) {
      message.error(parseApiError(error));
    }
  };

  const columns = [
    {
      title: 'Holiday',
      dataIndex: 'name',
      key: 'name',
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
          {record.description ? <Typography.Text type="secondary">{record.description}</Typography.Text> : null}
        </Space>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: (value) => dayjs(value).format('DD MMM YYYY'),
      sorter: (left, right) => dayjs(left.date).valueOf() - dayjs(right.date).valueOf(),
    },
    {
      title: 'Scope',
      key: 'scope',
      width: 180,
      render: (_, record) => (
        <Tag color={record.branchId ? 'blue' : 'green'}>
          {record.branchName || 'All branches'}
        </Tag>
      ),
    },
    {
      title: 'Recurring',
      dataIndex: 'isRecurring',
      key: 'isRecurring',
      width: 120,
      render: (value) => <Tag color={value ? 'purple' : 'default'}>{value ? 'Yearly' : 'One-time'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedHoliday(record);
              setShowForm(true);
            }}
          />
          <Popconfirm title="Delete holiday?" onConfirm={() => handleDelete(record)}>
            <Button danger icon={<DeleteOutlined />} loading={isDeleting} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const resetFilters = () => {
    setFilters({
      year: currentYear,
      month: undefined,
      branchId: undefined,
      scope: undefined,
      isRecurring: undefined,
      search: '',
    });
  };

  const items = [
    {
      key: 'table',
      label: 'Holiday List',
      children: (
        <Card bordered={false}>
          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={holidays}
            columns={columns}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            locale={{ emptyText: <Empty description="No holidays found" /> }}
          />
        </Card>
      ),
    },
    {
      key: 'calendar',
      label: 'Calendar View',
      children: (
        <Card bordered={false}>
          <HolidayCalendar
            holidays={holidays}
            onSelectHoliday={(holiday) => {
              setSelectedHoliday(holiday);
              setShowForm(true);
            }}
          />
        </Card>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Holidays"
        subtitle="Manage global and branch-specific holidays for attendance calculations."
        actions={[
          <Button key="import" icon={<UploadOutlined />} onClick={() => setShowImport(true)}>
            Bulk Import
          </Button>,
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedHoliday(null);
              setShowForm(true);
            }}
          >
            Add Holiday
          </Button>,
        ]}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={5}><Card><Statistic title="Holidays" value={stats.total || 0} prefix={<CalendarOutlined />} /></Card></Col>
        <Col xs={24} sm={12} xl={5}><Card><Statistic title="Upcoming" value={stats.upcoming || 0} /></Card></Col>
        <Col xs={24} sm={12} xl={5}><Card><Statistic title="Global" value={stats.global || 0} prefix={<GlobalOutlined />} /></Card></Col>
        <Col xs={24} sm={12} xl={5}><Card><Statistic title="Branch Specific" value={stats.branchSpecific || 0} /></Card></Col>
        <Col xs={24} sm={12} xl={4}><Card><Statistic title="Recurring" value={stats.recurring || 0} /></Card></Col>
      </Row>

      <Card title="Upcoming Holidays" bordered={false}>
        {upcoming.length ? (
          <Space wrap>
            {upcoming.map((holiday) => (
              <Tag key={holiday.id} color={holiday.branchId ? 'blue' : 'green'}>
                {dayjs(holiday.date).format('DD MMM')} - {holiday.name}
              </Tag>
            ))}
          </Space>
        ) : (
          <Empty description="No upcoming holidays in this view" />
        )}
      </Card>

      <Card bordered={false}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={6}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search holiday"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            />
          </Col>
          <Col xs={24} md={8} lg={4}>
            <DatePicker
              picker="year"
              style={{ width: '100%' }}
              value={filters.year ? dayjs(String(filters.year), 'YYYY') : null}
              onChange={(value) => setFilters((current) => ({ ...current, year: value ? value.year() : undefined }))}
            />
          </Col>
          <Col xs={24} md={8} lg={4}>
            <Select
              allowClear
              placeholder="Month"
              style={{ width: '100%' }}
              value={filters.month}
              onChange={(value) => setFilters((current) => ({ ...current, month: value }))}
              options={Array.from({ length: 12 }, (_, index) => ({
                label: dayjs().month(index).format('MMMM'),
                value: index + 1,
              }))}
            />
          </Col>
          <Col xs={24} md={8} lg={4}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Branch"
              style={{ width: '100%' }}
              value={filters.branchId}
              onChange={(value) => setFilters((current) => ({ ...current, branchId: value }))}
              options={branchOptions}
            />
          </Col>
          <Col xs={24} md={8} lg={3}>
            <Select
              allowClear
              placeholder="Scope"
              style={{ width: '100%' }}
              value={filters.scope}
              onChange={(value) => setFilters((current) => ({ ...current, scope: value }))}
              options={[
                { label: 'Global', value: 'global' },
                { label: 'Branch', value: 'branch' },
              ]}
            />
          </Col>
          <Col xs={24} md={8} lg={3}>
            <Select
              allowClear
              placeholder="Recurring"
              style={{ width: '100%' }}
              value={filters.isRecurring}
              onChange={(value) => setFilters((current) => ({ ...current, isRecurring: value }))}
              options={[
                { label: 'Recurring', value: true },
                { label: 'One-time', value: false },
              ]}
            />
          </Col>
        </Row>
        <div className="mt-4">
          <Space>
            <Button icon={<ReloadOutlined />} onClick={resetFilters}>Clear Filters</Button>
            <Button onClick={() => refetch()}>Refresh</Button>
          </Space>
        </div>
      </Card>

      <Tabs defaultActiveKey="table" items={items} />

      <HolidayForm
        open={showForm}
        holiday={selectedHoliday}
        branches={branches}
        onClose={() => {
          setShowForm(false);
          setSelectedHoliday(null);
        }}
        onSubmit={handleSubmit}
        loading={isCreating || isUpdating}
      />

      <ImportModal
        open={showImport}
        branches={branches}
        loading={isImporting}
        onCancel={() => setShowImport(false)}
        onSubmit={handleImport}
      />
    </div>
  );
}
