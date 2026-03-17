"use client"

import { useEffect, useState, useTransition } from "react"
import { Save, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { updateProfileAction } from "@/app/actions/profile"
import type { UserProfile } from "@/lib/entities/profile"
import { AddressSchema, LETTERS_ONLY, ALPHANUMERIC, EMPTY_ADDRESS } from "@/lib/entities/address"
import type { AddressFormData } from "@/lib/entities/address"
import { AddressForm } from "@/components/misc/address-form"
import { useSession } from "next-auth/react"

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
  const [addressKey, setAddressKey] = useState(0)

  const triggerShake = (field: string) => {
    setShakingFields((prev) => ({ ...prev, [field]: true }))
    setTimeout(() => setShakingFields((prev) => ({ ...prev, [field]: false })), 400)
  }

  const buildForm = () => {
    let address: AddressFormData = { ...EMPTY_ADDRESS }
    if (profile?.address) {
      const { addressId: _id, ...addr } = profile.address
      address = {
        countryCode: addr.countryCode ?? "",
        addressLine1: addr.addressLine1 ?? "",
        addressLine2: addr.addressLine2 ?? "",
        muniDistrict: addr.muniDistrict ?? "",
        city: addr.city ?? "",
        province: addr.province ?? "",
        zipCode: addr.zipCode ?? "",
      }
    }
    return {
      firstName: profile?.firstName ?? "",
      lastName: profile?.lastName ?? "",
      username: profile?.username ?? "",
      bio: profile?.bio ?? "",
      profilePictureUrl: profile?.profile_picture_url ?? "",
      address,
    }
  }

  const [form, setForm] = useState(buildForm)
  const { data: session } = useSession()

  useEffect(() => {
    if (!open) return
    setForm(buildForm())
    setAddressKey((k) => k + 1)
  }, [open, profile])

  // Re-sync when dialog opens; incrementing addressKey remounts AddressForm to reset its internal state
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setError(null)
      setFieldErrors({})
      setShakingFields({})
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
    
    if (!session?.user?.id) {
      setError("User not authenticated.")
      return
    }

    const errors: Record<string, string> = {}

    if (!form.firstName.trim()) errors.firstName = "First name is required."
    else if (!LETTERS_ONLY.test(form.firstName.trim())) errors.firstName = "First name may only contain letters."

    if (!form.lastName.trim()) errors.lastName = "Last name is required."
    else if (!LETTERS_ONLY.test(form.lastName.trim())) errors.lastName = "Last name may only contain letters."

    if (!form.username.trim()) errors.username = "Username is required."
    else if (!ALPHANUMERIC.test(form.username.trim())) errors.username = "Username may only contain letters and numbers."

    const hasAnyAddressField = Object.values(form.address).some((v) => v?.trim() !== "")
    if (hasAnyAddressField) {
      const result = AddressSchema.safeParse(form.address)
      if (!result.success) {
        result.error.errors.forEach((e) => {
          const key = e.path[0] as string
          if (key && !errors[key]) errors[key] = e.message
        })
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setError(null)

    startTransition(async () => {
      const result = await updateProfileAction(session.user.id, form)
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
                      if (val !== "" && !ALPHANUMERIC.test(val)) { triggerShake("username"); return }
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

                {/* Location - Centralized Address Form */}
                <AddressForm
                  key={addressKey}
                  value={form.address}
                  onChange={(address) => setForm({ ...form, address })}
                  errors={fieldErrors}
                  onClearError={clearFieldError}
                />
            </>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </ScrollArea>
        
        {/* Place action buttons in footer so they're always visible */}
        <DialogFooter className="gap-2 pt-2 shrink-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
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
