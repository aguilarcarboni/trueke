"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, User, ImageIcon, MapPin } from "lucide-react"
import { Country, State, City } from "country-state-city"
import { register } from "@/app/register/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[?!*&]).{8,}$/
const LETTERS_ONLY = /^[a-zA-ZÀ-ÖØ-öø-ÿ\s'\-]+$/
const ALPHANUMERIC_ONLY = /^[a-zA-Z0-9]+$/
const LOCATION_TEXT = /^[a-zA-ZÀ-ÖØ-öø-ÿ\s'\-,\.]+$/
const ZIPCODE_PATTERN = /^[a-zA-Z0-9\s\-]+$/
const URL_PATTERN = /^https?:\/\/[^\s/$.?#].[^\s]*$/i

export default function RegisterPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [profilePictureUrl, setProfilePictureUrl] = useState("")
  const [bio, setBio] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [countryCode, setCountryCode] = useState("CR")
  const [stateCode, setStateCode] = useState("")
  const [province, setProvince] = useState("")
  const [muniDistrict, setMuniDistrict] = useState("")
  const [cantonCity, setCantonCity] = useState("")
  const [zipCode, setZipCode] = useState("")

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const provinces = useMemo(() => State.getStatesOfCountry("CR"), [])
  const cantons = useMemo(() => {
    if (!stateCode) return []
    return City.getCitiesOfState("CR", stateCode)
  }, [stateCode])

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!email.trim()) errors.email = "Email is required."
    else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Please enter a valid email format."

    if (!username.trim()) errors.username = "Username is required."
    else if (!ALPHANUMERIC_ONLY.test(username.trim())) errors.username = "Username may only contain letters and numbers."

    if (!firstName.trim()) errors.firstName = "First name is required."
    else if (!LETTERS_ONLY.test(firstName.trim())) errors.firstName = "First name may only contain letters."

    if (!lastName.trim()) errors.lastName = "Last name is required."
    else if (!LETTERS_ONLY.test(lastName.trim())) errors.lastName = "Last name may only contain letters."

    if (profilePictureUrl.trim() && !URL_PATTERN.test(profilePictureUrl.trim())) {
      errors.profilePictureUrl = "Profile picture URL must start with http:// or https://"
    }

    if (!password) {
      errors.password = "Password is required."
    } else if (!PASSWORD_PATTERN.test(password)) {
      errors.password = "Password must be at least 8 chars and include 1 uppercase, 1 number, and 1 special (?, !, *, &)."
    }

    if (!countryCode.trim()) errors.countryCode = "Country is required."

    if (!province.trim()) errors.province = "Province is required."
    else if (!LOCATION_TEXT.test(province.trim())) errors.province = "Province has an invalid format."

    if (!muniDistrict.trim()) errors.muniDistrict = "Municipality is required."
    else if (!LOCATION_TEXT.test(muniDistrict.trim())) errors.muniDistrict = "Municipality has an invalid format."

    if (!cantonCity.trim()) errors.cantonCity = "Canton is required."
    else if (!LOCATION_TEXT.test(cantonCity.trim())) errors.cantonCity = "Canton has an invalid format."

    if (!zipCode.trim()) errors.zipCode = "Zip code is required."
    else if (!ZIPCODE_PATTERN.test(zipCode.trim())) errors.zipCode = "Zip code has an invalid format."

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError("")
    setSuccessMessage("")

    if (!validateForm()) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append("email", email.trim())
      formData.append("username", username.trim())
      formData.append("firstName", firstName.trim())
      formData.append("lastName", lastName.trim())
      formData.append("profilePictureUrl", profilePictureUrl.trim())
      formData.append("bio", bio.trim())
      formData.append("password", password)
      formData.append("countryCode", countryCode)
      formData.append("province", province.trim())
      formData.append("muniDistrict", muniDistrict.trim())
      formData.append("cantonCity", cantonCity.trim())
      formData.append("zipCode", zipCode.trim())

      const result = await register(formData)
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
          <form onSubmit={handleSubmit} className="space-y-4">
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
                    value={email}
                    onChange={(e) => {
                      const value = e.target.value
                      setEmail(value)
                      if (!value.trim()) {
                        clearFieldError("email")
                      } else if (!EMAIL_PATTERN.test(value.trim())) {
                        setFieldErrors((prev) => ({ ...prev, email: "Please enter a valid email format." }))
                      } else {
                        clearFieldError("email")
                      }
                    }}
                    placeholder="your.email@example.com"
                    className={`pl-9 ${fieldErrors.email ? "border-destructive" : ""}`}
                    disabled={isPending}
                    required
                  />
                </div>
                {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">
                  Username <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value)
                      clearFieldError("username")
                    }}
                    placeholder="johndoe"
                    className={`pl-9 ${fieldErrors.username ? "border-destructive" : ""}`}
                    disabled={isPending}
                    required
                  />
                </div>
                {fieldErrors.username && <p className="text-xs text-destructive">{fieldErrors.username}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value)
                    clearFieldError("firstName")
                  }}
                  placeholder="John"
                  className={fieldErrors.firstName ? "border-destructive" : ""}
                  disabled={isPending}
                  required
                />
                {fieldErrors.firstName && <p className="text-xs text-destructive">{fieldErrors.firstName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value)
                    clearFieldError("lastName")
                  }}
                  placeholder="Doe"
                  className={fieldErrors.lastName ? "border-destructive" : ""}
                  disabled={isPending}
                  required
                />
                {fieldErrors.lastName && <p className="text-xs text-destructive">{fieldErrors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profilePictureUrl">Profile picture</Label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="profilePictureUrl"
                  value={profilePictureUrl}
                  onChange={(e) => {
                    setProfilePictureUrl(e.target.value)
                    clearFieldError("profilePictureUrl")
                  }}
                  placeholder="https://..."
                  className={`pl-9 ${fieldErrors.profilePictureUrl ? "border-destructive" : ""}`}
                  disabled={isPending}
                />
              </div>
              {fieldErrors.profilePictureUrl && <p className="text-xs text-destructive">{fieldErrors.profilePictureUrl}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio / description</Label>
              <Textarea
                id="bio"
                rows={3}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                className="resize-none"
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
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
                  value={password}
                  onChange={(e) => {
                    const value = e.target.value
                    setPassword(value)
                    if (!value) {
                      clearFieldError("password")
                    } else if (!PASSWORD_PATTERN.test(value)) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: "Password must be at least 8 chars and include 1 uppercase, 1 number, and 1 special (?, !, *, &).",
                      }))
                    } else {
                      clearFieldError("password")
                    }
                  }}
                  placeholder="Create a password"
                  className={`pl-9 pr-9 ${fieldErrors.password ? "border-destructive" : ""}`}
                  disabled={isPending}
                  required
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
              {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
            </div>

            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4" />
                Location (Costa Rica)
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Country <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={countryCode}
                    onValueChange={(value) => {
                      setCountryCode(value)
                      clearFieldError("countryCode")
                    }}
                    disabled={isPending}
                  >
                    <SelectTrigger className={fieldErrors.countryCode ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {Country.getAllCountries()
                        .filter((country) => country.isoCode === "CR")
                        .map((country) => (
                          <SelectItem key={country.isoCode} value={country.isoCode}>
                            {country.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.countryCode && <p className="text-xs text-destructive">{fieldErrors.countryCode}</p>}
                </div>

                <div className="space-y-2">
                  <Label>
                    Province <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={stateCode}
                    onValueChange={(value) => {
                      const state = provinces.find((item) => item.isoCode === value)
                      setStateCode(value)
                      setProvince(state?.name ?? "")
                      setCantonCity("")
                      clearFieldError("province")
                      clearFieldError("cantonCity")
                    }}
                    disabled={isPending}
                  >
                    <SelectTrigger className={fieldErrors.province ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((item) => (
                        <SelectItem key={item.isoCode} value={item.isoCode}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.province && <p className="text-xs text-destructive">{fieldErrors.province}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="muniDistrict">
                    Municipality <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="muniDistrict"
                    value={muniDistrict}
                    onChange={(e) => {
                      setMuniDistrict(e.target.value)
                      clearFieldError("muniDistrict")
                    }}
                    placeholder="Mata Redonda"
                    className={fieldErrors.muniDistrict ? "border-destructive" : ""}
                    disabled={isPending}
                    required
                  />
                  {fieldErrors.muniDistrict && <p className="text-xs text-destructive">{fieldErrors.muniDistrict}</p>}
                </div>

                <div className="space-y-2">
                  <Label>
                    Canton <span className="text-destructive">*</span>
                  </Label>
                  {cantons.length > 0 ? (
                    <Select
                      value={cantonCity}
                      onValueChange={(value) => {
                        setCantonCity(value)
                        clearFieldError("cantonCity")
                      }}
                      disabled={isPending}
                    >
                      <SelectTrigger className={fieldErrors.cantonCity ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select canton" />
                      </SelectTrigger>
                      <SelectContent>
                        {cantons.map((item) => (
                          <SelectItem key={`${item.name}-${item.stateCode}`} value={item.name}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={cantonCity}
                      onChange={(e) => {
                        setCantonCity(e.target.value)
                        clearFieldError("cantonCity")
                      }}
                      placeholder="Santa Ana"
                      className={fieldErrors.cantonCity ? "border-destructive" : ""}
                      disabled={isPending}
                      required
                    />
                  )}
                  {fieldErrors.cantonCity && <p className="text-xs text-destructive">{fieldErrors.cantonCity}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">
                    Zip code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => {
                      setZipCode(e.target.value)
                      clearFieldError("zipCode")
                    }}
                    placeholder="10901"
                    className={fieldErrors.zipCode ? "border-destructive" : ""}
                    disabled={isPending}
                    required
                  />
                  {fieldErrors.zipCode && <p className="text-xs text-destructive">{fieldErrors.zipCode}</p>}
                </div>
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
