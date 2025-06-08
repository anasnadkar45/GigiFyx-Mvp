import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import type { UrgencyLevel, SeverityLevel } from "@prisma/client"

const smartBookingSchema = z.object({
  symptoms: z.array(z.string()).min(1, "At least one symptom is required"),
  location: z.string().min(1, "Location is required"),
  urgency: z.enum(["routine", "soon", "urgent"]).default("routine"),
})

const aiAnalysisSchema = z.object({
  urgencyScore: z.number().min(1).max(10),
  severity: z.enum(["MILD", "MODERATE", "SEVERE"]),
  urgencyLevel: z.enum(["LOW", "MEDIUM", "HIGH", "EMERGENCY"]),
  reasoning: z.string(),
  recommendedServices: z.array(z.string()),
  estimatedCost: z.number(),
  suggestedTimeframe: z.string(),
  possibleConditions: z.array(
    z.object({
      condition: z.string(),
      likelihood: z.enum(["LOW", "MEDIUM", "HIGH"]),
      description: z.string(),
    }),
  ),
  immediateActions: z.array(z.string()),
  whenToSeekCare: z.string(),
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
        Patient: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { symptoms, location, urgency } = smartBookingSchema.parse(body)

    // Get available clinics near the location
    const clinics = await prisma.clinic.findMany({
      where: {
        status: "APPROVED",
        OR: [
          { city: { contains: location, mode: "insensitive" } },
          { address: { contains: location, mode: "insensitive" } },
        ],
      },
      include: {
        services: {
          where: { isActive: "ACTIVE" },
        },
        reviews: true,
        workingHours: true,
      },
    })

    if (clinics.length === 0) {
      return NextResponse.json({ error: "No clinics found in your area" }, { status: 404 })
    }

    // AI Analysis
    const systemPrompt = `You are an AI dental health analyzer. Analyze the patient's symptoms and provide comprehensive assessment.

Patient Information:
${
  user.Patient
    ? `
- Age: ${user.Patient.age || "Not specified"}
- Gender: ${user.Patient.gender || "Not specified"}
- Medical history: ${user.Patient.medicalNote || "None"}
- Allergies: ${user.Patient.allergies || "None"}
`
    : "Limited patient information"
}

Symptoms: ${symptoms.join(", ")}
Location: ${location}
Urgency preference: ${urgency}

Available clinics: ${clinics.length} clinics found

Provide detailed analysis including urgency scoring (1-10), severity assessment, and treatment recommendations.`

    const { object: analysis } = await generateObject({
      model: google("gemini-1.5-flash"),
      system: systemPrompt,
      prompt:
        "Analyze the symptoms and provide comprehensive dental health assessment with urgency scoring and treatment recommendations.",
      schema: aiAnalysisSchema,
    })

    // Score and rank clinics based on AI analysis
    const scoredClinics = clinics.map((clinic) => {
      let score = 0

      // Base score from reviews
      if (clinic.reviews.length > 0) {
        const avgRating = clinic.reviews.reduce((sum, review) => sum + review.rating, 0) / clinic.reviews.length
        score += avgRating * 15
      }

      // Service matching score
      const matchingServices = clinic.services.filter((service) =>
        analysis.recommendedServices.some(
          (rec) =>
            service.name.toLowerCase().includes(rec.toLowerCase()) ||
            service.category.toLowerCase().includes(rec.toLowerCase()),
        ),
      )
      score += matchingServices.length * 20

      // Urgency matching
      if (urgency === "urgent" && analysis.urgencyScore >= 8) {
        score += 30
      } else if (urgency === "soon" && analysis.urgencyScore >= 5) {
        score += 20
      }

      // Working hours availability (simplified)
      if (clinic.workingHours.length > 0) {
        score += 10
      }

      return {
        ...clinic,
        score,
        matchingServices,
        distance: "2.5 km", // Simplified - would calculate actual distance
      }
    })

    // Get the best clinic
    const bestClinic = scoredClinics.sort((a, b) => b.score - a.score)[0]

    if (!bestClinic) {
      return NextResponse.json({ error: "No suitable clinic found" }, { status: 404 })
    }

    // Calculate estimated cost
    const estimatedCost = bestClinic.matchingServices.reduce((sum, service) => sum + (service.price || 100), 0)

    // Generate suggested appointment date
    const suggestedDate = new Date()
    if (analysis.urgencyScore >= 8) {
      suggestedDate.setDate(suggestedDate.getDate() + 1) // Tomorrow for urgent
    } else if (analysis.urgencyScore >= 5) {
      suggestedDate.setDate(suggestedDate.getDate() + 3) // 3 days for moderate
    } else {
      suggestedDate.setDate(suggestedDate.getDate() + 7) // 1 week for routine
    }

    const booking = {
      recommendedClinic: {
        id: bestClinic.id,
        name: bestClinic.name,
        address: bestClinic.address,
        phone: bestClinic.phone,
        rating:
          bestClinic.reviews.length > 0
            ? bestClinic.reviews.reduce((sum, review) => sum + review.rating, 0) / bestClinic.reviews.length
            : 0,
        distance: bestClinic.distance,
        nextAvailable: "Today 2:00 PM", // Simplified
        matchingServices: bestClinic.matchingServices.map((service) => ({
          name: service.name,
          price: service.price || 100,
          duration: service.duration || 30,
        })),
      },
      urgencyScore: analysis.urgencyScore,
      reasoning: analysis.reasoning,
      estimatedCost,
      suggestedDate: suggestedDate.toLocaleDateString(),
    }

    // Save the smart booking analysis
    await prisma.symptomCheck.create({
      data: {
        userId: user.id,
        symptoms: symptoms.join(", "),
        severity: analysis.severity as SeverityLevel,
        urgencyLevel: analysis.urgencyLevel as UrgencyLevel,
        aiAnalysis: JSON.stringify(analysis),
      },
    })

    return NextResponse.json({
      booking,
      analysis: {
        urgencyLevel: analysis.urgencyLevel,
        possibleConditions: analysis.possibleConditions,
        immediateActions: analysis.immediateActions,
        whenToSeekCare: analysis.whenToSeekCare,
        recommendations: analysis.recommendedServices,
      },
    })
  } catch (error) {
    console.error("Error in smart booking:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: "Failed to find clinic",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
