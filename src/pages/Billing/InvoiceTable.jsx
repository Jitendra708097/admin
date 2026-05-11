/**
 * @module InvoiceTable
 * @description Invoice payment history table.
 */
import { Button, Empty, Space, Table, Tag, Typography } from 'antd';
import { DownloadOutlined, EyeOutlined, WalletOutlined } from '@ant-design/icons';
import Skeleton from '../../components/common/Skeleton.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

function getInvoiceStatus(record) {
  if (record.isOverdue) return 'overdue';
  return record.status || 'due';
}

function getStatusColor(status) {
  if (status === 'paid') return 'green';
  if (status === 'overdue') return 'red';
  if (status === 'due') return 'orange';
  return 'default';
}

function formatPeriod(period) {
  if (!period?.start || !period?.end) {
    return '-';
  }

  return `${formatDate(period.start)} - ${formatDate(period.end)}`;
}

export default function InvoiceTable({ data, loading, payingInvoiceId, onDownload, onPay }) {
  const columns = [
    {
      title: 'Invoice',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary">{record.isCurrent ? 'Current invoice' : 'Historical invoice'}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'planLabel',
      key: 'planLabel',
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{value || record.plan || '-'}</Typography.Text>
          <Typography.Text type="secondary">{record.employeeCount || 0} employees</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
      render: formatPeriod,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount, record) => formatCurrency(amount, record.currency || 'INR'),
    },
    {
      title: 'Invoice Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => (date ? formatDate(date) : '-'),
    },
    {
      title: 'Due/Paid',
      key: 'duePaid',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{record.dueDate ? formatDate(record.dueDate) : '-'}</Typography.Text>
          {record.paidAt ? <Typography.Text type="secondary">Paid {formatDate(record.paidAt)}</Typography.Text> : null}
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const status = getInvoiceStatus(record);
        return <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      render: (_, record) => {
        const status = getInvoiceStatus(record);
        return (
          <Space>
            {status !== 'paid' && (
              <Button
                type="primary"
                icon={<WalletOutlined />}
                loading={payingInvoiceId === record.id}
                onClick={() => onPay(record)}
              >
                Pay
              </Button>
            )}
            <Button
              type="link"
              icon={record.status === 'paid' ? <DownloadOutlined /> : <EyeOutlined />}
              onClick={() => onDownload(record.id)}
            >
              {record.status === 'paid' ? 'Download' : 'Preview'}
            </Button>
          </Space>
        );
      },
    },
  ];

  if (loading) {
    return <Skeleton active paragraph={{ rows: 5 }} />;
  }

  if (!data.length) {
    return <Empty description="No invoices found" />;
  }

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      pagination={{ pageSize: 8 }}
      scroll={{ x: 1100 }}
    />
  );
}
