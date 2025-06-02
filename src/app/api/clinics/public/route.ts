import { prisma } from "@/app/utils/db"
import { NextResponse } from "next/server"

// GET - Fetch all approved clinics for public viewing
export async function GET() {
  try {
    const clinics = await prisma.clinic.findMany({
      where: {
        status: "APPROVED",
      },
      include: {
        services: {
          where: {
            isActive: "ACTIVE",
          },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            category: true,
            duration: true,
            preparation: true,
          },
        },
        doctors: {
          select: {
            id: true,
            name: true,
            specialization: true,
            image: true,
            bio: true,
            experience: true,
          },
        },
        workingHours: {
          orderBy: {
            day: "asc",
          },
          select: {
            day: true,
            openTime: true,
            closeTime: true,
            duration: true,
            breakStartTime: true,
            breakEndTime: true,
          },
        },
        _count: {
          select: {
            appointments: {
              where: {
                status: "COMPLETED",
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    // Calculate average rating for each clinic (if you have reviews)
    const clinicsWithRatings = await Promise.all(
      clinics.map(async (clinic) => {
        const reviews = await prisma.review.findMany({
          where: {
            clinicId: clinic.id,
            isApproved: true,
          },
          select: {
            rating: true,
          },
        })

        const averageRating =
          reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

        return {
          ...clinic,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: reviews.length,
          totalCompletedAppointments: clinic._count.appointments,
        }
      }),
    )

    return NextResponse.json({ clinics: clinicsWithRatings })
  } catch (error) {
    console.error("Error fetching clinics:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch clinics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
