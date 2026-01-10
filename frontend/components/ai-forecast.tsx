"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts"
import { aqiService } from "@/lib/api"
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Info, Wind, Car, Factory, Construction, Leaf, Sun, Cloud, Droplets } from "lucide-react"

interface AIForecastProps {
  selectedWard: string
}

export default function AIForecast({ selectedWard }: AIForecastProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>("aqi")
  const [forecastData, setForecastData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<number>(0)
  const [trend, setTrend] = useState<string>("stable")
  const [patterns, setPatterns] = useState<any>(null)
  const [causes, setCauses] = useState<any[]>([])

  const metrics = [
    { id: "aqi", label: "AQI", color: "#3b82f6", icon: "🌡️" },
    { id: "pm25", label: "PM2.5", color: "#06b6d4", icon: "💨" },
    { id: "pm10", label: "PM10", color: "#10b981", icon: "🌫️" },
    { id: "no2", label: "NO2", color: "#8b5cf6", icon: "⚗️" },
    { id: "o3", label: "O3", color: "#14b8a6", icon: "☀️" },
  ]

  // Extract ward number
  const getWardNumber = (wardId: string): string | null => {
    if (!wardId) return null
    if (wardId.startsWith("ward-")) {
      return wardId.replace("ward-", "")
    }
    return wardId
  }

  useEffect(() => {
    const fetchForecast = async () => {
      if (!selectedWard) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const wardNo = getWardNumber(selectedWard)
        if (!wardNo) {
          setError("Invalid ward selected")
          setLoading(false)
          return
        }

        const response = await aqiService.getForecast(
          wardNo,
          '24h',
          selectedMetric as 'aqi' | 'pm25' | 'pm10' | 'no2' | 'o3'
        )

        if (response.forecast && response.forecast.length > 0) {
          setForecastData(response.forecast)
          setConfidence(response.confidence)
          setTrend(response.trend)
          
          // Analyze patterns from forecast data
          analyzePatterns(response.forecast, selectedMetric)
          // Analyze causes
          analyzeCauses(response.forecast, selectedMetric)
        } else {
          setError("No forecast data available")
        }
      } catch (err: any) {
        console.error("Error fetching forecast:", err)
        setError(err.response?.data?.detail || err.message || "Failed to load forecast")
      } finally {
        setLoading(false)
      }
    }

    fetchForecast()
  }, [selectedWard, selectedMetric])

  const analyzePatterns = (data: any[], metric: string) => {
    if (!data.length) return

    const values = data.map(d => d[metric] || 0)
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)
    const minIndex = values.indexOf(min)
    const maxIndex = values.indexOf(max)

    // Find peak hours
    const peakHour = data[maxIndex]?.time || "N/A"
    const cleanestHour = data[minIndex]?.time || "N/A"

    // Calculate variation
    const variation = ((max - min) / avg) * 100

    // Determine pattern type
    let patternType = "stable"
    if (variation > 30) patternType = "highly_variable"
    else if (variation > 15) patternType = "moderate_variable"
    else patternType = "stable"

    setPatterns({
      average: avg,
      minimum: min,
      maximum: max,
      peakHour,
      cleanestHour,
      variation: variation.toFixed(1),
      patternType,
      trend: trend
    })
  }

  const analyzeCauses = (data: any[], metric: string) => {
    if (!data.length) return

    const values = data.map(d => d[metric] || 0)
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const max = Math.max(...values)

    const causesList: any[] = []

    // Determine pollution level
    const isHigh = avg > (metric === 'aqi' ? 150 : metric === 'pm25' ? 55 : metric === 'pm10' ? 150 : metric === 'no2' ? 200 : 200)
    const isVeryHigh = avg > (metric === 'aqi' ? 200 : metric === 'pm25' ? 75 : metric === 'pm10' ? 200 : metric === 'no2' ? 300 : 300)

    // Traffic-related causes
    if (isHigh) {
      causesList.push({
        icon: Car,
        title: "Traffic Emissions",
        description: "High vehicular traffic during peak hours contributes significantly to pollution",
        impact: isVeryHigh ? 85 : 70,
        color: "text-orange-400",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/30",
        details: [
          "Rush hour traffic (8-10 AM, 6-8 PM)",
          "Diesel vehicles emitting NO2 and PM",
          "Congested roads with idling vehicles",
          "Poor traffic flow increasing emissions"
        ]
      })
    }

    // Industrial causes
    if (isHigh && (metric === 'pm25' || metric === 'pm10' || metric === 'aqi')) {
      causesList.push({
        icon: Factory,
        title: "Industrial Activity",
        description: "Nearby industrial zones and power plants release particulate matter",
        impact: isVeryHigh ? 75 : 60,
        color: "text-red-400",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
        details: [
          "Industrial emissions during working hours",
          "Power plant operations",
          "Construction material production",
          "Waste incineration activities"
        ]
      })
    }

    // Construction causes
    if (isHigh && (metric === 'pm10' || metric === 'pm25' || metric === 'aqi')) {
      causesList.push({
        icon: Construction,
        title: "Construction & Demolition",
        description: "Active construction sites generate dust and particulate matter",
        impact: isVeryHigh ? 65 : 50,
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
        details: [
          "Dust from construction sites",
          "Demolition activities",
          "Unpaved roads near construction",
          "Material transportation"
        ]
      })
    }

    // Weather-related causes
    if (isHigh) {
      causesList.push({
        icon: Cloud,
        title: "Weather Conditions",
        description: "Stagnant air and low wind speed trap pollutants near the ground",
        impact: isVeryHigh ? 80 : 65,
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
        details: [
          "Low wind speed preventing dispersion",
          "Temperature inversion trapping pollutants",
          "High humidity increasing particle formation",
          "Lack of rainfall to wash pollutants"
        ]
      })
    }

    // Seasonal causes
    if (isHigh) {
      causesList.push({
        icon: Leaf,
        title: "Seasonal Factors",
        description: "Winter conditions and crop burning contribute to pollution spikes",
        impact: isVeryHigh ? 70 : 55,
        color: "text-purple-400",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/30",
        details: [
          "Crop residue burning in nearby areas",
          "Winter inversion layer",
          "Festival firecrackers (if applicable)",
          "Reduced vegetation cover"
        ]
      })
    }

    // Low pollution indicators
    if (!isHigh) {
      causesList.push({
        icon: CheckCircle,
        title: "Favorable Conditions",
        description: "Current conditions are helping maintain lower pollution levels",
        impact: 90,
        color: "text-green-400",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
        details: [
          "Good wind speed dispersing pollutants",
          "Recent rainfall cleaning the air",
          "Reduced traffic during off-peak hours",
          "Effective pollution control measures"
        ]
      })
    }

    setCauses(causesList)
  }

  const getTrendIcon = () => {
    if (trend === "increasing") return <TrendingUp className="w-5 h-5 text-red-400" />
    if (trend === "decreasing") return <TrendingDown className="w-5 h-5 text-green-400" />
    return <Minus className="w-5 h-5 text-yellow-400" />
  }

  const getSuggestions = () => {
    if (!forecastData.length || !patterns) return []

    const avg = patterns.average
    const isHigh = avg > (selectedMetric === 'aqi' ? 150 : selectedMetric === 'pm25' ? 55 : selectedMetric === 'pm10' ? 150 : 200)
    
    const suggestions = []

    if (isHigh) {
      suggestions.push({
        type: "immediate",
        icon: "⚡",
        title: "Immediate Actions",
        color: "from-red-500/20 to-orange-500/20",
        borderColor: "border-red-500/30",
        items: [
          `Avoid outdoor activities between ${patterns.peakHour}`,
          "Use N95 masks if going outside",
          "Keep windows and doors closed",
          "Use air purifiers indoors",
          "Stay hydrated and limit physical exertion"
        ]
      })

      suggestions.push({
        type: "short-term",
        icon: "📋",
        title: "Short-term Measures",
        color: "from-orange-500/20 to-amber-500/20",
        borderColor: "border-orange-500/30",
        items: [
          "Plan outdoor activities during cleaner hours",
          "Use public transport instead of personal vehicles",
          "Avoid burning waste or using generators",
          "Check air quality updates regularly",
          "Keep indoor plants to improve air quality"
        ]
      })

      suggestions.push({
        type: "long-term",
        icon: "🎯",
        title: "Long-term Strategy",
        color: "from-blue-500/20 to-purple-500/20",
        borderColor: "border-blue-500/30",
        items: [
          "Support green initiatives in your area",
          "Reduce personal vehicle usage",
          "Advocate for better public transport",
          "Support tree plantation drives",
          "Stay informed about pollution control policies"
        ]
      })
    } else {
      suggestions.push({
        type: "maintain",
        icon: "✅",
        title: "Maintain Good Air Quality",
        color: "from-green-500/20 to-emerald-500/20",
        borderColor: "border-green-500/30",
        items: [
          "Continue using public transport",
          "Support environmental initiatives",
          "Maintain indoor air quality",
          "Stay informed about air quality trends",
          "Encourage community participation"
        ]
      })
    }

    return suggestions
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
            <span className="text-2xl">🔮</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">AI-Powered 24-Hour Forecast</h2>
            <p className="text-muted-foreground font-medium">Predictive analytics for proactive pollution management</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
          <div className="w-2 h-2 rounded-full bg-primary animate-glow-pulse"></div>
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">AI Powered</span>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="flex flex-wrap gap-3">
        {metrics.map((metric) => (
          <button
            key={metric.id}
            onClick={() => setSelectedMetric(metric.id)}
            className={`px-5 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
              selectedMetric === metric.id
                ? "text-white shadow-lg scale-105"
                : "glass-effect border border-border/40 text-foreground/70 hover:text-foreground hover:border-primary/40"
            }`}
            style={selectedMetric === metric.id ? { backgroundColor: metric.color } : {}}
          >
            <span className="text-lg">{metric.icon}</span>
            <span>{metric.label}</span>
          </button>
        ))}
      </div>

      {/* Main Forecast Chart */}
      <div className="rounded-3xl border border-border/40 glass-effect p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-foreground">24-Hour Forecast Trend</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg glass-effect border border-border/30">
              {getTrendIcon()}
              <span className="text-xs font-semibold text-foreground capitalize">{trend}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg glass-effect border border-border/30">
              <span className="text-green-400 text-sm">●</span>
              <span className="text-xs font-semibold text-foreground">
                {confidence.toFixed(1)}% Confidence
              </span>
            </div>
          </div>
        </div>

        {loading && (
          <div className="h-80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground">Generating AI forecast...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="text-5xl mb-4">🔮</div>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">Forecast Unavailable</h3>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && forecastData.length > 0 && (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metrics.find(m => m.id === selectedMetric)?.color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={metrics.find(m => m.id === selectedMetric)?.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis 
                  dataKey="time" 
                  stroke="rgba(255,255,255,0.6)" 
                  style={{ fontSize: "12px", fontWeight: "500" }}
                />
                <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: "12px", fontWeight: "500" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 20, 25, 0.95)",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(20px)",
                  }}
                  labelStyle={{ color: "#f1f5f9", fontWeight: "600" }}
                />
                <Area
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke={metrics.find(m => m.id === selectedMetric)?.color}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorForecast)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Patterns & Trends Section */}
      {patterns && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border/40 glass-effect p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">Average</p>
                <p className="text-2xl font-bold text-foreground">{patterns.average.toFixed(1)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 glass-effect p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <span className="text-xl">⬆️</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">Peak Hour</p>
                <p className="text-2xl font-bold text-foreground">{patterns.peakHour}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 glass-effect p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <span className="text-xl">⬇️</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">Cleanest Hour</p>
                <p className="text-2xl font-bold text-foreground">{patterns.cleanestHour}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 glass-effect p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <span className="text-xl">📈</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">Variation</p>
                <p className="text-2xl font-bold text-foreground">{patterns.variation}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Causes Section - Interactive */}
      {causes.length > 0 && !loading && (
        <div className="rounded-3xl border border-border/40 glass-effect p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center border border-orange-500/30">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Pollution Causes</h3>
              <p className="text-sm text-muted-foreground">Interactive analysis of contributing factors</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {causes.map((cause, index) => {
              const IconComponent = cause.icon
              
              return (
                <CauseCard key={index} cause={cause} IconComponent={IconComponent} />
              )
            })}
          </div>
        </div>
      )}

      {/* Suggestions Section */}
      {getSuggestions().length > 0 && !loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
              <Info className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">AI Recommendations</h3>
              <p className="text-sm text-muted-foreground">Actionable suggestions based on forecast</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getSuggestions().map((suggestion, index) => (
              <div
                key={index}
                className={`rounded-2xl border ${suggestion.borderColor} bg-gradient-to-br ${suggestion.color} p-6`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{suggestion.icon}</span>
                  <h4 className="font-bold text-foreground">{suggestion.title}</h4>
                </div>
                <ul className="space-y-2">
                  {suggestion.items.map((item: string, itemIndex: number) => (
                    <li key={itemIndex} className="text-sm text-foreground/90 flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accuracy Metrics */}
      {!loading && forecastData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-border/40 glass-effect p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-green-500 text-xl">🎯</span>
            </div>
            <h4 className="font-bold text-foreground mb-1">Forecast Confidence</h4>
            <p className="text-3xl font-bold text-green-400">{confidence.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">AI prediction confidence</p>
          </div>

          <div className="rounded-3xl border border-border/40 glass-effect p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-500 text-xl">📊</span>
            </div>
            <h4 className="font-bold text-foreground mb-1">Data Points</h4>
            <p className="text-3xl font-bold text-blue-400">{forecastData.length}</p>
            <p className="text-xs text-muted-foreground mt-1">24-hour predictions</p>
          </div>

          <div className="rounded-3xl border border-border/40 glass-effect p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
              {getTrendIcon()}
            </div>
            <h4 className="font-bold text-foreground mb-1">Trend</h4>
            <p className="text-3xl font-bold text-purple-400 capitalize">{trend}</p>
            <p className="text-xs text-muted-foreground mt-1">Predicted direction</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Separate component for cause cards with expandable state
function CauseCard({ cause, IconComponent }: { cause: any, IconComponent: any }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <div
      className={`rounded-2xl border ${cause.borderColor} ${cause.bgColor} p-5 cursor-pointer transition-all duration-300 hover:scale-105 ${
        isExpanded ? 'ring-2 ring-primary/50' : ''
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${cause.bgColor} flex items-center justify-center border ${cause.borderColor}`}>
                        <IconComponent className={`w-5 h-5 ${cause.color}`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-sm">{cause.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{cause.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground font-semibold">Impact</span>
                      <span className={`text-sm font-bold ${cause.color}`}>{cause.impact}%</span>
                    </div>
                    <div className="w-full h-2 bg-border/30 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          cause.color.includes('green') ? 'bg-green-500' :
                          cause.color.includes('red') ? 'bg-red-500' :
                          cause.color.includes('orange') ? 'bg-orange-500' :
                          cause.color.includes('amber') ? 'bg-amber-500' :
                          cause.color.includes('blue') ? 'bg-blue-500' :
                          'bg-purple-500'
                        }`}
                        style={{ width: `${cause.impact}%` }}
                      ></div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border/30 animate-in slide-in-from-top-2">
                      <p className="text-xs font-semibold text-foreground mb-2">Key Factors:</p>
                      <ul className="space-y-2">
                        {cause.details.map((detail: string, idx: number) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

      <div className="mt-3 text-center">
        <span className="text-xs text-muted-foreground">
          {isExpanded ? 'Click to collapse' : 'Click to expand'}
        </span>
      </div>
    </div>
  )
}
