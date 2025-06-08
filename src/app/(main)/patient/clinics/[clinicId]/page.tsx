import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, Clock, MapPin, Phone, Star, User, Users } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/app/utils/db"
import { notFound } from "next/navigation"
import { Topbar } from "@/components/global/Topbar"
import { Wrapper } from "@/components/global/Wrapper"
import { Badge } from "@/components/ui/badge"
import { ClinicBookingFlow } from "@/components/patient/clinic-booking-flow"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface PageProps {
  params: {
    clinicId: string
  }
  searchParams: {
    serviceId?: string
  }
}

export default async function BookAppointmentPage({ params, searchParams }: PageProps) {
  const clinic = await prisma.clinic.findUnique({
    where: {
      id: params.clinicId,
      status: "APPROVED",
    },
    include: {
      services: {
        where: {
          isActive: "ACTIVE",
        },
        orderBy: {
          category: "asc",
        },
      },
      doctors: true,
      reviews: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
      workingHours: true,
      owner: true,
    },
  })

  if (!clinic) {
    notFound()
  }

  // Calculate average rating
  const averageRating =
    clinic.reviews.length > 0
      ? clinic.reviews.reduce((sum, review) => sum + review.rating, 0) / clinic.reviews.length
      : 0

  return (
    <>
      <Topbar>
        <Link href={`/patient/search`} className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Back to search</span>
        </Link>
      </Topbar>
      <Wrapper>
        <div className="space-y-8">
          {/* Clinic Header */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Clinic Image */}
            <div className="md:w-1/3">
              <div className="h-64 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-6xl">🏥</span>
              </div>
            </div>

            {/* Clinic Info */}
            <div className="md:w-2/3 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{clinic.name}</h1>
                  {clinic.reviews.length > 0 && (
                    <div className="flex items-center mb-3">
                      <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                      <span className="font-medium text-lg">{averageRating.toFixed(1)}</span>
                      <span className="text-muted-foreground ml-2">({clinic.reviews.length} reviews)</span>
                    </div>
                  )}
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {clinic.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-5 w-5 mr-3" />
                  <span>{clinic.address}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Phone className="h-5 w-5 mr-3" />
                  <span>{clinic.phone}</span>
                </div>
              </div>

              <p className="text-muted-foreground">{clinic.description}</p>

              {/* Quick Stats */}
              <div className="flex gap-6 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{clinic.services.length}</div>
                  <div className="text-sm text-muted-foreground">Services</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{clinic.doctors.length}</div>
                  <div className="text-sm text-muted-foreground">Doctors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{clinic.reviews.length}</div>
                  <div className="text-sm text-muted-foreground">Reviews</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabbed Content */}
          <Tabs defaultValue="booking" className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="booking" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Booking</span>
              </TabsTrigger>
              <TabsTrigger value="doctors" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Doctors</span>
              </TabsTrigger>
              <TabsTrigger value="hours" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Working Hours</span>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>Reviews</span>
              </TabsTrigger>
            </TabsList>

            {/* Booking Tab */}
            <TabsContent value="booking" className="space-y-4">
              <ClinicBookingFlow
                clinic={{
                  id: clinic.id,
                  name: clinic.name,
                  address: clinic.address,
                  phone: clinic.phone,
                  email: clinic.owner.email,
                  description: clinic.description,
                  services: clinic.services.map((service) => ({
                    id: service.id,
                    name: service.name,
                    price: service.price,
                    category: service.category,
                    description: service.description,
                    duration: service.duration,
                    preparation: service.preparation,
                  })),
                  doctors: clinic.doctors.map((doctor) => ({
                    id: doctor.id,
                    name: doctor.name,
                    specialization: doctor.specialization,
                    bio: doctor.bio,
                    experience: doctor.experience,
                  })),
                  workingHours: clinic.workingHours.map((wh) => ({
                    day: wh.day,
                    openTime: wh.openTime,
                    closeTime: wh.closeTime,
                    duration: wh.duration,
                    breakStartTime: wh.breakStartTime,
                    breakEndTime: wh.breakEndTime,
                  })),
                }}
              />
            </TabsContent>

            {/* Doctors Tab */}
            <TabsContent value="doctors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Our Doctors</CardTitle>
                  <CardDescription>Meet our qualified healthcare professionals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {clinic.doctors.length > 0 ? (
                    clinic.doctors.map((doctor) => (
                      <div key={doctor.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={doctor.image || "/placeholder.svg"} />
                          <AvatarFallback className="bg-primary/10">
                            <User className="h-6 w-6 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium">{doctor.name}</h4>
                          <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                          {doctor.experience && (
                            <p className="text-xs text-muted-foreground">{doctor.experience} years experience</p>
                          )}
                          {doctor.bio && <p className="text-sm mt-1">{doctor.bio}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No doctors available at this clinic.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Working Hours Tab */}
            <TabsContent value="hours" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Working Hours</CardTitle>
                  <CardDescription>When you can visit us</CardDescription>
                </CardHeader>
                <CardContent>
                  {clinic.workingHours.length > 0 ? (
                    <div className="space-y-2">
                      {clinic.workingHours.map((wh) => (
                        <div key={wh.day} className="flex justify-between items-center p-2 border-b last:border-0">
                          <div className="font-medium">{wh.day}</div>
                          <div className="text-muted-foreground">
                            {wh.openTime} - {wh.closeTime}
                            {wh.breakStartTime && wh.breakEndTime && (
                              <span className="ml-2 text-xs">
                                (Break: {wh.breakStartTime} - {wh.breakEndTime})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No working hours information available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Reviews</CardTitle>
                  <CardDescription>What our patients are saying</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {clinic.reviews.length > 0 ? (
                    clinic.reviews.map((review) => (
                      <div key={review.id} className="space-y-2 p-3 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{review.user.name}</span>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm">{review.rating}</span>
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No reviews yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Wrapper>
    </>
  )
}
