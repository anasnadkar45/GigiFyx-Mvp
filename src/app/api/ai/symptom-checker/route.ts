import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { SeverityLevel, UrgencyLevel } from "@prisma/client"

const symptomSchema = z.object({
  symptoms: z.array(z.string()).min(1, "At least one symptom is required"),
  duration: z.string().optional(),
  severity: z.enum(["MILD", "MODERATE", "SEVERE"]).default("MODERATE"),
  additionalInfo: z.string().optional(),
})

const analysisSchema = z.object({
  urgencyLevel: z.enum(["LOW", "MEDIUM", "HIGH", "EMERGENCY"]),
  possibleConditions: z.array(
    z.object({
      condition: z.string(),
      likelihood: z.enum(["LOW", "MEDIUM", "HIGH"]),
      description: z.string(),
    }),
  ),
  recommendations: z.array(z.string()),
  immediateActions: z.array(z.string()),
  whenToSeekCare: z.string(),
  preventiveMeasures: z.array(z.string()),
})

// Map string values to Prisma enums
function mapSeverityToEnum(severity: string): SeverityLevel {
  switch (severity.toUpperCase()) {
    case "MILD":
      return SeverityLevel.MILD
    case "SEVERE":
      return SeverityLevel.SEVERE
    default:
      return SeverityLevel.MODERATE
  }
}

function mapUrgencyToEnum(urgency: string): UrgencyLevel {
  switch (urgency.toUpperCase()) {
    case "LOW":
      return UrgencyLevel.LOW
    case "HIGH":
      return UrgencyLevel.HIGH
    case "EMERGENCY":
      return UrgencyLevel.EMERGENCY
    default:
      return UrgencyLevel.MEDIUM
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
    const { symptoms, duration, severity, additionalInfo } = symptomSchema.parse(body)

    const systemPrompt = `You are a dental health AI assistant that helps analyze symptoms and provides guidance. 

IMPORTANT: You are NOT providing medical diagnosis. You are offering educational information and guidance on when to seek professional care.

Patient context:
${
  user.Patient
    ? `
- Age: ${user.Patient.age || "Not specified"}
- Gender: ${user.Patient.gender || "Not specified"}
- Allergies: ${user.Patient.allergies || "None reported"}
- Medical notes: ${user.Patient.medicalNote || "None"}
`
    : "Limited patient information available"
}

Analyze the following dental symptoms and provide structured guidance:
- Symptoms: ${symptoms.join(", ")}
- Duration: ${duration || "Not specified"}
- Severity: ${severity}
- Additional info: ${additionalInfo || "None"}

Provide a comprehensive analysis focusing on:
1. Urgency level (emergency situations require immediate care)
2. Possible dental conditions (educational purposes only)
3. General recommendations
4. Immediate actions the patient can take
5. Clear guidance on when to seek professional care
6. Preventive measures for the future

Use these exact values for urgencyLevel: LOW, MEDIUM, HIGH, EMERGENCY
Use these exact values for likelihood: LOW, MEDIUM, HIGH

Remember: Always emphasize the importance of professional dental evaluation for proper diagnosis and treatment.`

    const { object: analysis } = await generateObject({
      model: google("gemini-1.5-flash"),
      system: systemPrompt,
      prompt: `Analyze these dental symptoms and provide structured guidance.`,
      schema: analysisSchema,
    })

    // Save the symptom check for analytics and follow-up
    await prisma.symptomCheck.create({
      data: {
        userId: user.id,
        symptoms: symptoms.join(", "),
        duration,
        severity: mapSeverityToEnum(severity),
        additionalInfo,
        urgencyLevel: mapUrgencyToEnum(analysis.urgencyLevel),
        aiAnalysis: JSON.stringify(analysis),
      },
    })

    // Create notification if urgent
    if (analysis.urgencyLevel === "HIGH" || analysis.urgencyLevel === "EMERGENCY") {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "SYSTEM_NOTIFICATION",
          title: "Urgent Dental Symptoms Detected",
          message: `Your symptom check indicates ${analysis.urgencyLevel} urgency. Please seek professional dental care promptly.`,
        },
      })
    }

    return NextResponse.json({
      analysis,
      disclaimer:
        "This analysis is for educational purposes only and does not replace professional medical advice. Please consult with a qualified dentist for proper diagnosis and treatment.",
    })
  } catch (error) {
    console.error("Error in symptom checker:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: "Failed to analyze symptoms",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
