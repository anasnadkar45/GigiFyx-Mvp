import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const clinics = await prisma.clinic.findMany({
      where: {
        status: "APPROVED",
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ clinics })
  } catch (error) {
    console.error("Error fetching clinics:", error)
    return NextResponse.json(
      {
        error: "Something went wrong during fetching the clinics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
