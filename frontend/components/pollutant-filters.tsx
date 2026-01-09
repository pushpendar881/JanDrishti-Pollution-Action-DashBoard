"use client"

import { motion } from "framer-motion"
import { Search, Info } from "lucide-react"

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Search size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Parameter Focus</h3>
            <p className="text-sm text-muted-foreground">Isolate specific pollutants for detailed spatial analysis</p>
          </div>
        </div>
        <button className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
          <Info size={14} />
          What are these?
        </button>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {pollutants.map((pollutant) => (
          <button
            key={pollutant.id}
            onClick={() => onSelectPollutant(pollutant.id)}
            className={`relative px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 overflow-hidden group ${
              selectedPollutant === pollutant.id
                ? "text-primary-foreground"
                : "text-muted-foreground glass-morphism border border-white/5 hover:border-white/20 hover:text-foreground"
            }`}
          >
            {selectedPollutant === pollutant.id && (
              <motion.div
                layoutId="activePollutant"
                className="absolute inset-0 z-0"
                style={{ backgroundColor: pollutant.color }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full" style={{ 
                backgroundColor: selectedPollutant === pollutant.id ? 'white' : pollutant.color,
                boxShadow: selectedPollutant === pollutant.id ? 'none' : `0 0 8px ${pollutant.color}`
              }} />
              {pollutant.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
