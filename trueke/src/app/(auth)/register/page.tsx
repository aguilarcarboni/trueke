"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, User, ImageIcon, MapPin } from "lucide-react"
import { register as registerUser } from "./actions"
import { AddressForm } from "@/components/misc/address-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[?!*&]).{8,}$/
const LETTERS_ONLY = /^[a-zA-ZÀ-ÖØ-öø-ÿ\s'\-]+$/
const ALPHANUMERIC_ONLY = /^[a-zA-Z0-9]+$/
const LOCATION_TEXT = /^[a-zA-ZÀ-ÖØ-öø-ÿ\s'\-,\.]+$/
const ZIPCODE_PATTERN = /^[a-zA-Z0-9\s\-]+$/
const URL_PATTERN = /^https?:\/\/[^\s/$.?#].[^\s]*$/i

type RegisterFormValues = {
  email: string
  username: string
  firstName: string
  lastName: string
  profilePictureUrl: string
  bio: string
  password: string
  countryCode: string
  province: string
  muniDistrict: string
  cantonCity: string
  zipCode: string
  addressLine1: string
  addressLine2: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    mode: "onChange",
    defaultValues: {
      email: "",
      username: "",
      firstName: "",
      lastName: "",
      profilePictureUrl: "",
      bio: "",
      password: "",
      countryCode: "CR",
      province: "",
      muniDistrict: "",
      cantonCity: "",
      zipCode: "",
      addressLine1: "",
      addressLine2: "",
    },
  })

  const addressValue = {
    countryCode: watch("countryCode"),
    province: watch("province"),
    city: watch("cantonCity"),
    zipCode: watch("zipCode"),
    addressLine1: watch("addressLine1"),
    addressLine2: watch("addressLine2"),
    muniDistrict: watch("muniDistrict"),
  }

  const addressErrors = {
    countryCode: errors.countryCode?.message,
    province: errors.province?.message,
    city: errors.cantonCity?.message,
    muniDistrict: errors.muniDistrict?.message,
    zipCode: errors.zipCode?.message,
  }

  const onSubmit = (values: RegisterFormValues) => {
    setFormError("")
    setSuccessMessage("")

    let isValid = true

    if (!values.countryCode.trim()) {
      setError("countryCode", { type: "manual", message: "Country is required." })
      isValid = false
    }

    if (!values.province.trim()) {
      setError("province", { type: "manual", message: "Province is required." })
      isValid = false
    } else if (!LOCATION_TEXT.test(values.province.trim())) {
      setError("province", { type: "manual", message: "Province has an invalid format." })
      isValid = false
    }

    if (!values.muniDistrict.trim()) {
      setError("muniDistrict", { type: "manual", message: "Municipality is required." })
      isValid = false
    } else if (!LOCATION_TEXT.test(values.muniDistrict.trim())) {
      setError("muniDistrict", { type: "manual", message: "Municipality has an invalid format." })
      isValid = false
    }

    if (!values.cantonCity.trim()) {
      setError("cantonCity", { type: "manual", message: "Canton is required." })
      isValid = false
    } else if (!LOCATION_TEXT.test(values.cantonCity.trim())) {
      setError("cantonCity", { type: "manual", message: "Canton has an invalid format." })
      isValid = false
    }

    if (!values.zipCode.trim()) {
      setError("zipCode", { type: "manual", message: "Zip code is required." })
      isValid = false
    } else if (!ZIPCODE_PATTERN.test(values.zipCode.trim())) {
      setError("zipCode", { type: "manual", message: "Zip code has an invalid format." })
      isValid = false
    }

    if (!isValid) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append("email", values.email.trim())
      formData.append("username", values.username.trim())
      formData.append("firstName", values.firstName.trim())
      formData.append("lastName", values.lastName.trim())
      formData.append("profilePictureUrl", values.profilePictureUrl.trim())
      formData.append("bio", values.bio.trim())
      formData.append("password", values.password)
      formData.append("countryCode", values.countryCode)
      formData.append("province", values.province.trim())
      formData.append("muniDistrict", values.muniDistrict.trim())
      formData.append("cantonCity", values.cantonCity.trim())
      formData.append("zipCode", values.zipCode.trim())

      const result = await registerUser(formData)
      if (result.error) {
        setFormError(result.error)
        return
      }

      setSuccessMessage(result.message ?? "User created successfully.")
      setTimeout(() => {
        router.push("/login")
      }, 1200)
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create account</CardTitle>
          <CardDescription className="text-center">Fill the required information to register</CardDescription>
          <p className="text-xs text-center text-muted-foreground">
            Required fields are marked with <span className="text-destructive font-semibold">*</span>
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    className={`pl-9 ${errors.email ? "border-destructive" : ""}`}
                    disabled={isPending}
                    {...register("email", {
                      validate: (value) => {
                        if (!value.trim()) return "Email is required."
                        if (!EMAIL_PATTERN.test(value.trim())) return "Please enter a valid email format."
                        return true
                      },
                    })}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">
                  Username <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="johndoe"
                    className={`pl-9 ${errors.username ? "border-destructive" : ""}`}
                    disabled={isPending}
                    {...register("username", {
                      validate: (value) => {
                        if (!value.trim()) return "Username is required."
                        if (!ALPHANUMERIC_ONLY.test(value.trim())) return "Username may only contain letters and numbers."
                        return true
                      },
                    })}
                  />
                </div>
                {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  className={errors.firstName ? "border-destructive" : ""}
                  disabled={isPending}
                  {...register("firstName", {
                    validate: (value) => {
                      if (!value.trim()) return "First name is required."
                      if (!LETTERS_ONLY.test(value.trim())) return "First name may only contain letters."
                      return true
                    },
                  })}
                />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  className={errors.lastName ? "border-destructive" : ""}
                  disabled={isPending}
                  {...register("lastName", {
                    validate: (value) => {
                      if (!value.trim()) return "Last name is required."
                      if (!LETTERS_ONLY.test(value.trim())) return "Last name may only contain letters."
                      return true
                    },
                  })}
                />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profilePictureUrl">Profile picture</Label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="profilePictureUrl"
                  placeholder="https://..."
                  className={`pl-9 ${errors.profilePictureUrl ? "border-destructive" : ""}`}
                  disabled={isPending}
                  {...register("profilePictureUrl", {
                    validate: (value) => {
                      if (!value.trim()) return true
                      if (!URL_PATTERN.test(value.trim())) {
                        return "Profile picture URL must start with http:// or https://"
                      }
                      return true
                    },
                  })}
                />
              </div>
              {errors.profilePictureUrl && <p className="text-xs text-destructive">{errors.profilePictureUrl.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio / description</Label>
              <Textarea
                id="bio"
                rows={3}
                maxLength={500}
                placeholder="Tell us about yourself"
                className="resize-none"
                disabled={isPending}
                {...register("bio")}
              />
              <p className="text-xs text-muted-foreground text-right">{watch("bio")?.length ?? 0}/500</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className={`pl-9 pr-9 ${errors.password ? "border-destructive" : ""}`}
                  disabled={isPending}
                  {...register("password", {
                    validate: (value) => {
                      if (!value) return "Password is required."
                      if (!PASSWORD_PATTERN.test(value)) {
                        return "Password must be at least 8 chars and include 1 uppercase, 1 number, and 1 special (?, !, *, &)."
                      }
                      return true
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isPending}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Use at least 8 characters, 1 uppercase, 1 number, and 1 special character (?, !, *, &).</p>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4" />
                Location (Costa Rica)
              </div>

              <div className={isPending ? "pointer-events-none opacity-70" : ""}>
                <AddressForm
                  value={addressValue}
                  onChange={(address) => {
                    setValue("countryCode", address.countryCode, { shouldValidate: true, shouldDirty: true })
                    setValue("province", address.province, { shouldValidate: true, shouldDirty: true })
                    setValue("cantonCity", address.city, { shouldValidate: true, shouldDirty: true })
                    setValue("muniDistrict", address.muniDistrict, { shouldValidate: true, shouldDirty: true })
                    setValue("zipCode", address.zipCode, { shouldValidate: true, shouldDirty: true })
                    setValue("addressLine1", address.addressLine1, { shouldDirty: true })
                    setValue("addressLine2", address.addressLine2, { shouldDirty: true })
                  }}
                  errors={addressErrors as Record<string, string>}
                  onClearError={(field) => {
                    if (field === "city") {
                      clearErrors("cantonCity")
                      return
                    }
                    clearErrors(field as keyof RegisterFormValues)
                  }}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="px-1"
                onClick={() => router.push("/login")}
                disabled={isPending}
              >
                Sign in
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
