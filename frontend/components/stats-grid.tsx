"use client"

interface AQIData {
  pm25: number
  pm10: number
  status: string
}

interface StatsGridProps {
  aqiData: AQIData
}

export default function StatsGrid({ aqiData }: StatsGridProps) {
  const categories = [
    { name: "Good", range: "0-50", color: "from-green-500 to-green-600" },
    { name: "Moderate", range: "51-100", color: "from-yellow-500 to-yellow-600" },
    { name: "Poor", range: "101-150", color: "from-orange-500 to-orange-600" },
    { name: "Unhealthy", range: "151-200", color: "from-red-500 to-red-600" },
    { name: "Severe", range: "201+", color: "from-purple-600 to-red-700" },
  ]

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

      <div className="space-y-4">
        {categories.map((category, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-5 rounded-2xl glass-effect hover:glass-effect transition-all duration-300 group/cat cursor-pointer border border-border/30 hover:border-border/50 hover:scale-[1.02]"
          >
            <div className="flex items-center gap-4 flex-1">
              <div
                className={`w-4 h-4 rounded-full bg-gradient-to-r ${category.color} group-hover/cat:scale-125 transition-transform shadow-lg`}
                style={{ boxShadow: `0 4px 12px ${category.color.split(' ')[1]}40` }}
              ></div>
              <div>
                <p className="text-base font-bold text-foreground group-hover/cat:text-primary transition-colors">
                  {category.name}
                </p>
                <p className="text-sm text-muted-foreground font-medium">AQI {category.range}</p>
              </div>
            </div>
            <div className="w-8 h-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full opacity-60 group-hover/cat:opacity-100 transition-opacity"></div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
            <span className="text-red-500 text-lg">⚠️</span>
          </div>
          <p className="text-sm font-bold text-foreground">Current Status</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-red-500">{aqiData.status}</p>
            <p className="text-sm text-muted-foreground mt-1">Health advisory in effect</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">PM2.5</p>
            <p className="text-lg font-bold text-foreground">{aqiData.pm25} µg/m³</p>
          </div>
        </div>
      </div>
    </div>
  )
}
