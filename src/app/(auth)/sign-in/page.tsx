import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { redirect } from "next/navigation";
import { unstable_noStore } from "next/cache";
import { auth } from "@/app/utils/auth";
import GoogleLoginForm from "@/components/GoogleLoginForm";
export default async function SignIn() {
    unstable_noStore()
    const session = await auth();

    if (session?.user?.email) {
        redirect("/onboarding");
    }
    return (
        <>
            <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[size:6rem_4rem]">
            </div>
            <div className="flex h-screen w-full items-center justify-center px-4">
                <Card className="max-w-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl">Login</CardTitle>
                        <CardDescription>
                            Enter your email below to login in to your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 mt-5">
                            <GoogleLoginForm />
                        </div>

                    </CardContent>
                </Card>
            </div>
        </>
    );
}