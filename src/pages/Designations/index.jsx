import { useMemo, useState } from 'react';
import { App, Button, Card, Empty, Input, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined, TagsOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader.jsx';
import {
  useCreateDesignationMutation,
  useDeleteDesignationMutation,
  useGetDesignationsQuery,
  useUpdateDesignationMutation,
} from '../../store/api/designationApi.js';
import { parseApiError } from '../../utils/errorHandler.js';
import DesignationForm from './DesignationForm.jsx';

export default function DesignationsPage() {
  const { message } = App.useApp();
  const [search, setSearch] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const { data, isLoading, isFetching } = useGetDesignationsQuery();
  const [createDesignation, { isLoading: isCreating }] = useCreateDesignationMutation();
  const [updateDesignation, { isLoading: isUpdating }] = useUpdateDesignationMutation();
  const [deleteDesignation] = useDeleteDesignationMutation();

  const designations = data?.designations || [];
  const filteredDesignations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return designations;
    }

    return designations.filter((item) =>
      item.name?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term)
    );
  }, [designations, search]);

  const openCreate = () => {
    setSelectedDesignation(null);
    setShowForm(true);
  };

  const openEdit = (designation) => {
    setSelectedDesignation(designation);
    setShowForm(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (selectedDesignation?.id) {
        await updateDesignation({ id: selectedDesignation.id, ...values }).unwrap();
        message.success('Designation updated');
      } else {
        await createDesignation(values).unwrap();
        message.success('Designation created');
      }

      setShowForm(false);
      setSelectedDesignation(null);
    } catch (error) {
      message.error(parseApiError(error));
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteDesignation(id).unwrap();
      message.success('Designation deleted');
    } catch (error) {
      message.error(parseApiError(error));
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      title: 'Designation',
      dataIndex: 'name',
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary">{record.description || 'No description'}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      width: 120,
      render: (value) => <Tag color={value ? 'success' : 'default'}>{value ? 'Active' : 'Inactive'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="Delete designation?"
            description="Assigned designations cannot be deleted until employees are reassigned."
            okText="Delete"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Designations"
        subtitle="Manage organisation job titles used on employee profiles and reports"
        actions={[
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            New Designation
          </Button>,
        ]}
      />

      <Card bordered={false}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Space>
              <TagsOutlined />
              <Typography.Text strong>{designations.length} designations</Typography.Text>
            </Space>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search designations"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ maxWidth: 320 }}
            />
          </div>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredDesignations}
            loading={isLoading || isFetching}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            locale={{ emptyText: <Empty description="No designations found" /> }}
          />
        </Space>
      </Card>

      <DesignationForm
        open={showForm}
        designation={selectedDesignation}
        loading={isCreating || isUpdating}
        onClose={() => {
          setShowForm(false);
          setSelectedDesignation(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
