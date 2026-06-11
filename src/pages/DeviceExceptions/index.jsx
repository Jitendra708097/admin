/**
 * @module DeviceExceptionsPage
 * @description Device exception approvals.
 */
import { Alert, App, Card, Empty, Pagination, Tabs } from 'antd';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import PageHeader from '../../components/common/PageHeader.jsx';
import ExceptionCard from './ExceptionCard.jsx';
import { useGetDeviceExceptionsQuery, useApproveDeviceExceptionMutation, useRejectDeviceExceptionMutation } from '../../store/api/deviceExceptionApi.js';
import { parseApiError } from '../../utils/errorHandler.js';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'used', label: 'Used' },
  { key: 'expired', label: 'Expired' },
  { key: 'rejected', label: 'Rejected' },
];

export default function DeviceExceptionsPage() {
  const { message } = App.useApp();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');
  const empId = searchParams.get('empId');
  const [pendingAction, setPendingAction] = useState(null);
  const [status, setStatus] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const { data, isLoading } = useGetDeviceExceptionsQuery({
    requestId: requestId || undefined,
    empId: empId || undefined,
    status: requestId || status === 'all' ? undefined : status,
    page: pagination.current,
    limit: pagination.pageSize,
  });
  const [approveException] = useApproveDeviceExceptionMutation();
  const [rejectException] = useRejectDeviceExceptionMutation();
  const exceptions = data?.exceptions || [];

  const handleApprove = async (id) => {
    setPendingAction({ id, action: 'approve' });
    try {
      await approveException({ id }).unwrap();
      message.success('Device exception approved');
    } catch (error) {
      message.error(parseApiError(error));
    } finally {
      setPendingAction(null);
    }
  };

  const handleReject = async (id) => {
    setPendingAction({ id, action: 'reject' });
    try {
      await rejectException({ id }).unwrap();
      message.success('Device exception rejected');
    } catch (error) {
      message.error(parseApiError(error));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Device Exceptions" subtitle="Review device access requests and history" />

      <Card className="m-6">
        <Tabs
          activeKey={status}
          items={STATUS_TABS}
          onChange={(nextStatus) => {
            setStatus(nextStatus);
            setPagination((current) => ({ ...current, current: 1 }));
          }}
        />

        {requestId && !isLoading && exceptions.length === 0 ? (
          <Alert type="warning" showIcon message="Device exception request was not found or is no longer available." />
        ) : null}

        {!isLoading && exceptions.length === 0 && !requestId ? <Empty description="No device exception requests" /> : null}

        {exceptions.map((exception) => (
          <ExceptionCard
            key={exception.id}
            exception={exception}
            highlighted={requestId && String(exception.id) === String(requestId)}
            onApprove={handleApprove}
            onReject={handleReject}
            approveLoading={pendingAction?.id === exception.id && pendingAction?.action === 'approve'}
            rejectLoading={pendingAction?.id === exception.id && pendingAction?.action === 'reject'}
          />
        ))}

        {(data?.pagination?.total || data?.total || 0) > pagination.pageSize ? (
          <div className="flex justify-end mt-4">
            <Pagination
              current={data?.pagination?.page || pagination.current}
              pageSize={data?.pagination?.limit || pagination.pageSize}
              total={data?.pagination?.total || data?.total || 0}
              showSizeChanger
              onChange={(current, pageSize) => setPagination({ current, pageSize })}
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
