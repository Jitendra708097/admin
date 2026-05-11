/**
 * @module AttendanceLineChart
 * @description Recharts line chart for attendance trends.
 */
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function formatDate(value) {
  const [, month, day] = String(value || '').split('-');
  return month && day ? `${day}/${month}` : value;
}

export default function AttendanceLineChart({ data, height = 320 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 12, right: 18, left: -14, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          interval="preserveStartEnd"
          minTickGap={22}
          tick={{ fontSize: 11 }}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend verticalAlign="top" height={30} />
        <Line type="monotone" dataKey="present" stroke="#52c41a" name="Present" />
        <Line type="monotone" dataKey="absent" stroke="#ff4d4f" name="Absent" />
        <Line type="monotone" dataKey="leave" stroke="#1890ff" name="On Leave" />
      </LineChart>
    </ResponsiveContainer>
  );
}
