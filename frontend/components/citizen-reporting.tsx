"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/frontend/contexts/auth-context"
import { reportsAPI, Report } from "@/frontend/lib/api"
import AuthDialog from "@/frontend/components/auth-dialog"
import { toast } from "sonner"

interface CitizenReportingProps {
  selectedWard: string
}

export default function CitizenReporting({ selectedWard }: CitizenReportingProps) {
  const { isAuthenticated } = useAuth()
  const [activeReportTab, setActiveReportTab] = useState<string>("reports")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    category: "",
    priority: "medium",
  })

  const categories = [
    { id: "all", label: "All Reports", icon: "📋" },
    { id: "smoke", label: "Smoke/Burning", icon: "💨" },
    { id: "dust", label: "Construction Dust", icon: "🏗️" },
    { id: "vehicle", label: "Vehicle Pollution", icon: "🚗" },
    { id: "industrial", label: "Industrial Waste", icon: "🏭" },
    { id: "waste", label: "Waste Burning", icon: "🔥" },
  ]

  // Fetch reports
  useEffect(() => {
    fetchReports()
  }, [selectedCategory])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const category = selectedCategory === "all" ? undefined : selectedCategory
      const data = await reportsAPI.getAll(category)
      setReports(data)
    } catch (error: any) {
      toast.error("Failed to load reports: " + (error.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    return `${diffDays} days ago`
  }

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

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      setShowAuthDialog(true)
      return
    }

    if (!formData.title || !formData.description || !formData.location || !formData.category) {
      toast.error("Please fill in all required fields")
      return
    }

    setSubmitting(true)
    try {
      await reportsAPI.create({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        category: formData.category,
        priority: formData.priority,
        ward: selectedWard,
        images: [],
      })
      
      toast.success("Report submitted successfully!")
      setFormData({
        title: "",
        description: "",
        location: "",
        category: "",
        priority: "medium",
      })
      setActiveReportTab("reports")
      fetchReports()
    } catch (error: any) {
      toast.error("Failed to submit report: " + (error.message || "Unknown error"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpvote = async (reportId: string) => {
    try {
      await reportsAPI.upvote(reportId)
      fetchReports()
    } catch (error: any) {
      toast.error("Failed to upvote: " + (error.message || "Unknown error"))
    }
  }

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
          {loading ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">Loading reports...</div>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">No reports found</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {reports.map((report, index) => (
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
                    <span className="text-xs text-muted-foreground">{formatTimestamp(report.created_at)}</span>
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
                      <button 
                        onClick={() => handleUpvote(report.id)}
                        className="flex items-center gap-2 px-3 py-1 rounded-lg glass-effect border border-border/30 hover:border-primary/40 transition-all"
                      >
                        <span className="text-red-500">👍</span>
                        <span className="text-sm font-semibold">{report.upvotes}</span>
                      </button>
                      {report.images && report.images.length > 0 && (
                        <div className="flex items-center gap-1">
                          {report.images.map((_, imgIndex) => (
                            <div key={imgIndex} className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                              <span className="text-xs">📷</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeReportTab === "submit" && (
        <div className="max-w-2xl mx-auto">
          {!isAuthenticated ? (
            <div className="rounded-3xl border border-border/40 glass-effect p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20 mx-auto mb-6">
                <span className="text-4xl">🔒</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Login Required</h3>
              <p className="text-muted-foreground mb-6">
                You need to login to submit a pollution report. This helps us keep track of reports and maintain quality.
              </p>
              <button
                onClick={() => setShowAuthDialog(true)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:shadow-lg hover-glow transition-all duration-300 hover:scale-105"
              >
                Login / Sign Up
              </button>
              <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
            </div>
          ) : (
            <div className="rounded-3xl border border-border/40 glass-effect p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20 mx-auto mb-4">
                  <span className="text-3xl">📝</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Submit Pollution Report</h3>
                <p className="text-muted-foreground">Help your community by reporting pollution incidents</p>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Report Title *</label>
                <input
                  type="text"
                  placeholder="Brief description of the pollution issue"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  disabled={!isAuthenticated}
                  className="w-full px-4 py-3 rounded-xl glass-effect border border-border/40 text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  disabled={!isAuthenticated}
                  className="w-full px-4 py-3 rounded-xl glass-effect border border-border/40 text-foreground focus:border-primary/50 focus:outline-none transition-all disabled:opacity-50"
                >
                  <option value="">Select pollution type</option>
                  <option value="smoke">Smoke/Burning</option>
                  <option value="dust">Construction Dust</option>
                  <option value="vehicle">Vehicle Pollution</option>
                  <option value="industrial">Industrial Waste</option>
                  <option value="waste">Waste Burning</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Location *</label>
                <input
                  type="text"
                  placeholder="Specific location or landmark"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  disabled={!isAuthenticated}
                  className="w-full px-4 py-3 rounded-xl glass-effect border border-border/40 text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  disabled={!isAuthenticated}
                  className="w-full px-4 py-3 rounded-xl glass-effect border border-border/40 text-foreground focus:border-primary/50 focus:outline-none transition-all disabled:opacity-50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Description *</label>
                <textarea
                  rows={4}
                  placeholder="Detailed description of the pollution incident"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  disabled={!isAuthenticated}
                  className="w-full px-4 py-3 rounded-xl glass-effect border border-border/40 text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none transition-all resize-none disabled:opacity-50"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Upload Images</label>
                <div className="border-2 border-dashed border-border/40 rounded-xl p-8 text-center hover:border-primary/40 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📷</span>
                  </div>
                  <p className="text-muted-foreground mb-2">Image upload coming soon</p>
                  <p className="text-xs text-muted-foreground">Support: JPG, PNG, GIF (Max 5MB each)</p>
                </div>
              </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:shadow-lg hover-glow transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
              </form>
            </div>
          )}
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