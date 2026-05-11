/**
 * @module DeviceExceptionsPage
 * @description Device exception approvals.
 */
import { Alert, Card, Empty } from 'antd';
import { useSearchParams } from 'react-router';
import PageHeader from '../../components/common/PageHeader.jsx';
import ExceptionCard from './ExceptionCard.jsx';
import { useGetDeviceExceptionsQuery, useApproveDeviceExceptionMutation, useRejectDeviceExceptionMutation } from '../../store/api/deviceExceptionApi.js';

export default function DeviceExceptionsPage() {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');
  const empId = searchParams.get('empId');
  const { data, isLoading } = useGetDeviceExceptionsQuery({
    requestId: requestId || undefined,
    empId: empId || undefined,
  });
  const [approveException] = useApproveDeviceExceptionMutation();
  const [rejectException] = useRejectDeviceExceptionMutation();
  const exceptions = data?.exceptions || [];

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
            onApprove={(id) => approveException({ id })}
            onReject={(id) => rejectException({ id })}
            loading={isLoading}
          />
        ))}
      </Card>
    </div>
  );
}
