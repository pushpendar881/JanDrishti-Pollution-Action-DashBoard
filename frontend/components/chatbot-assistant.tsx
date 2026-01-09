"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { chatAPI } from "@/lib/api"
import AuthDialog from "@/components/auth-dialog"
import { toast } from "sonner"

interface Message {
  id: string
  user_id: string
  user_message: string  // Changed from 'message'
  bot_response?: string  // Changed from 'response'
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
    } else if (!isAuthenticated && isOpen) {
      // Show welcome message for non-authenticated users
      setMessages([{
        id: "welcome",
        user_id: "",
        user_message: "",
        bot_response: "Hi! I'm your AI pollution assistant. Please login to start a conversation and get personalized air quality insights.",
        type: "bot",
        created_at: new Date().toISOString(),
        suggestions: ["Login to Chat"]
      }])
    }
  }, [isAuthenticated, isOpen])

  const loadChatHistory = async () => {
    setLoading(true)
    try {
      const chatMessages = await chatAPI.getMessages()
      
      if (chatMessages.length === 0) {
        // Show welcome message if no history
        setMessages([{
          id: "welcome",
          user_id: user?.id || "",
          user_message: "",
          bot_response: "Hi! I'm your AI pollution assistant. I can help you understand air quality data, health recommendations, and government policies. What would you like to know?",
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
        // Transform messages: each bot message contains both user question and AI response
        const transformedMessages: Message[] = []
        
        chatMessages.reverse().forEach((msg) => {
          // Add user message
          transformedMessages.push({
            id: `user-${msg.id}`,
            user_id: msg.user_id,
            user_message: msg.user_message,
            type: "user",
            created_at: msg.created_at,
          })
          
          // Add bot response
          if (msg.bot_response) {
            transformedMessages.push({
              id: msg.id,
              user_id: msg.user_id,
              user_message: msg.user_message,
              bot_response: msg.bot_response,
              type: "bot",
              created_at: msg.created_at,
            })
          }
        })
        
        setMessages(transformedMessages)
      }
    } catch (error: any) {
      console.error("Failed to load chat history:", error)
      toast.error("Failed to load chat history")
      // Show welcome message as fallback
      setMessages([{
        id: "welcome",
        user_id: "",
        user_message: "",
        bot_response: "Hi! I'm your AI pollution assistant. What would you like to know?",
        type: "bot",
        created_at: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    // Check authentication
    if (!isAuthenticated) {
      setShowAuthDialog(true)
      return
    }

    // Add user message optimistically
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      user_id: user?.id || "",
      user_message: content,
      type: "user",
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      // Send message to API
      const response = await chatAPI.sendMessage(content)
      
      // Remove temp user message and add the bot response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== userMessage.id)
        return [
          ...filtered,
          // Add user message
          {
            id: `user-${response.id}`,
            user_id: user?.id || "",
            user_message: content,
            type: "user",
            created_at: new Date().toISOString()
          },
          // Add bot response
          {
            id: response.id,
            user_id: response.user_id,
            user_message: response.user_message,
            bot_response: response.bot_response || "I understand you're asking about pollution-related information.",
            type: "bot",
            created_at: response.created_at,
            suggestions: [
              "More information",
              "Emergency contacts",
              "Government helplines"
            ]
          }
        ]
      })
    } catch (error: any) {
      toast.error("Failed to send message: " + (error.message || "Unknown error"))
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id))
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
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      message.type === "user"
                        ? "bg-primary text-white"
                        : "bg-muted border border-border text-foreground"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {message.type === "user" ? message.user_message : message.bot_response}
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
                disabled={!isAuthenticated}
                className="px-3 py-1 rounded-lg bg-background border border-border text-xs text-foreground hover:border-red-500/40 hover:text-red-400 transition-all duration-300 disabled:opacity-50"
              >
                🚨 Emergency
              </button>
              <button
                onClick={() => handleSuggestionClick("Health precautions")}
                disabled={!isAuthenticated}
                className="px-3 py-1 rounded-lg bg-background border border-border text-xs text-foreground hover:border-green-500/40 hover:text-green-400 transition-all duration-300 disabled:opacity-50"
              >
                🏥 Health
              </button>
              <button
                onClick={() => handleSuggestionClick("Government helplines")}
                disabled={!isAuthenticated}
                className="px-3 py-1 rounded-lg bg-background border border-border text-xs text-foreground hover:border-blue-500/40 hover:text-blue-400 transition-all duration-300 disabled:opacity-50"
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