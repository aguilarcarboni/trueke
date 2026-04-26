import Link from "next/link"
import { ArrowLeft, Shield } from "lucide-react"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/auth"
import { getAdminUserDetails } from "@/app/actions/admin"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const STATUS_STYLES: Record<string, string> = {
  active:   "bg-success/15 text-success border-success/20",
  inactive: "bg-muted/60 text-muted-foreground border-border",
  banned:   "bg-destructive/10 text-destructive border-destructive/20",
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-3 text-center">
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

type PageProps = { params: Promise<{ id: string }> }

export default async function AdminUserPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.is_admin) redirect("/dashboard")

  const { id } = await params
  const result = await getAdminUserDetails(id)

  if (result.error === "User not found.") notFound()
  if (result.error) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="flex flex-col flex-1 min-w-0 lg:ml-64">
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="mx-auto max-w-5xl space-y-6">
              <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-foreground">
                <Link href="/dashboard"><ArrowLeft className="h-4 w-4" />Back to Dashboard</Link>
              </Button>
              <p className="text-sm text-destructive">{result.error}</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const u = result.data!
  const avgRatingLabel = u.avg_rating !== null ? `${u.avg_rating} / 5 (${u.total_ratings})` : "No ratings"
  const banLabel =
    u.status === "banned" && u.end_ban_date_time
      ? new Date(u.end_ban_date_time).getFullYear() >= 9999
        ? "Permanent"
        : new Date(u.end_ban_date_time).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
      : null

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex flex-col flex-1 min-w-0 lg:ml-64">
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-5xl space-y-6">
            <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-foreground">
              <Link href="/dashboard"><ArrowLeft className="h-4 w-4" />Back to Dashboard</Link>
            </Button>

            <Card>
              <CardContent className="pt-6 space-y-5">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                {u.profile_picture_url && <AvatarImage src={u.profile_picture_url} alt={u.username} />}
                <AvatarFallback className="text-lg">
                  {u.first_name.charAt(0)}{u.last_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-card-foreground">{u.first_name} {u.last_name}</h1>
                  {u.is_admin && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Shield className="h-3 w-3" />Admin
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">@{u.username}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
            </div>
            <Badge variant="outline" className={`text-sm ${STATUS_STYLES[u.status] ?? ""}`}>
              {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatBox label="Completed trades"  value={String(u.completed_trades)} />
            <StatBox label="Active items"       value={String(u.active_items)} />
            <StatBox label="Avg. rating"        value={avgRatingLabel} />
            <StatBox label="Reports received"   value={String(u.reports_received)} />
            <StatBox label="Reports filed"      value={String(u.reports_filed)} />
            <StatBox label="Member since"       value={new Date(u.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short" })} />
          </div>

          {/* Bio */}
          {u.bio && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-card-foreground mb-1">Bio</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{u.bio}</p>
              </div>
            </>
          )}

          {/* Ban details */}
          {banLabel && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-destructive mb-1">Ban expires</h3>
                <p className="text-sm text-muted-foreground">{banLabel}</p>
              </div>
            </>
          )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
