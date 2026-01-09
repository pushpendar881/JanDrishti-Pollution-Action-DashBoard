"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: "login" | "signup"
}

export default function AuthDialog({ open, onOpenChange, mode: initialMode = "login" }: AuthDialogProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const { login, signup } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")
    setLoading(true)

    try {
      if (mode === "login") {
        await login(email, password)
        toast.success("Login successful!", {
          description: "Welcome back! You can now submit reports and chat with the AI assistant.",
        })
        onOpenChange(false)
        // Reset form
        setEmail("")
        setPassword("")
        setFullName("")
      } else {
        const response = await signup(email, password, fullName || undefined)
        // Check if there's a message about email confirmation
        if (response && response.message) {
          setSuccessMessage(response.message)
          // Show prominent toast alert
          toast.info("📧 Check Your Email!", {
            description: "We've sent you a confirmation email. Please check your inbox and click the confirmation link to activate your account.",
            duration: 10000, // Show for 10 seconds
            action: {
              label: "Got it",
              onClick: () => { },
            },
          })
          // Don't close dialog, show success message
          // Clear password for security
          setPassword("")
        } else {
          // User is logged in (email already confirmed)
          toast.success("Account created successfully!", {
            description: "Welcome! You can now submit reports and chat with the AI assistant.",
          })
          onOpenChange(false)
          // Reset form
          setEmail("")
          setPassword("")
          setFullName("")
        }
      }
    } catch (err: any) {
      // Parse error message to show user-friendly messages
      const errorMsg = err.message || "An error occurred. Please try again."

      // Show specific error messages
      if (errorMsg.includes("Email not confirmed") || errorMsg.includes("email not confirmed")) {
        const message = "Email not confirmed. Please check your email and click the confirmation link before logging in."
        setError(message)
        // Show toast for email confirmation error
        toast.warning("Email Not Confirmed", {
          description: "Please check your email inbox and click the confirmation link to activate your account.",
          duration: 8000,
        })
      } else if (errorMsg.includes("Invalid email or password") || errorMsg.includes("Invalid login credentials")) {
        const message = "Invalid email or password. Please check your credentials and try again."
        setError(message)
        toast.error("Login Failed", {
          description: "Invalid email or password. Please check your credentials.",
          duration: 5000,
        })
      } else if (errorMsg.includes("User already registered")) {
        const message = "This email is already registered. Please login instead."
        setError(message)
        toast.info("Account Exists", {
          description: "This email is already registered. Please use the login form instead.",
          duration: 5000,
        })
      } else {
        setError(errorMsg)
        toast.error("Error", {
          description: errorMsg,
          duration: 5000,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {mode === "login" ? "Login" : "Sign Up"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Login to submit reports and chat with AI assistant"
              : "Create an account to get started"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-start gap-3">
                <span className="text-blue-400 text-xl">📧</span>
                <div className="flex-1">
                  <p className="text-blue-400 font-semibold mb-1">Check Your Email!</p>
                  <p className="text-blue-300 text-sm">{successMessage}</p>
                  <p className="text-blue-300/80 text-xs mt-2">
                    After confirming your email, you can close this dialog and login.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !!successMessage}
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Sign Up"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup")
                  setError("")
                }}
                className="text-primary hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login")
                  setError("")
                }}
                className="text-primary hover:underline"
              >
                Login
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
