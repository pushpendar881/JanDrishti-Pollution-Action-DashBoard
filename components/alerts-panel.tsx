"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, AlertTriangle, ShieldAlert, Info, MessageCircle, MoreVertical } from "lucide-react"

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
    const dummyAlerts: Alert[] = [
      {
        id: 1,
        type: "emergency",
        priority: "critical",
        title: "Severe Air Quality Alert",
        message: "AQI has reached 285. Immediate health advisory issued for all residents.",
        timestamp: "2 mins ago",
        location: "Central Delhi",
        action: "Stay indoors",
        isRead: false
      },
      {
        id: 2,
        type: "traffic",
        priority: "high",
        title: "Odd-Even Implementation",
        message: "Odd-even vehicle restriction starts from 6 AM tomorrow due to high pollution levels.",
        timestamp: "15 mins ago",
        location: "All Delhi",
        action: "Check schedule",
        isRead: false
      },
      {
        id: 3,
        type: "health",
        priority: "high",
        title: "Health Advisory",
        message: "Children and elderly advised to avoid outdoor activities. Use N95 masks.",
        timestamp: "1 hour ago",
        location: "Ward 1-5",
        action: "Follow guidelines",
        isRead: true
      }
    ]
    setAlerts(dummyAlerts)
  }, [])

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "critical": return "text-red-500 bg-red-500/10 border-red-500/20"
      case "high": return "text-orange-500 bg-orange-500/10 border-orange-500/20"
      case "medium": return "text-amber-500 bg-amber-500/10 border-amber-500/20"
      default: return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "emergency": return <ShieldAlert size={16} />
      case "health": return <AlertTriangle size={16} />
      case "traffic": return <Info size={16} />
      default: return <Bell size={16} />
    }
  }

  const filteredAlerts = filter === "all" ? alerts : alerts.filter(alert => alert.type === filter)

  return (
    <div className="flex flex-col h-[550px] relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl grad-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <Bell size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Critical Alerts</h3>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Real-time Safety Feed</p>
          </div>
        </div>
        <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <MoreVertical size={18} className="text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-5 rounded-[1.5rem] border transition-all duration-300 group cursor-pointer ${
                alert.isRead 
                  ? "bg-white/5 border-white/5 hover:border-white/10" 
                  : "bg-primary/5 border-primary/20 shadow-[0_0_20px_rgba(56,189,248,0.05)]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl ${getPriorityStyles(alert.priority)}`}>
                  {getTypeIcon(alert.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">
                      {alert.title}
                    </h4>
                    {!alert.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(56,189,248,0.5)] animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {alert.message}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Info size={10} className="text-primary" />
                        {alert.location}
                      </span>
                      <span>{alert.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-6">
        <button className="w-full p-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center gap-3 group hover:bg-[#25D366]/20 transition-all duration-300">
          <div className="w-8 h-8 rounded-lg bg-[#25D366] flex items-center justify-center text-white shadow-lg shadow-[#25D366]/20 group-hover:scale-110 transition-transform">
            <MessageCircle size={18} />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-foreground">Subscribe to WhatsApp</div>
            <div className="text-[10px] font-bold text-[#25D366] uppercase tracking-widest">Instant Safety Protocol</div>
          </div>
        </button>
      </div>
    </div>
  )
}
