import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, FileCheck, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/app/utils/db"

export default async function AdminDashboard() {
  // Fetch pending clinic approvals
  const pendingClinics = await prisma.clinic.findMany({
    where: {
      status: "PENDING",
    },
    include: {
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  })

  // Fetch system stats
  const totalClinics = await prisma.clinic.count()
  const approvedClinics = await prisma.clinic.count({
    where: { status: "APPROVED" },
  })
  const totalUsers = await prisma.user.count()
  const totalPatients = await prisma.patient.count()
  const totalAppointments = await prisma.appointment.count()

  // Recent activity
  const recentClinics = await prisma.clinic.findMany({
    where: {
      status: "APPROVED",
    },
    include: {
      owner: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 5,
  })

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage the DentalCare platform</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/clinics">
            <Button variant="outline">
              <FileCheck className="h-4 w-4 mr-2" />
              Review Clinics
            </Button>
          </Link>
          <Link href="/admin/analytics">
            <Button>
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clinics</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClinics}</div>
            <p className="text-xs text-muted-foreground">{approvedClinics} approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">{totalPatients} patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{pendingClinics.length}</div>
            <p className="text-xs text-muted-foreground">require review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAppointments}</div>
            <p className="text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Clinic Approvals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Clinic Approvals</CardTitle>
              <CardDescription>Clinics waiting for approval</CardDescription>
            </div>
            <Link href="/admin/clinics">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {pendingClinics.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingClinics.map((clinic) => (
                <div key={clinic.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{clinic.name}</h3>
                      <p className="text-sm text-muted-foreground">Owner: {clinic.owner.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Submitted: {new Date(clinic.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      Pending
                    </Badge>
                    <Link href={`/admin/clinics/${clinic.id}`}>
                      <Button size="sm">Review</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Approved Clinics */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Approved Clinics</CardTitle>
          <CardDescription>Latest clinics added to the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {recentClinics.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No approved clinics yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentClinics.map((clinic) => (
                <div key={clinic.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{clinic.name}</h3>
                      <p className="text-sm text-muted-foreground">Owner: {clinic.owner.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Approved: {new Date(clinic.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Approved
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
