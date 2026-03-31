import { Card } from 'antd';
import AttendanceLineChart from './charts/AttendanceLineChart.jsx';

export default function AttendanceTrendChart({ data }) {
  return (
    <Card
      title="30-Day Attendance Trend"
      bordered={false}
      style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }}
    >
      <AttendanceLineChart data={data} />
    </Card>
  );
}
