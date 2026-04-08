/**
 * @module InvoiceTable
 * @description Invoice payment history table.
 */
import { Table, Button, Tag, Space } from 'antd';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

export default function InvoiceTable({ data, loading, payingInvoiceId, onDownload, onPay }) {
  const columns = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => formatCurrency(amount, record.currency || 'INR'),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => formatDate(date),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => (date ? formatDate(date) : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === 'paid' ? 'green' : status === 'due' ? 'orange' : 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status !== 'paid' && (
            <Button
              type="primary"
              loading={payingInvoiceId === record.id}
              onClick={() => onPay(record)}
            >
              Pay Now
            </Button>
          )}
          <Button type="link" onClick={() => onDownload(record.id)}>
            {record.status === 'paid' ? 'Download' : 'Preview'}
          </Button>
        </Space>
      ),
    },
  ];

  return <Table rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={false} />;
}
