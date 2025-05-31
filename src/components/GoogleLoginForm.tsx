// components/auth/GoogleLoginForm.tsx
"use client";

import { signIn } from "next-auth/react";
import { GoogleAuthButton } from "@/components/global/Buttons";

export default function GoogleLoginForm() {
    return (
        <form onSubmit={(e) => {
            e.preventDefault();
            signIn("google");
        }}>
            <GoogleAuthButton />
        </form>
    );
}
