"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Building2, Bell, Menu, User } from "lucide-react"
import { ModeToggle } from "./mode-toggle"
import { useAuth } from "@/context/auth-context"
import AuthDialog from "@/components/auth-dialog"
import { aqiService, type WardData } from "@/lib/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  selectedWard: string
  setSelectedWard: (ward: string) => void
}

export default function Header({ selectedWard, setSelectedWard }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [wards, setWards] = useState<WardData[]>([])
  const [loadingWards, setLoadingWards] = useState(true)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Fetch wards from API
  useEffect(() => {
    const fetchWards = async () => {
      try {
        const wardsData = await aqiService.getWards()
        setWards(wardsData)
        
        // Set default ward if not set
        if (!selectedWard && wardsData.length > 0) {
          setSelectedWard(`ward-${wardsData[0].ward_no}`)
        }
      } catch (error) {
        console.error("Error fetching wards:", error)
        // Fallback to default wards
        setWards([
          { ward_name: "MODEL TOWN", ward_no: "72", quadrant: "NE", latitude: 28.701933, longitude: 77.191341 },
          { ward_name: "BEGUMPUR", ward_no: "27", quadrant: "NW", latitude: 28.765128, longitude: 77.022542 },
          { ward_name: "HAUZ RANI", ward_no: "162", quadrant: "SE", latitude: 28.533246, longitude: 77.212759 },
          { ward_name: "NANGLI SAKRAVATI", ward_no: "134", quadrant: "SW", latitude: 28.580401, longitude: 76.994073 },
        ])
      } finally {
        setLoadingWards(false)
      }
    }
    
    fetchWards()
  }, [])

  // Map wards to dropdown format
  const wardOptions = wards.map((ward, index) => ({
    id: `ward-${ward.ward_no}`,
    name: `${ward.ward_name} (${ward.ward_no}) - ${ward.quadrant}`,
    ward_no: ward.ward_no
  }))

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${isScrolled
        ? "py-3 glass-morphism-strong border-b"
        : "py-6 bg-transparent"
        }`}
    >
      <div className="container-px flex items-center justify-between">
        <div className="flex items-center gap-12">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl grad-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-[0_0_20px_rgba(56,189,248,0.3)] group-hover:scale-110 transition-transform duration-300">
                J
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-foreground flex items-center gap-1">
                JanDrishti
                <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20">Pro</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.1em]">Environmental Intelligence</div>
            </div>
          </motion.div>

        </div>

        <div className="flex items-center gap-4">
          {/* Ward Selector */}
          <div className="hidden md:flex items-center gap-2 p-1 rounded-2xl bg-muted/30 border backdrop-blur-md">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-muted/50 transition-colors group cursor-pointer">
              <Building2 size={14} className="text-accent group-hover:animate-bounce" />
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="bg-transparent text-sm font-bold text-foreground outline-none cursor-pointer"
              >
                {wardOptions.map((ward) => (
                  <option key={ward.id} value={ward.id} className="bg-background">
                    {ward.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <ModeToggle />
            <button className="p-2.5 rounded-xl bg-muted/30 border hover:bg-muted/50 transition-all text-muted-foreground hover:text-primary">
              <Bell size={18} />
            </button>

            {/* User Authentication */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/30 border hover:bg-muted/50 transition-all hover:scale-105 group">
                    <div className="w-8 h-8 rounded-full grad-primary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                      {user.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                    {/* <span className="text-sm font-bold text-foreground hidden sm:inline">
                      {user.full_name || user.email?.split("@")[0]}
                    </span> */}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-morphism border">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-bold">{user.full_name || "User"}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer hover:bg-muted/50">
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:bg-muted/50">
                    My Reports
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-400 cursor-pointer hover:text-red-300 hover:bg-red-500/10"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                {/* Desktop Login Button */}
                <button
                  onClick={() => setShowAuthDialog(true)}
                  className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl grad-primary text-primary-foreground font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-primary/20"
                >
                  <User size={16} />
                  Login
                </button>

                {/* Mobile Login Button */}
                <button
                  onClick={() => setShowAuthDialog(true)}
                  className="sm:hidden p-2.5 rounded-xl grad-primary text-primary-foreground hover:scale-105 transition-all shadow-lg shadow-primary/20"
                >
                  <User size={18} />
                </button>
              </>
            )}

            <button className="lg:hidden p-2.5 rounded-xl bg-muted/30 border text-foreground">
              <Menu size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Auth Dialog */}
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </header>
  )
}
