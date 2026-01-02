"use client"

import { useState } from "react"
import Header from "@/components/header"
import MainMetrics from "@/components/main-metrics"
import PollutantFilters from "@/components/pollutant-filters"
import PollutionMap from "@/components/pollution-map"
import PollutionChart from "@/components/pollution-chart"
import WeatherCard from "@/components/weather-card"
import StatsGrid from "@/components/stats-grid"
import NewsSection from "@/components/news-section"
import CitizenReporting from "@/components/citizen-reporting"
import AIForecast from "@/components/ai-forecast"
import PolicyRecommendations from "@/components/policy-recommendations"
import HistoricalAnalysis from "@/components/historical-analysis"
import AlertsPanel from "@/components/alerts-panel"
import ChatbotAssistant from "@/components/chatbot-assistant"

export default function Dashboard() {
  const [selectedPollutant, setSelectedPollutant] = useState<string>("aqi")
  const [selectedCity, setSelectedCity] = useState<string>("new-delhi")
  const [selectedWard, setSelectedWard] = useState<string>("ward-1")
  const [activeTab, setActiveTab] = useState<string>("overview")

  const pollutants = [
    { id: "aqi", label: "AQI (US)", color: "#3b82f6" },
    { id: "pm25", label: "PM2.5", color: "#06b6d4" },
    { id: "pm10", label: "PM10", color: "#10b981" },
    { id: "co", label: "CO", color: "#f59e0b" },
    { id: "so2", label: "SO2", color: "#ef4444" },
    { id: "no2", label: "NO2", color: "#8b5cf6" },
  ]

  const aqiData = {
    value: 206,
    status: "Severe",
    statusColor: "text-red-500",
    statusBg: "bg-red-500/10",
    pm25: 130,
    pm10: 180,
    temperature: 13,
    humidity: 77,
    windSpeed: 7,
    uvIndex: 0,
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: "🏠" },
    { id: "monitoring", label: "Live Monitoring", icon: "📊" },
    { id: "forecast", label: "AI Forecast", icon: "🔮" },
    { id: "reports", label: "Citizen Reports", icon: "📝" },
    { id: "policy", label: "Policy Hub", icon: "🏛️" },
    { id: "history", label: "Historical Data", icon: "📈" },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <>
            <div className="animate-fade-slide-in" style={{ animationDelay: "0.1s" }}>
              <MainMetrics aqiData={aqiData} selectedWard={selectedWard} />
            </div>

            <div className="animate-fade-slide-in" style={{ animationDelay: "0.2s" }}>
              <PollutantFilters
                pollutants={pollutants}
                selectedPollutant={selectedPollutant}
                onSelectPollutant={setSelectedPollutant}
              />
            </div>

            <div
              className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-slide-in"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="lg:col-span-2">
                <PollutionMap selectedPollutant={selectedPollutant} />
              </div>
              <div className="lg:col-span-1">
                <AlertsPanel />
              </div>
            </div>

            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-slide-in"
              style={{ animationDelay: "0.35s" }}
            >
              <WeatherCard aqiData={aqiData} />
              <StatsGrid aqiData={aqiData} />
            </div>
          </>
        )
      case "monitoring":
        return (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              <div className="xl:col-span-3">
                <PollutionChart selectedPollutant={selectedPollutant} />
              </div>
              <div className="xl:col-span-1">
                <NewsSection />
              </div>
            </div>
          </>
        )
      case "forecast":
        return <AIForecast selectedCity={selectedCity} selectedWard={selectedWard} />
      case "reports":
        return <CitizenReporting selectedWard={selectedWard} />
      case "policy":
        return <PolicyRecommendations aqiData={aqiData} />
      case "history":
        return <HistoricalAnalysis selectedPollutant={selectedPollutant} />
      default:
        return null
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background relative overflow-hidden">
      {/* Enhanced background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl animate-subtle-float"></div>
        <div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/6 rounded-full blur-3xl animate-subtle-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-primary/4 rounded-full blur-3xl animate-subtle-float"
          style={{ animationDelay: "4s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-0 w-[300px] h-[300px] bg-accent/5 rounded-full blur-3xl animate-subtle-float"
          style={{ animationDelay: "6s" }}
        ></div>
      </div>

      {/* Subtle grid overlay */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative z-10">
        <Header 
          selectedCity={selectedCity} 
          setSelectedCity={setSelectedCity}
          selectedWard={selectedWard}
          setSelectedWard={setSelectedWard}
        />

        {/* Navigation Tabs */}
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-wrap gap-2 mb-8 p-2 rounded-2xl glass-effect border border-border/30">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-lg hover-glow"
                    : "text-foreground/70 hover:text-foreground hover:bg-border/30"
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-10">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Floating Chatbot */}
      <ChatbotAssistant />
    </main>
  )
}
