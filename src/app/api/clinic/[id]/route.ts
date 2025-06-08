import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    if (!user || user.role !== "CLINIC_OWNER") {
      return NextResponse.json({ error: "Clinic owner access required" }, { status: 403 })
    }

    if (!user.clinic || user.clinic.id !== params.id) {
      return NextResponse.json({ error: "Clinic not found or access denied" }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, address, city, state, zipCode, phone, email, website, status } = body

    // Update clinic information
    const updatedClinic = await prisma.clinic.update({
      where: { id: params.id },
      data: {
        name,
        description,
        address,
        city,
        state,
        zipCode,
        phone,
        email,
        website,
        status: status , // Reset to pending for re-review
        updatedAt: new Date(),
      },
    })

    // Create notification for resubmission
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "CLINIC_UPDATE",
        title: "Application Resubmitted",
        message: `Your clinic "${name}" has been updated and resubmitted for verification. Our admin team will review your application again.`,
        isRead: false,
      },
    })

    return NextResponse.json({
      clinic: updatedClinic,
      message: "Clinic updated successfully and resubmitted for review",
    })
  } catch (error) {
    console.error("Error updating clinic:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
