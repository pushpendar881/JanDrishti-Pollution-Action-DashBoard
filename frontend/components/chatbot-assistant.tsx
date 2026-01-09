"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { chatService } from "@/lib/api"
import AuthDialog from "@/components/auth-dialog"
import { toast } from "sonner"

interface Message {
  id: string
  user_id: string
  message: string
  response?: string
  type: "user" | "bot"
  created_at: string
  suggestions?: string[]
}

export default function ChatbotAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  const { isAuthenticated, user } = useAuth()

  // Load chat history when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      loadChatHistory()
    } else if (!isAuthenticated) {
      // Show welcome message for non-authenticated users
      setMessages([{
        id: "welcome",
        user_id: "",
        message: "",
        response: "Hi! I'm your AI pollution assistant. Please login to start a conversation and get personalized air quality insights.",
        type: "bot",
        created_at: new Date().toISOString(),
        suggestions: ["Login to Chat"]
      }])
    }
  }, [isAuthenticated, isOpen])

  const loadChatHistory = async () => {
    if (!isAuthenticated) return

    setLoading(true)
    try {
      const history = await chatService.getMessages({ limit: 20 })
      if (history.length === 0) {
        // Show welcome message for authenticated users
        setMessages([{
          id: "welcome-auth",
          user_id: user?.id || "",
          message: "",
          response: "Hi! I'm your AI pollution assistant. I can help you understand air quality data, health recommendations, and government policies. What would you like to know?",
          type: "bot",
          created_at: new Date().toISOString(),
          suggestions: [
            "What's the current AQI?",
            "Health tips for high pollution",
            "Government regulations",
            "Best time to go outside"
          ]
        }])
      } else {
        // Convert API response to component format
        const formattedMessages = history.reverse().map(msg => ({
          ...msg,
          suggestions: msg.type === "bot" ? [
            "More information",
            "Emergency contacts",
            "Government helplines"
          ] : undefined
        }))
        setMessages(formattedMessages)
      }
    } catch (error) {
      console.error("Failed to load chat history:", error)
      toast.error("Failed to load chat history")
    } finally {
      setLoading(false)
    }
  }

  const quickResponses = {
    "What's the current AQI?": "The current AQI in Central Delhi is 206, which is in the 'Severe' category. This means the air quality is hazardous and everyone should avoid outdoor activities. I recommend staying indoors and using air purifiers if available.",

    "Health tips for high pollution": "Here are key health tips for severe pollution:\n\n• Use N95 or P100 masks when going outside\n• Keep windows and doors closed\n• Use air purifiers indoors\n• Avoid outdoor exercise\n• Stay hydrated\n• Eat antioxidant-rich foods\n• Consult a doctor if you have breathing issues",

    "Government regulations": "Current government measures in effect:\n\n• Odd-even vehicle scheme active\n• Construction activities banned\n• Industrial operations at 70% capacity\n• Public transport frequency increased\n• Emergency health advisories issued\n• Schools may be closed if AQI exceeds 300",

    "Best time to go outside": "Based on current patterns:\n\n• Avoid 6-10 AM (morning rush)\n• Avoid 7-11 PM (evening rush)\n• Best time: 11 AM - 4 PM\n• Weekends generally have 20% lower pollution\n• Check real-time AQI before going out\n• Always wear a mask regardless of time"
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    if (!isAuthenticated) {
      setShowAuthDialog(true)
      return
    }

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      user_id: user?.id || "",
      message: content,
      type: "user",
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, tempUserMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      // Send message to backend
      const response = await chatService.sendMessage(content)

      // Replace temp message with real response
      setMessages(prev => prev.map(msg =>
        msg.id === tempUserMessage.id
          ? {
            ...response,
            suggestions: [
              "More information",
              "Emergency contacts",
              "Government helplines"
            ]
          }
          : msg
      ))
    } catch (error: any) {
      console.error("Failed to send message:", error)
      toast.error("Failed to send message", {
        description: error.message || "Please try again later"
      })

      // Remove the temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id))
    } finally {
      setIsTyping(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion === "Login to Chat") {
      setShowAuthDialog(true)
      return
    }
    handleSendMessage(suggestion)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-2xl bg-gradient-to-r from-primary to-accent text-white shadow-2xl hover:shadow-3xl transition-all duration-300 z-50 flex items-center justify-center hover:scale-110 ${isOpen ? "rotate-45" : "hover:rotate-12"
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
        <div className="fixed bottom-24 right-6 w-96 h-[500px] rounded-3xl border border-border bg-background shadow-2xl z-50 flex flex-col animate-scale-in">
          {/* Header */}
          <div className="p-6 border-b border-border bg-background">
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-background">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <span className="text-sm ml-2">Loading chat...</span>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${message.type === "user"
                        ? "bg-primary text-white"
                        : "bg-muted border border-border text-foreground"
                      }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {message.type === "user" ? message.message : message.response}
                    </p>

                    {message.suggestions && (
                      <div className="mt-3 space-y-2">
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="block w-full text-left p-2 rounded-lg bg-background border border-border text-xs text-foreground hover:border-primary/40 hover:text-primary transition-all duration-300"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted border border-border p-3 rounded-2xl">
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
          <div className="p-4 border-t border-border bg-background">
            {!isAuthenticated ? (
              <div className="text-center py-2">
                <button
                  onClick={() => setShowAuthDialog(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Login to Chat
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
                  placeholder="Ask about air quality, health tips, or policies..."
                  className="flex-1 px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none transition-all text-sm"
                  disabled={isTyping}
                />
                <button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim() || isTyping}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-lg">➤</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-4 pt-0 bg-background">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleSuggestionClick("Emergency contacts")}
                className="px-3 py-1 rounded-lg bg-background border border-border text-xs text-foreground hover:border-red-500/40 hover:text-red-400 transition-all duration-300"
              >
                🚨 Emergency
              </button>
              <button
                onClick={() => handleSuggestionClick("Health precautions")}
                className="px-3 py-1 rounded-lg bg-background border border-border text-xs text-foreground hover:border-green-500/40 hover:text-green-400 transition-all duration-300"
              >
                🏥 Health
              </button>
              <button
                onClick={() => handleSuggestionClick("Government helplines")}
                className="px-3 py-1 rounded-lg bg-background border border-border text-xs text-foreground hover:border-blue-500/40 hover:text-blue-400 transition-all duration-300"
              >
                📞 Helpline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Dialog */}
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />

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
