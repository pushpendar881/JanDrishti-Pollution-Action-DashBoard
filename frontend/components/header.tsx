"use client"

import { useState, useEffect } from "react"
import { Building2, User } from "lucide-react"
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
      className={`sticky top-0 z-50 bg-background border-b border-border/50 shadow-sm transition-all h-[73px] flex items-center ${isScrolled
        ? "shadow-md"
        : ""
        }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-semibold text-lg">
              J
            </div>
            <div>
              <div className="text-lg font-semibold text-foreground">
                JanDrishti
              </div>
              <div className="text-xs text-muted-foreground">Environmental Intelligence</div>
            </div>
          </div>

        </div>

        <div className="flex items-center gap-4">
          {/* Ward Selector */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors">
            <Building2 size={16} className="text-muted-foreground" />
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="bg-transparent text-sm font-medium text-foreground outline-none cursor-pointer border-none appearance-none"
            >
              {wardOptions.map((ward) => (
                <option key={ward.id} value={ward.id}>
                  {ward.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <ModeToggle />

            {/* User Authentication */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
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
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                  <User size={16} />
                  <span className="hidden sm:inline">Login</span>
                </button>
              </>
            )}

          </div>
        </div>
      </div>

      {/* Auth Dialog */}
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </header>
  )
}
