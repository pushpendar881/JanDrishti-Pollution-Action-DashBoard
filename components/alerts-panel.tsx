"use client"

import { useState, useEffect } from "react"

interface Alert {
  id: number
  type: "health" | "traffic" | "emergency" | "weather"
  priority: "low" | "medium" | "high" | "critical"
  title: string
  message: string
  timestamp: string
  location?: string
  action?: string
  isRead: boolean
}

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    // Simulate real-time alerts
    const dummyAlerts: Alert[] = [
      {
        id: 1,
        type: "emergency",
        priority: "critical",
        title: "Severe Air Quality Alert",
        message: "AQI has reached 285. Immediate health advisory issued for all residents.",
        timestamp: "2 minutes ago",
        location: "Central Delhi",
        action: "Stay indoors, use masks",
        isRead: false
      },
      {
        id: 2,
        type: "traffic",
        priority: "high",
        title: "Odd-Even Implementation",
        message: "Odd-even vehicle restriction starts from 6 AM tomorrow due to high pollution levels.",
        timestamp: "15 minutes ago",
        location: "All Delhi",
        action: "Check vehicle number",
        isRead: false
      },
      {
        id: 3,
        type: "health",
        priority: "high",
        title: "Health Advisory",
        message: "Children and elderly advised to avoid outdoor activities. Use N95 masks if going out.",
        timestamp: "1 hour ago",
        location: "Ward 1-5",
        action: "Follow health guidelines",
        isRead: true
      },
      {
        id: 4,
        type: "policy",
        priority: "medium",
        title: "Construction Ban Extended",
        message: "All construction activities suspended for next 48 hours due to severe air quality.",
        timestamp: "2 hours ago",
        location: "Central Delhi",
        action: "Comply with orders",
        isRead: true
      },
      {
        id: 5,
        type: "weather",
        priority: "medium",
        title: "Weather Update",
        message: "Light winds expected by evening may help improve air quality conditions.",
        timestamp: "3 hours ago",
        location: "Delhi NCR",
        action: "Monitor conditions",
        isRead: true
      }
    ]
    setAlerts(dummyAlerts)
  }, [])

  const alertTypes = [
    { id: "all", label: "All Alerts", icon: "🔔", count: alerts.length },
    { id: "emergency", label: "Emergency", icon: "🚨", count: alerts.filter(a => a.type === "emergency").length },
    { id: "health", label: "Health", icon: "🏥", count: alerts.filter(a => a.type === "health").length },
    { id: "traffic", label: "Traffic", icon: "🚗", count: alerts.filter(a => a.type === "traffic").length },
    // { id: "policy", label: "Policy", icon: "📋", count: alerts.filter(a => a.type === "policy").length },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/30"
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "low": return "bg-green-500/20 text-green-400 border-green-500/30"
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "emergency": return "🚨"
      case "health": return "🏥"
      case "traffic": return "🚗"
      // case "policy": return "📋"
      case "weather": return "🌤️"
      default: return "🔔"
    }
  }

  const filteredAlerts = filter === "all" ? alerts : alerts.filter(alert => alert.type === filter)
  const unreadCount = alerts.filter(alert => !alert.isRead).length

  const markAsRead = (id: number) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, isRead: true } : alert
    ))
  }

  return (
    <div className="rounded-3xl border border-border/40 glass-effect p-6 h-[550px] flex flex-col hover:border-border/60 transition-all duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-red-500/20">
            <span className="text-xl">🚨</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Live Alerts</h3>
            <p className="text-xs text-muted-foreground">Real-time notifications</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <div className="px-2 py-1 rounded-full bg-red-500 text-white text-xs font-bold animate-glow-pulse">
              {unreadCount}
            </div>
          )}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg glass-effect border border-border/30">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-glow-pulse"></div>
            <span className="text-xs font-semibold text-foreground">Live</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-2 p-1 rounded-xl glass-effect border border-border/30">
        {alertTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setFilter(type.id)}
            className={`flex-1 py-2 rounded-lg font-medium transition-all duration-300 text-xs flex items-center justify-center gap-1 ${
              filter === type.id
                ? "bg-primary text-white shadow-lg"
                : "text-foreground/70 hover:text-foreground hover:bg-border/30"
            }`}
          >
            <span className="text-sm">{type.icon}</span>
            <span className="hidden sm:inline">{type.label}</span>
            {type.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                filter === type.id ? "bg-white/20" : "bg-primary/20 text-primary"
              }`}>
                {type.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
        {filteredAlerts.map((alert, index) => (
          <div
            key={alert.id}
            className={`p-4 rounded-xl border transition-all duration-300 hover:border-border/60 cursor-pointer group ${
              alert.isRead ? "glass-effect border-border/30" : "bg-primary/5 border-primary/20"
            }`}
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => markAsRead(alert.id)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-lg">{getTypeIcon(alert.type)}</span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                    {alert.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded-lg text-xs font-bold border ${getPriorityColor(alert.priority)}`}>
                      {alert.priority.toUpperCase()}
                    </div>
                    {!alert.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary animate-glow-pulse"></div>
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  {alert.message}
                </p>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    {alert.location && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span className="text-primary">📍</span>
                        <span>{alert.location}</span>
                      </div>
                    )}
                    {alert.action && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span className="text-accent">⚡</span>
                        <span>{alert.action}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-muted-foreground">{alert.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* WhatsApp Integration */}
      <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
            <span className="text-green-500 text-lg">📱</span>
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">WhatsApp Alerts</p>
            <p className="text-xs text-muted-foreground">Get instant notifications</p>
          </div>
        </div>
        <button className="w-full py-2 px-4 rounded-lg bg-green-500 text-white font-semibold text-sm hover:bg-green-600 transition-all duration-300 hover:scale-[1.02]">
          Subscribe to WhatsApp Alerts
        </button>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  )
}