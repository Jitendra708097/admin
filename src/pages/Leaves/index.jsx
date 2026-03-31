/**
 * @module LeavesPage
 * @description Leave requests management with approval workflow and calendar view.
 */
import { useState } from 'react';
import { App as AntdApp, Card, Tabs } from 'antd';
import PageHeader from '../../components/common/PageHeader.jsx';
import LeaveTable from './LeaveTable.jsx';
import LeaveCalendar from './LeaveCalendar.jsx';
import LeaveApprovalModal from './LeaveApprovalModal.jsx';
import { useGetLeavesQuery, useApproveLeaveMutation, useRejectLeaveMutation } from '../../store/api/leaveApi.js';

export default function LeavesPage() {
  const { message } = AntdApp.useApp();
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pagination] = useState({ current: 1, pageSize: 10 });

  const { data, isLoading } = useGetLeavesQuery({ limit: pagination.pageSize });
  const [approveLeave, { isLoading: approving }] = useApproveLeaveMutation();
  const [rejectLeave, { isLoading: rejecting }] = useRejectLeaveMutation();
  const leaves = data?.leaves || [];

  const items = [
    {
      key: 'list',
      label: 'List View',
      children: (
        <Card>
          <LeaveTable
            data={leaves}
            loading={isLoading}
            onApprove={(leave) => {
              setSelectedLeave(leave);
              setShowApprovalModal(true);
            }}
            onReject={(leave) => {
              setSelectedLeave(leave);
              setShowApprovalModal(true);
            }}
            pagination={pagination}
          />
        </Card>
      ),
    },
    {
      key: 'calendar',
      label: 'Calendar View',
      children: (
        <Card>
          <LeaveCalendar leaves={leaves} />
        </Card>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Leaves" subtitle="Manage and approve employee leave requests" />

      <Tabs items={items} />

      <LeaveApprovalModal
        open={showApprovalModal}
        leave={selectedLeave}
        leaveBalance={{}}
        onApprove={async (id) => {
          await approveLeave({ id }).unwrap();
          message.success('Leave approved');
          setShowApprovalModal(false);
        }}
        onReject={async (id, note) => {
          await rejectLeave({ id, reason: note }).unwrap();
          message.success('Leave rejected');
          setShowApprovalModal(false);
        }}
        onClose={() => setShowApprovalModal(false)}
        loading={approving || rejecting}
      />
    </div>
  );
}
