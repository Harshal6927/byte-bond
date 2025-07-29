import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createFileRoute } from "@tanstack/react-router"
import { Activity, Gamepad2, Plus, Settings, Trophy, Users } from "lucide-react"

export const Route = createFileRoute("/_admin/manage")({
  component: ManagePage,
})

function ManagePage() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="font-bold text-3xl text-foreground">Admin Panel</h1>
        <p className="text-muted-foreground">Manage your ByteBond event and participants</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">127</div>
            <p className="text-muted-foreground text-xs">+12 from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Active Games</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">23</div>
            <p className="text-muted-foreground text-xs">8 pairs connecting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Connections Made</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">89</div>
            <p className="text-muted-foreground text-xs">+5 in last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Top Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">156</div>
            <p className="text-muted-foreground text-xs">by Alex Chen</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Event Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Event Management
            </CardTitle>
            <CardDescription>Configure event settings and questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="h-4 w-4" />
              Add New Event
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Settings className="h-4 w-4" />
              Manage Questions
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Activity className="h-4 w-4" />
              View Event Analytics
            </Button>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>Manage participants and their data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4" />
              View All Users
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Plus className="h-4 w-4" />
              Add User Manually
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Activity className="h-4 w-4" />
              Export User Data
            </Button>
          </CardContent>
        </Card>

        {/* Game Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Game Control
            </CardTitle>
            <CardDescription>Control active games and matches</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <Activity className="h-4 w-4" />
              View Active Games
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Settings className="h-4 w-4" />
              Game Settings
            </Button>
            <div className="flex gap-2">
              <Button className="flex-1" variant="outline" size="sm">
                Start Game
              </Button>
              <Button className="flex-1" variant="outline" size="sm">
                Stop Game
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports & Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Reports & Analytics
            </CardTitle>
            <CardDescription>View detailed analytics and reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Activity className="h-4 w-4" />
              Connection Analytics
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Settings className="h-4 w-4" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">12:34 PM</span>
              <span>New user registered: John Doe</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">12:31 PM</span>
              <span>Game completed between Sarah and Mike</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-muted-foreground">12:28 PM</span>
              <span>New connection formed: Alice & Bob</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">12:25 PM</span>
              <span>Question added to event: DevFest 2025</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
