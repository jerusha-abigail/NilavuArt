import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ProgressChart({ points }) {
  if (!points.length) {
    return <p className="empty">Upload a few artworks to see your progress over time.</p>;
  }

  const data = points.map((p, i) => ({
    ...p,
    index: i + 1,
    label: p.title || `#${i + 1}`,
  }));

  return (
    <div className="card">
      <h2>Progress Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="overall_score" name="Overall" stroke="#7c3aed" strokeWidth={3} />
          <Line type="monotone" dataKey="composition" name="Composition" stroke="#f59e0b" />
          <Line type="monotone" dataKey="contrast" name="Contrast" stroke="#10b981" />
          <Line type="monotone" dataKey="color_balance" name="Color Balance" stroke="#ef4444" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
