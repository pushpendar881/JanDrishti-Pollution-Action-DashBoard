"use client"

import { useState } from "react"

interface Message {
  id: number
  type: "user" | "bot"
  content: string
  timestamp: string
  suggestions?: string[]
}

export default function ChatbotAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "bot",
      content: "Hi! I'm your AI pollution assistant. I can help you understand air quality data, health recommendations, and government policies. What would you like to know?",
      timestamp: "now",
      suggestions: [
        "What's the current AQI?",
        "Health tips for high pollution",
        "Government regulations",
        "Best time to go outside"
      ]
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const quickResponses = {
    "What's the current AQI?": "The current AQI in Central Delhi is 206, which is in the 'Severe' category. This means the air quality is hazardous and everyone should avoid outdoor activities. I recommend staying indoors and using air purifiers if available.",
    
    "Health tips for high pollution": "Here are key health tips for severe pollution:\n\n• Use N95 or P100 masks when going outside\n• Keep windows and doors closed\n• Use air purifiers indoors\n• Avoid outdoor exercise\n• Stay hydrated\n• Eat antioxidant-rich foods\n• Consult a doctor if you have breathing issues",
    
    "Government regulations": "Current government measures in effect:\n\n• Odd-even vehicle scheme active\n• Construction activities banned\n• Industrial operations at 70% capacity\n• Public transport frequency increased\n• Emergency health advisories issued\n• Schools may be closed if AQI exceeds 300",
    
    "Best time to go outside": "Based on current patterns:\n\n• Avoid 6-10 AM (morning rush)\n• Avoid 7-11 PM (evening rush)\n• Best time: 11 AM - 4 PM\n• Weekends generally have 20% lower pollution\n• Check real-time AQI before going out\n• Always wear a mask regardless of time"
  }

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: content,
      timestamp: "now"
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate bot response
    setTimeout(() => {
      const botResponse = quickResponses[content as keyof typeof quickResponses] || 
        "I understand you're asking about pollution-related information. Let me help you with that. For specific data, please check the dashboard or contact our support team."

      const botMessage: Message = {
        id: messages.length + 2,
        type: "bot",
        content: botResponse,
        timestamp: "now",
        suggestions: content === "What's the current AQI?" ? [
          "What should I do?",
          "When will it improve?",
          "Health precautions"
        ] : [
          "More information",
          "Emergency contacts",
          "Government helplines"
        ]
      }

      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion)
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-2xl bg-gradient-to-r from-primary to-accent text-white shadow-2xl hover:shadow-3xl transition-all duration-300 z-50 flex items-center justify-center hover:scale-110 ${
          isOpen ? "rotate-45" : "hover:rotate-12"
        }`}
      >
        {isOpen ? (
          <span className="text-2xl">✕</span>
        ) : (
          <span className="text-2xl animate-bounce">🤖</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] rounded-3xl border border-border/40 glass-effect shadow-2xl z-50 flex flex-col animate-scale-in">
          {/* Header */}
          <div className="p-6 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
                <span className="text-xl">🤖</span>
              </div>
              <div>
                <h3 className="font-bold text-foreground">AI Assistant</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-glow-pulse"></div>
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.type === "user"
                      ? "bg-primary text-white"
                      : "glass-effect border border-border/30 text-foreground"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                  
                  {message.suggestions && (
                    <div className="mt-3 space-y-2">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full text-left p-2 rounded-lg glass-effect border border-border/30 text-xs text-foreground hover:border-primary/40 hover:text-primary transition-all duration-300"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="glass-effect border border-border/30 p-3 rounded-2xl">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border/30">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
                placeholder="Ask about air quality, health tips, or policies..."
                className="flex-1 px-4 py-3 rounded-xl glass-effect border border-border/40 text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none transition-all text-sm"
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim()}
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-lg">➤</span>
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 pt-0">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleSuggestionClick("Emergency contacts")}
                className="px-3 py-1 rounded-lg glass-effect border border-border/30 text-xs text-foreground hover:border-red-500/40 hover:text-red-400 transition-all duration-300"
              >
                🚨 Emergency
              </button>
              <button
                onClick={() => handleSuggestionClick("Health precautions")}
                className="px-3 py-1 rounded-lg glass-effect border border-border/30 text-xs text-foreground hover:border-green-500/40 hover:text-green-400 transition-all duration-300"
              >
                🏥 Health
              </button>
              <button
                onClick={() => handleSuggestionClick("Government helplines")}
                className="px-3 py-1 rounded-lg glass-effect border border-border/30 text-xs text-foreground hover:border-blue-500/40 hover:text-blue-400 transition-all duration-300"
              >
                📞 Helpline
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </>
  )
}