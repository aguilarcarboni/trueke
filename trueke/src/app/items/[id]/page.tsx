"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin, Plus, UserRound } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

interface ItemResponse {
  item: {
    item_id: string
    title: string
    description: string | null
    category: string
    condition: string
    status: string
    item_type: string
    date_bought: string | null
    last_date_uploaded: string
  }
  owner: {
    user_id: string
    username: string
    first_name: string
    last_name: string
    profile_picture_url: string | null
  }
  address: {
    address_id: string
    country_code: string
    address_line1: string
    address_line2: string
    muni_district: string
    canton_city: string
    province_state: string
    zip_code: string
  } | null
}

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
    .split(/[_\s]+/)
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

function formatAddress(address: ItemResponse["address"]) {
  if (!address) {
    return "No address assigned to this item yet."
  }

  const line = [address.address_line1, address.address_line2].filter(Boolean).join(", ")
  const locality = [address.muni_district, address.canton_city, address.province_state]
    .filter(Boolean)
    .join(", ")

  return [line, locality, `${address.country_code} ${address.zip_code}`].filter(Boolean).join(" • ")
}

export default function ItemPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState("my-items")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ItemResponse | null>(null)

  const itemId = useMemo(() => {
    const raw = params?.id
    return Array.isArray(raw) ? raw[0] : raw || ""
  }, [params])

  const showCreatedBanner = searchParams.get("created") === "1"

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    router.push(`/?section=${section}`)
  }

  useEffect(() => {
    if (!itemId) {
      return
    }

    const controller = new AbortController()

    const fetchItem = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/items/${itemId}`, {
          cache: "no-store",
          signal: controller.signal,
        })

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null)
          setError(errorPayload?.error || "Failed to load this item.")
          setData(null)
          return
        }

        const payload = (await response.json()) as ItemResponse
        setData(payload)
      } catch {
        if (!controller.signal.aborted) {
          setError("Unable to load item details right now.")
          setData(null)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchItem()

    return () => controller.abort()
  }, [itemId])

  return (
    <div className="flex min-h-screen bg-background">

      <div className="flex flex-col flex-1 min-w-0 lg:ml-64">

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-5xl space-y-6">
            <Button
              variant="ghost"
              className="gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => router.push("/?section=my-items")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Items
            </Button>

            {showCreatedBanner && !isLoading && !error && data && (
              <Card className="border-success/25 bg-success/10">
                <CardContent className="flex items-center gap-3 py-4">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <p className="text-sm font-medium text-foreground">
                    Item created successfully. Here are its details.
                  </p>
                </CardContent>
              </Card>
            )}

            {isLoading && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <Skeleton className="h-7 w-2/5" />
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              </div>
            )}

            {!isLoading && error && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h1 className="text-xl font-semibold text-card-foreground">Unable to show item details</h1>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => router.push("/?section=my-items")}>
                      Back to My Items
                    </Button>
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isLoading && !error && data && (
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
                      <Button className="w-full gap-2" onClick={() => router.push("/?section=create-item")}>
                        <Plus className="h-4 w-4" />
                        Create Another Item
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => router.push("/?section=my-items")}
                      >
                        <CalendarDays className="h-4 w-4" />
                        Go to My Items
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
