import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"

const treatmentPlanSchema = z.object({
  patientId: z.string(),
  diagnosis: z.string(),
  symptoms: z.array(z.string()),
  medicalHistory: z.string().optional(),
  urgency: z.enum(["low", "medium", "high", "emergency"]),
})

const aiTreatmentPlanSchema = z.object({
  treatmentPhases: z.array(
    z.object({
      phase: z.number(),
      title: z.string(),
      description: z.string(),
      estimatedDuration: z.string(),
      procedures: z.array(z.string()),
      priority: z.enum(["low", "medium", "high"]),
    }),
  ),
  estimatedCost: z.object({
    minimum: z.number(),
    maximum: z.number(),
    currency: z.string(),
  }),
  timeline: z.string(),
  followUpSchedule: z.array(z.string()),
  homeCareTips: z.array(z.string()),
  warningSignsToWatch: z.array(z.string()),
})

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        clinic: true,
      },
    })

    if (!user || user.role !== "CLINIC_OWNER" || !user.clinic) {
      return NextResponse.json({ error: "Clinic owner access required" }, { status: 403 })
    }

    const body = await request.json()
    const { patientId, diagnosis, symptoms, medicalHistory, urgency } = treatmentPlanSchema.parse(body)

    // Get patient information
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: true,
      },
    })

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    // Get patient's appointment history
    const appointmentHistory = await prisma.appointment.findMany({
      where: {
        userId: patient.userId,
        clinicId: user.clinic.id,
      },
      include: {
        service: true,
      },
      orderBy: {
        startTime: "desc",
      },
      take: 10,
    })

    // Get available services from the clinic
    const availableServices = await prisma.service.findMany({
      where: {
        clinicId: user.clinic.id,
        isActive: "ACTIVE",
      },
    })

    const systemPrompt = `You are an AI dental treatment planning assistant. Create a comprehensive treatment plan based on the diagnosis and patient information.

Patient Information:
- Name: ${patient.name}
- Age: ${patient.age || "Not specified"}
- Gender: ${patient.gender || "Not specified"}
- Blood Group: ${patient.bloodGroup || "Not specified"}
- Allergies: ${patient.allergies || "None"}
- Medical Notes: ${patient.medicalNote || "None"}
- Medical History: ${medicalHistory || "None provided"}

Current Diagnosis: ${diagnosis}
Symptoms: ${symptoms.join(", ")}
Urgency Level: ${urgency}

Recent Treatment History:
${
  appointmentHistory.length > 0
    ? appointmentHistory
        .map((apt) => `- ${apt.service.name} on ${apt.startTime.toDateString()} (${apt.status})`)
        .join("\n")
    : "No recent treatments"
}

Available Services at Clinic:
${availableServices.map((service) => `- ${service.name}: ${service.description || "No description"}`).join("\n")}

Create a comprehensive treatment plan that includes:
1. Multiple treatment phases if needed
2. Realistic cost estimates in MYR (Malaysian Ringgit)
3. Timeline for treatment completion
4. Follow-up schedule
5. Home care instructions
6. Warning signs to watch for

IMPORTANT: This is a treatment planning tool. All plans must be reviewed and approved by a licensed dentist before implementation.`

    const { object: treatmentPlan } = await generateObject({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: "Generate a comprehensive dental treatment plan based on the provided information.",
      schema: aiTreatmentPlanSchema,
    })

    // Save the treatment plan
    const savedPlan = await prisma.treatmentPlan.create({
      data: {
        patientId: patient.id,
        clinicId: user.clinic.id,
        createdBy: user.id,
        diagnosis,
        symptoms: symptoms.join(", "),
        urgency,
        aiGeneratedPlan: JSON.stringify(treatmentPlan),
        status: "DRAFT",
      },
    })

    return NextResponse.json({
      treatmentPlan,
      planId: savedPlan.id,
      disclaimer:
        "This AI-generated treatment plan is a preliminary recommendation and must be reviewed, modified, and approved by a licensed dental professional before implementation.",
    })
  } catch (error) {
    console.error("Error generating treatment plan:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to generate treatment plan" }, { status: 500 })
  }
}
