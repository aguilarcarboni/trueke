import type { AddressFormData } from "@/lib/entities/address"

export type MeetingType = "physical" | "virtual"
export type MeetingRsvpStatus = "accepted" | "declined" | "pending" | "overdue"

export interface MeetingAddress {
  address_id: string
  countryCode: string
  city: string
  province: string
  zipCode: string
  addressLine1: string
  addressLine2: string
  muniDistrict: string
}

export interface MeetingInvitee {
  user_id: string
  username: string
  rsvp_status: MeetingRsvpStatus
}

export interface MeetingSummary {
  meeting_id: string
  negotiation_id: string
  meeting_type: MeetingType
  scheduled_at: string
  due_date: string | null
  platform: string | null
  access_code: string | null
  address: MeetingAddress | null
  created_by_user_id: string
  invitees: MeetingInvitee[]
}

export interface CreateMeetingForExchangeRequest {
  exchange_id: string
  creator_user_id: string
  meeting_type: MeetingType
  scheduled_at: string
  due_date?: string | null
  address?: AddressFormData | null
  platform?: string | null
  access_code?: string | null
}

export interface UpdateMeetingRequest {
  meeting_id: string
  actor_user_id: string
  meeting_type: MeetingType
  scheduled_at: string
  due_date?: string | null
  address?: AddressFormData | null
  platform?: string | null
  access_code?: string | null
}