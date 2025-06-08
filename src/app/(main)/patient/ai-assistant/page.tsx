"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Bot,
  Send,
  MessageCircle,
  AlertTriangle,
  Calendar,
  Stethoscope,
  Brain,
  Clock,
  MapPin,
  Phone,
  Star,
  CheckCircle,
  Loader2,
  Plus,
  X,
  Zap,
  Target,
  Shield,
  Mic,
  Camera,
  FileText,
} from "lucide-react"
import { toast } from "sonner"

interface ChatMessage {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  isUrgent?: boolean
  suggestions?: string[]
}

interface SymptomAnalysis {
  urgencyLevel: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY"
  possibleConditions: Array<{
    condition: string
    likelihood: "LOW" | "MEDIUM" | "HIGH"
    description: string
  }>
  recommendations: string[]
  immediateActions: string[]
  whenToSeekCare: string
}

interface SmartBooking {
  recommendedClinic: {
    id: string
    name: string
    address: string
    phone: string
    rating: number
    distance: string
    nextAvailable: string
    matchingServices: Array<{
      name: string
      price: number
      duration: number
    }>
  }
  urgencyScore: number
  reasoning: string
  estimatedCost: number
  suggestedDate: string
}

export default function AIAssistantPage() {
  const [activeTab, setActiveTab] = useState("chat")
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "ai",
      content:
        "Hi! I'm your AI dental assistant. I can help you with symptoms, find the best clinics, and even book appointments for you. What's bothering you today?",
      timestamp: new Date(),
      suggestions: ["I have tooth pain", "Find me a dentist", "Book urgent appointment", "Dental care advice"],
    },
  ])
  const [currentMessage, setCurrentMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Smart Booking State
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [newSymptom, setNewSymptom] = useState("")
  const [location, setLocation] = useState("")
  const [urgency, setUrgency] = useState<"routine" | "soon" | "urgent">("routine")
  const [smartBooking, setSmartBooking] = useState<SmartBooking | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // AI Features State
  const [isListening, setIsListening] = useState(false)
  const [symptomAnalysis, setSymptomAnalysis] = useState<SymptomAnalysis | null>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: currentMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setCurrentMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentMessage,
          context: "general",
          patientHistory: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI response")
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: data.response,
        timestamp: new Date(),
        isUrgent: data.isUrgent,
        suggestions: data.suggestions,
      }

      setMessages((prev) => [...prev, aiMessage])

      if (data.isUrgent) {
        toast.warning("Urgent care may be needed!")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to get AI response")
    } finally {
      setIsLoading(false)
    }
  }

  const addSymptom = () => {
    if (newSymptom.trim() && !symptoms.includes(newSymptom.trim())) {
      setSymptoms([...symptoms, newSymptom.trim()])
      setNewSymptom("")
    }
  }

  const removeSymptom = (symptom: string) => {
    setSymptoms(symptoms.filter((s) => s !== symptom))
  }

  const findBestClinic = async () => {
    if (symptoms.length === 0 || !location.trim()) {
      toast.error("Please add symptoms and location")
      return
    }

    setIsAnalyzing(true)

    try {
      const response = await fetch("/api/ai/smart-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms,
          location,
          urgency,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to find clinic")
      }

      setSmartBooking(data.booking)
      setSymptomAnalysis(data.analysis)

      if (data.booking.urgencyScore > 8) {
        toast.warning("High urgency detected! Immediate care recommended.")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to find clinic")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const bookAppointment = async () => {
    if (!smartBooking) return

    try {
      const response = await fetch("/api/ai/auto-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId: smartBooking.recommendedClinic.id,
          symptoms: symptoms.join(", "),
          urgency,
          suggestedDate: smartBooking.suggestedDate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to book appointment")
      }

      toast.success("Appointment booked successfully!")
      setSmartBooking(null)
      setSymptoms([])
      setLocation("")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to book appointment")
    }
  }

  const startVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window)) {
      toast.error("Voice input not supported in this browser")
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    setIsListening(true)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setCurrentMessage(transcript)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
      toast.error("Voice input failed")
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const handleSuggestionClick = (suggestion: string) => {
    setCurrentMessage(suggestion)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Simple Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            AI Dental Assistant
          </h1>
          <p className="text-gray-600">Simple, smart dental care guidance</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full max-w-2xl bg mx-auto">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="smart-booking">Smart Booking</TabsTrigger>

          </TabsList>

          {/* Simple Chat Tab */}
          <TabsContent value="chat">
            <Card className="max-w-4xl mx-auto">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chat with AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-96 w-full border rounded-lg p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.type === "user" ? "bg-blue-600 text-white" : "bg-white border shadow-sm"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {message.type === "ai" && <Bot className="h-4 w-4 mt-1 text-blue-600" />}
                            <div className="flex-1">
                              <p className="text-sm">{message.content}</p>
                              {message.isUrgent && (
                                <div className="flex items-center gap-1 mt-2 text-red-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span className="text-xs">Urgent</span>
                                </div>
                              )}
                              {message.suggestions && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {message.suggestions.map((suggestion, index) => (
                                    <Button
                                      key={index}
                                      variant="outline"
                                      size="sm"
                                      className="text-xs h-6"
                                      onClick={() => handleSuggestionClick(suggestion)}
                                    >
                                      {suggestion}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border rounded-lg p-3 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button onClick={startVoiceInput} disabled={isListening} variant="outline" size="icon">
                    <Mic className={`h-4 w-4 ${isListening ? "text-red-500" : ""}`} />
                  </Button>
                  <Button onClick={sendMessage} disabled={isLoading || !currentMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Smart Booking Tab */}
          <TabsContent value="smart-booking">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    Smart Clinic Finder
                  </CardTitle>
                  <CardDescription>
                    Tell us your symptoms and location, we'll find the best clinic and book for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Symptoms */}
                  <div>
                    <label className="text-sm font-medium">What's bothering you?</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={newSymptom}
                        onChange={(e) => setNewSymptom(e.target.value)}
                        placeholder="e.g., tooth pain, swelling"
                        onKeyPress={(e) => e.key === "Enter" && addSymptom()}
                      />
                      <Button onClick={addSymptom} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {symptoms.map((symptom) => (
                        <Badge
                          key={symptom}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeSymptom(symptom)}
                        >
                          {symptom} <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="text-sm font-medium">Your location</label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City or area"
                      className="mt-1"
                    />
                  </div>

                  {/* Urgency */}
                  <div>
                    <label className="text-sm font-medium">How urgent is it?</label>
                    <Select value={urgency} onValueChange={(value: any) => setUrgency(value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine checkup</SelectItem>
                        <SelectItem value="soon">Need care soon</SelectItem>
                        <SelectItem value="urgent">Urgent care needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={findBestClinic}
                    disabled={isAnalyzing || symptoms.length === 0 || !location.trim()}
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Finding best clinic...
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" />
                        Find Best Clinic
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Clinic</CardTitle>
                </CardHeader>
                <CardContent>
                  {smartBooking ? (
                    <div className="space-y-4">
                      {/* Clinic Info */}
                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{smartBooking.recommendedClinic.name}</h3>
                          <Badge className="bg-green-100 text-green-800">Score: {smartBooking.urgencyScore}/10</Badge>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {smartBooking.recommendedClinic.address}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {smartBooking.recommendedClinic.phone}
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            {smartBooking.recommendedClinic.rating} stars • {smartBooking.recommendedClinic.distance}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Next available: {smartBooking.recommendedClinic.nextAvailable}
                          </div>
                        </div>
                      </div>

                      {/* AI Reasoning */}
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-1">Why this clinic?</h4>
                        <p className="text-sm text-blue-800">{smartBooking.reasoning}</p>
                      </div>

                      {/* Services & Cost */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Recommended services:</h4>
                        {smartBooking.recommendedClinic.matchingServices.map((service, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{service.name}</span>
                            <span>${service.price}</span>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Estimated total:</span>
                          <span>${smartBooking.estimatedCost}</span>
                        </div>
                      </div>

                      <Button onClick={bookAppointment} className="w-full">
                        <Calendar className="h-4 w-4 mr-2" />
                        Book Appointment for {smartBooking.suggestedDate}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Add your symptoms and location to find the best clinic</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
