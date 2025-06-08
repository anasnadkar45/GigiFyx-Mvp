import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const inventoryItemSchema = z.object({
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
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const whereClause: any = {
      clinicId: user.clinic.id,
    }

    if (category && category !== "all") {
      whereClause.category = category
    }

    if (status) {
      if (status === "LOW_STOCK") {
        // Find items where current stock is less than or equal to minimum stock but greater than 0
        const items = await prisma.inventoryItem.findMany({
          where: {
            ...whereClause,
            currentStock: {
              gt: 0,
            },
          },
          include: {
            supplier: true,
          },
        })

        const lowStockItems = items.filter((item) => item.currentStock <= item.minimumStock)

        return NextResponse.json({
          items: lowStockItems.map((item) => formatInventoryItem(item)),
          movements: [],
        })
      } else if (status === "OUT_OF_STOCK") {
        whereClause.currentStock = 0
      } else if (status === "IN_STOCK") {
        // Find items where current stock is greater than minimum stock
        const items = await prisma.inventoryItem.findMany({
          where: whereClause,
          include: {
            supplier: true,
          },
        })

        const inStockItems = items.filter((item) => item.currentStock > item.minimumStock)

        return NextResponse.json({
          items: inStockItems.map((item) => formatInventoryItem(item)),
          movements: [],
        })
      }
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const items = await prisma.inventoryItem.findMany({
      where: whereClause,
      include: {
        supplier: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    // Get recent stock movements
    const recentMovements = await prisma.stockMovement.findMany({
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
      take: 20,
    })

    // Format the data for the frontend
    const formattedItems = items.map((item) => formatInventoryItem(item))

    const formattedMovements = recentMovements.map((movement) => ({
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
      items: formattedItems,
      movements: formattedMovements,
    })
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    console.log("Received inventory item data:", body)

    const validatedData = inventoryItemSchema.parse(body)
    console.log("Validated data:", validatedData)

    // Create the inventory item
    const item = await prisma.inventoryItem.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        category: validatedData.category,
        sku: validatedData.sku || null,
        currentStock: validatedData.currentStock,
        minimumStock: validatedData.minimumStock,
        maximumStock: validatedData.maximumStock,
        unit: validatedData.unit,
        unitCost: validatedData.unitCost || null,
        unitPrice: validatedData.unitPrice || null,
        expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
        clinicId: user.clinic.id,
        supplierId: validatedData.supplierId || null,
      },
      include: {
        supplier: true,
      },
    })

    console.log("Created inventory item:", item)

    // Record initial stock movement if there's initial stock
    if (validatedData.currentStock > 0) {
      const stockMovement = await prisma.stockMovement.create({
        data: {
          itemId: item.id,
          movementType: "IN",
          quantity: validatedData.currentStock,
          reason: "Initial stock",
          userId: user.id,
          previousStock: 0,
          newStock: validatedData.currentStock,
        },
      })
      console.log("Created stock movement:", stockMovement)
    }

    return NextResponse.json({
      message: "Inventory item added successfully",
      item: formatInventoryItem(item),
    })
  } catch (error) {
    console.error("Error creating inventory item:", error)

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      console.error("Validation error:", firstError)
      return NextResponse.json(
        {
          error: firstError.message,
          field: firstError.path.join("."),
          details: error.errors,
        },
        { status: 400 },
      )
    }

    if (error instanceof Error) {
      console.error("Database error:", error.message)
      return NextResponse.json(
        {
          error: "Failed to create inventory item",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

// Helper function to format inventory items consistently
function formatInventoryItem(item: any) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    currentStock: item.currentStock,
    minStock: item.minimumStock,
    maxStock: item.maximumStock,
    unit: item.unit,
    costPerUnit: item.unitCost || 0,
    supplier: item.supplier?.name || "Unknown",
    expiryDate: item.expiryDate ? item.expiryDate.toISOString() : undefined,
    lastRestocked: item.updatedAt.toISOString(),
    status: item.currentStock <= 0 ? "OUT_OF_STOCK" : item.currentStock <= item.minimumStock ? "LOW_STOCK" : "IN_STOCK",
  }
}
