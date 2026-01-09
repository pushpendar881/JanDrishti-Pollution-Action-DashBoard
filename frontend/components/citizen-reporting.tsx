"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { reportsService, CreateReportData } from "@/lib/api"
import AuthDialog from "@/components/auth-dialog"
import { toast } from "sonner"

interface CitizenReportingProps {
  selectedWard: string
}

interface Report {
  id: string
  user_id: string
  title: string
  description: string
  location: string
  status: "open" | "in-progress" | "resolved"
  priority: "low" | "medium" | "high" | "urgent"
  ward?: string
  images: string[]
  upvotes: number
  category: string
  created_at: string
  updated_at: string
}

export default function CitizenReporting({ selectedWard }: CitizenReportingProps) {
  const [activeReportTab, setActiveReportTab] = useState<string>("reports")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showReportForm, setShowReportForm] = useState(false)
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
    priority: "medium" as const
  })

  const { isAuthenticated, user } = useAuth()

  // Load reports on component mount
  useEffect(() => {
    loadReports()
  }, [selectedCategory])

  const loadReports = async () => {
    setLoading(true)
    try {
      const params = selectedCategory !== "all" ? { category: selectedCategory } : {}
      const data = await reportsService.getReports(params)
      setReports(data)
    } catch (error) {
      console.error("Failed to load reports:", error)
      toast.error("Failed to load reports")
    } finally {
      setLoading(false)
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
      const reportData: CreateReportData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        category: formData.category,
        priority: formData.priority,
        ward: selectedWard
      }

      await reportsService.createReport(reportData)
      
      toast.success("Report submitted successfully!", {
        description: "Thank you for helping improve our community's air quality."
      })
      
      // Reset form and switch to reports tab
      setFormData({
        title: "",
        description: "",
        location: "",
        category: "",
        priority: "medium"
      })
      setActiveReportTab("reports")
      
      // Reload reports to show the new one
      loadReports()
    } catch (error: any) {
      console.error("Failed to submit report:", error)
      toast.error("Failed to submit report", {
        description: error.message || "Please try again later"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpvote = async (reportId: string) => {
    try {
      await reportsService.upvoteReport(reportId)
      // Update local state
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, upvotes: report.upvotes + 1 }
          : report
      ))
      toast.success("Vote recorded!")
    } catch (error) {
      console.error("Failed to upvote:", error)
      toast.error("Failed to record vote")
    }
  }

  const requireAuth = (action: string) => {
    if (!isAuthenticated) {
      toast.info(`Please login to ${action}`, {
        action: {
          label: "Login",
          onClick: () => setShowAuthDialog(true)
        }
      })
      return false
    }
    return true
  }

  const categories = [
    { id: "all", label: "All Reports", icon: "📋" },
    { id: "smoke", label: "Smoke/Burning", icon: "💨" },
    { id: "dust", label: "Construction Dust", icon: "🏗️" },
    { id: "vehicle", label: "Vehicle Pollution", icon: "🚗" },
    { id: "industrial", label: "Industrial Waste", icon: "🏭" },
    { id: "waste", label: "Waste Burning", icon: "🔥" },
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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} days ago`
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
    <>
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
            {loading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-3xl border border-border/40 glass-effect p-6 animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-6 bg-muted/50 rounded-lg"></div>
                      <div className="w-20 h-6 bg-muted/50 rounded-full"></div>
                    </div>
                    <div className="w-16 h-4 bg-muted/50 rounded"></div>
                  </div>
                  <div className="w-3/4 h-6 bg-muted/50 rounded mb-2"></div>
                  <div className="w-full h-16 bg-muted/50 rounded mb-4"></div>
                  <div className="w-1/2 h-4 bg-muted/50 rounded"></div>
                </div>
              ))
            ) : filteredReports.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📝</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">No reports found</h3>
                <p className="text-muted-foreground">
                  {selectedCategory === "all" 
                    ? "No pollution reports have been submitted yet." 
                    : `No reports found for ${categories.find(c => c.id === selectedCategory)?.label}.`
                  }
                </p>
              </div>
            ) : (
              filteredReports.map((report, index) => (
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
                        className="flex items-center gap-2 px-3 py-1 rounded-lg glass-effect border border-border/30 hover:border-primary/40 transition-all hover:scale-105"
                      >
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
                    <span className="text-xs text-muted-foreground">
                      Report #{report.id.slice(-6)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeReportTab === "submit" && (
        <div className="max-w-2xl mx-auto">
          <div className="rounded-3xl border border-border/40 glass-effect p-8">
            {!isAuthenticated ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20 mx-auto mb-4">
                  <span className="text-3xl">🔒</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Login Required</h3>
                <p className="text-muted-foreground mb-6">Please login to submit pollution reports and help your community</p>
                <button
                  onClick={() => setShowAuthDialog(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:shadow-lg hover-glow transition-all duration-300 hover:scale-105"
                >
                  Login to Submit Report
                </button>
              </div>
            ) : (
              <>
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
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Brief description of the pollution issue"
                      className="w-full px-4 py-3 rounded-xl glass-effect border border-border/40 text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Category *</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl glass-effect border border-border/40 text-foreground focus:border-primary/50 focus:outline-none transition-all"
                      required
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
                    <label className="block text-sm font-semibold text-foreground mb-2">Priority</label>
                    <select 
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-4 py-3 rounded-xl glass-effect border border-border/40 text-foreground focus:border-primary/50 focus:outline-none transition-all"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Location *</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Specific location or landmark"
                      className="w-full px-4 py-3 rounded-xl glass-effect border border-border/40 text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Description *</label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed description of the pollution incident"
                      className="w-full px-4 py-3 rounded-xl glass-effect border border-border/40 text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none transition-all resize-none"
                      required
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Upload Images (Optional)</label>
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
                    disabled={submitting}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:shadow-lg hover-glow transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting..." : "Submit Report"}
                  </button>
                </form>
              </>
            )}
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

    {/* Auth Dialog */}
    <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
  </>
  )
}
