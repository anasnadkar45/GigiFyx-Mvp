import { prisma } from "@/app/utils/db";
import { type NextRequest, NextResponse } from "next/server";

// Fetch clinics and services from database
const getClinics = async () => {
  return prisma.clinic.findMany({
    select: {
      id: true,
      address: true,
      city: true,
    },
  });
};

const getServices = async () => {
  return prisma.service.findMany({
    select: {
      id: true,
      name: true,
    },
  });
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const type = searchParams.get("type"); // 'location' or 'service'

  if (!query || query.trim().length < 1) {
    return NextResponse.json([]);
  }

  const lowercaseQuery = query.toLowerCase();
  let suggestions: { id: string; name: string; type: string }[] = [];

  if (type === "location") {
    const clinics = await getClinics();

    suggestions = clinics
      .filter(
        (clinic) =>
          clinic.address.toLowerCase().includes(lowercaseQuery) ||
          (clinic.city && clinic.city.toLowerCase().includes(lowercaseQuery))
      )
      .slice(0, 8)
      .map((clinic, index) => ({
        id: `location-${clinic.id}`,
        name: `${clinic.address}${clinic.city ? `, ${clinic.city}` : ""}`,
        type: "location",
      }));
  } else if (type === "service") {
    const services = await getServices();

    suggestions = services
      .filter((service) =>
        service.name.toLowerCase().includes(lowercaseQuery)
      )
      .slice(0, 8)
      .map((service) => ({
        id: `service-${service.id}`,
        name: service.name,
        type: "service",
      }));
  }

  return NextResponse.json(suggestions);
}
