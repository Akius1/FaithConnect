"use client";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface StatisticsData {
  month: string;
  newConvert: number;
  firstTimer: number;
}

interface StatisticsChartProps {
  data: StatisticsData[];
}

export default function StatisticsChart({ data }: StatisticsChartProps) {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Monthly Statistics</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="newConvert" fill="#4F46E5" name="New Convert" />
          <Bar dataKey="firstTimer" fill="#10B981" name="First Timer" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
