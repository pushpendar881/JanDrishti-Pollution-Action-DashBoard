"use client"

import { useState } from "react"

interface PolicyRecommendationsProps {
  aqiData: {
    value: number
    status: string
    pm25: number
    pm10: number
  }
}

export default function PolicyRecommendations({ aqiData }: PolicyRecommendationsProps) {
  const [activeSection, setActiveSection] = useState<string>("recommendations")

  const sections = [
    { id: "recommendations", label: "AI Recommendations", icon: "🤖" },
    { id: "regulations", label: "Current Regulations", icon: "📋" },
    { id: "emergency", label: "Emergency SOPs", icon: "🚨" },
    { id: "resources", label: "Resources & Helplines", icon: "📞" },
  ]

  const aiRecommendations = [
    {
      priority: "critical",
      title: "Immediate Traffic Restrictions",
      description: "Implement odd-even vehicle scheme for next 48 hours to reduce vehicular emissions by 30%",
      impact: "High",
      timeframe: "Immediate",
      department: "Transport Authority",
      estimatedReduction: "25-30% AQI reduction",
      icon: "🚗",
      actions: [
        "Deploy traffic police at major intersections",
        "Increase public transport frequency by 40%",
        "Set up vehicle checking points",
        "Issue public advisories via media"
      ]
    },
    {
      priority: "high",
      title: "Construction Activity Suspension",
      description: "Halt all non-essential construction and demolition activities in the ward",
      impact: "Medium",
      timeframe: "24 hours",
      department: "Municipal Corporation",
      estimatedReduction: "15-20% PM10 reduction",
      icon: "🏗️",
      actions: [
        "Issue stop-work orders to construction sites",
        "Deploy inspection teams",
        "Ensure compliance monitoring",
        "Provide alternative work arrangements"
      ]
    },
    {
      priority: "medium",
      title: "Industrial Emission Control",
      description: "Mandate industrial units to operate at 70% capacity and enhance pollution control measures",
      impact: "Medium",
      timeframe: "48 hours",
      department: "Pollution Control Board",
      estimatedReduction: "10-15% overall reduction",
      icon: "🏭",
      actions: [
        "Conduct surprise inspections",
        "Monitor stack emissions",
        "Verify pollution control equipment",
        "Issue compliance certificates"
      ]
    },
    {
      priority: "preventive",
      title: "Water Sprinkling Operations",
      description: "Increase road dust suppression activities and deploy water tankers",
      impact: "Low-Medium",
      timeframe: "Ongoing",
      department: "Municipal Services",
      estimatedReduction: "5-10% dust reduction",
      icon: "💧",
      actions: [
        "Deploy water tankers on major roads",
        "Increase sprinkling frequency",
        "Focus on construction-adjacent areas",
        "Monitor dust levels continuously"
      ]
    }
  ]

  const regulations = [
    {
      title: "National Clean Air Programme (NCAP)",
      description: "Comprehensive plan to reduce PM2.5 and PM10 concentrations by 20-30% by 2024",
      status: "Active",
      lastUpdated: "2023",
      keyPoints: [
        "City-specific action plans",
        "Technology-driven solutions",
        "Public participation initiatives",
        "Regular monitoring and assessment"
      ]
    },
    {
      title: "Air (Prevention and Control of Pollution) Act, 1981",
      description: "Primary legislation for air pollution control in India",
      status: "Active",
      lastUpdated: "2021 Amendment",
      keyPoints: [
        "Establishment of Pollution Control Boards",
        "Consent mechanisms for industries",
        "Emission standards and monitoring",
        "Penalties for violations"
      ]
    },
    {
      title: "BS-VI Emission Standards",
      description: "Stringent vehicular emission norms equivalent to Euro-VI standards",
      status: "Implemented",
      lastUpdated: "2020",
      keyPoints: [
        "Reduced sulfur content in fuel",
        "Advanced emission control systems",
        "Real driving emission tests",
        "On-board diagnostics mandatory"
      ]
    }
  ]

  const emergencySOPs = [
    {
      level: "Severe+ (AQI 401-500)",
      color: "red",
      measures: [
        "Complete ban on construction and demolition",
        "Closure of schools and colleges",
        "Work from home advisory for offices",
        "Ban on diesel generators",
        "Entry restrictions for trucks",
        "Odd-even vehicle scheme mandatory"
      ]
    },
    {
      level: "Severe (AQI 301-400)",
      color: "purple",
      measures: [
        "Stop construction and demolition activities",
        "Increase bus and metro services",
        "Parking fee hike by 3-4 times",
        "Task force deployment for monitoring",
        "Public health advisory issued",
        "Industrial activity restrictions"
      ]
    },
    {
      level: "Very Poor (AQI 201-300)",
      color: "red",
      measures: [
        "Mechanized sweeping on roads",
        "Water sprinkling 2-3 times daily",
        "Strict vigilance on waste burning",
        "Enhanced public transport",
        "Health advisory for sensitive groups",
        "Industrial emission monitoring"
      ]
    }
  ]

  const resources = [
    {
      category: "Emergency Helplines",
      items: [
        { name: "Pollution Control Board", number: "1800-11-0031", available: "24/7" },
        { name: "Municipal Corporation", number: "1800-11-3344", available: "24/7" },
        { name: "Traffic Police", number: "1095", available: "24/7" },
        { name: "Health Emergency", number: "108", available: "24/7" }
      ]
    },
    {
      category: "Government Portals",
      items: [
        { name: "Central Pollution Control Board", url: "cpcb.nic.in", type: "Website" },
        { name: "Air Quality Index Portal", url: "app.cpcbccr.com", type: "Real-time Data" },
        { name: "SAMEER App", url: "Play Store/App Store", type: "Mobile App" },
        { name: "Prana Air App", url: "Play Store/App Store", type: "Mobile App" }
      ]
    },
    {
      category: "Health Resources",
      items: [
        { name: "AIIMS Pollution Clinic", contact: "011-26588500", type: "Specialized Care" },
        { name: "Chest Disease Hospital", contact: "011-25172000", type: "Respiratory Care" },
        { name: "Apollo Hospital", contact: "1860-500-1066", type: "Emergency Care" },
        { name: "Max Healthcare", contact: "1800-102-4647", type: "Multi-specialty" }
      ]
    }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/30"
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "preventive": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
            <span className="text-2xl">🏛️</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Policy & Governance Hub</h2>
            <p className="text-muted-foreground font-medium">AI-driven policy recommendations and regulatory information</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-glow-pulse"></div>
          <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">AQI {aqiData.value} - {aqiData.status}</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 p-2 rounded-2xl glass-effect border border-border/30">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
              activeSection === section.id
                ? "bg-primary text-white shadow-lg hover-glow"
                : "text-foreground/70 hover:text-foreground hover:bg-border/30"
            }`}
          >
            <span className="text-lg">{section.icon}</span>
            <span>{section.label}</span>
          </button>
        ))}
      </div>

      {/* AI Recommendations */}
      {activeSection === "recommendations" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {aiRecommendations.map((rec, index) => (
              <div
                key={index}
                className="rounded-3xl border border-border/40 glass-effect p-6 hover:border-border/60 transition-all duration-300 hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <span className="text-2xl">{rec.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{rec.title}</h3>
                      <p className="text-sm text-muted-foreground">{rec.department}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(rec.priority)}`}>
                    {rec.priority.toUpperCase()}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{rec.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 rounded-xl glass-effect border border-border/30">
                    <p className="text-xs text-muted-foreground">Impact</p>
                    <p className="font-bold text-foreground">{rec.impact}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl glass-effect border border-border/30">
                    <p className="text-xs text-muted-foreground">Timeframe</p>
                    <p className="font-bold text-foreground">{rec.timeframe}</p>
                  </div>
                </div>

                <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <p className="text-xs text-green-400 font-semibold mb-1">Estimated Reduction</p>
                  <p className="text-sm font-bold text-green-400">{rec.estimatedReduction}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Action Items:</p>
                  <ul className="space-y-1">
                    {rec.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Regulations */}
      {activeSection === "regulations" && (
        <div className="space-y-6">
          {regulations.map((reg, index) => (
            <div
              key={index}
              className="rounded-3xl border border-border/40 glass-effect p-6 hover:border-border/60 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{reg.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{reg.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-semibold">
                    {reg.status}
                  </div>
                  <span className="text-xs text-muted-foreground">Updated: {reg.lastUpdated}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reg.keyPoints.map((point, pointIndex) => (
                  <div key={pointIndex} className="flex items-start gap-3 p-3 rounded-xl glass-effect border border-border/30">
                    <span className="text-primary text-sm mt-1">✓</span>
                    <span className="text-sm text-foreground">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Emergency SOPs */}
      {activeSection === "emergency" && (
        <div className="space-y-6">
          {emergencySOPs.map((sop, index) => (
            <div
              key={index}
              className="rounded-3xl border border-border/40 glass-effect p-6 hover:border-border/60 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-4 h-4 rounded-full bg-${sop.color}-500`}></div>
                <h3 className="text-xl font-bold text-foreground">{sop.level}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sop.measures.map((measure, measureIndex) => (
                  <div key={measureIndex} className="flex items-start gap-3 p-3 rounded-xl glass-effect border border-border/30">
                    <span className={`text-${sop.color}-400 text-sm mt-1`}>•</span>
                    <span className="text-sm text-foreground">{measure}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resources & Helplines */}
      {activeSection === "resources" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {resources.map((category, index) => (
            <div
              key={index}
              className="rounded-3xl border border-border/40 glass-effect p-6"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-xl">
                  {category.category === "Emergency Helplines" ? "📞" : 
                   category.category === "Government Portals" ? "🌐" : "🏥"}
                </span>
                {category.category}
              </h3>

              <div className="space-y-3">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="p-3 rounded-xl glass-effect border border-border/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{item.name}</p>
                        <p className="text-xs text-primary font-mono">
                          {(item as any).number || (item as any).url || (item as any).contact}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {(item as any).available || (item as any).type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
