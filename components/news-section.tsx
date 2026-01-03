"use client"

import { useState, useEffect } from "react"

interface NewsItem {
  id: number
  title: string
  description: string
  timestamp: string
  category: "alert" | "update" | "health"
  icon: string
}

export default function NewsSection() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])

  useEffect(() => {
    setNewsItems([
      {
        id: 1,
        title: "Air Quality Critical",
        description: "AQI 206 in New Delhi. Vulnerable groups should stay indoors.",
        timestamp: "2 hours ago",
        category: "alert",
        icon: "⚠️",
      },
      {
        id: 2,
        title: "Wind Pattern Change",
        description: "NE winds 12 km/h expected by evening will improve AQI.",
        timestamp: "4 hours ago",
        category: "update",
        icon: "💨",
      },
      {
        id: 3,
        title: "Health Advisory",
        description: "Use N95 masks. Avoid outdoor activities 6-10 AM and 8-10 PM.",
        timestamp: "6 hours ago",
        category: "health",
        icon: "🏥",
      },
      {
        id: 4,
        title: "Bangalore AQI Improves",
        description: "Post-rain AQI dropped to Moderate. Relief expected 48 hours.",
        timestamp: "8 hours ago",
        category: "update",
        icon: "📈",
      },
    ])
  }, [])

  const getCategoryBg = (category: string) => {
    switch (category) {
      case "alert":
        return "bg-red-500/10 border-red-500/20"
      case "health":
        return "bg-orange-500/10 border-orange-500/20"
      case "update":
        return "bg-primary/10 border-primary/20"
      default:
        return "bg-border/20 border-border/50"
    }
  }

  return (
    <div className="rounded-3xl border border-border/40 backdrop-blur-xl glass-effect p-8 space-y-6 h-[550px] flex flex-col hover:border-border/60 transition-all duration-500 group">
      <div className="flex items-center justify-between pb-6 border-b border-border/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
            <span className="text-2xl">📰</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Live Updates</h2>
            <p className="text-sm text-muted-foreground font-medium">Real-time air quality news</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 border border-primary/30">
          <div className="w-2 h-2 rounded-full bg-primary animate-glow-pulse"></div>
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
        {newsItems.map((item, index) => (
          <div
            key={item.id}
            className={`p-6 rounded-2xl border transition-all duration-300 hover:border-border/60 hover:glass-effect cursor-pointer group/item ${getCategoryBg(item.category)}`}
            style={{
              animation: `fadeSlideIn 0.6s ease-out ${index * 0.1}s both`,
            }}
          >
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0 border border-border/20">
                <span className="text-xl">{item.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground group-hover/item:text-primary transition-colors text-base mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{item.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-border/20">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      item.category === 'alert' ? 'bg-red-500' : 
                      item.category === 'health' ? 'bg-orange-500' : 'bg-primary'
                    }`}></div>
                    <span className="text-xs font-semibold text-foreground/70 capitalize">{item.category}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{item.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-border/30">
        <button className="w-full py-3 px-4 rounded-xl glass-effect border border-border/40 text-foreground hover:border-primary/40 hover:text-primary transition-all duration-300 font-semibold text-sm hover:scale-[1.02] hover-glow">
          View All Updates
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  )
}
