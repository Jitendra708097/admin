/**
 * @module DeviceExceptionsPage
 * @description Device exception approvals.
 */
import { Alert, App, Card, Empty } from 'antd';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import PageHeader from '../../components/common/PageHeader.jsx';
import ExceptionCard from './ExceptionCard.jsx';
import { useGetDeviceExceptionsQuery, useApproveDeviceExceptionMutation, useRejectDeviceExceptionMutation } from '../../store/api/deviceExceptionApi.js';
import { parseApiError } from '../../utils/errorHandler.js';

export default function DeviceExceptionsPage() {
  const { message } = App.useApp();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');
  const empId = searchParams.get('empId');
  const [pendingAction, setPendingAction] = useState(null);
  const { data, isLoading } = useGetDeviceExceptionsQuery({
    requestId: requestId || undefined,
    empId: empId || undefined,
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
      <PageHeader title="Device Exceptions" subtitle="Approve device access exceptions" />

      <Card className="m-6">
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
      </Card>
    </div>
  );
}
