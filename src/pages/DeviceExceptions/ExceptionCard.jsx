/**
 * @module ExceptionCard
 * @description Device exception approval card.
 */
import { Card, Button, Space, Tag } from 'antd';

export default function ExceptionCard({ exception, onApprove, onReject, loading, highlighted = false }) {
  return (
    <Card className="mb-4" styles={{ body: highlighted ? { borderLeft: '4px solid #1677ff' } : undefined }}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold">{exception.tempDeviceId || 'Temporary device'}</h4>
          <p className="text-gray-600 text-sm">{exception.reason || 'No reason provided'}</p>
          <p className="text-gray-500 text-xs mt-2">
            Requested by: {exception.employeeName || exception.requestedBy || 'Employee'}
          </p>
        </div>
        <Tag>{exception.status}</Tag>
      </div>
      <Space className="mt-4">
        <Button
          type="primary"
          size="small"
          loading={loading}
          onClick={() => onApprove(exception.id)}
        >
          Approve
        </Button>
        <Button
          danger
          size="small"
          loading={loading}
          onClick={() => onReject(exception.id)}
        >
          Reject
        </Button>
      </Space>
    </Card>
  );
}
