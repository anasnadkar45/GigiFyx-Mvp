import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { AiContext } from "@prisma/client"

const chatSchema = z.object({
  message: z.string().min(1, "Message is required"),
  context: z.enum(["general", "symptoms", "appointment", "emergency"]).default("general"),
  patientHistory: z.boolean().default(false),
})

// Map string context to Prisma enum
function mapContextToEnum(context: string): AiContext {
  switch (context) {
    case "symptoms":
      return AiContext.SYMPTOM_CHECK
    case "appointment":
      return AiContext.APPOINTMENT_BOOKING
    case "emergency":
      return AiContext.EMERGENCY
    default:
      return AiContext.GENERAL_INQUIRY
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        Patient: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { message, context, patientHistory } = chatSchema.parse(body)

    // Build context-aware system prompt
    let systemPrompt = `You are DentalAI, a helpful dental health assistant. You provide educational information and guidance about dental health.

IMPORTANT: You are NOT providing medical diagnosis. Always recommend consulting with a qualified dentist for proper diagnosis and treatment.

User Information:
- Name: ${user.name || "User"}
${
  user.Patient && patientHistory
    ? `
- Age: ${user.Patient.age || "Not specified"}
- Gender: ${user.Patient.gender || "Not specified"}
- Allergies: ${user.Patient.allergies || "None reported"}
- Medical notes: ${user.Patient.medicalNote || "None"}
`
    : ""
}

Context: ${context}

Guidelines:
- Be helpful, empathetic, and professional
- Provide educational information about dental health
- Always emphasize the importance of professional dental care
- If symptoms suggest urgency, clearly state this
- Offer practical advice for immediate relief when appropriate
- Keep responses concise but informative (max 300 words)
- Use a friendly, conversational tone`

    // Add context-specific instructions
    if (context === "symptoms") {
      systemPrompt += `

Focus on:
- Understanding the symptoms described
- Providing general guidance on urgency
- Suggesting immediate relief measures
- Emphasizing when to seek professional care
- Asking clarifying questions if needed`
    } else if (context === "appointment") {
      systemPrompt += `

Focus on:
- Helping with appointment-related questions
- Explaining what to expect during dental visits
- Preparation tips for dental procedures
- Understanding different types of dental services`
    } else if (context === "emergency") {
      systemPrompt += `

Focus on:
- Identifying potential dental emergencies
- Providing immediate action steps
- Emphasizing urgent professional care
- Safety and pain management guidance`
    }

    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      system: systemPrompt,
      prompt: message,
      maxTokens: 500,
    })

    // Determine if response indicates urgency
    const isUrgent =
      text.toLowerCase().includes("urgent") ||
      text.toLowerCase().includes("emergency") ||
      text.toLowerCase().includes("immediately") ||
      context === "emergency"

    // Generate suggestions based on context
    const suggestions = generateSuggestions(context, message)
    const followUpQuestions = generateFollowUpQuestions(context, message)

    // Log the conversation for analytics
    await prisma.aiConversation.create({
      data: {
        userId: user.id,
        message,
        response: text,
        context: mapContextToEnum(context),
        sessionId: `session_${Date.now()}`,
      },
    })

    return NextResponse.json({
      response: text,
      isUrgent,
      suggestions,
      followUpQuestions,
      context,
    })
  } catch (error) {
    console.error("Error in AI chat:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: "Failed to get AI response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function generateSuggestions(context: string, message: string): string[] {
  const suggestions: string[] = []

  if (context === "symptoms") {
    suggestions.push("How severe is the pain?", "When did it start?", "What makes it worse?")
  } else if (context === "appointment") {
    suggestions.push("What services do you offer?", "How do I prepare for my visit?", "What should I expect?")
  } else if (context === "emergency") {
    suggestions.push("Is this a dental emergency?", "What should I do right now?", "Should I go to the ER?")
  } else {
    suggestions.push("Tell me about dental hygiene", "How often should I visit the dentist?", "Preventive care tips")
  }

  return suggestions
}

function generateFollowUpQuestions(context: string, message: string): string[] {
  const questions: string[] = []

  if (message.toLowerCase().includes("pain")) {
    questions.push("Can you describe the type of pain?", "Is the pain constant or intermittent?")
  }

  if (message.toLowerCase().includes("swelling")) {
    questions.push("Where exactly is the swelling?", "How long has it been swollen?")
  }

  if (context === "appointment") {
    questions.push("What type of appointment are you looking for?", "Do you have any specific concerns?")
  }

  return questions
}
