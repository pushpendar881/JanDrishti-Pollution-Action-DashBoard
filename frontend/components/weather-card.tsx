"use client"

interface AQIData {
  temperature: number
  humidity: number
  windSpeed: number
  uvIndex: number
}

interface WeatherCardProps {
  aqiData: AQIData
}

export default function WeatherCard({ aqiData }: WeatherCardProps) {
  return (
    <div
      className="rounded-3xl border border-border/40 backdrop-blur-xl glass-effect overflow-hidden group hover:border-primary/40 transition-all duration-500 p-8 hover-lift animate-fade-slide-in"
      style={{ animationDelay: "0.35s" }}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
            <span className="text-2xl">☁️</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Weather Conditions</h3>
            <p className="text-sm text-muted-foreground font-medium">Live environmental data</p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-xs font-semibold text-primary animate-glow-pulse">
          Real-time
        </div>
      </div>

      <div className="space-y-6">
        {[
          { label: "Temperature", value: `${aqiData.temperature}°C`, icon: "🌡️", color: "primary", gradient: "from-orange-500 to-red-500" },
          { label: "Humidity", value: `${aqiData.humidity}%`, icon: "💧", color: "accent", gradient: "from-blue-500 to-cyan-500" },
          { label: "Wind Speed", value: `${aqiData.windSpeed} km/h`, icon: "💨", color: "blue", gradient: "from-gray-500 to-slate-600" },
          { label: "UV Index", value: `${aqiData.uvIndex}`, icon: "☀️", color: "yellow", gradient: "from-yellow-500 to-orange-500" },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{ animationDelay: `${0.4 + idx * 0.05}s` }}
            className="flex items-center justify-between p-6 rounded-2xl glass-effect border border-border/30 hover:border-primary/40 transition-all duration-300 hover-lift animate-fade-slide-in group/item transform hover:scale-[1.02]"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} bg-opacity-20 flex items-center justify-center border border-white/10`}>
                <span className="text-2xl animate-subtle-float" style={{ animationDelay: `${idx * 0.5}s` }}>
                  {item.icon}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">{item.label}</p>
                <p className="text-3xl font-bold text-foreground transition-all duration-300 group-hover/item:scale-105 group-hover/item:text-primary">
                  {item.value}
                </p>
              </div>
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full opacity-60 group-hover/item:opacity-100 transition-opacity"></div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-primary text-lg">📊</span>
          </div>
          <p className="text-sm font-semibold text-foreground">Weather Summary</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Current conditions show moderate temperature with high humidity levels. Wind patterns are favorable for air quality improvement.
        </p>
      </div>
    </div>
  )
}
