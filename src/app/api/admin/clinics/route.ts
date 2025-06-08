import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const clinics = await prisma.clinic.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            services: true,
            reviews: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // PENDING first
        { createdAt: "desc" },
      ],
    })

    revalidatePath('/admin/clinics')

    return NextResponse.json({ clinics })
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
