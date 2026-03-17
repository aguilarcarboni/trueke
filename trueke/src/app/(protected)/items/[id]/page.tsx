import Link from "next/link"
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin, Plus, UserRound } from "lucide-react"
import { getItemDetails, type ItemDetailsResponse } from "@/app/actions/item"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const conditionLabel: Record<string, string> = {
  new: "New",
  "like new": "Like New",
  used: "Used",
  "heavily used": "Heavily Used",
  broken: "Broken",
}

const conditionStyles: Record<string, string> = {
  new: "bg-success/15 text-success border-success/20",
  "like new": "bg-primary/15 text-primary border-primary/20",
  used: "bg-warning/20 text-warning-foreground border-warning/25",
  "heavily used": "bg-accent/15 text-accent border-accent/25",
  broken: "bg-destructive/10 text-destructive border-destructive/20",
}

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  active: "bg-success/15 text-success border-success/20",
  contested: "bg-warning/20 text-warning-foreground border-warning/25",
  traded: "bg-primary/15 text-primary border-primary/20",
  deleted: "bg-destructive/10 text-destructive border-destructive/20",
}

function formatLabel(value: string) {
  return value
    .split(/[\s_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not provided"
  }

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatAddress(address: ItemDetailsResponse["address"]) {
  if (!address) {
    return "No address assigned to this item yet."
  }

  const line = [address.address_line1, address.address_line2].filter(Boolean).join(", ")
  const locality = [address.muni_district, address.canton_city, address.province_state]
    .filter(Boolean)
    .join(", ")

  return [line, locality, `${address.country_code} ${address.zip_code}`].filter(Boolean).join(" • ")
}

type ItemPageProps = {
  params: Promise<{ id: string | string[] }>
  searchParams?: Promise<{ created?: string | string[] }>
}

export default async function ItemPage({ params, searchParams }: ItemPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined

  const rawItemId = resolvedParams.id
  const itemId = Array.isArray(rawItemId) ? rawItemId[0] : rawItemId

  const rawCreated = resolvedSearchParams?.created
  const showCreatedBanner = (Array.isArray(rawCreated) ? rawCreated[0] : rawCreated) === "1"

  const result = await getItemDetails(itemId || "")
  const data = result.data ?? null
  const error = result.status === 200 ? null : result.error || "Failed to load this item."

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex flex-col flex-1 min-w-0 lg:ml-64">
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-5xl space-y-6">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground" asChild>
              <Link href="/marketplace">
                <ArrowLeft className="h-4 w-4" />
                Back to Marketplace
              </Link>
            </Button>

            {showCreatedBanner && !error && data && (
              <Card className="border-success/25 bg-success/10">
                <CardContent className="flex items-center gap-3 py-4">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <p className="text-sm font-medium text-foreground">
                    Item created successfully. Here are its details.
                  </p>
                </CardContent>
              </Card>
            )}

            {error && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h1 className="text-xl font-semibold text-card-foreground">Unable to show item details</h1>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <div className="flex gap-3">
                    <Button variant="outline" asChild>
                      <Link href="/items">Back to My Items</Link>
                    </Button>
                    <Button asChild>
                      <Link href={`/items/${encodeURIComponent(itemId || "")}`}>Retry</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!error && data && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <Card>
                    <CardContent className="pt-6 space-y-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h1 className="text-2xl font-bold text-card-foreground">{data.item.title}</h1>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{data.item.category}</Badge>
                            <Badge
                              variant="outline"
                              className={conditionStyles[data.item.condition] || "bg-muted text-muted-foreground border-border"}
                            >
                              {conditionLabel[data.item.condition] || formatLabel(data.item.condition)}
                            </Badge>
                            <Badge variant="outline">{formatLabel(data.item.item_type)}</Badge>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={statusStyles[data.item.status] || "bg-muted text-muted-foreground border-border"}
                        >
                          {formatLabel(data.item.status)}
                        </Badge>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h2 className="text-sm font-semibold text-card-foreground">Description</h2>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {data.item.description || "No description provided."}
                        </p>
                      </div>

                      <Separator />

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg bg-muted p-3">
                          <p className="text-xs text-muted-foreground">Date Bought</p>
                          <p className="text-sm font-medium text-foreground mt-1">{formatDate(data.item.date_bought)}</p>
                        </div>
                        <div className="rounded-lg bg-muted p-3">
                          <p className="text-xs text-muted-foreground">Last Updated</p>
                          <p className="text-sm font-medium text-foreground mt-1">{formatDate(data.item.last_date_uploaded)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base text-card-foreground">Location</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                        <p>{formatAddress(data.address)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base text-card-foreground">Owner</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={data.owner.profile_picture_url || undefined} alt={data.owner.username} />
                          <AvatarFallback>
                            <UserRound className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {data.owner.first_name} {data.owner.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">@{data.owner.username}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6 space-y-3">
                      <Button className="w-full gap-2" asChild>
                        <Link href="/items">
                          <Plus className="h-4 w-4" />
                          Create An Item
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full gap-2" asChild>
                        <Link href="/items">
                          <CalendarDays className="h-4 w-4" />
                          Go to My Items
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
