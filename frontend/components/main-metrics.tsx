"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Wind, Gauge, AlertCircle, MapPin, Share2 } from "lucide-react"
import { aqiService, type WardData } from "@/lib/api"

interface AQIData {
  value: number
  status: string
  statusColor: string
  statusBg: string
  pm25: number | null
  pm10: number | null
  no2: number | null
  o3: number | null
}

interface MainMetricsProps {
  selectedWard: string
}

export default function MainMetrics({ selectedWard }: MainMetricsProps) {
  const [aqiData, setAqiData] = useState<AQIData>({
    value: 0,
    status: "Loading",
    statusColor: "text-primary",
    statusBg: "bg-primary/10",
    pm25: null,
    pm10: null,
    no2: null,
    o3: null,
  })
  const [wardName, setWardName] = useState<string>("Select a ward...")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Extract ward number from selectedWard (format: "ward-72" or just "72")
  const getWardNumber = (wardId: string): string | null => {
    if (!wardId) return null
    if (wardId.startsWith("ward-")) {
      return wardId.replace("ward-", "")
    }
    return wardId
  }

  // Calculate AQI status from value
  const getAQIStatus = (aqi: number): { status: string; color: string; bg: string } => {
    if (aqi <= 50) {
      return { status: "Good", color: "text-emerald-400", bg: "bg-emerald-500/10" }
    } else if (aqi <= 100) {
      return { status: "Moderate", color: "text-amber-400", bg: "bg-amber-500/10" }
    } else if (aqi <= 150) {
      return { status: "Unhealthy", color: "text-orange-500", bg: "bg-orange-500/10" }
    } else if (aqi <= 200) {
      return { status: "Unhealthy", color: "text-red-500", bg: "bg-red-500/10" }
    } else if (aqi <= 300) {
      return { status: "Severe", color: "text-red-500", bg: "bg-red-500/10" }
    } else {
      return { status: "Hazardous", color: "text-red-600", bg: "bg-red-600/10" }
    }
  }

  useEffect(() => {
    const fetchAQIData = async () => {
      if (!selectedWard) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const wardNo = getWardNumber(selectedWard)
        
        if (!wardNo) {
          setError("Invalid ward selected. Please select a ward from the dropdown.")
          setLoading(false)
          return
        }

        // Fetch ward details to get the name
        try {
          const wards = await aqiService.getWards()
          const ward = wards.find(w => w.ward_no === wardNo)
          if (ward) {
            setWardName(ward.ward_name)
          } else {
            setWardName(`Ward ${wardNo}`)
          }
        } catch (err) {
          setWardName(`Ward ${wardNo}`)
        }

        // Fetch current AQI data
        console.log(`Fetching AQI data for ward: ${wardNo}`)
        const currentData = await aqiService.getCurrentAQIForWard(wardNo)
        console.log('Received AQI data:', currentData)
        console.log('NO2 value:', currentData.no2, 'Type:', typeof currentData.no2)
        console.log('O3 value:', currentData.o3, 'Type:', typeof currentData.o3)
        
        if (!currentData || currentData.aqi === undefined || currentData.aqi === null) {
          throw new Error("Received invalid AQI data from the server")
        }
        
        const status = getAQIStatus(currentData.aqi)
        
        setAqiData({
          value: Math.round(currentData.aqi),
          status: status.status,
          statusColor: status.color,
          statusBg: status.bg,
          pm25: currentData.pm25 ?? null,
          pm10: currentData.pm10 ?? null,
          no2: currentData.no2 ?? null,
          o3: currentData.o3 ?? null,
        })
      } catch (err: any) {
        console.error("Error fetching AQI data:", err)
        console.error("Error details:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          wardNo: getWardNumber(selectedWard)
        })
        
        let errorMessage = "Failed to load AQI data"
        if (err.message) {
          errorMessage = err.message
        } else if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail
        } else if (err.response?.status === 404) {
          errorMessage = "AQI data not found for this ward. The external API may not have data for this location."
        } else if (err.response?.status === 500) {
          errorMessage = "Server error. Please check if the backend server is running."
        } else if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
          errorMessage = "Cannot connect to the backend server. Please ensure the server is running on port 8000."
        }
        
        setError(errorMessage)
        
        // Set default/error state
        setAqiData({
          value: 0,
          status: "No Data",
          statusColor: "text-muted-foreground",
          statusBg: "bg-muted/10",
          pm25: null,
          pm10: null,
          no2: null,
          o3: null,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAQIData()
  }, [selectedWard])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "good": return "text-emerald-400"
      case "moderate": return "text-amber-400"
      case "unhealthy": return "text-orange-500"
      case "severe": return "text-red-500"
      case "hazardous": return "text-red-600"
      case "loading": return "text-primary"
      case "no data": return "text-muted-foreground"
      default: return "text-primary"
    }
  }

  return (
    <div className="relative group">
      {/* Background Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
      
      <div className="relative rounded-[2rem] glass-morphism border border-white/5 p-8 md:p-10 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] -ml-32 -mb-32" />

        {loading && (
          <div className="relative z-10 flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground">Loading AQI data...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="relative z-10 flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">Unable to Load Data</h3>
              <p className="text-muted-foreground text-sm mb-3">{error}</p>
              <div className="text-xs text-muted-foreground space-y-2">
                <p>
                  {error.includes("WAQI API") || error.includes("external API") 
                    ? "The external air quality API may be temporarily unavailable. Please try again in a few moments."
                    : error.includes("Ward not found")
                    ? "Please select a valid ward from the dropdown menu."
                    : "Our AQI monitoring system is collecting data for this ward. Data will appear here as it becomes available."}
                </p>
                <p className="mt-3 text-[10px]">
                  💡 Tip: Make sure the backend server is running and the WAQI API is accessible.
                </p>
              </div>
            </div>
          </div>
        )}

        {!selectedWard && !loading && (
          <div className="relative z-10 flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <div className="text-5xl mb-4">📍</div>
              <h3 className="text-xl font-bold text-primary mb-2">Select a Ward</h3>
              <p className="text-muted-foreground text-sm">
                Please select a ward from the dropdown menu above to view live AQI data.
              </p>
            </div>
          </div>
        )}

        {selectedWard && !loading && !error && (
          <div className="relative z-10 flex flex-col lg:flex-row gap-12">
            {/* Main AQI Display */}
            <div className="lg:w-1/3 flex flex-col items-center justify-center text-center space-y-6">
              <div className="space-y-2">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${aqiData.statusBg} border ${aqiData.statusColor === "text-red-500" ? "border-red-500/20" : "border-primary/20"} ${aqiData.statusColor} text-[10px] font-bold uppercase tracking-widest`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${aqiData.statusColor === "text-red-500" ? "bg-red-500" : "bg-primary"} animate-pulse`} />
                  Live Status
                </div>
                <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                  <MapPin size={20} className="text-primary" />
                  {wardName}
                </h2>
              </div>

              <div className="relative w-48 h-48 md:w-56 md:h-56">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    className="stroke-white/5 fill-none"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    className="stroke-primary fill-none"
                    strokeWidth="8"
                    strokeDasharray="283"
                    initial={{ strokeDashoffset: 283 }}
                    animate={{ strokeDashoffset: 283 - (283 * Math.min(aqiData.value, 300)) / 300 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                    style={{ filter: "drop-shadow(0 0 8px rgba(56, 189, 248, 0.5))" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-6xl md:text-7xl font-bold font-display"
                  >
                    {aqiData.value || "N/A"}
                  </motion.span>
                  <span className={`text-sm font-bold uppercase tracking-widest ${getStatusColor(aqiData.status)}`}>
                    {aqiData.status}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground">
                  <Share2 size={20} />
                </button>
                <button className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors font-bold text-sm">
                  View History
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="lg:w-2/3 space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "PM2.5", value: aqiData.pm25 ?? null, unit: "µg/m³", icon: <Wind className="text-primary" />, desc: "Fine particles" },
                { label: "PM10", value: aqiData.pm10 ?? null, unit: "µg/m³", icon: <Wind className="text-accent" />, desc: "Coarse particles" },
                { label: "NO2", value: aqiData.no2 ?? null, unit: "µg/m³", icon: <Gauge className="text-emerald-400" />, desc: "Nitrogen Dioxide" },
                { label: "O3", value: aqiData.o3 ?? null, unit: "µg/m³", icon: <AlertCircle className="text-amber-400" />, desc: "Ozone" },
              ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group/card"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2.5 rounded-xl bg-white/5 group-hover/card:scale-110 transition-transform">
                        {item.icon}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold font-display">
                          {item.value !== null && item.value !== undefined && typeof item.value === 'number' 
                            ? item.value.toFixed(1) 
                            : "N/A"}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{item.unit}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{item.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Scale Visualizer */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>AQI Health Scale</span>
                  <span className="text-primary">Current: {aqiData.status}</span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-white/5 overflow-hidden flex">
                  <div className="h-full w-[16.6%] bg-emerald-500" />
                  <div className="h-full w-[16.6%] bg-yellow-400" />
                  <div className="h-full w-[16.6%] bg-orange-500" />
                  <div className="h-full w-[16.6%] bg-red-500" />
                  <div className="h-full w-[16.6%] bg-purple-600" />
                  <div className="h-full w-[17%] bg-red-900" />
                  
                  {/* Pointer */}
                  {aqiData.value > 0 && (
                    <motion.div 
                      initial={{ left: 0 }}
                      animate={{ left: `${Math.min((aqiData.value / 300) * 100, 100)}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white] z-10" 
                    />
                  )}
                </div>
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                  <span>150</span>
                  <span>200</span>
                  <span>300+</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
