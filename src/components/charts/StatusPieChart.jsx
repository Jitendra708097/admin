/**
 * @module StatusPieChart
 * @description Recharts pie chart for status distribution.
 */
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#52c41a', '#ff4d4f', '#1890ff', '#faad14'];

export default function StatusPieChart({ data, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart margin={{ top: 6, right: 6, bottom: 6, left: 6 }}>
        <Pie
          data={data}
          cx="50%"
          cy="44%"
          innerRadius={48}
          outerRadius={76}
          paddingAngle={2}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{ fontSize: 12, lineHeight: '18px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
