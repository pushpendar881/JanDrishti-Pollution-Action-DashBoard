"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Maximize2, Minimize2, Map as MapIcon, Layers, Navigation } from "lucide-react"

interface PollutionMapProps {
  selectedPollutant: string
}

export default function PollutionMap({ selectedPollutant }: PollutionMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredLocation, setHoveredLocation] = useState<number | null>(null)
  const animationRef = useRef<number>(0)

  const locations = [
    { id: 1, name: "New Delhi", lat: 28.6139, lng: 77.209, value: 206, color: "#f87171" },
    { id: 2, name: "Gurugram", lat: 28.4595, lng: 77.0266, value: 178, color: "#fbbf24" },
    { id: 3, name: "Noida", lat: 28.5355, lng: 77.391, value: 192, color: "#f87171" },
    { id: 4, name: "Faridabad", lat: 28.4089, lng: 77.3178, value: 165, color: "#fbbf24" },
    { id: 5, name: "Greater Noida", lat: 28.4744, lng: 77.5202, value: 150, color: "#34d399" },
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    const updateCanvasSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    updateCanvasSize()

    const animate = (timestamp: number) => {
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight

      // Clear with very slight fade for trails
      ctx.fillStyle = "#020617"
      ctx.fillRect(0, 0, width, height)

      // Draw subtle grid
      ctx.strokeStyle = "rgba(56, 189, 248, 0.05)"
      ctx.lineWidth = 1
      const gridSize = 40
      for (let i = 0; i < width; i += gridSize) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, height)
        ctx.stroke()
      }
      for (let i = 0; i < height; i += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(width, i)
        ctx.stroke()
      }

      // Draw locations
      locations.forEach((location, index) => {
        const x = (location.lng - 76.8) * 180 + width * 0.5
        const y = (location.lat - 28.3) * 220 + height * 0.35

        const pulse = Math.sin(timestamp * 0.002 + index * 0.5) * 0.5 + 0.5
        const ring1 = 20 + pulse * 10
        const ring2 = 40 + pulse * 20

        // Rings
        ctx.strokeStyle = location.color + "20"
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(x, y, ring2, 0, Math.PI * 2)
        ctx.stroke()

        ctx.strokeStyle = location.color + "40"
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(x, y, ring1, 0, Math.PI * 2)
        ctx.stroke()

        const isHovered = hoveredLocation === location.id
        const dotSize = isHovered ? 10 : 7
        
        // Dot Glow
        ctx.shadowColor = location.color
        ctx.shadowBlur = isHovered ? 25 : 15
        ctx.fillStyle = location.color
        ctx.beginPath()
        ctx.arc(x, y, dotSize, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        if (isHovered) {
          // Tooltip Background
          const tooltipW = 140
          const tooltipH = 50
          const tx = x - tooltipW / 2
          const ty = y - tooltipH - 20
          
          ctx.fillStyle = "rgba(15, 23, 42, 0.9)"
          ctx.beginPath()
          ctx.roundRect(tx, ty, tooltipW, tooltipH, 12)
          ctx.fill()
          ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
          ctx.stroke()

          ctx.fillStyle = "white"
          ctx.font = "bold 12px Inter"
          ctx.textAlign = "center"
          ctx.fillText(location.name, x, ty + 20)
          
          ctx.fillStyle = location.color
          ctx.font = "bold 14px Space Grotesk"
          ctx.fillText(`AQI: ${location.value}`, x, ty + 40)
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const width = canvas.offsetWidth
      const height = canvas.offsetHeight

      let found = false
      for (const location of locations) {
        const x = (location.lng - 76.8) * 180 + width * 0.5
        const y = (location.lat - 28.3) * 220 + height * 0.35
        const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2)

        if (distance < 30) {
          setHoveredLocation(location.id)
          canvas.style.cursor = "pointer"
          found = true
          break
        }
      }

      if (!found) {
        setHoveredLocation(null)
        canvas.style.cursor = "default"
      }
    }

    canvas.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("resize", updateCanvasSize)

    return () => {
      cancelAnimationFrame(animationRef.current)
      canvas.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", updateCanvasSize)
    }
  }, [hoveredLocation])

  return (
    <div className="relative rounded-[2rem] glass-morphism border border-white/5 overflow-hidden h-[550px] group">
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Floating Header */}
      <div className="absolute top-8 left-8 z-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl grad-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <MapIcon size={24} />
        </div>
        <div className="space-y-0.5">
          <h3 className="text-xl font-bold tracking-tight">Environmental Spatial Intelligence</h3>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            Live Network Operational
          </div>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute right-8 top-8 flex flex-col gap-3 z-10">
        {[
          { icon: <Maximize2 size={18} />, label: "Zoom In" },
          { icon: <Minimize2 size={18} />, label: "Zoom Out" },
          { icon: <Layers size={18} />, label: "Layers" },
          { icon: <Navigation size={18} />, label: "Recenter" },
        ].map((control, i) => (
          <button 
            key={i}
            className="w-12 h-12 rounded-2xl glass-morphism-strong border border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all duration-300 hover:scale-110"
          >
            {control.icon}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 left-8 z-10">
        <div className="glass-morphism-strong rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Network Legend</div>
          <div className="space-y-2.5">
            {[
              { color: "#f87171", label: "Hazardous / Severe" },
              { color: "#fbbf24", label: "Moderate Risk" },
              { color: "#34d399", label: "Optimal / Safe" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                <span className="text-xs font-semibold text-foreground/80">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Overlay */}
      <div className="absolute bottom-8 right-8 z-10">
        <div className="px-4 py-2 rounded-xl glass-morphism border border-white/10 text-[10px] font-bold uppercase tracking-widest text-primary">
          Layer: {selectedPollutant.toUpperCase()} Intensity
        </div>
      </div>
    </div>
  )
}
