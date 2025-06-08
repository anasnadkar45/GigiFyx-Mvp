import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const updateItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.enum(["MEDICATION", "EQUIPMENT", "SUPPLIES", "MATERIALS", "INSTRUMENTS", "CONSUMABLES"]),
  sku: z.string().optional(),
  currentStock: z.number().min(0),
  minimumStock: z.number().min(0),
  maximumStock: z.number().min(0),
  unit: z.string().min(1, "Unit is required"),
  unitCost: z.number().optional(),
  unitPrice: z.number().optional(),
  expiryDate: z.string().optional(),
  supplierId: z.string().optional(),
})

export async function GET(request: NextRequest, { params }: { params: { itemId: string } }) {
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

    const item = await prisma.inventoryItem.findUnique({
      where: {
        id: params.itemId,
      },
      include: {
        supplier: true,
        stockMovements: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    if (item.clinicId !== user.clinic.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error("Error fetching inventory item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { itemId: string } }) {
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
    const validatedData = updateItemSchema.parse(body)

    const item = await prisma.inventoryItem.update({
      where: {
        id: params.itemId,
      },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        sku: validatedData.sku,
        currentStock: validatedData.currentStock,
        minimumStock: validatedData.minimumStock,
        maximumStock: validatedData.maximumStock,
        unit: validatedData.unit,
        unitCost: validatedData.unitCost,
        unitPrice: validatedData.unitPrice,
        expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
        supplierId: validatedData.supplierId,
      },
    })

    // Record stock movement if quantity changed
    if (existingItem.currentStock !== validatedData.currentStock) {
      const difference = validatedData.currentStock - existingItem.currentStock
      await prisma.stockMovement.create({
        data: {
          itemId: params.itemId,
          movementType: difference > 0 ? "IN" : "OUT",
          quantity: Math.abs(difference),
          reason: "Manual adjustment",
          userId: user.id,
          previousStock: existingItem.currentStock,
          newStock: validatedData.currentStock,
        },
      })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error("Error updating inventory item:", error)

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { itemId: string } }) {
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

    await prisma.inventoryItem.delete({
      where: {
        id: params.itemId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting inventory item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
