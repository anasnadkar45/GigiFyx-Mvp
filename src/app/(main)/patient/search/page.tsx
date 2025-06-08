"use client"
import { AppointmentBooking } from "@/components/patient/appointment-booking"
import { Clinic } from "@/app/utils/types"
import { Topbar, TopbarTitle } from "@/components/global/Topbar"
import { Wrapper } from "@/components/global/Wrapper"
import { useEffect, useState } from "react"

const ClinicsPage = () => {
    const [clinics, setClinics] = useState<Clinic[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchClinics() {
            try {
                setLoading(true)
                const res = await fetch("/api/clinics/list")

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`)
                }

                const data = await res.json()

                if (data.error) {
                    throw new Error(data.error)
                }

                if (data.clinics) {
                    setClinics(data.clinics)
                }
            } catch (err) {
                console.error("Error fetching clinics:", err)
                setError(err instanceof Error ? err.message : "Failed to fetch clinics")
            } finally {
                setLoading(false)
            }
        }

        fetchClinics()
    }, [])

    if (error) {
        return <div className="p-4 text-red-500">Error: {error}</div>
    }

    return (
        <>
            <Topbar>
                <TopbarTitle>
                    Search an closest clinic
                </TopbarTitle>
            </Topbar>
            <Wrapper>
                <AppointmentBooking />
            </Wrapper>
        </>
    )
}

export default ClinicsPage
