import { App, Alert, Button, Modal, Progress, Table, Typography, Upload } from 'antd';
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useMemo } from 'react';
import { useGetBranchesQuery } from '../../store/api/branchApi.js';
import { useGetDepartmentsQuery } from '../../store/api/departmentApi.js';
import { useGetShiftsQuery } from '../../store/api/shiftApi.js';

const BULK_UPLOAD_LIMIT = 500;

export default function BulkUpload({ open, loading, onUpload, onClose, results }) {
  const { message } = App.useApp();
  const { data: branches } = useGetBranchesQuery(undefined, { skip: !open });
  const { data: departments } = useGetDepartmentsQuery(undefined, { skip: !open });
  const { data: shifts } = useGetShiftsQuery(undefined, { skip: !open });

  const columns = [
    { title: 'Row', dataIndex: 'row', key: 'row' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) =>
        status === 'success' ? (
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
        ) : (
          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
        ),
    },
    { title: 'Message', dataIndex: 'message', key: 'message' },
  ];

  const templateRows = useMemo(() => {
    const branchName = branches?.branches?.[0]?.name || 'Main Branch';
    const departmentName = departments?.departments?.[0]?.name || 'Administration';
    const shiftName = shifts?.shifts?.[0]?.name || 'General Shift';

    return [
      ['name', 'email', 'phone', 'branch_name', 'department_name', 'shift_name', 'role', 'emp_code'],
      ['Rahul Sharma', 'rahul@company.com', '9876543210', branchName, departmentName, shiftName, 'employee', 'EMP001'],
      ['Priya Singh', 'priya@company.com', '9876543211', branchName, '', shiftName, 'manager', ''],
    ];
  }, [branches, departments, shifts]);

  const handleDownloadTemplate = () => {
    const csv = templateRows
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'employee-bulk-upload-template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const customRequest = ({ file }) => {
    const fileName = String(file.name || '').toLowerCase();

    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      message.error('Please upload an Excel file.');
      return;
    }

    onUpload(file);
  };

  return (
    <Modal
      title="Bulk Upload Employees"
      open={open}
      onCancel={onClose}
      width={700}
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Use branch, department, and shift names from your system. IDs also work, but names are easier."
        description={
          <div>
            <Typography.Paragraph style={{ marginBottom: 8 }}>
              Required columns: <strong>name</strong>, <strong>email</strong>, <strong>branch_name</strong> or <strong>branch_id</strong>, <strong>shift_name</strong> or <strong>shift_id</strong>, <strong>role</strong>.
            </Typography.Paragraph>
            <Typography.Paragraph style={{ marginBottom: 8 }}>
              Upload limit: <strong>{BULK_UPLOAD_LIMIT} employees</strong> per file. Use branch, department, and shift names exactly as they appear in the system.
            </Typography.Paragraph>
            <Button size="small" onClick={handleDownloadTemplate}>
              Download Template
            </Button>
          </div>
        }
      />
      {!results ? (
        <Upload customRequest={customRequest} accept=".xlsx,.xls" showUploadList={false}>
          <Button icon={<UploadOutlined />} loading={loading}>
            Upload Excel File
          </Button>
        </Upload>
      ) : (
        <>
          <Progress percent={100} />
          <Table columns={columns} dataSource={results} pagination={false} rowKey="row" style={{ marginTop: 16 }} />
        </>
      )}
    </Modal>
  );
}
