/**
 * @module RegularisationsPage
 * @description Regularisation requests list with approval.
 */
import { useEffect, useRef, useState } from 'react';
import { App, Card } from 'antd';
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

export default function RegularisationsPage() {
  const { message } = App.useApp();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');
  const openedRequestRef = useRef(null);
  const [selectedReg, setSelectedReg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const role = useSelector((state) => state.auth.user?.role || 'admin');

  const { data, isLoading } = useGetRegularisationsQuery({ requestId: requestId || undefined });
  const [managerApproveReg, { isLoading: isManagerApproving }] = useManagerApproveRegularisationMutation();
  const [rejectReg, { isLoading: isRejecting }] = useRejectRegularisationMutation();
  const [approveReg, { isLoading: isApproving }] = useApproveRegularisationMutation();

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
      <PageHeader title="Regularisations" subtitle="Review and approve regularisation requests" />

      <Card style={{ marginTop: 16 }}>
        <RegTable
          data={data?.regularisations || []}
          loading={isLoading}
          onView={(record) => {
            setSelectedReg(record);
            setShowModal(true);
          }}
        />
      </Card>

      <RegApprovalModal
        open={showModal}
        reg={selectedReg}
        role={role}
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
