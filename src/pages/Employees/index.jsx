import { useState } from 'react';
import { Card, Button, Input, Select, Row, Col } from 'antd';
import { PlusOutlined, UploadOutlined, SearchOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmployeeTable from './EmployeeTable.jsx';
import EmployeeForm from './EmployeeForm.jsx';
import BulkUpload from './BulkUpload.jsx';
import LeaveBalanceModal from './LeaveBalanceModal.jsx';
import {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useResendInviteMutation,
  useUpdateLeaveBalanceMutation,
  useBulkUploadEmployeesMutation,
} from '../../store/api/employeeApi.js';
import { useDebounce } from '../../hooks/useDebounce.js';

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showLeaveBalance, setShowLeaveBalance] = useState(false);
  const [branch, setBranch] = useState();
  const [status, setStatus] = useState();
  const [pagination] = useState({ current: 1, pageSize: 10 });

  const debouncedSearch = useDebounce(search);
  const { data, isLoading } = useGetEmployeesQuery({
    search: debouncedSearch,
    branch,
    status,
    page: pagination.current,
    limit: pagination.pageSize,
  });
  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();
  const [deleteEmployee] = useDeleteEmployeeMutation();
  const [resendInvite] = useResendInviteMutation();
  const [updateLeaveBalance] = useUpdateLeaveBalanceMutation();
  const [bulkUploadEmployees, { isLoading: isUploading }] = useBulkUploadEmployeesMutation();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        subtitle="Manage organization employees"
        actions={[
          <Button key="bulk" icon={<UploadOutlined />} onClick={() => setShowBulk(true)}>
            Bulk Upload
          </Button>,
          <Button
            key="add"
            type="primary"
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

      <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Input
              placeholder="Search by name or email..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select placeholder="Branch" style={{ width: '100%' }} allowClear onChange={setBranch} />
          </Col>
          <Col xs={24} md={6}>
            <Select
              placeholder="Status"
              style={{ width: '100%' }}
              allowClear
              onChange={setStatus}
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ]}
            />
          </Col>
        </Row>
      </div>

      <Card className="bg-white shadow border border-gray-100">
        <EmployeeTable
          data={data?.employees || []}
          loading={isLoading}
          onEdit={(employee) => {
            setSelectedEmployee(employee);
            setShowForm(true);
          }}
          onDelete={(id) => deleteEmployee(id)}
          onResendInvite={(id) => resendInvite(id)}
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
          } else {
            await createEmployee(values);
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
          await bulkUploadEmployees(formData);
          setShowBulk(false);
        }}
        onClose={() => setShowBulk(false)}
        results={null}
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
