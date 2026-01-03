"use client"

import { useState } from "react"

interface CitizenReportingProps {
  selectedWard: string
}

interface Report {
  id: number
  title: string
  description: string
  location: string
  status: "open" | "in-progress" | "resolved"
  priority: "low" | "medium" | "high" | "urgent"
  timestamp: string
  images: string[]
  upvotes: number
  category: string
  reporter: string
}

export default function CitizenReporting({ selectedWard }: CitizenReportingProps) {
  const [activeReportTab, setActiveReportTab] = useState<string>("reports")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showReportForm, setShowReportForm] = useState(false)

  const categories = [
    { id: "all", label: "All Reports", icon: "📋" },
    { id: "smoke", label: "Smoke/Burning", icon: "💨" },
    { id: "dust", label: "Construction Dust", icon: "🏗️" },
    { id: "vehicle", label: "Vehicle Pollution", icon: "🚗" },
    { id: "industrial", label: "Industrial Waste", icon: "🏭" },
    { id: "waste", label: "Waste Burning", icon: "🔥" },
  ]

  const reports: Report[] = [
    {
      id: 1,
      title: "Heavy smoke from waste burning",
      description: "Large amount of smoke coming from illegal waste burning near residential area. Affecting visibility and causing breathing issues.",
      location: "Sector 15, Central Delhi",
      status: "open",
      priority: "urgent",
      timestamp: "2 hours ago",
      images: ["smoke1.jpg", "smoke2.jpg"],
      upvotes: 23,
      category: "smoke",
      reporter: "Citizen A"
    },
    {
      id: 2,
      title: "Construction dust pollution",
      description: "Ongoing construction work without proper dust control measures. Heavy dust particles in air.",
      location: "Block C, Central Delhi",
      status: "in-progress",
      priority: "high",
      timestamp: "5 hours ago",
      images: ["dust1.jpg"],
      upvotes: 15,
      category: "dust",
      reporter: "Citizen B"
    },
    {
      id: 3,
      title: "Industrial chimney emissions",
      description: "Factory releasing thick black smoke continuously. No pollution control equipment visible.",
      location: "Industrial Area, Central Delhi",
      status: "resolved",
      priority: "high",
      timestamp: "1 day ago",
      images: ["industrial1.jpg", "industrial2.jpg"],
      upvotes: 31,
      category: "industrial",
      reporter: "Citizen C"
    },
    {
      id: 4,
      title: "Vehicle emission hotspot",
      description: "Heavy traffic congestion causing severe air pollution. Multiple diesel vehicles emitting black smoke.",
      location: "Main Road, Central Delhi",
      status: "open",
      priority: "medium",
      timestamp: "3 hours ago",
      images: ["traffic1.jpg"],
      upvotes: 8,
      category: "vehicle",
      reporter: "Citizen D"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-red-500/20 text-red-400 border-red-500/30"
      case "in-progress": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "resolved": return "bg-green-500/20 text-green-400 border-green-500/30"
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-600 text-white"
      case "high": return "bg-orange-500 text-white"
      case "medium": return "bg-yellow-500 text-white"
      case "low": return "bg-green-500 text-white"
      default: return "bg-gray-500 text-white"
    }
  }

  const filteredReports = selectedCategory === "all" 
    ? reports 
    : reports.filter(report => report.category === selectedCategory)

  const reportTabs = [
    { id: "reports", label: "Active Reports", icon: "📝" },
    { id: "submit", label: "Submit Report", icon: "➕" },
    { id: "analytics", label: "Ward Analytics", icon: "📊" },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
            <span className="text-2xl">📝</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Citizen Pollution Reports</h2>
            <p className="text-muted-foreground font-medium">Community-driven pollution monitoring and reporting</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 border border-primary/30">
          <div className="w-2 h-2 rounded-full bg-primary animate-glow-pulse"></div>
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">Live Reports</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-2 rounded-2xl glass-effect border border-border/30">
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
              activeReportTab === tab.id
                ? "bg-primary text-white shadow-lg hover-glow"
                : "text-foreground/70 hover:text-foreground hover:bg-border/30"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeReportTab === "reports" && (
        <>
          {/* Category Filters */}
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? "bg-primary text-white shadow-lg"
                    : "glass-effect border border-border/40 text-foreground/70 hover:text-foreground hover:border-primary/40"
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredReports.map((report, index) => (
              <div
                key={report.id}
                className="rounded-3xl border border-border/40 glass-effect p-6 hover:border-border/60 transition-all duration-300 hover-lift group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-1 rounded-lg text-xs font-bold ${getPriorityColor(report.priority)}`}>
                      {report.priority.toUpperCase()}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(report.status)}`}>
                      {report.status.replace("-", " ").toUpperCase()}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{report.timestamp}</span>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {report.title}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {report.description}
                </p>

                <div className="flex items-center gap-2 mb-4 text-sm text-foreground/70">
                  <span className="text-primary">📍</span>
                  <span>{report.location}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/30">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-3 py-1 rounded-lg glass-effect border border-border/30 hover:border-primary/40 transition-all">
                      <span className="text-red-500">👍</span>
                      <span className="text-sm font-semibold">{report.upvotes}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      {report.images.map((_, imgIndex) => (
                        <div key={imgIndex} className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                          <span className="text-xs">📷</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">by {report.reporter}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeReportTab === "submit" && (
        <div className="max-w-2xl mx-auto">
          <div className="rounded-3xl border border-border/40 glass-effect p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20 mx-auto mb-4">
                <span className="text-3xl">📝</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Submit Pollution Report</h3>
              <p className="text-muted-foreground">Help your community by reporting pollution incidents</p>
            </div>

            <form className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Report Title</label>
                <input
                  type="text"
                  placeholder="Brief description of the pollution issue"
                  className="w-full px-4 py-3 rounded-xl glass-effect border border-border/40 text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Category</label>
                <select className="w-full px-4 py-3 rounded-xl glass-effect border border-border/40 text-foreground focus:border-primary/50 focus:outline-none transition-all">
                  <option>Select pollution type</option>
                  <option>Smoke/Burning</option>
                  <option>Construction Dust</option>
                  <option>Vehicle Pollution</option>
                  <option>Industrial Waste</option>
                  <option>Waste Burning</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Location</label>
                <input
                  type="text"
                  placeholder="Specific location or landmark"
                  className="w-full px-4 py-3 rounded-xl glass-effect border border-border/40 text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
                <textarea
                  rows={4}
                  placeholder="Detailed description of the pollution incident"
                  className="w-full px-4 py-3 rounded-xl glass-effect border border-border/40 text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none transition-all resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Upload Images</label>
                <div className="border-2 border-dashed border-border/40 rounded-xl p-8 text-center hover:border-primary/40 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📷</span>
                  </div>
                  <p className="text-muted-foreground mb-2">Drag and drop images or click to browse</p>
                  <p className="text-xs text-muted-foreground">Support: JPG, PNG, GIF (Max 5MB each)</p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:shadow-lg hover-glow transition-all duration-300 hover:scale-[1.02]"
              >
                Submit Report
              </button>
            </form>
          </div>
        </div>
      )}

      {activeReportTab === "analytics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-border/40 glass-effect p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <span className="text-red-500 text-lg">📊</span>
              </div>
              <div>
                <h3 className="font-bold text-foreground">Total Reports</h3>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">127</p>
            <p className="text-sm text-green-400 mt-1">↑ 23% from last month</p>
          </div>

          <div className="rounded-3xl border border-border/40 glass-effect p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <span className="text-yellow-500 text-lg">⏱️</span>
              </div>
              <div>
                <h3 className="font-bold text-foreground">Avg Response Time</h3>
                <p className="text-xs text-muted-foreground">Resolution time</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">4.2h</p>
            <p className="text-sm text-green-400 mt-1">↓ 15% improvement</p>
          </div>

          <div className="rounded-3xl border border-border/40 glass-effect p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <span className="text-green-500 text-lg">✅</span>
              </div>
              <div>
                <h3 className="font-bold text-foreground">Resolution Rate</h3>
                <p className="text-xs text-muted-foreground">Success rate</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">89%</p>
            <p className="text-sm text-green-400 mt-1">↑ 5% this month</p>
          </div>
        </div>
      )}
    </div>
  )
}