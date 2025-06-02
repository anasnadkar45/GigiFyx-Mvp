"use client"
import { AppointmentBooking } from "@/app/components/patient/booking/appointment-booking"
import { Clinic } from "@/app/utils/types"
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

    if (loading) {
        return <div className="p-4">Loading clinics...</div>
    }

    if (error) {
        return <div className="p-4 text-red-500">Error: {error}</div>
    }

    return (
        // <div className="p-4">
        //     <h1 className="text-2xl font-bold mb-4">Approved Clinics</h1>
        //     {clinics.length === 0 ? (
        //         <p>No approved clinics found.</p>
        //     ) : (
        //         <div className="grid gap-4">
        //             {clinics.map((clinic) => (
        //                 <div key={clinic.id} className="border rounded-lg p-4">
        //                     <h2 className="text-xl font-semibold">{clinic.name}</h2>
        //                     <p className="text-gray-600">{clinic.description}</p>
        //                     <p className="text-sm text-gray-500">
        //                         <strong>Address:</strong> {clinic.address}
        //                     </p>
        //                     <p className="text-sm text-gray-500">
        //                         <strong>Phone:</strong> {clinic.phone}
        //                     </p>
        //                     <p className="text-sm text-gray-500">
        //                         <strong>Owner:</strong> {clinic.owner.name}
        //                     </p>
        //                 </div>
        //             ))}
        //         </div>
        //     )}
        // </div>
        <div className="min-h-screen bg-background">
            <AppointmentBooking />
        </div>
    )
}

export default ClinicsPage
