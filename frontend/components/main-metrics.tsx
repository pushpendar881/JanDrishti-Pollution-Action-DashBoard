"use client"

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
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/40 backdrop-blur-xl glass-effect p-10 hover:border-border/60 transition-all duration-500 hover-lift hover-glow group">
      {/* Enhanced background effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 premium-gradient blur-2xl"></div>
      </div>

      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/8 rounded-full blur-3xl animate-subtle-float"></div>
      <div
        className="absolute bottom-0 left-0 w-64 h-64 bg-accent/6 rounded-full blur-3xl animate-subtle-float"
        style={{ animationDelay: "3s" }}
      ></div>

      <div className="relative z-10 space-y-8">
        <div className="flex items-start justify-between animate-fade-slide-in" style={{ animationDelay: "0.1s" }}>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-glow-pulse shadow-lg shadow-red-500/50"></div>
                <span className="text-xs font-bold tracking-wider text-red-400 uppercase">Live Data</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-xs font-semibold text-primary">
                Real-time
              </div>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">{wardName} Air Quality</h1>
            <p className="text-muted-foreground font-medium">Ward-wise pollution monitoring with real-time updates</p>
          </div>

          <div className="flex gap-3">
            <button className="p-3 rounded-xl glass-effect border border-border/40 text-primary hover:border-primary/50 transition-all hover:scale-110 duration-300 hover-glow group/btn">
              <span className="text-xl group-hover/btn:scale-110 transition-transform">📍</span>
            </button>
            <button className="p-3 rounded-xl glass-effect border border-border/40 text-primary hover:border-primary/50 transition-all hover:scale-110 duration-300 hover-glow group/btn">
              <span className="text-xl group-hover/btn:scale-110 transition-transform">♥</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Enhanced AQI Gauge */}
          <div
            className="flex flex-col items-center justify-center animate-fade-slide-in"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="relative w-56 h-56 group/gauge">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/30 to-accent/30 p-2 group-hover/gauge:animate-rotate-slow transition-all">
                <div className="w-full h-full rounded-full glass-effect flex flex-col items-center justify-center backdrop-blur transition-all duration-500 group-hover/gauge:shadow-2xl group-hover/gauge:shadow-primary/30 border border-border/30">
                  <span className="text-7xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent transition-all duration-300 group-hover/gauge:scale-110">
                    {aqiData.value}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground mt-3 uppercase tracking-wider">
                    {aqiData.status}
                  </span>
                  <div className="w-16 h-1 bg-gradient-to-r from-primary to-accent rounded-full mt-2 opacity-60"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Metrics Cards */}
          <div
            className="lg:col-span-2 flex flex-col justify-between gap-6 animate-fade-slide-in"
            style={{ animationDelay: "0.3s" }}
          >
            {/* Top Row */}
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-2xl glass-effect border border-border/40 p-6 hover:border-red-500/40 transition-all duration-300 hover-lift hover:glass-effect group/card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <span className="text-red-500 text-lg">⚠️</span>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Air Quality Status</p>
                </div>
                <p className="text-3xl font-bold text-red-500 transition-all duration-300 group-hover/card:scale-105">
                  {aqiData.status}
                </p>
              </div>

              <div className="rounded-2xl glass-effect border border-border/40 p-6 hover:border-accent/40 transition-all duration-300 hover-lift hover:glass-effect group/card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                    <span className="text-accent text-lg">🌡️</span>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Temperature</p>
                </div>
                <p className="text-3xl font-bold text-accent transition-all duration-300 group-hover/card:scale-105">
                  {aqiData.temperature}°C
                </p>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "PM2.5", value: aqiData.pm25, unit: "µg/m³", color: "primary", icon: "🔴" },
                { label: "PM10", value: aqiData.pm10, unit: "µg/m³", color: "accent", icon: "🟠" },
                { label: "Humidity", value: aqiData.humidity, unit: "%", color: "blue", icon: "💧" },
              ].map((metric, idx) => (
                <div
                  key={idx}
                  className="rounded-xl glass-effect border border-border/40 p-5 hover:border-primary/40 transition-all duration-300 hover-lift group/metric transform hover:scale-105"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{metric.icon}</span>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{metric.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground transition-colors duration-300 group-hover/metric:text-primary">
                    {metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">{metric.unit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl glass-effect border border-border/40 p-6 hover:border-border/60 transition-all hover:glass-effect group/scale">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-lg">📊</span>
            </div>
            <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">Air Quality Index Scale</p>
          </div>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-3">
            {[
              { color: "bg-green-500", width: "flex-1", label: "Good" },
              { color: "bg-yellow-500", width: "flex-1", label: "Moderate" },
              { color: "bg-orange-500", width: "flex-1", label: "Unhealthy for Sensitive" },
              { color: "bg-red-500", width: "flex-1", label: "Unhealthy" },
              { color: "bg-purple-600", width: "flex-1", label: "Very Unhealthy" },
              { color: "bg-red-800", width: "flex-1", label: "Hazardous" },
            ].map((bar, idx) => (
              <div
                key={idx}
                className={`${bar.color} ${bar.width} transition-all duration-300 group-hover/scale:shadow-lg group-hover/scale:shadow-current first:rounded-l-full last:rounded-r-full`}
              ></div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
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
  )
}
