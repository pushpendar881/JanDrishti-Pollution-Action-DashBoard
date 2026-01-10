"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Shield, Heart, Activity } from "lucide-react"
import { aqiService } from "@/lib/api"

interface PollutantHealthProps {
  selectedWard: string
}

export default function PollutantHealth({ selectedWard }: PollutantHealthProps) {
  const [healthData, setHealthData] = useState<{
    aqi: number
    status: string
    pm25: number | null
    pm10: number | null
    no2: number | null
    o3: number | null
  } | null>(null)
  const [loading, setLoading] = useState(true)

  // Extract ward number
  const getWardNumber = (wardId: string): string | null => {
    if (!wardId) return null
    if (wardId.startsWith("ward-")) {
      return wardId.replace("ward-", "")
    }
    return wardId
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedWard) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const wardNo = getWardNumber(selectedWard)
        if (!wardNo) return

        const data = await aqiService.getCurrentAQIForWard(wardNo)
        
        const getStatus = (aqi: number) => {
          if (aqi <= 50) return "Good"
          if (aqi <= 100) return "Moderate"
          if (aqi <= 150) return "Unhealthy for Sensitive Groups"
          if (aqi <= 200) return "Unhealthy"
          if (aqi <= 300) return "Very Unhealthy"
          return "Hazardous"
        }

        setHealthData({
          aqi: data.aqi,
          status: getStatus(data.aqi),
          pm25: data.pm25,
          pm10: data.pm10,
          no2: data.no2,
          o3: data.o3,
        })
      } catch (error) {
        console.error("Error fetching health data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedWard])

  const getHealthAdvice = (aqi: number, status: string) => {
    if (aqi <= 50) {
      return {
        icon: <Shield className="text-emerald-400" />,
        color: "from-emerald-500/10 to-green-500/10",
        border: "border-emerald-500/20",
        text: "Air quality is satisfactory. Enjoy outdoor activities!",
        recommendations: ["Perfect for outdoor exercise", "Windows can be opened", "No health concerns"]
      }
    } else if (aqi <= 100) {
      return {
        icon: <Activity className="text-amber-400" />,
        color: "from-amber-500/10 to-yellow-500/10",
        border: "border-amber-500/20",
        text: "Air quality is acceptable. Sensitive individuals may experience minor issues.",
        recommendations: ["Sensitive people should limit outdoor time", "Consider indoor activities", "Monitor air quality"]
      }
    } else if (aqi <= 150) {
      return {
        icon: <AlertTriangle className="text-orange-400" />,
        color: "from-orange-500/10 to-red-500/10",
        border: "border-orange-500/20",
        text: "Unhealthy for sensitive groups. Take precautions.",
        recommendations: ["Reduce outdoor activities", "Keep windows closed", "Use air purifiers if available"]
      }
    } else {
      return {
        icon: <AlertTriangle className="text-red-400" />,
        color: "from-red-500/10 to-red-600/10",
        border: "border-red-500/20",
        text: "Air quality is unhealthy. Limit outdoor exposure.",
        recommendations: ["Avoid outdoor activities", "Keep windows and doors closed", "Wear masks if going outside", "Use air purifiers"]
      }
    }
  }

  const getPollutantStatus = (value: number | null, type: string) => {
    if (value === null || value === undefined) return { level: "N/A", color: "text-muted-foreground" }
    
    const thresholds: { [key: string]: { good: number; moderate: number; unhealthy: number } } = {
      pm25: { good: 12, moderate: 35, unhealthy: 55 },
      pm10: { good: 50, moderate: 100, unhealthy: 150 },
      no2: { good: 40, moderate: 100, unhealthy: 200 },
      o3: { good: 100, moderate: 160, unhealthy: 200 }
    }

    const threshold = thresholds[type]
    if (!threshold) return { level: "Unknown", color: "text-muted-foreground" }

    if (value <= threshold.good) return { level: "Good", color: "text-emerald-400" }
    if (value <= threshold.moderate) return { level: "Moderate", color: "text-amber-400" }
    if (value <= threshold.unhealthy) return { level: "Unhealthy", color: "text-orange-400" }
    return { level: "Very Unhealthy", color: "text-red-400" }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-border/40 backdrop-blur-xl glass-effect overflow-hidden p-8">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!healthData) {
    return (
      <div className="rounded-3xl border border-border/40 backdrop-blur-xl glass-effect overflow-hidden p-8">
        <div className="text-center text-muted-foreground">
          <p>No health data available</p>
        </div>
      </div>
    )
  }

  const advice = getHealthAdvice(healthData.aqi, healthData.status)

  return (
    <div className="rounded-3xl border border-border/40 backdrop-blur-xl glass-effect overflow-hidden group hover:border-primary/40 transition-all duration-500 p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
            <Heart className="text-primary" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Health Advisory</h3>
            <p className="text-sm text-muted-foreground font-medium">Based on current AQI</p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-xs font-semibold text-primary animate-glow-pulse">
          Live
        </div>
      </div>

      {/* Current Status */}
      <div className={`mb-6 p-6 rounded-2xl bg-gradient-to-r ${advice.color} border ${advice.border}`}>
        <div className="flex items-center gap-3 mb-3">
          {advice.icon}
          <p className="text-sm font-bold text-foreground">Current Status: {healthData.status}</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {advice.text}
        </p>
        <div className="space-y-2">
          {advice.recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pollutant Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-foreground mb-3">Pollutant Levels</h4>
        {[
          { label: "PM2.5", value: healthData.pm25, unit: "µg/m³" },
          { label: "PM10", value: healthData.pm10, unit: "µg/m³" },
          { label: "NO2", value: healthData.no2, unit: "µg/m³" },
          { label: "O3", value: healthData.o3, unit: "µg/m³" },
        ].map((pollutant) => {
          const status = getPollutantStatus(pollutant.value, pollutant.label.toLowerCase())
          return (
            <div
              key={pollutant.label}
              className="flex items-center justify-between p-4 rounded-xl glass-effect border border-border/30 hover:border-primary/40 transition-all"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{pollutant.label}</p>
                <p className="text-xs text-muted-foreground">{pollutant.unit}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">
                  {pollutant.value !== null && pollutant.value !== undefined 
                    ? pollutant.value.toFixed(1) 
                    : "N/A"}
                </p>
                <p className={`text-xs font-semibold ${status.color}`}>
                  {status.level}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
