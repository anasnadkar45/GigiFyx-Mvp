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
  const user = await prisma.user.findUnique({
    where: {
      id: session?.user?.id
    },
    include:{
      clinic:true,
      Appointments:true,
      Patient:true,
    }
  })
  return {
    userId: session?.user?.id,
    user
  }
}