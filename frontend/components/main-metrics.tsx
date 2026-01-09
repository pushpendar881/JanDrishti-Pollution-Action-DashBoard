"use client"

import { motion } from "framer-motion"
import { Wind, Thermometer, Droplets, Gauge, AlertCircle, MapPin, Share2 } from "lucide-react"

interface AQIData {
  value: number
  status: string
  statusColor: string
  statusBg: string
  pm25: number
  pm10: number
  temperature: number
  humidity: number
  windSpeed: number
  uvIndex: number
}

interface MainMetricsProps {
  aqiData: AQIData
  selectedWard: string
}

export default function MainMetrics({ aqiData, selectedWard }: MainMetricsProps) {
  const wardNames = {
    "ward-1": "Central Delhi",
    "ward-2": "South Delhi", 
    "ward-3": "North Delhi",
    "ward-4": "East Delhi",
    "ward-5": "West Delhi"
  }

  const wardName = wardNames[selectedWard as keyof typeof wardNames] || "Central Delhi"

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "good": return "text-emerald-400"
      case "moderate": return "text-amber-400"
      case "unhealthy": return "text-orange-500"
      case "severe": return "text-red-500"
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

        <div className="relative z-10 flex flex-col lg:flex-row gap-12">
          {/* Main AQI Display */}
          <div className="lg:w-1/3 flex flex-col items-center justify-center text-center space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
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
                  {aqiData.value}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "PM2.5", value: aqiData.pm25, unit: "µg/m³", icon: <Wind className="text-primary" />, desc: "Fine particles" },
                { label: "PM10", value: aqiData.pm10, unit: "µg/m³", icon: <Wind className="text-accent" />, desc: "Coarse particles" },
                { label: "Temp", value: aqiData.temperature, unit: "°C", icon: <Thermometer className="text-orange-400" />, desc: "Ambient" },
                { label: "Humidity", value: aqiData.humidity, unit: "%", icon: <Droplets className="text-blue-400" />, desc: "Relative" },
                { label: "Wind", value: aqiData.windSpeed, unit: "km/h", icon: <Gauge className="text-emerald-400" />, desc: "Velocity" },
                { label: "UV Index", value: aqiData.uvIndex, unit: "", icon: <AlertCircle className="text-amber-400" />, desc: "Exposure" },
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
                      <span className="text-2xl font-bold font-display">{item.value}</span>
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
                <motion.div 
                  initial={{ left: 0 }}
                  animate={{ left: `${Math.min((aqiData.value / 300) * 100, 100)}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white] z-10" 
                />
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
      </div>
    </div>
  )
}
