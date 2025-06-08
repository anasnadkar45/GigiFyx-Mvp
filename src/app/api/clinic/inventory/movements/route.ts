import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        clinic: true,
      },
    })

    if (!user || user.role !== "CLINIC_OWNER" || !user.clinic) {
      return NextResponse.json({ error: "Clinic owner access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const movements = await prisma.stockMovement.findMany({
      where: {
        item: {
          clinicId: user.clinic.id,
        },
      },
      include: {
        item: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    })

    const formattedMovements = movements.map((movement) => ({
      id: movement.id,
      itemId: movement.itemId,
      itemName: movement.item.name,
      type: movement.movementType,
      quantity: movement.quantity,
      reason: movement.reason || "",
      performedBy: movement.user.name || "Unknown",
      createdAt: movement.createdAt.toISOString(),
    }))

    return NextResponse.json({
      movements: formattedMovements,
    })
  } catch (error) {
    console.error("Error fetching stock movements:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
