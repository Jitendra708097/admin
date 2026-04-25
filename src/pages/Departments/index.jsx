/**
 * @module DepartmentsPage
 * @description Department hierarchy management.
 */
import { useState } from 'react';
import { App, Card, Button, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader.jsx';
import DepartmentTree from './DepartmentTree.jsx';
import DepartmentForm from './DepartmentForm.jsx';
import {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} from '../../store/api/departmentApi.js';
import { parseApiError } from '../../utils/errorHandler.js';

export default function DepartmentsPage() {
  const { message } = App.useApp();
  const [selectedDept, setSelectedDept] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useGetDepartmentsQuery();
  const [createDept, { isLoading: isCreating }] = useCreateDepartmentMutation();
  const [updateDept, { isLoading: isUpdating }] = useUpdateDepartmentMutation();
  const [deleteDept] = useDeleteDepartmentMutation();

  const handleDelete = async (id) => {
    try {
      await deleteDept(id).unwrap();
      message.success('Department deleted successfully');
    } catch (error) {
      message.error(parseApiError(error));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Departments"
        subtitle="Manage department hierarchy"
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

      <Card className="m-6">
        <Spin spinning={isLoading}>
          <DepartmentTree
            data={data?.departments || []}
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
        </Spin>
      </Card>

      <DepartmentForm
        open={showForm}
        department={selectedDept}
        departments={data?.departments || []}
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
    </div>
  );
}
