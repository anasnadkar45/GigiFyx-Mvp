import { redirect } from "next/navigation";
import { prisma } from "./db";
import { auth } from "./auth";

export async function requireUser() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function getUserData() {
  const session = await auth();

  if (!session?.user?.email) {
    return { userId: null, user: null };
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      clinic: true,
      Appointments: true,
      Patient: true,
    },
  });

  return {
    userId: user?.id ?? null,
    user,
  };
}