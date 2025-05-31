"use client"

import { useState } from "react"
import {  useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Building2, Shield } from "lucide-react"
const OnBoardingForm = () => {
    const router = useRouter()
    const [selectedRole, setSelectedRole] = useState<string | null>(null)

    const handleRoleSelect = (role: string) => {
        setSelectedRole(role)
    }

    const handleContinue = () => {
        if (selectedRole === "patient") {
            router.push("/sign-up?role=PATIENT")
        } else if (selectedRole === "clinic") {
            router.push("/sign-up?role=CLINIC")
        }
    }

    const roles = [
        {
            id: "patient",
            title: "Patient",
            description: "Book dental appointments and manage your oral health",
            icon: User,
            features: [
                "Search and book appointments",
                "View appointment history",
                "Manage your profile",
                "Receive appointment reminders",
            ],
        },
        {
            id: "clinic",
            title: "Dental Clinic",
            description: "Manage your clinic and connect with patients",
            icon: Building2,
            features: [
                "Manage clinic profile",
                "Handle appointment bookings",
                "Manage doctors and services",
                "View analytics and reports",
            ],
        },
    ]

    return (
        <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-4">Welcome to GigiFyx</h1>
                    <p className="text-xl text-white/90">Choose your role to get started</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {roles.map((role) => {
                        const Icon = role.icon
                        const isSelected = selectedRole === role.id

                        return (
                            <Card
                                key={role.id}
                                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${isSelected ? "ring-2 ring-primary bg-primary/5 border-primary" : "hover:border-primary/50"
                                    }`}
                                onClick={() => handleRoleSelect(role.id)}
                            >
                                <CardHeader className="text-center">
                                    <div
                                        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isSelected ? "bg-primary text-white" : "bg-primary/10 text-primary"
                                            }`}
                                    >
                                        <Icon className="h-8 w-8" />
                                    </div>
                                    <CardTitle className="text-xl">{role.title}</CardTitle>
                                    <CardDescription>{role.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {role.features.map((feature, index) => (
                                            <li key={index} className="flex items-center text-sm">
                                                <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    {isSelected && <Badge className="w-full justify-center mt-4 bg-primary">Selected</Badge>}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <div className="text-center">
                    <Button
                        size="lg"
                        onClick={handleContinue}
                        disabled={!selectedRole}
                        className="bg-white text-primary hover:bg-white/90 px-8"
                    >
                        Continue
                    </Button>
                    <p className="text-white/70 text-sm mt-4">
                        Already have an account?{" "}
                        <button onClick={() => router.push("/auth/signin")} className="text-white underline hover:no-underline">
                            Sign in here
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default OnBoardingForm