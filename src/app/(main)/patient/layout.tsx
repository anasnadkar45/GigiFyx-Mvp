import { Sidebar } from "@/app/components/patient/Sidebar";
import { getUserData } from "@/app/utils/hooks";
import { ScrollArea } from "@/components/ui/scroll-area";
import { redirect } from "next/navigation";
import React from "react";

const MainLayout = async ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const user = await getUserData()
    if (user.user?.role === "CLINIC_OWNER") {
        redirect("/clinic/dashboard")
    }
    return (
        <div className="w-screen h-screen flex custom-scrollbar scroll-smooth">
            <div className="m-3 hidden md:flex flex-col">
                <Sidebar />
            </div>
            <div className="w-full">
                <ScrollArea className="h-[100vh] md:h-[100vh]  border-l-2">
                    {children}
                </ScrollArea>
            </div>
            {/* <BottomNav /> */}
        </div>
    );
};

export default MainLayout;