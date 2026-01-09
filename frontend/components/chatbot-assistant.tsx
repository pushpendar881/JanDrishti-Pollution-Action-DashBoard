"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/frontend/contexts/auth-context"
import { chatAPI, ChatMessage } from "@/frontend/lib/api"
import AuthDialog from "@/frontend/components/auth-dialog"
import { toast } from "sonner"

interface Message {
  id: string
  type: "user" | "bot"
  content: string
  response?: string
  timestamp: string
  suggestions?: string[]
}

export default function ChatbotAssistant() {
  const { isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Load messages when authenticated and chat opens
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadMessages()
    } else if (isOpen && !isAuthenticated) {
      // Show welcome message for unauthenticated users
      setMessages([{
        id: "welcome",
        type: "bot",
        content: "Hi! I'm your AI pollution assistant. Please login to start chatting with me. I can help you understand air quality data, health recommendations, and government policies.",
        timestamp: new Date().toISOString(),
      }])
    }
  }, [isOpen, isAuthenticated])

  const loadMessages = async () => {
    setLoadingMessages(true)
    try {
      const chatMessages = await chatAPI.getMessages()
      // Transform API messages to UI format
      const transformedMessages: Message[] = chatMessages.map((msg) => ({
        id: msg.id,
        type: msg.type,
        content: msg.message,
        response: msg.response,
        timestamp: msg.created_at,
      }))
      
      if (transformedMessages.length === 0) {
        // Show welcome message if no history
        setMessages([{
          id: "welcome",
          type: "bot",
          content: "Hi! I'm your AI pollution assistant. I can help you understand air quality data, health recommendations, and government policies. What would you like to know?",
          timestamp: new Date().toISOString(),
          suggestions: [
            "What's the current AQI?",
            "Health tips for high pollution",
            "Government regulations",
            "Best time to go outside"
          ]
        }])
      } else {
        setMessages(transformedMessages.reverse()) // Reverse to show oldest first
      }
    } catch (error: any) {
      toast.error("Failed to load chat history: " + (error.message || "Unknown error"))
      setMessages([{
        id: "welcome",
        type: "bot",
        content: "Hi! I'm your AI pollution assistant. I can help you understand air quality data, health recommendations, and government policies. What would you like to know?",
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setLoadingMessages(false)
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
      type: "user",
      content: content,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      // Send message to API
      const response = await chatAPI.sendMessage(content)
      
      // Replace temp message with real one and add bot response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== userMessage.id)
        return [
          ...filtered,
          {
            id: response.id,
            type: "user",
            content: response.message,
            timestamp: response.created_at
          },
          {
            id: `bot-${Date.now()}`,
            type: "bot",
            content: response.response || "I understand you're asking about pollution-related information. Let me help you with that.",
            timestamp: new Date().toISOString(),
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
            {loadingMessages ? (
              <div className="text-center py-8 text-muted-foreground">Loading chat history...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No messages yet</div>
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
                        : "glass-effect border border-border/30 text-foreground"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {message.type === "user" ? message.content : (message.response || message.content)}
                    </p>
                    
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
              ))
            )}

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
            {!isAuthenticated && (
              <div className="mb-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-xs text-yellow-400 mb-2">Please login to chat</p>
                <button
                  onClick={() => setShowAuthDialog(true)}
                  className="text-xs px-3 py-1 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all"
                >
                  Login / Sign Up
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
                placeholder={isAuthenticated ? "Ask about air quality, health tips, or policies..." : "Login to chat..."}
                disabled={!isAuthenticated}
                className="flex-1 px-4 py-3 rounded-xl glass-effect border border-border/40 text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none transition-all text-sm disabled:opacity-50"
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || !isAuthenticated}
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-lg">➤</span>
              </button>
            </div>
          </div>
          
          <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />

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