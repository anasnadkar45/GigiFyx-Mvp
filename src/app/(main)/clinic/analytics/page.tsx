"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, TrendingDown, Users, Calendar, DollarSign, Star, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"

interface AnalyticsData {
  appointments: {
    total: number
    completed: number
    cancelled: number
    noShow: number
    trend: number
  }
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
    trend: number
  }
  patients: {
    total: number
    new: number
    returning: number
    trend: number
  }
  services: {
    popular: Array<{ name: string; count: number; revenue: number }>
    performance: Array<{ name: string; satisfaction: number }>
  }
  timeSlots: Array<{ time: string; bookings: number }>
  monthlyData: Array<{ month: string; appointments: number; revenue: number }>
}

export default function ClinicAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [timeRange, setTimeRange] = useState("30")
  const [selectedMetric, setSelectedMetric] = useState("appointments")

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clinic/analytics?days=${timeRange}`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setAnalytics(data)
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast.error(`Failed to load analytics data: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const exportExcel = async () => {
    try {
      setExporting(true)
      const response = await fetch(`/api/clinic/analytics/export?days=${timeRange}`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `clinic-analytics-${timeRange}days.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Excel report downloaded successfully")
    } catch (error) {
      console.error("Error exporting report:", error)
      toast.warning(`Could not export Excel report: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setExporting(false)
    }
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Failed to load analytics data</p>
          <Button onClick={fetchAnalytics} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Insights into your clinic's performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportExcel} variant="outline" disabled={exporting}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {exporting ? "Exporting..." : "Export Excel"}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.appointments.total}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analytics.appointments.trend > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={analytics.appointments.trend > 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(analytics.appointments.trend)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {analytics.revenue.total.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analytics.revenue.trend > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={analytics.revenue.trend > 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(analytics.revenue.trend)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.patients.total}</div>
            <div className="text-xs text-muted-foreground">
              {analytics.patients.new} new, {analytics.patients.returning} returning
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <div className="text-xs text-muted-foreground">Based on patient reviews</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>Appointments and revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="appointments" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appointment Status Distribution</CardTitle>
                <CardDescription>Breakdown of appointment outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Completed", value: analytics.appointments.completed },
                        { name: "Cancelled", value: analytics.appointments.cancelled },
                        { name: "No Show", value: analytics.appointments.noShow },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: "Completed", value: analytics.appointments.completed },
                        { name: "Cancelled", value: analytics.appointments.cancelled },
                        { name: "No Show", value: analytics.appointments.noShow },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Popular Services</CardTitle>
                <CardDescription>Most booked services by volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.services.popular.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Performance</CardTitle>
                <CardDescription>Patient satisfaction by service</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.services.performance.map((service, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{service.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${service.satisfaction}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">{service.satisfaction}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Peak Hours Analysis */}
        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Peak Hours Analysis</CardTitle>
              <CardDescription>Busiest times for appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.timeSlots}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
