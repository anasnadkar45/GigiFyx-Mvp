import { getUserData } from "@/app/utils/hooks";
import { redirect } from "next/navigation";
import React from "react";

const MainLayout = async({
    children,
}: {
    children: React.ReactNode;
}) => {
    const user = await getUserData()
    if(user.user?.role === "CLINIC_OWNER"){
        redirect("/clinic/dashboard")
    }
    return <div className="container mx-auto my-20">{children}</div>;
};

export default MainLayout;