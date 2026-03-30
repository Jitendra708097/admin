import { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader.jsx';
import BranchCard from './BranchCard.jsx';
import BranchForm from './BranchForm.jsx';
import GeoFenceDrawer from './GeoFenceDrawer.jsx';
import {
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} from '../../store/api/branchApi.js';

export default function BranchesPage() {
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showGeofence, setShowGeofence] = useState(false);

  const { data } = useGetBranchesQuery();
  const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();
  const [deleteBranch] = useDeleteBranchMutation();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        subtitle="Manage organization branches and geofences"
        actions={[
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedBranch(null);
              setShowForm(true);
            }}
          >
            Add Branch
          </Button>,
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.branches?.map((branch) => (
          <BranchCard
            key={branch.id}
            branch={branch}
            onEdit={(record) => {
              setSelectedBranch(record);
              setShowForm(true);
            }}
            onSetGeofence={(record) => {
              setSelectedBranch(record);
              setShowGeofence(true);
            }}
            onDelete={(id) => deleteBranch(id)}
          />
        ))}
      </div>

      <BranchForm
        open={showForm}
        branch={selectedBranch}
        onClose={() => setShowForm(false)}
        onSubmit={async (values) => {
          if (selectedBranch?.id) {
            await updateBranch({ id: selectedBranch.id, ...values });
          } else {
            await createBranch(values);
          }
          setShowForm(false);
        }}
        loading={isCreating || isUpdating}
      />

      <GeoFenceDrawer
        open={showGeofence}
        branch={selectedBranch}
        onClose={() => setShowGeofence(false)}
      />
    </div>
  );
}
