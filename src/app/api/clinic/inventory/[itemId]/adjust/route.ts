import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const adjustStockSchema = z.object({
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  reason: z.string().min(1, "Reason is required"),
})

export async function POST(request: NextRequest, { params }: { params: { itemId: string } }) {
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

    // Check if item exists and belongs to this clinic
    const existingItem = await prisma.inventoryItem.findUnique({
      where: {
        id: params.itemId,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    if (existingItem.clinicId !== user.clinic.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = adjustStockSchema.parse(body)

    // Calculate new stock level
    let newStock = existingItem.currentStock

    if (validatedData.type === "IN") {
      newStock += validatedData.quantity
    } else if (validatedData.type === "OUT") {
      newStock = Math.max(0, newStock - validatedData.quantity)
    } else if (validatedData.type === "ADJUSTMENT") {
      newStock = validatedData.quantity
    }

    // Update the inventory item
    const updatedItem = await prisma.inventoryItem.update({
      where: {
        id: params.itemId,
      },
      data: {
        currentStock: newStock,
      },
    })

    // Record the stock movement
    await prisma.stockMovement.create({
      data: {
        itemId: params.itemId,
        movementType: validatedData.type === "ADJUSTMENT" ? "IN" : validatedData.type,
        quantity:
          validatedData.type === "ADJUSTMENT"
            ? Math.abs(validatedData.quantity - existingItem.currentStock)
            : validatedData.quantity,
        reason: validatedData.reason,
        userId: user.id,
        previousStock: existingItem.currentStock,
        newStock: newStock,
      },
    })

    return NextResponse.json({
      message: "Stock adjusted successfully",
      item: updatedItem,
    })
  } catch (error) {
    console.error("Error adjusting stock:", error)

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
