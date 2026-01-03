"use client"

interface Pollutant {
  id: string
  label: string
  color: string
}

interface PollutantFiltersProps {
  pollutants: Pollutant[]
  selectedPollutant: string
  onSelectPollutant: (pollutant: string) => void
}

export default function PollutantFilters({ pollutants, selectedPollutant, onSelectPollutant }: PollutantFiltersProps) {
  return (
    <div className="space-y-4 animate-fade-slide-in" style={{ animationDelay: "0.25s" }}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
          <span className="text-xl">🔍</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Pollutant Analysis</h3>
          <p className="text-sm text-muted-foreground">Select pollutant type to analyze</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4">
        {pollutants.map((pollutant, index) => (
          <button
            key={pollutant.id}
            onClick={() => onSelectPollutant(pollutant.id)}
            style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 cursor-pointer transform hover:scale-105 animate-scale-in border ${
              selectedPollutant === pollutant.id
                ? `text-white shadow-xl hover-glow border-transparent`
                : "glass-effect border-border/40 text-foreground/80 hover:border-primary/40 hover:text-foreground hover:glass-effect"
            }`}
            style={
              selectedPollutant === pollutant.id
                ? {
                    backgroundImage: `linear-gradient(135deg, ${pollutant.color}, ${pollutant.color}dd)`,
                    animationDelay: `${0.1 + index * 0.05}s`,
                    boxShadow: `0 8px 32px ${pollutant.color}40`
                  }
                : { animationDelay: `${0.1 + index * 0.05}s` }
            }
          >
            <span className="flex items-center gap-3">
              {selectedPollutant === pollutant.id && (
                <span className="text-lg animate-glow-pulse">✓</span>
              )}
              <span className="font-bold">{pollutant.label}</span>
              {selectedPollutant !== pollutant.id && (
                <div 
                  className="w-3 h-3 rounded-full opacity-60" 
                  style={{ backgroundColor: pollutant.color }}
                ></div>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
