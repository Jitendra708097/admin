/**
 * @module LateBarChart
 * @description Recharts bar chart for late employees.
 */
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LateBarChart({ data, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 18, left: 12, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => (String(value).length > 15 ? `${String(value).slice(0, 15)}...` : value)}
        />
        <Tooltip />
        <Legend verticalAlign="top" height={28} />
        <Bar dataKey="count" fill="#faad14" name="Late Count" />
      </BarChart>
    </ResponsiveContainer>
  );
}
