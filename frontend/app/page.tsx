"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
import { LayoutDashboard, Activity, Zap, Users, ShieldAlert, History, ArrowRight } from "lucide-react"

export default function Dashboard() {
  const [selectedPollutant, setSelectedPollutant] = useState<string>("aqi")
  const [selectedCity, setSelectedCity] = useState<string>("new-delhi")
  const [selectedWard, setSelectedWard] = useState<string>("ward-1")
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
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={18} /> },
    { id: "monitoring", label: "Live Monitoring", icon: <Activity size={18} /> },
    { id: "forecast", label: "AI Forecast", icon: <Zap size={18} /> },
    { id: "reports", label: "Citizen Reports", icon: <Users size={18} /> },
    { id: "policy", label: "Policy Hub", icon: <ShieldAlert size={18} /> },
    { id: "history", label: "Historical Data", icon: <History size={18} /> },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            <motion.div variants={itemVariants}>
              <MainMetrics aqiData={aqiData} selectedWard={selectedWard} />
            </motion.div>

            <motion.div variants={itemVariants}>
              <PollutantFilters
                pollutants={pollutants}
                selectedPollutant={selectedPollutant}
                onSelectPollutant={setSelectedPollutant}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <PollutionMap selectedPollutant={selectedPollutant} />
              </div>
              <div className="lg:col-span-1">
                <AlertsPanel />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <WeatherCard aqiData={aqiData} />
              <StatsGrid aqiData={aqiData} />
            </motion.div>
          </motion.div>
        )
      case "monitoring":
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="grid grid-cols-1 xl:grid-cols-4 gap-8"
          >
            <div className="xl:col-span-3">
              <PollutionChart selectedPollutant={selectedPollutant} />
            </div>
            <div className="xl:col-span-1">
              <NewsSection />
            </div>
          </motion.div>
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
    <main className="min-h-screen bg-background relative selection:bg-primary/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-mesh" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-mesh" style={{ animationDelay: '-5s' }} />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-purple-500/5 rounded-full blur-[100px] animate-mesh" style={{ animationDelay: '-10s' }} />
        
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(56, 189, 248, 0.4) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header 
          selectedCity={selectedCity} 
          setSelectedCity={setSelectedCity}
          selectedWard={selectedWard}
          setSelectedWard={setSelectedWard}
        />

        <div className="flex-1 container-px py-12">
          {/* Hero Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Live Environmental Intelligence
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Actionable Insights for a <br />
              <span className="grad-text">Cleaner Future.</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
              Real-time monitoring and AI-powered forecasts to protect public health 
              and guide environmental policy in your neighborhood.
            </p>
          </motion.div>

          {/* Navigation Tabs Overhaul */}
          <div className="sticky top-24 z-20 mb-12">
            <div className="p-1.5 rounded-2xl glass-morphism border border-white/5 flex flex-wrap gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2.5 overflow-hidden group ${
                    activeTab === tab.id
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary shadow-[0_0_20px_rgba(56,189,248,0.4)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{tab.icon}</span>
                  <span className="relative z-10">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="pb-24"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Chatbot */}
      <ChatbotAssistant />

      {/* Footer / Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 glass-morphism-strong border-t border-white/5 py-3 px-6 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            System Operational
          </div>
          <div className="hidden sm:block">Update: 2 mins ago</div>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms</a>
          <a href="#" className="hover:text-primary transition-colors">Documentation</a>
        </div>
      </footer>
    </main>
  )
}
