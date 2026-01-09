"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from "recharts"
import { aqiService, type WardData, type DailyAQIData } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface HistoricalAnalysisProps {
  selectedPollutant: string
}

export default function HistoricalAnalysis({ selectedPollutant }: HistoricalAnalysisProps) {
  const [timeRange, setTimeRange] = useState<string>("7d")
  const [viewType, setViewType] = useState<string>("trend")
  const [selectedWard, setSelectedWard] = useState<string>("")
  const [wards, setWards] = useState<WardData[]>([])
  const [dailyData, setDailyData] = useState<DailyAQIData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const timeRanges = [
    { id: "7d", label: "7 Days", icon: "📅", days: 7 },
    { id: "30d", label: "30 Days", icon: "📊", days: 30 },
    { id: "90d", label: "90 Days", icon: "📈", days: 90 },
    { id: "1y", label: "1 Year", icon: "📆", days: 365 },
  ]

  const viewTypes = [
    { id: "trend", label: "Trend Analysis", icon: "📈" },
    { id: "comparison", label: "Week Comparison", icon: "⚖️" },
    { id: "seasonal", label: "Monthly Pattern", icon: "🍂" },
  ]

  // Fetch wards on component mount
  useEffect(() => {
    const fetchWards = async () => {
      try {
        const wardsData = await aqiService.getWards()
        setWards(wardsData)
        if (wardsData.length > 0) {
          setSelectedWard(wardsData[0].ward_no)
        }
      } catch (err) {
        console.error("Error fetching wards:", err)
        setError("Failed to load ward information. Please try again later.")
      }
    }
    fetchWards()
  }, [])

  // Fetch daily data when ward or time range changes
  useEffect(() => {
    if (!selectedWard) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const days = timeRanges.find(r => r.id === timeRange)?.days || 7
        const data = await aqiService.getWardDailyData(selectedWard, days)
        setDailyData(data)
      } catch (err: any) {
        console.error("Error fetching daily data:", err)
        setError(err.response?.data?.detail || "Failed to load historical data. Please try again later.")
        setDailyData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedWard, timeRange])

  // Process daily data for charts
  const processDataForCharts = () => {
    if (!dailyData || dailyData.length === 0) return []

    // Sort by date (oldest first)
    const sortedData = [...dailyData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return sortedData.map(item => {
      const date = new Date(item.date)
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      
      return {
        date: dayName,
        fullDate: item.date,
        month: monthName,
        aqi: Math.round(item.avg_aqi),
        pm25: item.avg_pm25 ? Math.round(item.avg_pm25) : null,
        pm10: item.avg_pm10 ? Math.round(item.avg_pm10) : null,
        no2: item.avg_no2 ? Math.round(item.avg_no2) : null,
        o3: item.avg_o3 ? Math.round(item.avg_o3) : null,
        min_aqi: Math.round(item.min_aqi),
        max_aqi: Math.round(item.max_aqi),
      }
    })
  }

  // Calculate weekly averages
  const calculateWeeklyData = () => {
    const processedData = processDataForCharts()
    if (processedData.length === 0) return []

    const weeklyGroups: { [key: string]: any[] } = {}
    
    processedData.forEach(item => {
      const date = new Date(item.fullDate)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0]
      
      if (!weeklyGroups[weekKey]) {
        weeklyGroups[weekKey] = []
      }
      weeklyGroups[weekKey].push(item)
    })

    return Object.keys(weeklyGroups)
      .sort()
      .map(weekKey => {
        const weekData = weeklyGroups[weekKey]
        const weekStart = new Date(weekKey)
        const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        
        return {
          week: weekLabel,
          aqi: Math.round(weekData.reduce((sum, d) => sum + d.aqi, 0) / weekData.length),
          pm25: weekData[0].pm25 ? Math.round(weekData.reduce((sum, d) => sum + (d.pm25 || 0), 0) / weekData.filter(d => d.pm25).length) : null,
          pm10: weekData[0].pm10 ? Math.round(weekData.reduce((sum, d) => sum + (d.pm10 || 0), 0) / weekData.filter(d => d.pm10).length) : null,
          no2: weekData[0].no2 ? Math.round(weekData.reduce((sum, d) => sum + (d.no2 || 0), 0) / weekData.filter(d => d.no2).length) : null,
          o3: weekData[0].o3 ? Math.round(weekData.reduce((sum, d) => sum + (d.o3 || 0), 0) / weekData.filter(d => d.o3).length) : null,
        }
      })
  }

  // Calculate monthly averages
  const calculateMonthlyData = () => {
    const processedData = processDataForCharts()
    if (processedData.length === 0) return []

    const monthlyGroups: { [key: string]: any[] } = {}
    
    processedData.forEach(item => {
      const date = new Date(item.fullDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = []
      }
      monthlyGroups[monthKey].push(item)
    })

    return Object.keys(monthlyGroups)
      .sort()
      .map(monthKey => {
        const monthData = monthlyGroups[monthKey]
        const date = new Date(monthKey + '-01')
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short' })
        
        return {
          month: monthLabel,
          aqi: Math.round(monthData.reduce((sum, d) => sum + d.aqi, 0) / monthData.length),
          pm25: monthData[0].pm25 ? Math.round(monthData.reduce((sum, d) => sum + (d.pm25 || 0), 0) / monthData.filter(d => d.pm25).length) : null,
          pm10: monthData[0].pm10 ? Math.round(monthData.reduce((sum, d) => sum + (d.pm10 || 0), 0) / monthData.filter(d => d.pm10).length) : null,
          no2: monthData[0].no2 ? Math.round(monthData.reduce((sum, d) => sum + (d.no2 || 0), 0) / monthData.filter(d => d.no2).length) : null,
        }
      })
  }

  // Calculate statistics
  const calculateStats = () => {
    if (!dailyData || dailyData.length === 0) return null

    const aqiValues = dailyData.map(d => d.avg_aqi)
    const avgAqi = aqiValues.reduce((sum, val) => sum + val, 0) / aqiValues.length
    const maxAqi = Math.max(...aqiValues)
    const minAqi = Math.min(...aqiValues)
    const maxDate = dailyData.find(d => d.avg_aqi === maxAqi)?.date
    const minDate = dailyData.find(d => d.avg_aqi === minAqi)?.date

    // Calculate trend (compare first half vs second half)
    const midPoint = Math.floor(dailyData.length / 2)
    const firstHalf = dailyData.slice(0, midPoint).map(d => d.avg_aqi)
    const secondHalf = dailyData.slice(midPoint).map(d => d.avg_aqi)
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
    const trendPercent = ((secondAvg - firstAvg) / firstAvg) * 100

    return {
      avgAqi: Math.round(avgAqi),
      maxAqi: Math.round(maxAqi),
      minAqi: Math.round(minAqi),
      maxDate: maxDate ? new Date(maxDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
      minDate: minDate ? new Date(minDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
      trendPercent: Math.round(trendPercent * 10) / 10,
      trend: trendPercent > 0 ? 'worsening' : trendPercent < 0 ? 'improving' : 'consistent'
    }
  }

  const getCurrentData = () => {
    const processed = processDataForCharts()
    if (timeRange === "1y") {
      return calculateMonthlyData()
    }
    return processed
  }

  const getChartComponent = () => {
    const data = viewType === "comparison" ? calculateWeeklyData() : 
                  viewType === "seasonal" ? calculateMonthlyData() : getCurrentData()

    if (data.length === 0) return null

    const dataKey = selectedPollutant === "aqi" ? "aqi" : 
                   selectedPollutant === "pm25" ? "pm25" :
                   selectedPollutant === "pm10" ? "pm10" :
                   selectedPollutant === "no2" ? "no2" : "aqi"

    switch (viewType) {
      case "comparison":
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="week" stroke="rgba(255,255,255,0.6)" />
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
            <Line type="monotone" dataKey={dataKey} stroke="#3b82f6" strokeWidth={3} />
          </LineChart>
        )
      case "seasonal":
        return (
          <BarChart data={data}>
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
            <Bar dataKey={dataKey} fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        )
      default:
        return (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey={timeRange === "1y" ? "month" : "date"} stroke="rgba(255,255,255,0.6)" />
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
              dataKey={dataKey}
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorGradient)"
            />
          </AreaChart>
        )
    }
  }

  const stats = calculateStats()
  const selectedWardName = wards.find(w => w.ward_no === selectedWard)?.ward_name || ""

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
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

      {/* Ward Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-semibold text-foreground">Select Ward:</label>
        <Select value={selectedWard} onValueChange={setSelectedWard}>
          <SelectTrigger className="w-[300px] glass-effect border-border/40">
            <SelectValue placeholder="Select a ward">
              {selectedWard && wards.find(w => w.ward_no === selectedWard) 
                ? `${wards.find(w => w.ward_no === selectedWard)?.ward_name} (${selectedWard}) - ${wards.find(w => w.ward_no === selectedWard)?.quadrant}`
                : "Select a ward"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {wards.map((ward) => (
              <SelectItem key={ward.ward_no} value={ward.ward_no}>
                {ward.ward_name} ({ward.ward_no}) - {ward.quadrant}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-3xl border border-red-500/30 glass-effect p-6 bg-red-500/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-bold text-red-400 mb-1">Unable to Load Data</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && dailyData.length === 0 && (
        <div className="rounded-3xl border border-yellow-500/30 glass-effect p-8 bg-yellow-500/10 text-center">
          <div className="flex flex-col items-center gap-4">
            <span className="text-5xl">📊</span>
            <div>
              <h3 className="font-bold text-yellow-400 mb-2 text-xl">Historical Data Not Available</h3>
              <p className="text-muted-foreground max-w-md">
                We're just getting started! Our AQI monitoring system is collecting data for {selectedWardName || "this ward"}. 
                Historical data will appear here as we gather more information over time.
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Data is collected hourly and daily averages are calculated at midnight IST. 
                Please check back soon as we build our historical database.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rounded-3xl border border-border/40 glass-effect p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Loading historical data...</p>
          </div>
        </div>
      )}

      {/* Data Display */}
      {!loading && !error && dailyData.length > 0 && (
        <>
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
                {viewType === "comparison" ? "Week-over-Week Comparison" :
                 viewType === "seasonal" ? "Monthly Patterns" :
             "Historical Trend Analysis"}
          </h3>
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg glass-effect border border-border/30">
            <span className="text-xs font-semibold text-foreground">
                  {selectedWardName && `${selectedWardName} • `}
              {timeRange === "7d" ? "Last 7 Days" :
               timeRange === "30d" ? "Last 30 Days" :
                   timeRange === "90d" ? "Last 90 Days" :
                   "Last 12 Months"}
            </span>
          </div>
        </div>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            {getChartComponent()}
          </ResponsiveContainer>
        </div>
      </div>

          {/* Statistical Summary */}
          {stats && (
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
                      <p className="text-2xl font-bold text-foreground">{stats.avgAqi}</p>
              </div>
              <div className="text-right">
                      <p className="text-sm text-muted-foreground">Trend</p>
                      <p className={`text-sm font-bold ${
                        stats.trend === "improving" ? "text-green-400" :
                        stats.trend === "worsening" ? "text-red-400" :
                        "text-yellow-400"
                      }`}>
                        {stats.trend === "improving" ? "↓" : stats.trend === "worsening" ? "↑" : "→"} {Math.abs(stats.trendPercent)}%
                      </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl glass-effect border border-border/30">
              <div>
                <p className="text-sm text-muted-foreground">Peak Value</p>
                      <p className="text-2xl font-bold text-foreground">{stats.maxAqi}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Date</p>
                      <p className="text-sm font-bold text-foreground">{stats.maxDate}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl glass-effect border border-border/30">
              <div>
                <p className="text-sm text-muted-foreground">Best Value</p>
                      <p className="text-2xl font-bold text-foreground">{stats.minAqi}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Date</p>
                      <p className="text-sm font-bold text-foreground">{stats.minDate}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border/40 glass-effect p-6">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
                  <span className="text-2xl">ℹ️</span>
                  Data Information
          </h3>

          <div className="space-y-4">
            <div className="p-4 rounded-xl glass-effect border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-400">📅</span>
                      <p className="font-semibold text-foreground text-sm">Data Collection</p>
              </div>
                    <p className="text-xs text-muted-foreground">
                      Data is collected hourly throughout the day. Daily averages are calculated and stored at midnight IST.
                    </p>
            </div>

            <div className="p-4 rounded-xl glass-effect border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-400">✓</span>
                      <p className="font-semibold text-foreground text-sm">Data Points</p>
              </div>
                    <p className="text-xs text-muted-foreground">
                      Showing {dailyData.length} day{dailyData.length !== 1 ? 's' : ''} of historical data for {selectedWardName}.
                    </p>
            </div>

                  {dailyData.length > 0 && (
            <div className="p-4 rounded-xl glass-effect border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                        <span className="text-yellow-400">📊</span>
                        <p className="font-semibold text-foreground text-sm">Coverage</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Data range: {new Date(dailyData[dailyData.length - 1].date).toLocaleDateString()} to {new Date(dailyData[0].date).toLocaleDateString()}
                      </p>
              </div>
                  )}
            </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
