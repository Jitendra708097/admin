import { Modal, Upload, Button, Progress, Table, message } from 'antd';
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

export default function BulkUpload({ open, loading, onUpload, onClose, results }) {
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
