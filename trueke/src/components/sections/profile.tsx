"use client"

import { useState, useTransition } from "react"
import { Star, MapPin, Calendar, Edit, Shield, Save, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { items, exchanges, COUNTRIES } from "@/lib/data"
import { updateProfileAction } from "@/app/user/actions"
import type { UserProfile } from "@/utils/supabase/tables/profile"

interface ProfileProps {
  profile: UserProfile | null
}

export function Profile({ profile }: ProfileProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({})
  const [shakingFields, setShakingFields] = useState<Record<string, boolean>>({})

  const triggerShake = (field: string) => {
    setShakingFields((prev) => ({ ...prev, [field]: true }))
    setTimeout(() => setShakingFields((prev) => ({ ...prev, [field]: false })), 400)
  }

  const emptyAddress = {
    countryCode: "",
    addressLine1: "",
    addressLine2: "",
    muniDistrict: "",
    city: "",
    province: "",
    zipCode: "",
  }

  const [form, setForm] = useState({
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    username: profile?.username ?? "",
    bio: profile?.bio ?? "",
    profilePictureUrl: profile?.profilePictureUrl ?? "",
    address: profile?.address ? { ...profile.address } : emptyAddress,
  })

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim() || profile.username
    : "—"

  const userItems = items.filter((i) => i.owner.id === (profile?.id ?? ""))
  const completedExchanges = exchanges.filter((e) => e.status === "accepted")

  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleOpenDialog = () => {
    // Re-sync form with latest saved profile values
    setForm({
      firstName: profile?.firstName ?? "",
      lastName: profile?.lastName ?? "",
      username: profile?.username ?? "",
      bio: profile?.bio ?? "",
      profilePictureUrl: profile?.profilePictureUrl ?? "",
      address: profile?.address ? { ...profile.address } : emptyAddress,
    })
    setError(null)
    setDialogOpen(true)
  }

  const handleSave = () => {
    // Validate required fields
    const hasAnyAddressField = Object.values(form.address).some((v) => v.trim() !== "")
    const errors: Record<string, boolean> = {
      firstName: !form.firstName.trim(),
      lastName: !form.lastName.trim(),
      username: !form.username.trim(),
      ...(hasAnyAddressField && {
        city: !form.address.city.trim(),
        province: !form.address.province.trim(),
        zipCode: !form.address.zipCode.trim(),
        countryCode: !form.address.countryCode.trim(),
      }),
    }
    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setError(null)
    startTransition(async () => {
      const result = await updateProfileAction(form)
      if (result.error) {
        setError(result.error)
      } else {
        setDialogOpen(false)
        window.location.reload()
      }
    })
  }

  return (
    <>
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My Profile</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card — view only */}
        <Card className="lg:row-span-2">
          <CardContent className="pt-6 text-center space-y-4">
            {/* Avatar */}
            <div className="relative inline-block">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage src={profile?.profilePictureUrl || undefined} alt={displayName} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
            </div>

            {/* Name, username, location */}
            <div>
              <h2 className="text-xl font-bold text-card-foreground">{displayName}</h2>
              {profile?.username && (
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              )}
              {(profile?.address?.muniDistrict || profile?.address?.city || profile?.address?.province || profile?.address?.countryCode) && (
                <div className="flex items-center justify-center gap-1.5 mt-1 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-sm">
                    {[profile.address.muniDistrict, profile.address.city, profile.address.province, profile.address.countryCode]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              )}
              {profile?.bio && (
                <p className="text-sm text-muted-foreground leading-relaxed wrap-break-word">{profile.bio}</p>
              )}
            </div>
            

            {/* Static 5-star rating for now */} 
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-5 w-5 text-muted" />
              ))}
            </div>
              

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{completedExchanges.length}</p>
                <p className="text-xs text-muted-foreground">Total Trades</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{userItems.length}</p>
                <p className="text-xs text-muted-foreground">Active Listings</p>
              </div>
            </div>

            {profile?.createdAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                <Calendar className="h-3.5 w-3.5" />
                Joined on {" "}
                {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            )}

            <Button className="w-full gap-2" onClick={handleOpenDialog}>
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Trust Score */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Shield className="h-5 w-5 text-primary" />
              Trust Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-foreground">92</span>
              <Badge className="bg-success/10 text-success border border-success/20">Trusted Trader</Badge>
            </div>
            <Progress value={92} className="h-2" />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Completed Trades", value: "47" },
                { label: "Response Rate", value: "96%" },
                { label: "Meeting Participation Rate", value: "98%" },
                { label: "Positive Reviews", value: "45" },
              ].map((metric) => (
                <div key={metric.label} className="rounded-lg bg-muted p-3">
                  <p className="text-lg font-bold text-foreground">{metric.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{metric.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* My Listings */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-card-foreground">My Listings</CardTitle>
            <Button variant="outline" size="sm">Add Item</Button>
          </CardHeader>
          <CardContent>
            {userItems.length > 0 ? (
              <div className="space-y-3">
                {userItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="h-14 w-14 rounded-lg object-cover"
                      crossOrigin="anonymous"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.category} &middot; {item.condition}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize text-xs">{item.state}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No items listed yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Trades */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-card-foreground">Trade History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exchanges.slice(0, 3).map((ex) => (
                <div key={ex.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={ex.initiator.avatar} alt={ex.initiator.name} />
                    <AvatarFallback>{ex.initiator.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{ex.initiator.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ex.type} trade &middot;{" "}
                      {new Date(ex.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize text-xs">{ex.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    {/* ==========================================
        ────────── Edit Profile Dialog ───────────
        ========================================== */}
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4 py-1">
            <p className="text-xs text-muted-foreground">
              Fields marked with <span className="text-destructive font-semibold">*</span> are required.
            </p>
            {/* Avatar preview + URL */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 shrink-0">
                <AvatarImage src={form.profilePictureUrl} alt={displayName} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <Label htmlFor="avatarUrl" className="text-xs">Profile picture URL</Label>
                <Input
                  id="avatarUrl"
                  value={form.profilePictureUrl}
                  onChange={(e) => setForm({ ...form, profilePictureUrl: e.target.value })}
                  placeholder="https://..."
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-xs">
                  First name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => {
                    if (e.target.value.length > 50) { triggerShake("firstName"); return }
                    setForm({ ...form, firstName: e.target.value })
                  }}
                  placeholder="John"
                  className={`h-8 text-sm${fieldErrors.firstName || shakingFields.firstName ? " border-destructive" : ""}${shakingFields.firstName ? " shake" : ""}`}
                />
                {fieldErrors.firstName && <p className="text-xs text-destructive">First name is required.</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName" className="text-xs">
                  Last name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => {
                    if (e.target.value.length > 50) { triggerShake("lastName"); return }
                    setForm({ ...form, lastName: e.target.value })
                  }}
                  placeholder="Doe"
                  className={`h-8 text-sm${fieldErrors.lastName || shakingFields.lastName ? " border-destructive" : ""}${shakingFields.lastName ? " shake" : ""}`}
                />
                {fieldErrors.lastName && <p className="text-xs text-destructive">Last name is required.</p>}
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1">
              <Label htmlFor="username" className="text-xs">
                Username <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="johndoe"
                className={`h-8 text-sm${fieldErrors.username ? " border-destructive" : ""}`}
              />
              {fieldErrors.username && <p className="text-xs text-destructive">Username is required.</p>}
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <Label htmlFor="bio" className="text-xs">Bio</Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value.slice(0, 500) })}
                rows={4}
                maxLength={500}
                className="text-sm resize-none [word-break:break-word]"
              />
              <p className={`text-xs text-right ${form.bio.length >= 500 ? "text-destructive" : "text-muted-foreground"}`}>
                {form.bio.length}/500
              </p>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</p>
              {/* Country Drop-down*/}
              <div className="space-y-1">
                <Label className="text-xs">
                  Country <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={form.address.countryCode}
                  onValueChange={(val) => setForm({ ...form, address: { ...form.address, countryCode: val } })}
                >
                  <SelectTrigger className={`h-8 text-sm w-full${fieldErrors.countryCode ? " border-destructive" : ""}`}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(({ code, name }) => (
                      <SelectItem key={code} value={code}>
                        {name} ({code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.countryCode && <p className="text-xs text-destructive">Country is required.</p>}
              </div>

              {/* City, Province/State */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="city" className="text-xs">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={form.address.city}
                    onChange={(e) => {
                      if (e.target.value.length > 75) { triggerShake("city"); return }
                      setForm({ ...form, address: { ...form.address, city: e.target.value } })
                    }}
                    placeholder="San José"
                    className={`h-8 text-sm${fieldErrors.city || shakingFields.city ? " border-destructive" : ""}${shakingFields.city ? " shake" : ""}`}
                  />
                  {fieldErrors.city && <p className="text-xs text-destructive">City is required.</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="province" className="text-xs">
                    Province / State <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="province"
                    value={form.address.province}
                    onChange={(e) => {
                      if (e.target.value.length > 75) { triggerShake("province"); return }
                      setForm({ ...form, address: { ...form.address, province: e.target.value } })
                    }}
                    placeholder="San José"
                    className={`h-8 text-sm${fieldErrors.province || shakingFields.province ? " border-destructive" : ""}${shakingFields.province ? " shake" : ""}`}
                  />
                  {fieldErrors.province && <p className="text-xs text-destructive">Province is required.</p>}
                </div>
              </div>
              
              {/* Municipality/District, Zip code */}
              <div className="grid grid-cols-2 gap-3">    
                <div className="space-y-1">
                  <Label htmlFor="muniDistrict" className="text-xs">Municipality / District</Label>
                  <Input
                    id="muniDistrict"
                    value={form.address.muniDistrict}
                    onChange={(e) => {
                      if (e.target.value.length > 100) { triggerShake("muniDistrict"); return }
                      setForm({ ...form, address: { ...form.address, muniDistrict: e.target.value } })
                    }}
                    placeholder="Mata Redonda"
                    className={`h-8 text-sm${shakingFields.muniDistrict ? " border-destructive shake" : ""}`}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="zipCode" className="text-xs">
                    Zip code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="zipCode"
                    value={form.address.zipCode}
                    onChange={(e) => {
                      if (e.target.value.length > 10) { triggerShake("zipCode"); return }
                      setForm({ ...form, address: { ...form.address, zipCode: e.target.value } })
                    }}
                    placeholder="10103"
                    className={`h-8 text-sm${fieldErrors.zipCode || shakingFields.zipCode ? " border-destructive" : ""}${shakingFields.zipCode ? " shake" : ""}`}
                  />
                  {fieldErrors.zipCode && <p className="text-xs text-destructive">Zip code is required.</p>}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="addressLine1" className="text-xs">Address line 1</Label>
                <Input
                  id="addressLine1"
                  value={form.address.addressLine1}
                  onChange={(e) => setForm({ ...form, address: { ...form.address, addressLine1: e.target.value } })}
                  placeholder="Street, building..."
                  className="h-8 text-sm"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="addressLine2" className="text-xs">Address line 2</Label>
                <Input
                  id="addressLine2"
                  value={form.address.addressLine2}
                  onChange={(e) => setForm({ ...form, address: { ...form.address, addressLine2: e.target.value } })}
                  placeholder="Apartment, suite..."
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending} className="gap-1.5">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
