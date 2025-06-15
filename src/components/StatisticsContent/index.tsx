/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  ChartBarIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import {
  FaUsers,
  FaChartLine,
  FaCalendarCheck,
  FaPrayingHands,
} from "react-icons/fa";
import Header from "@/src/components/Header";

interface ContactStats {
  period: string;
  newConvert: number;
  firstTimer: number;
  total: number;
  date: string;
}

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface MetricCard {
  title: string;
  value: number;
  change: number;
  trend: "up" | "down" | "neutral";
  icon: React.ComponentType<any>;
  color: string;
}

interface DistributionData {
  contactType: { [key: string]: number };
  serviceType: { [key: string]: number };
  gender: { [key: string]: number };
  district: { [key: string]: number };
}

const COLORS = {
  primary: ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
};

export default function StatisticsPage() {
  const [timePeriod, setTimePeriod] = useState<"weekly" | "monthly" | "yearly">(
    "monthly"
  );
  const [contactData, setContactData] = useState<ContactStats[]>([]);
  const [distributionData, setDistributionData] = useState<DistributionData>({
    contactType: {},
    serviceType: {},
    gender: {},
    district: {},
  });
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState({
    contactType: "all",
    serviceType: "all",
    district: "all",
  });

  useEffect(() => {
    fetchStatistics();
  }, [timePeriod, selectedFilters]);

  const fetchStatistics = async () => {
    setIsLoading(true);

    try {
      const queryParams = new URLSearchParams({
        period: timePeriod,
        filters: JSON.stringify(selectedFilters),
      });

      const response = await fetch(`/api/statistics?${queryParams}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `HTTP ${response.status}`);
      }

      const data = await response.json();

      setContactData(data.timeSeries || []);
      setDistributionData(
        data.distribution || {
          contactType: {},
          serviceType: {},
          gender: {},
          district: {},
        }
      );
      setMetrics(data.metrics || []);
    } catch (error) {
      console.error("API Error:", error);
      setContactData([]);
      setDistributionData({
        contactType: {},
        serviceType: {},
        gender: {},
        district: {},
      });
      setMetrics([]);
      alert(
        `Failed to load data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getPieChartData = (data: { [key: string]: number }): PieChartData[] => {
    return Object.entries(data).map(([name, value], index) => ({
      name,
      value,
      color: COLORS.primary[index % COLORS.primary.length],
    }));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  const MetricCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">
                {metric.title}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(metric.value)}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${metric.color}`}>
              <metric.icon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {metric.trend === "up" ? (
              <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            ) : metric.trend === "down" ? (
              <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
            ) : (
              <div className="h-4 w-4 bg-gray-400 rounded-full mr-1" />
            )}
            <span
              className={`text-sm font-medium ${
                metric.trend === "up"
                  ? "text-green-600"
                  : metric.trend === "down"
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {metric.change > 0 ? "+" : ""}
              {metric.change.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last period</span>
          </div>
        </div>
      ))}
    </div>
  );

  const TimeSeriesChart = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <FaChartLine className="text-indigo-600" />
            <span>Contact Trends</span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} contact
            statistics over time
          </p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          {["weekly", "monthly", "yearly"].map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period as any)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                timePeriod === period
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {contactData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <div className="text-6xl mb-4">📈</div>
          <h4 className="text-lg font-medium mb-2">
            No contact data available
          </h4>
          <p className="text-sm text-center max-w-md">
            Start adding contacts to see trends and statistics.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={contactData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="newConvert" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="firstTimer" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: "#e0e0e0" }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: "#e0e0e0" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="newConvert"
              stackId="1"
              stroke="#4F46E5"
              fill="url(#newConvert)"
              name="New Convert"
            />
            <Area
              type="monotone"
              dataKey="firstTimer"
              stackId="1"
              stroke="#10B981"
              fill="url(#firstTimer)"
              name="First Timer"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  const BarChartComponent = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <ChartBarIcon className="h-5 w-5 text-indigo-600" />
            <span>Contact Comparison</span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Side-by-side comparison by contact type
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={contactData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: "#e0e0e0" }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: "#e0e0e0" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Legend />
          <Bar
            dataKey="newConvert"
            fill="#4F46E5"
            name="New Convert"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="firstTimer"
            fill="#10B981"
            name="First Timer"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const PieChartComponent = ({
    title,
    data,
    description,
  }: {
    title: string;
    data: { [key: string]: number };
    description: string;
  }) => {
    const pieData = getPieChartData(data);

    if (!data || Object.keys(data).length === 0) {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-sm">No data available</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center">
          <ResponsiveContainer width="100%" height={250} className="lg:w-2/3">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="lg:w-1/3 mt-4 lg:mt-0 space-y-3">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {entry.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header appName="Statistics" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin" />
              <p className="text-gray-600 font-medium">
                Loading statistics from database...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header appName="Statistics" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Real-time data from your database
            </p>
          </div>

          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <button
              onClick={fetchStatistics}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <MetricCards />

        <div className="space-y-8">
          <TimeSeriesChart />
          <BarChartComponent />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PieChartComponent
              title="Contact Types"
              data={distributionData.contactType}
              description="Distribution of contact types"
            />
            <PieChartComponent
              title="Service Types"
              data={distributionData.serviceType}
              description="Breakdown by service attendance"
            />
            <PieChartComponent
              title="Gender Distribution"
              data={distributionData.gender}
              description="Contact distribution by gender"
            />
            <PieChartComponent
              title="District Coverage"
              data={distributionData.district}
              description="Geographic distribution of contacts"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
