// app/layouts/MainLayout.tsx
import React from "react";
import { getUserData } from "@/app/utils/hooks";
import { redirect } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar } from "@/app/components/clinic/Sidebar";

const MainLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const user = await getUserData();

  if (user.user?.role === "PATIENT") {
    redirect("/patient/dashboard");
  }

  return (
    <div className="w-screen h-screen flex custom-scrollbar scroll-smooth">
      {/* Sidebar handles internal collapse state */}
      <Sidebar />

      {/* Main Content area */}
      <div className="flex-1">
        <ScrollArea className="h-screen border-l-2">
          {children}
        </ScrollArea>
      </div>
    </div>
  );
};

export default MainLayout;
