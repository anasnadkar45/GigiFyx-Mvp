import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const reviewSchema = z.object({
  clinicId: z.string().min(1, "Clinic ID is required"),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== "PATIENT") {
      return NextResponse.json({ error: "Only patients can leave reviews" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = reviewSchema.parse(body)

    // Check if clinic exists
    const clinic = await prisma.clinic.findUnique({
      where: { id: validatedData.clinicId },
    })

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 })
    }

    // Check if user has had an appointment with this clinic
    const hasAppointment = await prisma.appointment.findFirst({
      where: {
        userId: user.id,
        clinicId: validatedData.clinicId,
        status: "COMPLETED",
      },
    })

    if (!hasAppointment) {
      return NextResponse.json(
        { error: "You can only review clinics after completing an appointment" },
        { status: 403 },
      )
    }

    // Check if user has already reviewed this clinic
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: user.id,
        clinicId: validatedData.clinicId,
      },
    })

    if (existingReview) {
      // Update existing review
      const updatedReview = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: validatedData.rating,
          comment: validatedData.comment,
          isApproved: false, // Reset approval status for moderation
        },
      })

      return NextResponse.json({
        message: "Review updated successfully and pending approval",
        review: updatedReview,
      })
    }

    // Create new review
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        clinicId: validatedData.clinicId,
        rating: validatedData.rating,
        comment: validatedData.comment,
        isApproved: false, // Requires moderation
      },
    })

    return NextResponse.json({
      message: "Review submitted successfully and pending approval",
      review,
    })
  } catch (error) {
    console.error("Error creating review:", error)

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: "Failed to submit review",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const clinicId = url.searchParams.get("clinicId")

  if (!clinicId) {
    return NextResponse.json({ error: "Clinic ID is required" }, { status: 400 })
  }

  try {
    const reviews = await prisma.review.findMany({
      where: {
        clinicId,
        isApproved: true,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Calculate average rating
    const averageRating =
      reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

    return NextResponse.json({
      reviews,
      averageRating,
      totalReviews: reviews.length,
    })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch reviews",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
