import { prisma } from "@/app/utils/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, respose: NextResponse) {
    if (request.method === "GET") {
        try {
            const clinics = await prisma.clinic.findMany({
                where: {
                    status: "APPROVED"
                },
                orderBy: {
                    createdAt: "desc"
                }
            })

            return NextResponse.json(clinics)
        } catch (error) {
            console.log(error)
            return NextResponse.json(
                {
                    error: "Something went wrong during fetching the clinics",
                    details: error instanceof Error ? error.message : "Unknown error",
                },
                { status: 500 },
            )
        }
    }
}