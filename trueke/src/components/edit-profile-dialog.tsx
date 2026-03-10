"use client"

import { useState, useTransition } from "react"
import { Save, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { updateProfileAction } from "@/app/user/actions"
import type { UserProfile } from "@/utils/supabase/tables/profile"
import { Country, State, City } from "country-state-city"

// Validation patterns
const LETTERS_ONLY      = /^[a-zA-ZÀ-ÖØ-öø-ÿ\s'\-]+$/
const ALPHANUMERIC_ONLY = /^[a-zA-Z0-9]+$/
const LOCATION_TEXT     = /^[a-zA-ZÀ-ÖØ-öø-ÿ\s'\-,\.]+$/
const ZIPCODE_PATTERN   = /^[a-zA-Z0-9\s\-]+$/
const ADDRESS_LINE_PATTERN = /^[a-zA-Z0-9À-ÖØ-öø-ÿ\s'\-\.,#\/]+$/

const EMPTY_ADDRESS = {
  countryCode: "",
  addressLine1: "",
  addressLine2: "",
  muniDistrict: "",
  city: "",
  province: "",
  zipCode: "",
}

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: UserProfile | null
}

export function EditProfileDialog({
  open,
  onOpenChange,
  profile,
}: EditProfileDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [shakingFields, setShakingFields] = useState<Record<string, boolean>>({})

  const triggerShake = (field: string) => {
    setShakingFields((prev) => ({ ...prev, [field]: true }))
    setTimeout(() => setShakingFields((prev) => ({ ...prev, [field]: false })), 400)
  }

  const buildForm = () => ({
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    username: profile?.username ?? "",
    bio: profile?.bio ?? "",
    profilePictureUrl: profile?.profilePictureUrl ?? "",
    address: profile?.address ? { ...profile.address } : { ...EMPTY_ADDRESS },
  })

  const [form, setForm] = useState(buildForm)
  // stateCode is UI-only (drives city dropdown); not persisted
  const [stateCode, setStateCode] = useState<string>("")

  // Re-sync when dialog opens
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setForm(buildForm())
      setStateCode("")
      setError(null)
      setFieldErrors({})
    }
    onOpenChange(next)
  }

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim() || profile.username
    : "—"

  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: "" }))

  const handleSave = () => {
    const errors: Record<string, string> = {}

    if (!form.firstName.trim()) errors.firstName = "First name is required."
    else if (!LETTERS_ONLY.test(form.firstName.trim())) errors.firstName = "First name may only contain letters."

    if (!form.lastName.trim()) errors.lastName = "Last name is required."
    else if (!LETTERS_ONLY.test(form.lastName.trim())) errors.lastName = "Last name may only contain letters."

    if (!form.username.trim()) errors.username = "Username is required."
    else if (!ALPHANUMERIC_ONLY.test(form.username.trim())) errors.username = "Username may only contain letters and numbers."

    const hasAnyAddressField = Object.values(form.address).some((v) => v?.trim() !== "")
    if (hasAnyAddressField) {
      if (!form.address.countryCode.trim()) errors.countryCode = "Country is required."
      if (!form.address.city.trim()) errors.city = "City is required."
      else if (!LOCATION_TEXT.test(form.address.city.trim())) errors.city = "City may only contain letters."
      if (!form.address.province.trim()) errors.province = "Province is required."
      else if (!LOCATION_TEXT.test(form.address.province.trim())) errors.province = "Province may only contain letters."
      if (form.address.muniDistrict.trim() && !LOCATION_TEXT.test(form.address.muniDistrict.trim())) errors.muniDistrict = "Municipality may only contain letters."
      if (!form.address.zipCode.trim()) errors.zipCode = "Zip code is required."
      else if (!ZIPCODE_PATTERN.test(form.address.zipCode.trim())) errors.zipCode = "Zip code may only contain letters, numbers and hyphens."
    }

    if (Object.keys(errors).length > 0) {
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
        onOpenChange(false)
        window.location.reload()
      }
    })
  }

  const inputCls = (field: string) =>
    `h-8 text-sm${fieldErrors[field] || shakingFields[field] ? " border-destructive" : ""}${shakingFields[field] ? " shake" : ""}`

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex flex-col w-full max-w-2xl max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto pr-4">
          <div className="space-y-4 py-1">
            <p className="text-xs text-muted-foreground">
              Fields marked with <span className="text-destructive font-semibold">*</span> are required.
            </p>

            {/* ── Avatar ── */}
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

            {/* ── Name ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-xs">
                  First name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val.length > 50) { triggerShake("firstName"); return }
                    if (val !== "" && !LETTERS_ONLY.test(val)) { triggerShake("firstName"); return }
                    setForm({ ...form, firstName: val })
                    if (fieldErrors.firstName) clearFieldError("firstName")
                  }}
                  placeholder="John"
                  className={inputCls("firstName")}
                />
                {fieldErrors.firstName && <p className="text-xs text-destructive">{fieldErrors.firstName}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName" className="text-xs">
                  Last name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val.length > 50) { triggerShake("lastName"); return }
                    if (val !== "" && !LETTERS_ONLY.test(val)) { triggerShake("lastName"); return }
                    setForm({ ...form, lastName: val })
                    if (fieldErrors.lastName) clearFieldError("lastName")
                  }}
                  placeholder="Doe"
                  className={inputCls("lastName")}
                />
                {fieldErrors.lastName && <p className="text-xs text-destructive">{fieldErrors.lastName}</p>}
              </div>
            </div>

            {/* ── Username / Bio / Location ── */}
            <>
                {/* Username */}
                <div className="space-y-1">
                  <Label htmlFor="username" className="text-xs">
                    Username <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val !== "" && !ALPHANUMERIC_ONLY.test(val)) { triggerShake("username"); return }
                      setForm({ ...form, username: val })
                      if (fieldErrors.username) clearFieldError("username")
                    }}
                    placeholder="johndoe"
                    className={inputCls("username")}
                  />
                  {fieldErrors.username && <p className="text-xs text-destructive">{fieldErrors.username}</p>}
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

                  {/* Country — fixed to Costa Rica for v1 */}
                  <div className="space-y-1">
                    <Label className="text-xs">
                      Country <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.address.countryCode}
                      onValueChange={(val) => {
                        setForm({ ...form, address: { ...form.address, countryCode: val, province: "", city: "" } })
                        setStateCode("")
                        if (fieldErrors.countryCode) clearFieldError("countryCode")
                        if (fieldErrors.province) clearFieldError("province")
                        if (fieldErrors.city) clearFieldError("city")
                      }}
                    >
                      <SelectTrigger className={`h-8 text-sm w-full${fieldErrors.countryCode ? " border-destructive" : ""}`}>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {Country.getAllCountries()
                          .filter((c) => c.isoCode === "CR") // Remove filter to show all countries in the dropdown 
                          .map((c) => (
                            <SelectItem key={c.isoCode} value={c.isoCode}>
                              {c.name} ({c.isoCode})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {fieldErrors.countryCode && <p className="text-xs text-destructive">{fieldErrors.countryCode}</p>}
                  </div>


                  {/* Province / State — dropdown if states exist, otherwise free text */}
                  {(() => {
                    const states = form.address.countryCode
                      ? State.getStatesOfCountry(form.address.countryCode)
                      : []
                    return (
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Province / State <span className="text-destructive">*</span>
                        </Label>
                        {states.length > 0 ? (
                          <Select
                            value={stateCode}
                            onValueChange={(val) => {
                              const state = states.find((s) => s.isoCode === val)
                              setStateCode(val)
                              setForm({ ...form, address: { ...form.address, province: state?.name ?? val, city: "" } })
                              if (fieldErrors.province) clearFieldError("province")
                              if (fieldErrors.city) clearFieldError("city")
                            }}
                          >
                            <SelectTrigger className={`h-8 text-sm w-full${fieldErrors.province ? " border-destructive" : ""}`}>
                              <SelectValue placeholder="Select state / province" />
                            </SelectTrigger>
                            <SelectContent>
                              {states.map((s) => (
                                <SelectItem key={s.isoCode} value={s.isoCode}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={form.address.province}
                            onChange={(e) => {
                              const val = e.target.value
                              if (val.length > 75) { triggerShake("province"); return }
                              if (val !== "" && !LOCATION_TEXT.test(val)) { triggerShake("province"); return }
                              setForm({ ...form, address: { ...form.address, province: val } })
                              if (fieldErrors.province) clearFieldError("province")
                            }}
                            placeholder="Province / State"
                            className={inputCls("province")}
                          />
                        )}
                        {fieldErrors.province && <p className="text-xs text-destructive">{fieldErrors.province}</p>}
                      </div>
                    )
                  })()}

                  {/* City — dropdown if cities exist for the selected state, otherwise free text */}
                  {(() => {
                    const cities = stateCode
                      ? City.getCitiesOfState(form.address.countryCode, stateCode)
                      : form.address.countryCode && !State.getStatesOfCountry(form.address.countryCode).length
                        ? City.getCitiesOfCountry(form.address.countryCode) ?? []
                        : []
                    return (
                      <div className="space-y-1">
                        <Label className="text-xs">
                          City <span className="text-destructive">*</span>
                        </Label>
                        {cities.length > 0 ? (
                          <Select
                            value={form.address.city}
                            onValueChange={(val) => {
                              setForm({ ...form, address: { ...form.address, city: val } })
                              if (fieldErrors.city) clearFieldError("city")
                            }}
                          >
                            <SelectTrigger className={`h-8 text-sm w-full${fieldErrors.city ? " border-destructive" : ""}`}>
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent>
                              {cities.map((c) => (
                                <SelectItem key={`${c.name}-${c.stateCode}`} value={c.name}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={form.address.city}
                            onChange={(e) => {
                              const val = e.target.value
                              if (val.length > 75) { triggerShake("city"); return }
                              if (val !== "" && !LOCATION_TEXT.test(val)) { triggerShake("city"); return }
                              setForm({ ...form, address: { ...form.address, city: val } })
                              if (fieldErrors.city) clearFieldError("city")
                            }}
                            placeholder="City"
                            className={inputCls("city")}
                          />
                        )}
                        {fieldErrors.city && <p className="text-xs text-destructive">{fieldErrors.city}</p>}
                      </div>
                    )
                  })()}

                  {/* Municipality / Zip */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="muniDistrict" className="text-xs">Municipality / District</Label>
                      <Input
                        id="muniDistrict"
                        value={form.address.muniDistrict}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val.length > 100) { triggerShake("muniDistrict"); return }
                          if (val !== "" && !LOCATION_TEXT.test(val)) { triggerShake("muniDistrict"); return }
                          setForm({ ...form, address: { ...form.address, muniDistrict: val } })
                          if (fieldErrors.muniDistrict) clearFieldError("muniDistrict")
                        }}
                        placeholder="Mata Redonda"
                        className={inputCls("muniDistrict")}
                      />
                      {fieldErrors.muniDistrict && <p className="text-xs text-destructive">{fieldErrors.muniDistrict}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="zipCode" className="text-xs">
                        Zip code <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="zipCode"
                        value={form.address.zipCode}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val.length > 10) { triggerShake("zipCode"); return }
                          if (val !== "" && !ZIPCODE_PATTERN.test(val)) { triggerShake("zipCode"); return }
                          setForm({ ...form, address: { ...form.address, zipCode: val } })
                          if (fieldErrors.zipCode) clearFieldError("zipCode")
                        }}
                        placeholder="10103"
                        className={inputCls("zipCode")}
                      />
                      {fieldErrors.zipCode && <p className="text-xs text-destructive">{fieldErrors.zipCode}</p>}
                    </div>
                  </div>

                  {/* Address lines */}
                  <div className="space-y-1">
                    <Label htmlFor="addressLine1" className="text-xs">Address line 1</Label>
                    <Input
                      id="addressLine1"
                      value={form.address.addressLine1}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val !== "" && !ADDRESS_LINE_PATTERN.test(val)) { triggerShake("addressLine1"); return }
                        setForm({ ...form, address: { ...form.address, addressLine1: val } })
                      }}
                      placeholder="Street, building..."
                      className={`h-8 text-sm${shakingFields.addressLine1 ? " border-destructive shake" : ""}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="addressLine2" className="text-xs">Address line 2</Label>
                    <Input
                      id="addressLine2"
                      value={form.address.addressLine2}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val !== "" && !ADDRESS_LINE_PATTERN.test(val)) { triggerShake("addressLine2"); return }
                        setForm({ ...form, address: { ...form.address, addressLine2: val } })
                      }}
                      placeholder="Apartment, suite..."
                      className={`h-8 text-sm${shakingFields.addressLine2 ? " border-destructive shake" : ""}`}
                    />
                  </div>
                </div>
            </>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 pt-2 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending} className="gap-1.5">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
