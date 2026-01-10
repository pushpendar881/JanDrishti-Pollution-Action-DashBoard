"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { aqiService } from "@/lib/api"

interface PollutionChartProps {
  selectedPollutant: string
  selectedWard: string
}

export default function PollutionChart({ selectedPollutant, selectedWard }: PollutionChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [currentValues, setCurrentValues] = useState<any>({})
  const [wardName, setWardName] = useState<string>("")

  // Extract ward number from selectedWard (format: "ward-72" or just "72")
  const getWardNumber = (wardId: string): string | null => {
    if (!wardId) return null
    
    // If format is "ward-72", extract "72"
    if (wardId.startsWith("ward-")) {
      return wardId.replace("ward-", "")
    }
    
    // If it's already a number, return as is
    return wardId
  }

  const chartConfig = {
    aqi: { color: "#3b82f6", label: "AQI" },
    pm25: { color: "#8b5cf6", label: "PM2.5" },
    pm10: { color: "#ec4899", label: "PM10" },
    co: { color: "#06b6d4", label: "CO" },
    so2: { color: "#f59e0b", label: "SO2" },
    no2: { color: "#10b981", label: "NO2" },
    o3: { color: "#14b8a6", label: "O3" },
  }

  useEffect(() => {
    const fetchHourlyData = async () => {
      if (!selectedWard) return

      setLoading(true)
      setError(null)

      try {
        const actualWardNo = getWardNumber(selectedWard)
        
        if (!actualWardNo) {
          setError("Invalid ward selected")
          setLoading(false)
          return
        }

        // Fetch ward details to get the name
        try {
          const wards = await aqiService.getWards()
          const ward = wards.find(w => w.ward_no === actualWardNo)
          if (ward) {
            setWardName(`${ward.ward_name} (${ward.ward_no}) - ${ward.quadrant}`)
          } else {
            setWardName(`Ward ${actualWardNo}`)
          }
        } catch (err) {
          setWardName(`Ward ${actualWardNo}`)
        }

        const response = await aqiService.getWardHourlyData(actualWardNo, 24)
        
        if (response.readings && response.readings.length > 0) {
          // Format data for chart
          const chartData = response.readings.map(reading => ({
            time: reading.time,
            aqi: reading.aqi,
            pm25: reading.pm25,
            pm10: reading.pm10,
            no2: reading.no2,
            o3: reading.o3,
            // Set default values for missing pollutants
            co: null,
            so2: null,
          }))

          setData(chartData)

          // Set current values (latest reading)
          const latest = response.readings[response.readings.length - 1]
          setCurrentValues({
            aqi: latest.aqi,
            pm25: latest.pm25,
            pm10: latest.pm10,
            no2: latest.no2,
            o3: latest.o3,
            co: null,
            so2: null,
          })
        } else {
          setData([])
          setError("No hourly data available for this ward")
        }
      } catch (err: any) {
        console.error("Error fetching hourly data:", err)
        setError(err.response?.data?.detail || "Failed to load hourly data. Data may not be available yet.")
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchHourlyData()
  }, [selectedWard])

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
            <p className="text-sm text-muted-foreground font-medium">
              {wardName} • Live hourly data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl glass-effect border border-border/30 text-sm font-semibold text-foreground">
            {data.length > 0 ? `Last ${data.length} hours` : "No data"}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 border border-primary/30">
            <div className="w-2 h-2 rounded-full bg-primary animate-glow-pulse"></div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Live</span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Loading hourly data...</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="h-96 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-yellow-400 mb-2">No Data Available</h3>
            <p className="text-muted-foreground text-sm">
              {error.includes("not be available yet") 
                ? "Our hourly data collection system is gathering data for this ward. Please check back soon as we build our monitoring database."
                : error}
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Data is collected hourly and stored in real-time. Historical data will appear as the system collects more information.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && data.length > 0 && (
        <>
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
            {Object.entries(chartConfig).map(([key, config]) => {
              const value = currentValues[key as keyof typeof currentValues]
              return (
                <div 
                  key={key}
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    selectedKey === key 
                      ? 'border-primary/40 bg-primary/10' 
                      : 'border-border/30 glass-effect hover:border-border/50'
                  }`}
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
                        {value !== null && value !== undefined ? value.toFixed(1) : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
