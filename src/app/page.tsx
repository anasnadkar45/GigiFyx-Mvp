import { auth } from "@/app/utils/auth"
import { getUserData } from "@/app/utils/hooks"
import { redirect } from "next/navigation"
import { LandingPage } from "@/components/landing/landing-page"
import { prisma } from "./utils/db"

export default async function HomePage() {
  const session = await auth()

  if (session?.user?.email) {
    try {
      const user = await getUserData()

      if (user.user?.role === "PATIENT") {
        redirect("/patient/dashboard")
      } else if (user.user?.role === "CLINIC_OWNER") {
        redirect("/clinic/dashboard")
      } else if (user.user?.role === "ADMIN") {
        redirect("/admin/dashboard")
      } else {
        redirect("/")
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      // If there's an error, continue to landing page
    }
  }

  // Fetch approved clinics for the landing page
  const clinics = await prisma.clinic.findMany({
    where: {
      status: "APPROVED",
    },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      state: true,
      image: true,
      description: true,
      services: {
        where: {
          isActive: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          price: true,
          category: true,
        },
        take: 3,
      },
      reviews: {
        where: {
          isApproved: true,
        },
        select: {
          rating: true,
        },
      },
    },
    take: 6,
  })

  // Calculate average rating for each clinic
  const clinicsWithRating = clinics.map((clinic) => {
    const totalRatings = clinic.reviews.length
    const avgRating =
      totalRatings > 0 ? clinic.reviews.reduce((sum, review) => sum + review.rating, 0) / totalRatings : 0

    return {
      ...clinic,
      avgRating: avgRating.toFixed(1),
      totalRatings,
    }
  })

  return (
    <>
      <LandingPage user={session?.user} featuredClinics={clinicsWithRating} />
    </>
  )
}
