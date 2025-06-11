import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { getUserData } from "@/app/utils/hooks"
import { type NextRequest, NextResponse } from "next/server"

// GET - Fetch all services for a clinic
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

// DELETE - Delete a specific service by ID
export async function DELETE(request: NextRequest) {
  const user = await getUserData()
  const { searchParams } = new URL(request.url)
  const serviceId = searchParams.get("id")

  if (!serviceId) {
    return NextResponse.json({ error: "Service ID is required" }, { status: 400 })
  }

  try {
    const deletedService = await prisma.service.delete({
      where: {
        id: serviceId,
        clinicId: user.user?.clinic?.id,
      },
    })
    return NextResponse.json({ message: "Service deleted", service: deletedService })
  } catch (error) {
    console.error("Error deleting service:", error)
    return NextResponse.json(
      {
        error: "Something went wrong during service deletion",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// PUT - Update a specific service by ID
export async function PUT(request: NextRequest) {
  const user = await getUserData()
  const body = await request.json()

  const { id, name, price, description, category, isActive } = body

  if (!id || !name || price == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const updatedService = await prisma.service.update({
      where: {
        id,
        clinicId: user.user?.clinic?.id,
      },
      data: {
        name,
        price,
        description,
        category,
        isActive,
      },
    })

    return NextResponse.json({ message: "Service updated", service: updatedService })
  } catch (error) {
    console.error("Error updating service:", error)
    return NextResponse.json(
      {
        error: "Something went wrong during service update",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
