import { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader.jsx';
import ShiftCard from './ShiftCard.jsx';
import ShiftForm from './ShiftForm.jsx';
import {
  useGetShiftsQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
} from '../../store/api/shiftApi.js';

export default function ShiftsPage() {
  const [selectedShift, setSelectedShift] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useGetShiftsQuery();
  const [createShift, { isLoading: isCreating }] = useCreateShiftMutation();
  const [updateShift, { isLoading: isUpdating }] = useUpdateShiftMutation();
  const [deleteShift] = useDeleteShiftMutation();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shifts"
        subtitle="Manage shift timings and thresholds"
        actions={[
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedShift(null);
              setShowForm(true);
            }}
          >
            Add Shift
          </Button>,
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.shifts?.map((shift) => (
          <ShiftCard
            key={shift.id}
            shift={shift}
            onEdit={(record) => {
              setSelectedShift(record);
              setShowForm(true);
            }}
            onDelete={(id) => deleteShift(id)}
          />
        ))}
      </div>

      <ShiftForm
        open={showForm}
        shift={selectedShift}
        onClose={() => setShowForm(false)}
        onSubmit={async (values) => {
          if (selectedShift?.id) {
            await updateShift({ id: selectedShift.id, ...values });
          } else {
            await createShift(values);
          }
          setShowForm(false);
        }}
        loading={isCreating || isUpdating || isLoading}
      />
    </div>
  );
}
