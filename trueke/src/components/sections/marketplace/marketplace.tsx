"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Search, Grid3X3, List, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Country, State } from "country-state-city"
import { getMarketplaceItems, getMarketplaceCategories } from "@/app/actions/marketplace"
import { getConditionLabel, ITEM_CONDITION_LABELS, ITEM_TYPE_LABELS } from "@/lib/entities/item"
import type { Item, ItemCondition, ItemType } from "@/lib/entities/item"
import type { ItemFilters } from "@/lib/entities/filters"
import { useToast } from "@/hooks/use-toast"
import { getFriendlyErrorMessage } from "@/lib/error-messages"
import { useRouter } from "next/navigation"

const ALL_COUNTRIES = Country.getAllCountries()

// Temporary placeholder image for items without photos SHOULD BE REPLACED WITH A PROPER ASSET
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="%23e5e7eb" viewBox="0 0 200 200"%3E%3Crect width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dy=".3em" text-anchor="middle" fill="%236b7280" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E'

export function Marketplace() {

  const router = useRouter()
  const { toast } = useToast()

  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedCondition, setSelectedCondition] = useState<ItemCondition | "">("")
  const [selectedType, setSelectedType] = useState<ItemType | "">("")
  const [ownerQuery, setOwnerQuery] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedProvince, setSelectedProvince] = useState("")
  const [cityQuery, setCityQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const provinces = useMemo(
    () => selectedCountry ? State.getStatesOfCountry(selectedCountry) : [],
    [selectedCountry]
  )

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== "" ||
    selectedCondition !== "" ||
    selectedType !== "" ||
    ownerQuery !== "" ||
    selectedCountry !== "" ||
    selectedProvince !== "" ||
    cityQuery !== ""

  const fetchItems = useCallback(async (overrideFilters?: ItemFilters) => {
    setIsLoading(true)

    const filters: ItemFilters = overrideFilters ?? {}

    if (overrideFilters === undefined) {
      if (searchQuery)       filters.search       = searchQuery
      if (selectedCategory)  filters.category     = selectedCategory
      if (selectedCondition) filters.condition    = selectedCondition
      if (selectedType)      filters.item_type    = selectedType
      if (ownerQuery)        filters.owner_search = ownerQuery

      if (selectedCountry || selectedProvince || cityQuery) {
        filters.address = {}
        if (selectedCountry)  filters.address.country_code = selectedCountry
        if (selectedProvince) filters.address.province     = selectedProvince
        if (cityQuery)        filters.address.city         = cityQuery
      }
    }

    const result = await getMarketplaceItems(filters)
    if (result.success) {
      setItems(result.data || [])
    } else {
      toast({
        title: "Couldn't load marketplace",
        description: getFriendlyErrorMessage(result.error),
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }, [searchQuery, selectedCategory, selectedCondition, selectedType, ownerQuery, selectedCountry, selectedProvince, cityQuery, toast])

  // Load categories, owners + initial unfiltered item list on mount
  useEffect(() => {
    getMarketplaceCategories().then((result) => {
      if (result.success) setCategories(result.data || [])
    })
    fetchItems({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clearFilters = useCallback(() => {
    setSearchQuery("")
    setSelectedCategory("")
    setSelectedCondition("")
    setSelectedType("")
    setOwnerQuery("")
    setSelectedCountry("")
    setSelectedProvince("")
    setCityQuery("")
    fetchItems({})
  // fetchItems is intentionally omitted — we pass {} directly so stale state is irrelevant
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-full w-full flex-1 flex-col space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
        <p className="text-muted-foreground mt-1">Browse and discover items available for trade.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          {/* Row 1: search + apply button + view toggle */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchItems()}
                className="pl-9"
              />
            </div>
            <Button onClick={() => fetchItems()} disabled={isLoading} className="shrink-0">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <div className="flex rounded-lg border border-border shrink-0">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-r-none"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Row 2: discrete filter selects — each child flex-1 so the row matches the search bar width */}
          <div className="flex gap-2 items-center">
            {/* Address filters */}
            <Select
              value={selectedCountry || "__all__"}
              onValueChange={(v) => {
                setSelectedCountry(v === "__all__" ? "" : v)
                setSelectedProvince("") // reset province when country changes
              }}
            >
              <SelectTrigger className="flex-1 min-w-0">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All countries</SelectItem>
                {ALL_COUNTRIES.filter((c) => c.isoCode === "CR").map((c) => (
                  <SelectItem key={c.isoCode} value={c.isoCode}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedProvince || "__all__"}
              onValueChange={(v) => setSelectedProvince(v === "__all__" ? "" : v)}
              disabled={provinces.length === 0}
            >
              <SelectTrigger className="flex-1 min-w-0">
                <SelectValue placeholder={selectedCountry ? "State / Province" : "Select country first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All states / provinces</SelectItem>
                {provinces.map((s) => (
                  <SelectItem key={s.isoCode} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="City..."
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>

            <div className="w-px h-6 bg-border mx-1 shrink-0" />

            <Select value={selectedCategory || "__all__"} onValueChange={(v) => setSelectedCategory(v === "__all__" ? "" : v)}>
              <SelectTrigger className="flex-1 min-w-0">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCondition || "__all__"} onValueChange={(v) => setSelectedCondition(v === "__all__" ? "" : v as ItemCondition)}>
              <SelectTrigger className="flex-1 min-w-0">
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All conditions</SelectItem>
                {(Object.entries(ITEM_CONDITION_LABELS) as [ItemCondition, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType || "__all__"} onValueChange={(v) => setSelectedType(v === "__all__" ? "" : v as ItemType)}>
              <SelectTrigger className="flex-1 min-w-0">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All types</SelectItem>
                {(Object.entries(ITEM_TYPE_LABELS) as [ItemType, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Owner name or username..."
                value={ownerQuery}
                onChange={(e) => setOwnerQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground shrink-0">
                <X className="h-3.5 w-3.5" />
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{isLoading ? "Loading..." : `${items.length} items found`}</p>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">Loading items...</div>
          ) : items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.item_id}
                onClick={() => router.push(`/items/${item.item_id}`)}
                className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={item.images?.[0] || PLACEHOLDER_IMAGE}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="bg-card/90 text-card-foreground backdrop-blur-sm capitalize text-xs border-0">
                      {item.item_type}
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-card-foreground truncate">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={item.owner_avatar || ""} alt={item.owner_name} />
                        <AvatarFallback className="text-[10px]">{item.owner_name?.charAt(0) || "O"}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{item.owner_name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {getConditionLabel(item.condition)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground">No items found</div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading items...</div>
          ) : items.length > 0 ? (
            items.map((item) => (
              <Card
                key={item.item_id}
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => router.push(`/items/${item.item_id}`)}
              >
                <CardContent className="flex gap-4 py-4">
                  <img
                    src={item.images?.[0] || PLACEHOLDER_IMAGE}
                    alt={item.title}
                    className="h-24 w-24 rounded-lg object-cover shrink-0"
                    crossOrigin="anonymous"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-card-foreground">{item.title}</h3>
                      <div className="flex gap-1.5 shrink-0">
                        <Badge variant="secondary" className="capitalize text-xs">{item.item_type}</Badge>
                        <Badge variant="outline" className="capitalize text-xs">{getConditionLabel(item.condition)}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={item.owner_avatar || ""} alt={item.owner_name} />
                        <AvatarFallback className="text-[10px]">{item.owner_name?.charAt(0) || "O"}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{item.owner_name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">No items found</div>
          )}
        </div>
      )}
    </div>
  )
}
