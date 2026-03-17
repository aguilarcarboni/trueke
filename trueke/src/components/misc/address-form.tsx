"use client"

import { useState, useEffect } from "react"
import { Country, State, City } from "country-state-city"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AddressSchema } from "@/lib/entities/address"
import type { AddressFormData } from "@/lib/entities/address"

// Returns true when a non-empty value fails any Zod rule other than "required"
function hasFormatError(field: keyof typeof AddressSchema.shape, val: string): boolean {
  if (!val) return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (AddressSchema.shape[field] as any).safeParse(val)
  if (!result.success) {
    return result.error.errors.some(
      (e: { code: string; minimum?: number }) => !(e.code === "too_small" && e.minimum === 1)
    )
  }
  return false
}

interface AddressFormProps {
  value: AddressFormData
  onChange: (value: AddressFormData) => void
  errors?: Record<string, string>
  onClearError?: (field: string) => void
}

export function AddressForm({ value, onChange, errors = {}, onClearError }: AddressFormProps) {
  const [stateCode, setStateCode] = useState<string>("")
  const [shakingFields, setShakingFields] = useState<Record<string, boolean>>({})

  // When country changes, try to match the saved province name back to an ISO code.
  // This correctly restores the dropdown when editing an existing address.
  useEffect(() => {
    if (!value.countryCode) { setStateCode(""); return }
    const states = State.getStatesOfCountry(value.countryCode)
    const match = states.find((s) => s.name === value.province)
    setStateCode(match?.isoCode ?? "")
  }, [value.countryCode])

  const triggerShake = (field: string) => {
    setShakingFields((prev) => ({ ...prev, [field]: true }))
    setTimeout(() => setShakingFields((prev) => ({ ...prev, [field]: false })), 400)
  }

  const inputCls = (field: string) =>
    `h-8 text-sm${errors[field] || shakingFields[field] ? " border-destructive" : ""}${shakingFields[field] ? " shake" : ""}`

  const states = value.countryCode ? State.getStatesOfCountry(value.countryCode) : []
  const cities = stateCode
    ? City.getCitiesOfState(value.countryCode, stateCode)
    : value.countryCode && !states.length
      ? City.getCitiesOfCountry(value.countryCode) ?? []
      : []

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</p>

      {/* Country */}
      <div className="space-y-1">
        <Label className="text-xs">
          Country <span className="text-destructive">*</span>
        </Label>
        <Select
          value={value.countryCode}
          onValueChange={(val) => {
            onChange({ ...value, countryCode: val, province: "", city: "" })
            onClearError?.("countryCode")
            onClearError?.("province")
            onClearError?.("city")
          }}
        >
          <SelectTrigger className={`h-8 text-sm w-full${errors.countryCode ? " border-destructive" : ""}`}>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {Country.getAllCountries()
              .filter((c) => c.isoCode === "CR") // Remove filter to show all countries
              .map((c) => (
                <SelectItem key={c.isoCode} value={c.isoCode}>
                  {c.name} ({c.isoCode})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {errors.countryCode && <p className="text-xs text-destructive">{errors.countryCode}</p>}
      </div>

      {/* Province / State — dropdown if states exist, otherwise free text */}
      <div className="space-y-1">
        <Label className="text-xs">
          Province <span className="text-destructive">*</span>
        </Label>
        {states.length > 0 ? (
          <Select
            value={stateCode}
            onValueChange={(val) => {
              const state = states.find((s) => s.isoCode === val)
              setStateCode(val)
              onChange({ ...value, province: state?.name ?? val, city: "" })
              onClearError?.("province")
              onClearError?.("city")
            }}
          >
            <SelectTrigger className={`h-8 text-sm w-full${errors.province ? " border-destructive" : ""}`}>
              <SelectValue placeholder="Select province" />
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
            value={value.province}
            onChange={(e) => {
              const val = e.target.value
              if (hasFormatError("province", val)) { triggerShake("province"); return }
              onChange({ ...value, province: val })
              onClearError?.("province")
            }}
            placeholder="Province / State"
            className={inputCls("province")}
          />
        )}
        {errors.province && <p className="text-xs text-destructive">{errors.province}</p>}
      </div>

      {/* City — dropdown if cities exist for the selected state, otherwise free text */}
      <div className="space-y-1">
        <Label className="text-xs">
          City <span className="text-destructive">*</span>
        </Label>
        {cities.length > 0 ? (
          <Select
            value={value.city}
            onValueChange={(val) => {
              onChange({ ...value, city: val })
              onClearError?.("city")
            }}
          >
            <SelectTrigger className={`h-8 text-sm w-full${errors.city ? " border-destructive" : ""}`}>
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
            value={value.city}
            onChange={(e) => {
              const val = e.target.value
              if (hasFormatError("city", val)) { triggerShake("city"); return }
              onChange({ ...value, city: val })
              onClearError?.("city")
            }}
            placeholder="City"
            className={inputCls("city")}
          />
        )}
        {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
      </div>

      {/* District / Zip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="muniDistrict" className="text-xs">District</Label>
          <Input
            id="muniDistrict"
            value={value.muniDistrict}
            onChange={(e) => {
              const val = e.target.value
              if (hasFormatError("muniDistrict", val)) { triggerShake("muniDistrict"); return }
              onChange({ ...value, muniDistrict: val })
              onClearError?.("muniDistrict")
            }}
            placeholder="Mata Redonda"
            className={inputCls("muniDistrict")}
          />
          {errors.muniDistrict && <p className="text-xs text-destructive">{errors.muniDistrict}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="zipCode" className="text-xs">
            Zip code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="zipCode"
            value={value.zipCode}
            onChange={(e) => {
              const val = e.target.value
              if (hasFormatError("zipCode", val)) { triggerShake("zipCode"); return }
              onChange({ ...value, zipCode: val })
              onClearError?.("zipCode")
            }}
            placeholder="10103"
            className={inputCls("zipCode")}
          />
          {errors.zipCode && <p className="text-xs text-destructive">{errors.zipCode}</p>}
        </div>
      </div>

      {/* Address lines */}
      <div className="space-y-1">
        <Label htmlFor="addressLine1" className="text-xs">Address line 1</Label>
        <Input
          id="addressLine1"
          value={value.addressLine1}
          onChange={(e) => {
            const val = e.target.value
            if (hasFormatError("addressLine1", val)) { triggerShake("addressLine1"); return }
            onChange({ ...value, addressLine1: val })
          }}
          placeholder="Street, building..."
          className={`h-8 text-sm${shakingFields.addressLine1 ? " border-destructive shake" : ""}`}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="addressLine2" className="text-xs">Address line 2</Label>
        <Input
          id="addressLine2"
          value={value.addressLine2}
          onChange={(e) => {
            const val = e.target.value
            if (hasFormatError("addressLine2", val)) { triggerShake("addressLine2"); return }
            onChange({ ...value, addressLine2: val })
          }}
          placeholder="Apartment, suite..."
          className={`h-8 text-sm${shakingFields.addressLine2 ? " border-destructive shake" : ""}`}
        />
      </div>
    </div>
  )
}
