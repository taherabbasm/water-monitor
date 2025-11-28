// src/components/SensorChart.jsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function SensorChart({ data, dataKey, title, yLabel }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 h-80">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <span className="text-xs text-slate-500">{yLabel}</span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(value) =>
              new Date(value).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            }
            minTickGap={30}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(value) =>
              new Date(value).toLocaleString()
            }
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SensorChart;
