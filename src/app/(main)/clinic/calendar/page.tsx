import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserData } from "@/app/utils/hooks"
import { WorkingHoursManager } from "@/components/clinic/calendar/working-hours-manager"

export default async function ClinicCalendarPage() {
  const user = await getUserData()

  if (!user.user?.clinic) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Clinic Not Found</CardTitle>
            <CardDescription>Unable to load clinic information</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendar & Working Hours</h1>
        <p className="text-muted-foreground">Manage your clinic's operating schedule and appointment availability</p>
      </div>

      <WorkingHoursManager />
    </div>
  )
}
