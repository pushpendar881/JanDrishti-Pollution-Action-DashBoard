"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MapPin, Building2, Bell, Menu, User } from "lucide-react"
import { ModeToggle } from "./mode-toggle"
import { useAuth } from "@/context/auth-context"
import AuthDialog from "@/components/auth-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  selectedCity: string
  setSelectedCity: (city: string) => void
  selectedWard: string
  setSelectedWard: (ward: string) => void
}

export default function Header({ selectedCity, setSelectedCity, selectedWard, setSelectedWard }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const cities = [
    { id: "new-delhi", name: "New Delhi", emoji: "📍" },
    { id: "mumbai", name: "Mumbai", emoji: "📍" },
    { id: "bangalore", name: "Bangalore", emoji: "📍" },
  ]

  const wards = [
    { id: "ward-1", name: "Ward 1 - Central Delhi", city: "new-delhi" },
    { id: "ward-2", name: "Ward 2 - South Delhi", city: "new-delhi" },
    { id: "ward-3", name: "Ward 3 - North Delhi", city: "new-delhi" },
    { id: "ward-4", name: "Ward 4 - East Delhi", city: "new-delhi" },
    { id: "ward-5", name: "Ward 5 - West Delhi", city: "new-delhi" },
  ]

  const filteredWards = wards.filter(ward => ward.city === selectedCity)

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

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {["Insights", "Network", "Policy", "Forecast"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Locality Selectors */}
          <div className="hidden md:flex items-center gap-2 p-1 rounded-2xl bg-muted/30 border backdrop-blur-md">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-muted/50 transition-colors group cursor-pointer">
              <MapPin size={14} className="text-primary group-hover:animate-bounce" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-sm font-bold text-foreground outline-none cursor-pointer"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id} className="bg-background">
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-px h-4 bg-border" />

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-muted/50 transition-colors group cursor-pointer">
              <Building2 size={14} className="text-accent group-hover:animate-bounce" />
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="bg-transparent text-sm font-bold text-foreground outline-none cursor-pointer"
              >
                {filteredWards.map((ward) => (
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
