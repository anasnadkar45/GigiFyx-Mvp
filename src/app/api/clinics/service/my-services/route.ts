import { prisma } from "@/app/utils/db"
import { getUserData } from "@/app/utils/hooks"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const user = await getUserData()
  try {
    const services = await prisma.service.findMany({
      where: {
        clinicId: user.user?.clinic?.id,
      },

      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ services })
  } catch (error) {
    console.error("Error fetching services:", error)
    return NextResponse.json(
      {
        error: "Something went wrong during fetching the services",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
