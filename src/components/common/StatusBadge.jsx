/**
 * @module StatusBadge
 * @description Reusable status badge component.
 */
import { Badge } from 'antd';

const STATUS_CONFIG = {
  present: { color: '#52c41a', label: 'Present' },
  absent: { color: '#ff4d4f', label: 'Absent' },
  half_day: { color: '#faad14', label: 'Half Day' },
  half_day_early: { color: '#faad14', label: 'Half Day Early' },
  on_leave: { color: '#1890ff', label: 'On Leave' },
  incomplete: { color: '#ff4d4f', label: 'Incomplete' },
  checked_in: { color: '#52c41a', label: 'Checked In' },
  late: { color: '#faad14', label: 'Late' },
  overtime: { color: '#722ed1', label: 'Overtime' },
  holiday: { color: '#2f54eb', label: 'Holiday' },
  weekend: { color: '#8c8c8c', label: 'Weekend' },
  not_marked: { color: '#8c8c8c', label: 'Not Marked' },
  pending: { color: '#faad14', label: 'Pending' },
  approved: { color: '#52c41a', label: 'Approved' },
  rejected: { color: '#ff4d4f', label: 'Rejected' },
  active: { color: '#52c41a', label: 'Active' },
  inactive: { color: '#8c8c8c', label: 'Inactive' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.absent;
  return <Badge color={config.color} text={config.label} />;
}
