"use client"

interface HeaderProps {
  selectedCity: string
  setSelectedCity: (city: string) => void
  selectedWard: string
  setSelectedWard: (ward: string) => void
}

export default function Header({ selectedCity, setSelectedCity, selectedWard, setSelectedWard }: HeaderProps) {
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
    <header className="border-b border-border/30 backdrop-blur-xl sticky top-0 z-20 glass-effect animate-slide-in-left">
      <div className="container mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg animate-smooth-glow">
              A
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground">JanDrishti</div>
              <div className="text-xs text-muted-foreground font-medium">Professional Monitor</div>
            </div>
          </div>
          {/* <nav className="hidden md:flex items-center gap-8">
            <a
              href="#"
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-all duration-300 hover-lift relative group"
            >
              Dashboard
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
            </a>
            <a
              href="#"
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-all duration-300 hover-lift relative group"
            >
              Analytics
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
            </a>
            <a
              href="#"
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-all duration-300 hover-lift relative group"
            >
              Resources
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
            </a>
          </nav> */}
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <button className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-all duration-300 hover:scale-105 hover-glow backdrop-blur-sm">
            AQI (US)
          </button>
          <button className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-muted/20 text-foreground/70 border border-muted/30 hover:bg-muted/30 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
            PM2.5
          </button>
          <button className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-muted/20 text-foreground/70 border border-muted/30 hover:bg-muted/30 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
            PM10
          </button>
        </div>

        <div className="flex items-center gap-4 animate-slide-in-right">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-effect border border-border/30">
            <span className="text-primary text-lg">🏙️</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent text-foreground outline-none cursor-pointer font-semibold text-sm transition-colors duration-300 hover:text-primary"
            >
              {cities.map((city) => (
                <option key={city.id} value={city.id} className="bg-card text-foreground">
                  {city.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-effect border border-border/30">
            <span className="text-accent text-lg">🏘️</span>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="bg-transparent text-foreground outline-none cursor-pointer font-semibold text-sm transition-colors duration-300 hover:text-accent"
            >
              {filteredWards.map((ward) => (
                <option key={ward.id} value={ward.id} className="bg-card text-foreground">
                  {ward.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  )
}
