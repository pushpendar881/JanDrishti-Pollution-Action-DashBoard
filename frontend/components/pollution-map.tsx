"use client"

import { useEffect, useRef, useState } from "react"

interface PollutionMapProps {
  selectedPollutant: string
}

export default function PollutionMap({ selectedPollutant }: PollutionMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredLocation, setHoveredLocation] = useState<number | null>(null)
  const animationRef = useRef<number>(0)

  const locations = [
    { id: 1, name: "New Delhi", lat: 28.6139, lng: 77.209, value: 206, color: "#ef4444" },
    { id: 2, name: "Gurugram", lat: 28.4595, lng: 77.0266, value: 178, color: "#f97316" },
    { id: 3, name: "Noida", lat: 28.5355, lng: 77.391, value: 192, color: "#ef4444" },
    { id: 4, name: "Faridabad", lat: 28.4089, lng: 77.3178, value: 165, color: "#f59e0b" },
    { id: 5, name: "Greater Noida", lat: 28.4744, lng: 77.5202, value: 150, color: "#eab308" },
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

      ctx.fillStyle = "rgba(15, 23, 42, 0.2)"
      ctx.fillRect(0, 0, width, height)

      ctx.strokeStyle = "rgba(14, 165, 233, 0.03)"
      ctx.lineWidth = 1
      const gridSize = 50
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

        const pulse = Math.sin(timestamp * 0.003 + index * 0.5) * 0.5 + 0.5
        const ring1 = 25 + pulse * 15
        const ring2 = 45 + pulse * 25

        ctx.strokeStyle = location.color + "30"
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(x, y, ring2, 0, Math.PI * 2)
        ctx.stroke()

        ctx.strokeStyle = location.color + "50"
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(x, y, ring1, 0, Math.PI * 2)
        ctx.stroke()

        const isHovered = hoveredLocation === location.id
        const dotSize = isHovered ? 9 : 6
        ctx.fillStyle = location.color
        ctx.shadowColor = location.color
        ctx.shadowBlur = isHovered ? 20 : 10
        ctx.beginPath()
        ctx.arc(x, y, dotSize, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        if (isHovered) {
          ctx.fillStyle = "rgba(17, 24, 39, 0.95)"
          ctx.fillRect(x - 60, y - 45, 120, 35)
          ctx.strokeStyle = location.color
          ctx.lineWidth = 1
          ctx.strokeRect(x - 60, y - 45, 120, 35)

          ctx.fillStyle = "white"
          ctx.font = "bold 12px sans-serif"
          ctx.textAlign = "center"
          ctx.fillText(location.name, x, y - 28)
          ctx.fillStyle = location.color
          ctx.font = "11px sans-serif"
          ctx.fillText(`AQI: ${location.value}`, x, y - 13)
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

        if (distance < 25) {
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
    <div className="relative rounded-3xl border border-border/40 backdrop-blur-xl glass-effect overflow-hidden hover:border-border/60 transition-all duration-500 h-[550px] group">
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Enhanced header */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
          <span className="text-2xl">🗺️</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Interactive Pollution Map</h3>
          <p className="text-sm text-muted-foreground font-medium">Real-time air quality monitoring</p>
        </div>
      </div>

      {/* Enhanced legend */}
      <div className="absolute bottom-6 left-6 z-10 space-y-2">
        <div className="glass-effect rounded-xl p-4 border border-border/30">
          <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">AQI Levels</p>
          <div className="space-y-2 text-xs font-medium">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
              <span className="text-foreground/80">Critical (200+)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50"></div>
              <span className="text-foreground/80">High (100-200)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
              <span className="text-foreground/80">Moderate (0-100)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced controls */}
      <div className="absolute right-6 top-6 flex flex-col gap-3 z-10">
        <button className="w-12 h-12 rounded-xl glass-effect border border-border/40 text-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center font-bold text-lg hover:scale-110 duration-300 hover-glow">
          +
        </button>
        <button className="w-12 h-12 rounded-xl glass-effect border border-border/40 text-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center font-bold text-lg hover:scale-110 duration-300 hover-glow">
          −
        </button>
        <button className="w-12 h-12 rounded-xl glass-effect border border-border/40 text-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center text-lg hover:scale-110 duration-300 hover-glow">
          📍
        </button>
      </div>

      {/* Status indicator */}
      <div className="absolute top-6 right-24 z-10">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-effect border border-border/30">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-glow-pulse"></div>
          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Live</span>
        </div>
      </div>
    </div>
  )
}
