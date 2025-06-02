import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export const serviceSchema = z.object({
  name: z.string().min(1, { message: "Service name is required" }),

  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters long" })
    .optional()
    .or(z.literal("")), // allows empty string but doesn't trigger min length

  price: z
    .number({ invalid_type_error: "Price must be a number" })
    .nonnegative({ message: "Price must be 0 or more" })
    .optional(),

  category: z.string().min(1, { message: "Category is required" }),

  isActive: z.enum(["ACTIVE", "INACTIVE"]).optional(),

  clinicId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    console.log("Received data:", body)

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        clinic: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.role !== "CLINIC_OWNER") {
      return NextResponse.json({ error: "User is not clinic owner" }, { status: 404 })
    }

    if (!user.clinic) {
      return NextResponse.json({ error: "User does not have a clinic" }, { status: 400 })
    }

    const validatedData = serviceSchema.parse(body)

    const newService = await prisma.service.create({
      data: {
        name: validatedData.name,
        description: validatedData.description ?? "",
        category: validatedData.category,
        price: validatedData.price || null,
        isActive: validatedData.isActive,
        clinicId: user.clinic?.id, // Use the clinic ID from the authenticated user
      },
    })
    return NextResponse.json({ message: "Service created successfully" })
  } catch (error) {
    console.error("Detailed onboarding error:", error)

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
        error: "Something went wrong during service creation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
