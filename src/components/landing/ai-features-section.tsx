import { Brain, Sparkles, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function AIFeaturesSection() {
  return (
    <section className="py-16 px-4 bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">AI-Powered Dental Care</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Experience the future of dental care with our advanced AI features
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Symptom Checker</h3>
            <p className="text-gray-600 mb-6">
              Get instant preliminary assessment of your dental symptoms with AI guidance
            </p>
            <Link href="/patient/symptom-checker">
              <Button className="bg-blue-600 hover:bg-blue-700">Check Symptoms</Button>
            </Link>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Smart Booking</h3>
            <p className="text-gray-600 mb-6">
              Find the perfect clinic based on your symptoms, location, and preferences
            </p>
            <Link href="/patient/smart-booking">
              <Button className="bg-green-600 hover:bg-green-700">Find Best Clinic</Button>
            </Link>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Treatment Plans</h3>
            <p className="text-gray-600 mb-6">
              Clinics use AI to create comprehensive treatment plans tailored to your needs
            </p>
            <Link href="/clinic/treatment-plans">
              <Button className="bg-purple-600 hover:bg-purple-700">For Clinics</Button>
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Our AI features are designed to enhance your dental care experience, not replace professional advice. Always
            consult with a qualified dentist for proper diagnosis and treatment.
          </p>
        </div>
      </div>
    </section>
  )
}
