"use client"

import { useState, useEffect } from "react"
import { aqiService } from "@/lib/api"

interface AQIReferenceProps {
  selectedWard: string
}

export default function AQIReference({ selectedWard }: AQIReferenceProps) {
  const [currentAQI, setCurrentAQI] = useState<number | null>(null)
  const [currentStatus, setCurrentStatus] = useState<string>("Loading")
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
        setCurrentAQI(data.aqi)
        
        const getStatus = (aqi: number) => {
          if (aqi <= 50) return "Good"
          if (aqi <= 100) return "Moderate"
          if (aqi <= 150) return "Unhealthy for Sensitive Groups"
          if (aqi <= 200) return "Unhealthy"
          if (aqi <= 300) return "Very Unhealthy"
          return "Hazardous"
        }
        
        setCurrentStatus(getStatus(data.aqi))
      } catch (error) {
        console.error("Error fetching AQI:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedWard])

  const categories = [
    { name: "Good", range: "0-50", color: "from-green-500 to-green-600", bg: "bg-green-500/10", border: "border-green-500/20" },
    { name: "Moderate", range: "51-100", color: "from-yellow-500 to-yellow-600", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    { name: "Unhealthy for Sensitive", range: "101-150", color: "from-orange-500 to-orange-600", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { name: "Unhealthy", range: "151-200", color: "from-red-500 to-red-600", bg: "bg-red-500/10", border: "border-red-500/20" },
    { name: "Very Unhealthy", range: "201-300", color: "from-purple-600 to-red-700", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { name: "Hazardous", range: "300+", color: "from-red-900 to-red-950", bg: "bg-red-900/10", border: "border-red-900/20" },
  ]

  const getStatusColor = (status: string) => {
    const statusMap: { [key: string]: string } = {
      "Good": "text-emerald-400",
      "Moderate": "text-amber-400",
      "Unhealthy for Sensitive Groups": "text-orange-400",
      "Unhealthy": "text-red-400",
      "Very Unhealthy": "text-red-500",
      "Hazardous": "text-red-600"
    }
    return statusMap[status] || "text-muted-foreground"
  }

  return (
    <div className="rounded-3xl border border-border/40 backdrop-blur-xl glass-effect overflow-hidden group hover:border-primary/40 transition-all duration-500 p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
          <span className="text-2xl">📊</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">AQI Reference Scale</h3>
          <p className="text-sm text-muted-foreground font-medium">Air quality index categories</p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {categories.map((category, index) => {
          const isCurrent = currentStatus === category.name || 
            (category.name === "Unhealthy for Sensitive" && currentStatus === "Unhealthy for Sensitive Groups")
          return (
            <div
              key={index}
              className={`flex items-center justify-between p-5 rounded-2xl glass-effect transition-all duration-300 group/cat cursor-pointer border ${
                isCurrent 
                  ? `${category.border} ${category.bg}` 
                  : "border-border/30 hover:border-border/50"
              } hover:scale-[1.02]`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`w-4 h-4 rounded-full bg-gradient-to-r ${category.color} group-hover/cat:scale-125 transition-transform shadow-lg`}
                  style={{ boxShadow: `0 4px 12px ${category.color.split(' ')[1]}40` }}
                ></div>
                <div>
                  <p className={`text-base font-bold transition-colors ${
                    isCurrent ? "text-primary" : "text-foreground group-hover/cat:text-primary"
                  }`}>
                    {category.name}
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">AQI {category.range}</p>
                </div>
              </div>
              {isCurrent && (
                <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-xs font-semibold text-primary">
                  Current
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Current Status Card */}
      {!loading && currentAQI !== null && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-lg">⚠️</span>
            </div>
            <p className="text-sm font-bold text-foreground">Current Status</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-2xl font-bold ${getStatusColor(currentStatus)}`}>
                {currentStatus}
              </p>
              <p className="text-sm text-muted-foreground mt-1">AQI: {Math.round(currentAQI)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current AQI</p>
              <p className="text-lg font-bold text-foreground">{Math.round(currentAQI)}</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="p-6 rounded-2xl bg-muted/10 border border-border/30">
          <div className="flex items-center justify-center h-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}
    </div>
  )
}
