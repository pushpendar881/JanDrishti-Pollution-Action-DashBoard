"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import MainMetrics from "@/components/main-metrics"
import PollutantFilters from "@/components/pollutant-filters"
import PollutionMap from "@/components/pollution-map"
import PollutionChart from "@/components/pollution-chart"
import PollutantHealth from "@/components/pollutant-health"
import AQIReference from "@/components/aqi-reference"
import NewsSection from "@/components/news-section"
import CitizenReporting from "@/components/citizen-reporting"
import AIForecast from "@/components/ai-forecast"
import PolicyRecommendations from "@/components/policy-recommendations"
import HistoricalAnalysis from "@/components/historical-analysis"
import AlertsPanel from "@/components/alerts-panel"
import ChatbotAssistant from "@/components/chatbot-assistant"
import { LayoutDashboard, Activity, Zap, Users, ShieldAlert, History, ArrowRight } from "lucide-react"

export default function Dashboard() {
  const [selectedPollutant, setSelectedPollutant] = useState<string>("aqi")
  const [selectedWard, setSelectedWard] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const pollutants = [
    { id: "aqi", label: "AQI (US)", color: "#38bdf8" },
    { id: "pm25", label: "PM2.5", color: "#818cf8" },
    { id: "pm10", label: "PM10", color: "#34d399" },
    { id: "co", label: "CO", color: "#fbbf24" },
    { id: "so2", label: "SO2", color: "#f87171" },
    { id: "no2", label: "NO2", color: "#a78bfa" },
  ]

  // Removed hardcoded aqiData - now fetched dynamically in MainMetrics component

  const tabs = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={18} /> },
    { id: "monitoring", label: "Live Monitoring", icon: <Activity size={18} /> },
    { id: "forecast", label: "AI Forecast", icon: <Zap size={18} /> },
    { id: "reports", label: "Citizen Reports", icon: <Users size={18} /> },
    { id: "policy", label: "Policy Hub", icon: <ShieldAlert size={18} /> },
    { id: "history", label: "Historical Data", icon: <History size={18} /> },
  ]


  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8">
            <MainMetrics selectedWard={selectedWard} />

            <PollutantFilters
              pollutants={pollutants}
              selectedPollutant={selectedPollutant}
              onSelectPollutant={setSelectedPollutant}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <PollutionMap selectedPollutant={selectedPollutant} />
              </div>
              <div className="lg:col-span-1">
                <AlertsPanel />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <PollutantHealth selectedWard={selectedWard} />
              <AQIReference selectedWard={selectedWard} />
            </div>
          </div>
        )
      case "monitoring":
        return (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div className="xl:col-span-3">
              <PollutionChart selectedPollutant={selectedPollutant} selectedWard={selectedWard} />
            </div>
            <div className="xl:col-span-1">
              <NewsSection />
            </div>
          </div>
        )
      case "forecast":
        return <AIForecast selectedWard={selectedWard} />
      case "reports":
        return <CitizenReporting selectedWard={selectedWard} />
      case "policy":
        return <PolicyRecommendations aqiData={{ value: 0, status: "Loading", statusColor: "text-primary", statusBg: "bg-primary/10", pm25: 0, pm10: 0, temperature: 0, humidity: 0, windSpeed: 0, uvIndex: 0 }} />
      case "history":
        return <HistoricalAnalysis selectedPollutant={selectedPollutant} />
      default:
        return null
    }
  }

  return (
    <main className="min-h-screen bg-background relative">

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header 
          selectedWard={selectedWard}
          setSelectedWard={setSelectedWard}
        />

        <div className="flex-1 container-px py-12">
          {/* Hero Header */}
          <div className="mb-10 space-y-3">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Air Quality Dashboard
            </h1>
            <p className="text-muted-foreground text-base max-w-2xl">
              Real-time air quality monitoring for Delhi wards
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="sticky top-20 z-20 mb-8 border-b border-border">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap border-b-2 ${
                    activeTab === tab.id
                      ? "text-primary border-primary"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground/30"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pb-12">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Floating Chatbot */}
      <ChatbotAssistant />

      {/* Footer */}
      <footer className="border-t border-border bg-background py-6 mt-16">
        <div className="container-px">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>System Operational</span>
            </div>
            <div className="text-xs">
              © {new Date().getFullYear()} JanDrishti. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
