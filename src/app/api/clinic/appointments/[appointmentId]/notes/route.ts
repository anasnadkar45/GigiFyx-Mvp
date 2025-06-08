import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const notesSchema = z.object({
  clinicNotes: z.string(),
})

interface RouteParams {
  params: {
    appointmentId: string
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

    const body = await request.json()
    const validatedData = notesSchema.parse(body)

    // Check if appointment exists and belongs to this clinic
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.appointmentId },
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    if (appointment.clinicId !== user.clinic.id) {
      return NextResponse.json({ error: "This appointment does not belong to your clinic" }, { status: 403 })
    }

    // Update appointment notes
    const updatedAppointment = await prisma.appointment.update({
      where: { id: params.appointmentId },
      data: {
        clinicNotes: validatedData.clinicNotes,
      },
    })

    return NextResponse.json({
      message: "Appointment notes updated successfully",
      appointment: updatedAppointment,
    })
  } catch (error) {
    console.error("Error updating appointment notes:", error)

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: "Failed to update appointment notes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
