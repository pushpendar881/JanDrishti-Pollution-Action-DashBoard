"use client"

import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from "recharts"

interface HistoricalAnalysisProps {
  selectedPollutant: string
}

export default function HistoricalAnalysis({ selectedPollutant }: HistoricalAnalysisProps) {
  const [timeRange, setTimeRange] = useState<string>("7d")
  const [viewType, setViewType] = useState<string>("trend")
  const [selectedYear, setSelectedYear] = useState<string>("2024")

  const timeRanges = [
    { id: "24h", label: "24 Hours", icon: "🕐" },
    { id: "7d", label: "7 Days", icon: "📅" },
    { id: "30d", label: "30 Days", icon: "📊" },
    { id: "1y", label: "1 Year", icon: "📈" },
  ]

  const viewTypes = [
    { id: "trend", label: "Trend Analysis", icon: "📈" },
    { id: "comparison", label: "Year Comparison", icon: "⚖️" },
    { id: "seasonal", label: "Seasonal Pattern", icon: "🍂" },
    { id: "heatmap", label: "Time Heatmap", icon: "🔥" },
  ]

  // Dummy historical data
  const weeklyData = [
    { date: "Mon", aqi: 180, pm25: 95, pm10: 160, no2: 45, so2: 12, co: 0.8 },
    { date: "Tue", aqi: 195, pm25: 105, pm10: 175, no2: 48, so2: 14, co: 0.85 },
    { date: "Wed", aqi: 210, pm25: 115, pm10: 185, no2: 52, so2: 15, co: 0.9 },
    { date: "Thu", aqi: 185, pm25: 98, pm10: 165, no2: 46, so2: 13, co: 0.82 },
    { date: "Fri", aqi: 220, pm25: 125, pm10: 195, no2: 55, so2: 16, co: 0.95 },
    { date: "Sat", aqi: 165, pm25: 85, pm10: 145, no2: 40, so2: 11, co: 0.75 },
    { date: "Sun", aqi: 155, pm25: 80, pm10: 135, no2: 38, so2: 10, co: 0.7 },
  ]

  const monthlyData = [
    { month: "Jan", aqi: 195, pm25: 105, pm10: 175, no2: 48 },
    { month: "Feb", aqi: 180, pm25: 95, pm10: 160, no2: 45 },
    { month: "Mar", aqi: 165, pm25: 85, pm10: 145, no2: 42 },
    { month: "Apr", aqi: 150, pm25: 75, pm10: 130, no2: 38 },
    { month: "May", aqi: 175, pm25: 90, pm10: 155, no2: 44 },
    { month: "Jun", aqi: 160, pm25: 80, pm10: 140, no2: 40 },
    { month: "Jul", aqi: 145, pm25: 70, pm10: 125, no2: 36 },
    { month: "Aug", aqi: 155, pm25: 78, pm10: 135, no2: 39 },
    { month: "Sep", aqi: 170, pm25: 88, pm10: 150, no2: 43 },
    { month: "Oct", aqi: 200, pm25: 110, pm10: 180, no2: 50 },
    { month: "Nov", aqi: 250, pm25: 140, pm10: 220, no2: 60 },
    { month: "Dec", aqi: 230, pm25: 130, pm10: 200, no2: 55 },
  ]

  const yearlyComparison = [
    { month: "Jan", "2022": 210, "2023": 195, "2024": 185 },
    { month: "Feb", "2022": 195, "2023": 180, "2024": 170 },
    { month: "Mar", "2022": 180, "2023": 165, "2024": 155 },
    { month: "Apr", "2022": 165, "2023": 150, "2024": 145 },
    { month: "May", "2022": 190, "2023": 175, "2024": 165 },
    { month: "Jun", "2022": 175, "2023": 160, "2024": 150 },
    { month: "Jul", "2022": 160, "2023": 145, "2024": 140 },
    { month: "Aug", "2022": 170, "2023": 155, "2024": 150 },
    { month: "Sep", "2022": 185, "2023": 170, "2024": 165 },
    { month: "Oct", "2022": 220, "2023": 200, "2024": 190 },
    { month: "Nov", "2022": 270, "2023": 250, "2024": 240 },
    { month: "Dec", "2022": 250, "2023": 230, "2024": 220 },
  ]

  const seasonalData = [
    { season: "Winter", avg: 235, max: 280, min: 190 },
    { season: "Spring", avg: 165, max: 200, min: 130 },
    { season: "Summer", avg: 180, max: 220, min: 140 },
    { season: "Monsoon", avg: 150, max: 180, min: 120 },
  ]

  const insights = [
    {
      title: "Peak Pollution Hours",
      value: "6-10 AM, 7-11 PM",
      trend: "consistent",
      icon: "🕐",
      description: "Traffic rush hours show highest pollution levels"
    },
    {
      title: "Worst Month",
      value: "November",
      trend: "worsening",
      icon: "📅",
      description: "Stubble burning and weather conditions peak"
    },
    {
      title: "Best Day",
      value: "Sunday",
      trend: "improving",
      icon: "📊",
      description: "Reduced traffic and industrial activity"
    },
    {
      title: "Annual Trend",
      value: "12% Improvement",
      trend: "improving",
      icon: "📈",
      description: "Year-over-year pollution levels decreasing"
    }
  ]

  const getCurrentData = () => {
    switch (timeRange) {
      case "7d": return weeklyData
      case "30d": return monthlyData
      case "1y": return monthlyData
      default: return weeklyData
    }
  }

  const getChartComponent = () => {
    const data = viewType === "comparison" ? yearlyComparison : 
                  viewType === "seasonal" ? seasonalData : getCurrentData()

    switch (viewType) {
      case "comparison":
        return (
          <LineChart data={yearlyComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" />
            <YAxis stroke="rgba(255,255,255,0.6)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 20, 25, 0.95)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "12px",
                backdropFilter: "blur(20px)",
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="2022" stroke="#ef4444" strokeWidth={3} />
            <Line type="monotone" dataKey="2023" stroke="#f59e0b" strokeWidth={3} />
            <Line type="monotone" dataKey="2024" stroke="#10b981" strokeWidth={3} />
          </LineChart>
        )
      case "seasonal":
        return (
          <BarChart data={seasonalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="season" stroke="rgba(255,255,255,0.6)" />
            <YAxis stroke="rgba(255,255,255,0.6)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 20, 25, 0.95)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "12px",
                backdropFilter: "blur(20px)",
              }}
            />
            <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="max" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="min" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        )
      default:
        return (
          <AreaChart data={getCurrentData()}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey={timeRange === "7d" ? "date" : "month"} stroke="rgba(255,255,255,0.6)" />
            <YAxis stroke="rgba(255,255,255,0.6)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 20, 25, 0.95)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "12px",
                backdropFilter: "blur(20px)",
              }}
            />
            <Area
              type="monotone"
              dataKey={selectedPollutant}
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorGradient)"
            />
          </AreaChart>
        )
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
            <span className="text-2xl">📈</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Historical Data Analysis</h2>
            <p className="text-muted-foreground font-medium">Comprehensive pollution trends and patterns analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
          <div className="w-2 h-2 rounded-full bg-primary animate-glow-pulse"></div>
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">Historical Data</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          {timeRanges.map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                timeRange === range.id
                  ? "bg-primary text-white shadow-lg"
                  : "glass-effect border border-border/40 text-foreground/70 hover:text-foreground hover:border-primary/40"
              }`}
            >
              <span>{range.icon}</span>
              <span>{range.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {viewTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setViewType(type.id)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                viewType === type.id
                  ? "bg-accent text-white shadow-lg"
                  : "glass-effect border border-border/40 text-foreground/70 hover:text-foreground hover:border-accent/40"
              }`}
            >
              <span>{type.icon}</span>
              <span className="hidden sm:inline">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart */}
      <div className="rounded-3xl border border-border/40 glass-effect p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-foreground">
            {viewType === "comparison" ? "Year-over-Year Comparison" :
             viewType === "seasonal" ? "Seasonal Patterns" :
             viewType === "heatmap" ? "Time-based Heatmap" :
             "Historical Trend Analysis"}
          </h3>
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg glass-effect border border-border/30">
            <span className="text-xs font-semibold text-foreground">
              {timeRange === "7d" ? "Last 7 Days" :
               timeRange === "30d" ? "Last 30 Days" :
               timeRange === "1y" ? "Last 12 Months" : "Last 24 Hours"}
            </span>
          </div>
        </div>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            {getChartComponent()}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="rounded-3xl border border-border/40 glass-effect p-6 hover:border-border/60 transition-all duration-300 hover-lift"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-xl">{insight.icon}</span>
              </div>
              <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
                insight.trend === "improving" ? "bg-green-500/20 text-green-400" :
                insight.trend === "worsening" ? "bg-red-500/20 text-red-400" :
                "bg-yellow-500/20 text-yellow-400"
              }`}>
                {insight.trend === "improving" ? "↗️" : insight.trend === "worsening" ? "↘️" : "→"}
              </div>
            </div>
            <h4 className="font-bold text-foreground mb-1">{insight.title}</h4>
            <p className="text-2xl font-bold text-primary mb-2">{insight.value}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
          </div>
        ))}
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-border/40 glass-effect p-6">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
            <span className="text-2xl">📊</span>
            Statistical Summary
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl glass-effect border border-border/30">
              <div>
                <p className="text-sm text-muted-foreground">Average AQI</p>
                <p className="text-2xl font-bold text-foreground">186</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">vs Last Period</p>
                <p className="text-sm font-bold text-green-400">↓ 8.2%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl glass-effect border border-border/30">
              <div>
                <p className="text-sm text-muted-foreground">Peak Value</p>
                <p className="text-2xl font-bold text-foreground">285</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-sm font-bold text-foreground">Nov 15</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl glass-effect border border-border/30">
              <div>
                <p className="text-sm text-muted-foreground">Best Value</p>
                <p className="text-2xl font-bold text-foreground">95</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-sm font-bold text-foreground">Jul 22</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border/40 glass-effect p-6">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            Key Observations
          </h3>

          <div className="space-y-4">
            <div className="p-4 rounded-xl glass-effect border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-400">✓</span>
                <p className="font-semibold text-foreground text-sm">Improvement Trend</p>
              </div>
              <p className="text-xs text-muted-foreground">Overall 12% reduction in annual average compared to previous year</p>
            </div>

            <div className="p-4 rounded-xl glass-effect border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-400">⚠️</span>
                <p className="font-semibold text-foreground text-sm">Seasonal Spike</p>
              </div>
              <p className="text-xs text-muted-foreground">Winter months show 40% higher pollution levels due to weather conditions</p>
            </div>

            <div className="p-4 rounded-xl glass-effect border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-400">ℹ️</span>
                <p className="font-semibold text-foreground text-sm">Weekly Pattern</p>
              </div>
              <p className="text-xs text-muted-foreground">Weekends consistently show 20-25% lower pollution levels</p>
            </div>

            <div className="p-4 rounded-xl glass-effect border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-400">🔥</span>
                <p className="font-semibold text-foreground text-sm">Critical Hours</p>
              </div>
              <p className="text-xs text-muted-foreground">Morning (6-10 AM) and evening (7-11 PM) rush hours are most polluted</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}