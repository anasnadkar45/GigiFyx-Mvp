import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

// Define schema for admin insights
const adminInsightsSchema = z.array(
  z.object({
    id: z.string(),
    type: z.enum(["fraud", "quality", "performance", "market", "compliance"]),
    title: z.string(),
    description: z.string(),
    severity: z.enum(["critical", "high", "medium", "low"]),
    affectedClinics: z.number(),
    action: z.string(),
    confidence: z.number().min(0).max(100),
  }),
)

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get platform data for AI analysis
    const platformData = await prisma.$transaction([
      prisma.clinic.count(),
      prisma.user.count(),
      prisma.appointment.count(),
      prisma.review.aggregate({
        _avg: {
          rating: true,
        },
      }),
      prisma.clinic.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          _count: {
            select: {
              appointments: true,
              reviews: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      }),
    ])

    const [clinicCount, userCount, appointmentCount, avgRating, clinics] = platformData

    // Calculate clinic metrics
    const clinicMetrics = clinics.map((clinic) => {
      const avgClinicRating =
        clinic.reviews.length > 0
          ? clinic.reviews.reduce((sum, review) => sum + review.rating, 0) / clinic.reviews.length
          : 0

      return {
        id: clinic.id,
        name: clinic.name,
        status: clinic.status,
        appointmentCount: clinic._count.appointments,
        reviewCount: clinic._count.reviews,
        avgRating: avgClinicRating,
      }
    })

    // Create system prompt with platform data
    const systemPrompt = `You are an AI platform administrator for a dental marketplace. Generate actionable insights for the platform administrator based on the data.

Platform Overview:
- Total clinics: ${clinicCount}
- Total users: ${userCount}
- Total appointments: ${appointmentCount}
- Average rating: ${avgRating._avg.rating || "N/A"}

Clinic Metrics (sample):
${clinicMetrics
  .slice(0, 5)
  .map(
    (c) =>
      `- ${c.name}: ${c.status}, ${c.appointmentCount} appointments, ${c.reviewCount} reviews, ${c.avgRating.toFixed(
        1,
      )} rating`,
  )
  .join("\n")}

Generate 5 actionable platform insights across these categories:
1. Fraud detection and prevention
2. Quality control and monitoring
3. Platform performance optimization
4. Market trends and opportunities
5. Compliance and risk management

Each insight should have a clear type, title, description, severity level, number of affected clinics, suggested action, and confidence score.`

    // Generate insights using Gemini
    const { object: insights } = await generateObject({
      model: google("gemini-1.5-flash"),
      system: systemPrompt,
      prompt: "Generate actionable platform insights for the dental marketplace administrator.",
      schema: adminInsightsSchema,
    })

    // Store insights in database
    await prisma.aiAnalytics.create({
      data: {
        userId: user.id,
        type: "ADMIN_INSIGHTS",
        data: JSON.stringify(insights),
      },
    })

    return NextResponse.json({ insights })
  } catch (error) {
    console.error("Error generating admin insights:", error)
    return NextResponse.json(
      { error: "Failed to generate insights", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
