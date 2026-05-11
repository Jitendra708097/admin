import { Card } from 'antd';
import AttendanceLineChart from './charts/AttendanceLineChart.jsx';

export default function AttendanceTrendChart({ data, height = 320 }) {
  return (
    <Card
      title="30-Day Attendance Trend"
      bordered={false}
      style={{ borderRadius: 8 }}
    >
      <AttendanceLineChart data={data} height={height} />
    </Card>
  );
}
