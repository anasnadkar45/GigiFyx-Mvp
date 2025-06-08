import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"

const recommendationSchema = z.object({
  preferences: z.object({
    location: z.string().optional(),
    timePreference: z.enum(["morning", "afternoon", "evening", "any"]).default("any"),
    urgency: z.enum(["routine", "soon", "urgent"]).default("routine"),
    serviceType: z.string().optional(),
    maxDistance: z.number().optional(),
    priceRange: z.enum(["budget", "moderate", "premium", "any"]).default("any"),
  }),
  symptoms: z.array(z.string()).optional(),
  lastVisit: z.string().optional(),
})

const aiRecommendationSchema = z.object({
  recommendedServices: z.array(
    z.object({
      serviceName: z.string(),
      priority: z.enum(["low", "medium", "high"]),
      reason: z.string(),
    }),
  ),
  suggestedTimeframe: z.string(),
  preparationTips: z.array(z.string()),
  questionsToAsk: z.array(z.string()),
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
        Appointments: {
          include: {
            service: true,
            clinic: true,
          },
          orderBy: {
            startTime: "desc",
          },
          take: 5,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { preferences, symptoms, lastVisit } = recommendationSchema.parse(body)

    // Get available clinics and services
    const clinics = await prisma.clinic.findMany({
      where: {
        status: "APPROVED",
      },
      include: {
        services: {
          where: {
            isActive: "ACTIVE",
          },
        },
        reviews: true,
      },
    })

    // Filter clinics based on preferences
    let filteredClinics = clinics

    if (preferences.location) {
      filteredClinics = clinics.filter(
        (clinic) =>
          clinic.city?.toLowerCase().includes(preferences.location!.toLowerCase()) ||
          clinic.address.toLowerCase().includes(preferences.location!.toLowerCase()),
      )
    }

    // Generate AI recommendations
    const systemPrompt = `You are a dental appointment recommendation AI. Based on patient information and preferences, recommend appropriate dental services and provide guidance.

Patient Information:
${
  user.Patient
    ? `
- Age: ${user.Patient.age || "Not specified"}
- Last visit: ${lastVisit || "Not specified"}
- Medical history: ${user.Patient.medicalNote || "None"}
- Allergies: ${user.Patient.allergies || "None"}
`
    : "Limited patient information"
}

Recent appointments:
${
  user.Appointments.length > 0
    ? user.Appointments.map((apt) => `- ${apt.service.name} (${apt.startTime.toDateString()})`).join("\n")
    : "No recent appointments"
}

Current preferences:
- Urgency: ${preferences.urgency}
- Time preference: ${preferences.timePreference}
- Service type: ${preferences.serviceType || "Any"}
- Price range: ${preferences.priceRange}

Symptoms (if any): ${symptoms?.join(", ") || "None reported"}

Provide recommendations for dental services, timing, and preparation.`

    const { object: aiRecommendations } = await generateObject({
      model: google("gemini-1.5-flash"),
      system: systemPrompt,
      prompt:
        "Generate personalized dental appointment recommendations based on the patient information and preferences.",
      schema: aiRecommendationSchema,
    })

    // Score and rank clinics
    const rankedClinics = filteredClinics
      .map((clinic) => {
        let score = 0

        // Base score from reviews
        if (clinic.reviews.length > 0) {
          const avgRating = clinic.reviews.reduce((sum, review) => sum + review.rating, 0) / clinic.reviews.length
          score += avgRating * 20
        }

        // Service availability score
        const hasRecommendedServices = aiRecommendations.recommendedServices.some((rec) =>
          clinic.services.some((service) => service.name.toLowerCase().includes(rec.serviceName.toLowerCase())),
        )
        if (hasRecommendedServices) score += 30

        // Price range matching
        if (preferences.priceRange !== "any") {
          const avgPrice =
            clinic.services.reduce((sum, service) => sum + (service.price || 0), 0) / clinic.services.length
          if (preferences.priceRange === "budget" && avgPrice < 100) score += 20
          if (preferences.priceRange === "moderate" && avgPrice >= 100 && avgPrice <= 300) score += 20
          if (preferences.priceRange === "premium" && avgPrice > 300) score += 20
        }

        return {
          ...clinic,
          score,
          matchingServices: clinic.services.filter((service) =>
            aiRecommendations.recommendedServices.some((rec) =>
              service.name.toLowerCase().includes(rec.serviceName.toLowerCase()),
            ),
          ),
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    // Save recommendation for analytics
    await prisma.appointmentRecommendation.create({
      data: {
        userId: user.id,
        preferences: JSON.stringify(preferences),
        symptoms: symptoms?.join(", "),
        aiRecommendations: JSON.stringify(aiRecommendations),
        recommendedClinics: JSON.stringify(rankedClinics.map((c) => c.id)),
      },
    })

    return NextResponse.json({
      aiRecommendations,
      recommendedClinics: rankedClinics.map((clinic) => ({
        id: clinic.id,
        name: clinic.name,
        address: clinic.address,
        city: clinic.city,
        phone: clinic.phone,
        score: Math.round(clinic.score),
        averageRating:
          clinic.reviews.length > 0
            ? clinic.reviews.reduce((sum, review) => sum + review.rating, 0) / clinic.reviews.length
            : 0,
        reviewCount: clinic.reviews.length,
        matchingServices: clinic.matchingServices.map((service) => ({
          id: service.id,
          name: service.name,
          price: service.price,
          description: service.description,
        })),
      })),
    })
  } catch (error) {
    console.error("Error generating appointment recommendations:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: "Failed to generate recommendations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
