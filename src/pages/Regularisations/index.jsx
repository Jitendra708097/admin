/**
 * @module RegularisationsPage
 * @description Regularisation requests list with approval.
 */
import { useEffect, useRef, useState } from 'react';
import { App, Card, Tabs } from 'antd';
import { useSearchParams } from 'react-router';
import { useSelector } from 'react-redux';
import PageHeader from '../../components/common/PageHeader.jsx';
import RegTable from './RegTable.jsx';
import RegApprovalModal from './RegApprovalModal.jsx';
import {
  useGetRegularisationsQuery,
  useManagerApproveRegularisationMutation,
  useApproveRegularisationMutation,
  useRejectRegularisationMutation,
} from '../../store/api/regularisationApi.js';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'manager_approved', label: 'Manager Approved' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const REVIEWABLE_STATUSES = ['pending', 'manager_approved'];

export default function RegularisationsPage() {
  const { message } = App.useApp();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');
  const openedRequestRef = useRef(null);
  const [selectedReg, setSelectedReg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const role = useSelector((state) => state.auth.user?.role || 'admin');
  const [status, setStatus] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const { data, isLoading } = useGetRegularisationsQuery({
    reviewOnly: role === 'manager',
    requestId: requestId || undefined,
    status: requestId || status === 'all' ? undefined : status,
    page: pagination.current,
    limit: pagination.pageSize,
  });
  const [managerApproveReg, { isLoading: isManagerApproving }] = useManagerApproveRegularisationMutation();
  const [rejectReg, { isLoading: isRejecting }] = useRejectRegularisationMutation();
  const [approveReg, { isLoading: isApproving }] = useApproveRegularisationMutation();

  const canReview = (record) => {
    if (!record) {
      return false;
    }

    if (role === 'manager') {
      return record.status === 'pending';
    }

    return REVIEWABLE_STATUSES.includes(record.status);
  };

  const handleDecision = async (action, id, values = {}) => {
    try {
      if (action === 'manager-approve') {
        await managerApproveReg({ id }).unwrap();
        message.success('Regularisation moved to admin review');
      } else if (action === 'approve') {
        await approveReg({ id, ...values }).unwrap();
        message.success('Regularisation approved');
      } else {
        await rejectReg({ id, ...values }).unwrap();
        message.success('Regularisation rejected');
      }

      setShowModal(false);
      setSelectedReg(null);
    } catch (error) {
      message.error(error?.data?.error?.message || 'Unable to update regularisation');
    }
  };

  const handleStatusChange = (nextStatus) => {
    setStatus(nextStatus);
    setPagination((current) => ({ ...current, current: 1 }));
  };

  useEffect(() => {
    if (!requestId) {
      openedRequestRef.current = null;
      return;
    }

    const regularisations = data?.regularisations || [];
    const matchedReg = regularisations.find((record) => String(record.id) === String(requestId));

    if (matchedReg && openedRequestRef.current !== requestId) {
      openedRequestRef.current = requestId;
      setSelectedReg(matchedReg);
      setShowModal(true);
    }
  }, [data?.regularisations, requestId]);

  return (
    <div className="space-y-6">
      <PageHeader title="Regularisations" subtitle="Review requests and inspect regularisation history" />

      <Card style={{ marginTop: 16 }}>
        {role !== 'manager' ? (
          <Tabs
            activeKey={status}
            items={STATUS_TABS}
            onChange={handleStatusChange}
          />
        ) : null}
        <RegTable
          data={data?.regularisations || []}
          loading={isLoading}
          canReview={canReview}
          onView={(record) => {
            setSelectedReg(record);
            setShowModal(true);
          }}
          pagination={{
            current: data?.pagination?.page || pagination.current,
            pageSize: data?.pagination?.limit || pagination.pageSize,
            total: data?.pagination?.total || data?.total || 0,
            showSizeChanger: true,
          }}
          onPaginationChange={(nextPagination) =>
            setPagination({
              current: nextPagination.current,
              pageSize: nextPagination.pageSize,
            })
          }
        />
      </Card>

      <RegApprovalModal
        open={showModal}
        reg={selectedReg}
        role={role}
        canReview={canReview(selectedReg)}
        onApprove={(id, values) => handleDecision(role === 'manager' ? 'manager-approve' : 'approve', id, values)}
        onReject={(id, values) => handleDecision('reject', id, values)}
        onClose={() => {
          setShowModal(false);
          setSelectedReg(null);
        }}
        loading={isApproving || isRejecting || isManagerApproving}
      />
    </div>
  );
}
