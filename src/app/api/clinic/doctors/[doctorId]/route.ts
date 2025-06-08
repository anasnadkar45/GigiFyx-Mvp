import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const doctorUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  specialization: z.string().min(1, "Specialization is required"),
  bio: z.string().optional(),
  experience: z.number().min(0).optional(),
  image: z.string().url().optional().or(z.literal("")),
})

interface RouteParams {
  params: {
    doctorId: string
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        clinic: true,
      },
    })

    if (!user || user.role !== "CLINIC_OWNER" || !user.clinic) {
      return NextResponse.json({ error: "Clinic owner access required" }, { status: 403 })
    }

    // Check if doctor exists and belongs to this clinic
    const doctor = await prisma.doctor.findUnique({
      where: { id: params.doctorId },
    })

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 })
    }

    if (doctor.clinicId !== user.clinic.id) {
      return NextResponse.json({ error: "This doctor does not belong to your clinic" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = doctorUpdateSchema.parse(body)

    const updatedDoctor = await prisma.doctor.update({
      where: { id: params.doctorId },
      data: {
        name: validatedData.name,
        specialization: validatedData.specialization,
        bio: validatedData.bio,
        experience: validatedData.experience,
        image: validatedData.image || null,
      },
    })

    return NextResponse.json({
      message: "Doctor updated successfully",
      doctor: updatedDoctor,
    })
  } catch (error) {
    console.error("Error updating doctor:", error)

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: "Failed to update doctor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        clinic: true,
      },
    })

    if (!user || user.role !== "CLINIC_OWNER" || !user.clinic) {
      return NextResponse.json({ error: "Clinic owner access required" }, { status: 403 })
    }

    // Check if doctor exists and belongs to this clinic
    const doctor = await prisma.doctor.findUnique({
      where: { id: params.doctorId },
    })

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 })
    }

    if (doctor.clinicId !== user.clinic.id) {
      return NextResponse.json({ error: "This doctor does not belong to your clinic" }, { status: 403 })
    }

    await prisma.doctor.delete({
      where: { id: params.doctorId },
    })

    return NextResponse.json({
      message: "Doctor deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting doctor:", error)
    return NextResponse.json(
      {
        error: "Failed to delete doctor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
