import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserData } from "@/app/utils/hooks"
import { WorkingHoursManager } from "@/components/clinic/calendar/working-hours-manager"
import { Topbar, TopbarContent, TopbarDescription, TopbarTitle } from "@/components/global/Topbar"
import { Wrapper } from "@/components/global/Wrapper"

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
    <div>
      <Topbar>
        <TopbarContent>
          <TopbarTitle>Calendar & Working Hours</TopbarTitle>
          <TopbarDescription>Manage your clinic's operating schedule and appointment availability</TopbarDescription>
        </TopbarContent>
      </Topbar>

      <Wrapper>
        <WorkingHoursManager />
      </Wrapper>
    </div>
  )
}
