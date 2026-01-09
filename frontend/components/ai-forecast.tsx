"use client"

import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts"

interface AIForecastProps {
  selectedCity: string
  selectedWard: string
}

export default function AIForecast({ selectedCity, selectedWard }: AIForecastProps) {
  const [forecastPeriod, setForecastPeriod] = useState<string>("24h")
  const [selectedMetric, setSelectedMetric] = useState<string>("aqi")

  const forecastPeriods = [
    { id: "24h", label: "24 Hours", icon: "🕐" },
    { id: "7d", label: "7 Days", icon: "📅" },
    { id: "30d", label: "30 Days", icon: "📊" },
  ]

  const metrics = [
    { id: "aqi", label: "AQI", color: "#3b82f6" },
    { id: "pm25", label: "PM2.5", color: "#06b6d4" },
    { id: "pm10", label: "PM10", color: "#10b981" },
    { id: "no2", label: "NO2", color: "#8b5cf6" },
  ]

  // Dummy forecast data
  const hourlyForecast = [
    { time: "00:00", aqi: 180, pm25: 95, pm10: 160, no2: 45, confidence: 92 },
    { time: "03:00", aqi: 175, pm25: 90, pm10: 155, no2: 42, confidence: 89 },
    { time: "06:00", aqi: 195, pm25: 105, pm10: 175, no2: 48, confidence: 94 },
    { time: "09:00", aqi: 220, pm25: 125, pm10: 195, no2: 55, confidence: 91 },
    { time: "12:00", aqi: 210, pm25: 115, pm10: 185, no2: 52, confidence: 88 },
    { time: "15:00", aqi: 200, pm25: 110, pm10: 180, no2: 50, confidence: 90 },
    { time: "18:00", aqi: 230, pm25: 135, pm10: 205, no2: 58, confidence: 87 },
    { time: "21:00", aqi: 215, pm25: 120, pm10: 190, no2: 53, confidence: 89 },
  ]

  const weeklyForecast = [
    { day: "Mon", aqi: 195, pm25: 105, pm10: 175, no2: 48, confidence: 85 },
    { day: "Tue", aqi: 210, pm25: 115, pm10: 185, no2: 52, confidence: 82 },
    { day: "Wed", aqi: 185, pm25: 95, pm10: 165, no2: 45, confidence: 88 },
    { day: "Thu", aqi: 175, pm25: 90, pm10: 155, no2: 42, confidence: 90 },
    { day: "Fri", aqi: 200, pm25: 110, pm10: 180, no2: 50, confidence: 86 },
    { day: "Sat", aqi: 165, pm25: 85, pm10: 145, no2: 40, confidence: 91 },
    { day: "Sun", aqi: 155, pm25: 80, pm10: 135, no2: 38, confidence: 93 },
  ]

  const getCurrentData = () => {
    return forecastPeriod === "24h" ? hourlyForecast : weeklyForecast
  }

  const factors = [
    { name: "Weather Patterns", impact: 85, trend: "improving", icon: "🌤️" },
    { name: "Traffic Volume", impact: 72, trend: "worsening", icon: "🚗" },
    { name: "Industrial Activity", impact: 68, trend: "stable", icon: "🏭" },
    { name: "Construction Work", impact: 45, trend: "improving", icon: "🏗️" },
    { name: "Seasonal Factors", impact: 91, trend: "worsening", icon: "🍂" },
  ]

  const recommendations = [
    {
      type: "immediate",
      title: "Immediate Actions (Next 6 hours)",
      items: [
        "Avoid outdoor activities between 6-10 AM",
        "Use N95 masks if going outside",
        "Keep windows closed during peak hours",
        "Use air purifiers indoors"
      ],
      icon: "⚡",
      color: "red"
    },
    {
      type: "short-term",
      title: "Short-term Measures (24-48 hours)",
      items: [
        "Implement odd-even vehicle restrictions",
        "Increase public transport frequency",
        "Suspend construction activities",
        "Deploy water sprinklers on roads"
      ],
      icon: "📋",
      color: "orange"
    },
    {
      type: "long-term",
      title: "Long-term Strategy (This week)",
      items: [
        "Monitor industrial emissions closely",
        "Increase green cover in the area",
        "Promote work-from-home policies",
        "Enhance public awareness campaigns"
      ],
      icon: "🎯",
      color: "blue"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
            <span className="text-2xl">🔮</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">AI-Powered Pollution Forecast</h2>
            <p className="text-muted-foreground font-medium">Predictive analytics for proactive pollution management</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
          <div className="w-2 h-2 rounded-full bg-primary animate-glow-pulse"></div>
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">AI Powered</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          {forecastPeriods.map((period) => (
            <button
              key={period.id}
              onClick={() => setForecastPeriod(period.id)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                forecastPeriod === period.id
                  ? "bg-primary text-white shadow-lg"
                  : "glass-effect border border-border/40 text-foreground/70 hover:text-foreground hover:border-primary/40"
              }`}
            >
              <span>{period.icon}</span>
              <span>{period.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {metrics.map((metric) => (
            <button
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                selectedMetric === metric.id
                  ? "text-white shadow-lg"
                  : "glass-effect border border-border/40 text-foreground/70 hover:text-foreground hover:border-primary/40"
              }`}
              style={selectedMetric === metric.id ? { backgroundColor: metric.color } : {}}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Forecast Chart */}
      <div className="rounded-3xl border border-border/40 glass-effect p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-foreground">Pollution Forecast Trend</h3>
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg glass-effect border border-border/30">
            <span className="text-green-400 text-sm">●</span>
            <span className="text-xs font-semibold text-foreground">
              {getCurrentData().reduce((acc, curr) => acc + curr.confidence, 0) / getCurrentData().length}% Confidence
            </span>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={getCurrentData()}>
              <defs>
                <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metrics.find(m => m.id === selectedMetric)?.color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={metrics.find(m => m.id === selectedMetric)?.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis 
                dataKey={forecastPeriod === "24h" ? "time" : "day"} 
                stroke="rgba(255,255,255,0.6)" 
                style={{ fontSize: "12px", fontWeight: "500" }}
              />
              <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: "12px", fontWeight: "500" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 20, 25, 0.95)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  borderRadius: "12px",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(20px)",
                }}
                labelStyle={{ color: "#f1f5f9", fontWeight: "600" }}
              />
              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke={metrics.find(m => m.id === selectedMetric)?.color}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorAqi)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecast Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-border/40 glass-effect p-6">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            Contributing Factors
          </h3>
          
          <div className="space-y-4">
            {factors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl glass-effect border border-border/30">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{factor.icon}</span>
                  <div>
                    <p className="font-semibold text-foreground">{factor.name}</p>
                    <p className={`text-xs font-medium ${
                      factor.trend === "improving" ? "text-green-400" : 
                      factor.trend === "worsening" ? "text-red-400" : "text-yellow-400"
                    }`}>
                      {factor.trend === "improving" ? "↓" : factor.trend === "worsening" ? "↑" : "→"} {factor.trend}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{factor.impact}%</p>
                  <div className="w-16 h-2 bg-border/30 rounded-full mt-1">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                      style={{ width: `${factor.impact}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="rounded-3xl border border-border/40 glass-effect p-6">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            AI Recommendations
          </h3>

          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="rounded-xl glass-effect border border-border/30 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg bg-${rec.color}-500/20 flex items-center justify-center`}>
                    <span className="text-lg">{rec.icon}</span>
                  </div>
                  <h4 className="font-bold text-foreground text-sm">{rec.title}</h4>
                </div>
                <ul className="space-y-1">
                  {rec.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Accuracy Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-border/40 glass-effect p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-3">
            <span className="text-green-500 text-xl">🎯</span>
          </div>
          <h4 className="font-bold text-foreground mb-1">Forecast Accuracy</h4>
          <p className="text-3xl font-bold text-green-400">94.2%</p>
          <p className="text-xs text-muted-foreground mt-1">Last 30 days average</p>
        </div>

        <div className="rounded-3xl border border-border/40 glass-effect p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
            <span className="text-blue-500 text-xl">⚡</span>
          </div>
          <h4 className="font-bold text-foreground mb-1">Prediction Speed</h4>
          <p className="text-3xl font-bold text-blue-400">0.3s</p>
          <p className="text-xs text-muted-foreground mt-1">Real-time processing</p>
        </div>

        <div className="rounded-3xl border border-border/40 glass-effect p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
            <span className="text-purple-500 text-xl">🧠</span>
          </div>
          <h4 className="font-bold text-foreground mb-1">Model Version</h4>
          <p className="text-3xl font-bold text-purple-400">v2.1</p>
          <p className="text-xs text-muted-foreground mt-1">Latest AI model</p>
        </div>
      </div>
    </div>
  )
}
