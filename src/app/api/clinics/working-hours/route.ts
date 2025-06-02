import { prisma } from "@/app/utils/db"
import { getUserData } from "@/app/utils/hooks"
import type { DayOfWeek } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const singleWorkingHourSchema = z.object({
  openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
  day: z.string().min(1, { message: "Day is required" }),
  duration: z.number(),
})

export const workingHoursSchema = z.object({
  workingHours: z.array(singleWorkingHourSchema).min(1, "At least one working day is required"),
})

// GET - Fetch existing working hours
export async function GET() {
  const user = await getUserData()

  if (!user?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    if (user.user.role !== "CLINIC_OWNER") {
      return NextResponse.json({ error: "User is not clinic owner" }, { status: 403 })
    }

    if (!user.user.clinic) {
      return NextResponse.json({ error: "User does not have a clinic" }, { status: 400 })
    }

    const workingHours = await prisma.clinicWorkingHours.findMany({
      where: {
        clinicId: user.user.clinic.id,
      },
      orderBy: {
        day: "asc",
      },
    })

    return NextResponse.json({ workingHours })
  } catch (error) {
    console.error("Error fetching working hours:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch working hours",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST - Create/Update working hours
export async function POST(request: NextRequest) {
  const user = await getUserData()

  if (!user?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    console.log("Received data:", body)

    if (user.user.role !== "CLINIC_OWNER") {
      return NextResponse.json({ error: "User is not clinic owner" }, { status: 403 })
    }

    if (!user.user.clinic) {
      return NextResponse.json({ error: "User does not have a clinic" }, { status: 400 })
    }

    const validatedData = workingHoursSchema.parse(body)

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Delete all previous working hours for this clinic
      await tx.clinicWorkingHours.deleteMany({
        where: {
          clinicId: user.user?.clinic?.id,
        },
      })

      // Create all new working hours
      const newWorkingHours = await tx.clinicWorkingHours.createMany({
        data: validatedData.workingHours.map((hour) => ({
          clinicId: user.user?.clinic?.id,
          day: hour.day as DayOfWeek,
          openTime: hour.openTime,
          closeTime: hour.closeTime,
          duration: hour.duration,
        })),
      })

      return newWorkingHours
    })

    revalidatePath("/clinic/calendar")

    return NextResponse.json({
      message: "Working hours saved successfully",
      count: result.count,
    })
  } catch (error) {
    console.error("Detailed working hours error:", error)

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    // Handle other Prisma errors
    if (error instanceof Error && error.message.includes("Invalid")) {
      return NextResponse.json({ error: "Invalid data provided" }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: "Something went wrong during working hours creation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
