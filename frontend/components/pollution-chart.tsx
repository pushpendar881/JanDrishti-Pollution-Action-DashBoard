"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface PollutionChartProps {
  selectedPollutant: string
}

export default function PollutionChart({ selectedPollutant }: PollutionChartProps) {
  const data = [
    { time: "12:00", aqi: 180, pm25: 95, pm10: 160, co: 0.8, so2: 12, no2: 45 },
    { time: "13:00", aqi: 185, pm25: 98, pm10: 165, co: 0.85, so2: 13, no2: 48 },
    { time: "14:00", aqi: 195, pm25: 105, pm10: 175, co: 0.9, so2: 14, no2: 52 },
    { time: "15:00", aqi: 206, pm25: 115, pm10: 185, co: 0.95, so2: 15, no2: 55 },
    { time: "16:00", aqi: 200, pm25: 110, pm10: 180, co: 0.92, so2: 14.5, no2: 53 },
    { time: "17:00", aqi: 195, pm25: 108, pm10: 175, co: 0.9, so2: 14, no2: 51 },
    { time: "18:00", aqi: 188, pm25: 100, pm10: 168, co: 0.87, so2: 13, no2: 48 },
  ]

  const chartConfig = {
    aqi: { color: "#3b82f6", label: "AQI" },
    pm25: { color: "#8b5cf6", label: "PM2.5" },
    pm10: { color: "#ec4899", label: "PM10" },
    co: { color: "#06b6d4", label: "CO" },
    so2: { color: "#f59e0b", label: "SO2" },
    no2: { color: "#10b981", label: "NO2" },
  }

  const selectedKey = selectedPollutant as keyof typeof chartConfig

  return (
    <div className="rounded-3xl border border-border/40 backdrop-blur-xl glass-effect overflow-hidden group hover:border-primary/40 transition-all duration-500 p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
            <span className="text-2xl">📈</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">
              {chartConfig[selectedKey]?.label || "Pollution"} Trend Analysis
            </h3>
            <p className="text-sm text-muted-foreground font-medium">Historical data visualization</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl glass-effect border border-border/30 text-sm font-semibold text-foreground">
            Past 7 hours
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 border border-primary/30">
            <div className="w-2 h-2 rounded-full bg-primary animate-glow-pulse"></div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Live</span>
          </div>
        </div>
      </div>

      <div className="h-96 opacity-90 group-hover:opacity-100 transition-opacity rounded-2xl overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis 
              dataKey="time" 
              stroke="rgba(255,255,255,0.6)" 
              style={{ fontSize: "12px", fontWeight: "500" }}
              tick={{ fill: "rgba(255,255,255,0.6)" }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.6)" 
              style={{ fontSize: "12px", fontWeight: "500" }}
              tick={{ fill: "rgba(255,255,255,0.6)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 20, 25, 0.95)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(20px)",
              }}
              labelStyle={{ color: "#f1f5f9", fontWeight: "600" }}
              cursor={{ stroke: "rgba(59, 130, 246, 0.3)", strokeWidth: 2 }}
            />
            <Legend 
              wrapperStyle={{ 
                color: "#94a3b8", 
                fontSize: "12px", 
                fontWeight: "500",
                paddingTop: "20px"
              }} 
            />
            <Line
              type="monotone"
              dataKey={selectedKey}
              stroke={chartConfig[selectedKey]?.color || "#3b82f6"}
              strokeWidth={4}
              dot={{ 
                fill: chartConfig[selectedKey]?.color || "#3b82f6", 
                r: 6,
                strokeWidth: 2,
                stroke: "rgba(255,255,255,0.2)"
              }}
              activeDot={{ 
                r: 8, 
                strokeWidth: 3,
                stroke: "rgba(255,255,255,0.3)",
                fill: chartConfig[selectedKey]?.color || "#3b82f6"
              }}
              isAnimationActive={true}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(chartConfig).map(([key, config]) => (
          <div 
            key={key}
            className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
              selectedKey === key 
                ? 'border-primary/40 bg-primary/10' 
                : 'border-border/30 glass-effect hover:border-border/50'
            }`}
            onClick={() => {/* Add click handler if needed */}}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: config.color }}
              ></div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  {config.label}
                </p>
                <p className="text-lg font-bold text-foreground">
                  {data[data.length - 1][key as keyof typeof data[0]]}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
