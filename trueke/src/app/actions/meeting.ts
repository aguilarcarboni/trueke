"use server"

import { createClient } from "@/utils/supabase/server"
import { AddressSchema } from "@/lib/entities/address"
import { createAddressRecord } from "@/utils/entities/address"
import { createNotification } from "@/utils/entities/notification"
import type { ApiResponse } from "@/lib/types"
import type {
  CreateMeetingForExchangeRequest,
  UpdateMeetingRequest,
} from "@/lib/entities/meeting"
import type { AddressFormData } from "@/lib/entities/address"
import type { NotificationType } from "@/lib/entities/notification"

function normalizeAddress(address: {
  countryCode: string
  city: string
  province: string
  zipCode: string
  addressLine1: string
  addressLine2?: string
  muniDistrict?: string
}): AddressFormData {
  return {
    countryCode: address.countryCode,
    city: address.city,
    province: address.province,
    zipCode: address.zipCode,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 ?? "",
    muniDistrict: address.muniDistrict ?? "",
  }
}

function validateDate(value: string, label: string): { date?: Date; error?: string } {
  if (!value) return { error: `${label} is required.` }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return { error: `${label} is invalid.` }
  }

  return { date }
}

function validateMeetingTiming(
  scheduledAt: string,
  dueDate?: string | null
): { scheduledDate?: Date; dueDateValue?: Date | null; error?: string } {
  const scheduled = validateDate(scheduledAt, "Scheduled time")
  if (scheduled.error || !scheduled.date) {
    return { error: scheduled.error }
  }

  if (scheduled.date <= new Date()) {
    return { error: "Meeting time must be in the future." }
  }

  if (!dueDate) {
    return { scheduledDate: scheduled.date, dueDateValue: null }
  }

  const due = validateDate(dueDate, "End time")
  if (due.error || !due.date) {
    return { error: due.error }
  }

  if (due.date <= scheduled.date) {
    return { error: "End time must be after the scheduled time." }
  }

  return { scheduledDate: scheduled.date, dueDateValue: due.date }
}

async function notifyInvitees(
  meetingId: string,
  senderUserId: string,
  inviteeIds: string[]
): Promise<void> {
  await Promise.allSettled(
    inviteeIds
      .filter((userId) => userId !== senderUserId)
      .map((recipientId) =>
        createNotification({
          recipient_user_id: recipientId,
          sender_user_id: senderUserId,
          type: "meeting_invite" as NotificationType,
          title: "Meeting Invite",
          body: "A meeting has been scheduled for one of your accepted trades.",
          reference_type: "meeting",
          reference_id: meetingId,
        })
      )
  )
}

export async function createMeetingForExchange(
  request: CreateMeetingForExchangeRequest
): Promise<ApiResponse<{ meeting_id: string }>> {
  try {
    const supabase = await createClient()

    if (!request.exchange_id?.trim()) {
      return { success: false, error: "Exchange is required." }
    }

    if (!request.creator_user_id?.trim()) {
      return { success: false, error: "User is required." }
    }

    if (request.meeting_type !== "physical" && request.meeting_type !== "virtual") {
      return { success: false, error: "Meeting type is invalid." }
    }

    const timing = validateMeetingTiming(request.scheduled_at, request.due_date)
    if (timing.error || !timing.scheduledDate) {
      return { success: false, error: timing.error }
    }

    const { data: exchange, error: exchangeError } = await supabase
      .from("exchange")
      .select("exchange_id,status,negotiation_id")
      .eq("exchange_id", request.exchange_id)
      .single()

    if (exchangeError || !exchange) {
      return { success: false, error: exchangeError?.message ?? "Exchange not found." }
    }

    if (exchange.status !== "accepted") {
      return { success: false, error: "Meetings can only be created for accepted exchanges." }
    }

    if (!exchange.negotiation_id) {
      return {
        success: false,
        error: "This exchange does not have a linked negotiation.",
      }
    }

    const { data: membership, error: membershipError } = await supabase
      .from("exchange_participant")
      .select("user_id")
      .eq("exchange_id", request.exchange_id)
      .eq("user_id", request.creator_user_id)
      .maybeSingle()

    if (membershipError) {
      return { success: false, error: membershipError.message }
    }

    if (!membership) {
      return { success: false, error: "You are not a participant in this exchange." }
    }

    const { data: participants, error: participantsError } = await supabase
      .from("exchange_participant")
      .select("user_id")
      .eq("exchange_id", request.exchange_id)

    if (participantsError) {
      return { success: false, error: participantsError.message }
    }

    const participantIds = (participants ?? []).map((p) => p.user_id)
    if (participantIds.length === 0) {
      return { success: false, error: "No exchange participants found." }
    }

    let addressId: string | null = null
    let platform: string | null = null
    let accessCode: string | null = null

    if (request.meeting_type === "physical") {
      if (!request.address) {
        return { success: false, error: "Address is required for a physical meeting." }
      }

      const parsedAddress = AddressSchema.safeParse(request.address)
      if (!parsedAddress.success) {
        const message = parsedAddress.error.errors.map((e) => e.message).join(" ")
        return { success: false, error: message }
      }

      const { addressId: createdAddressId, error: addressError } =
        await createAddressRecord(normalizeAddress(parsedAddress.data))

      if (addressError || !createdAddressId) {
        return { success: false, error: addressError ?? "Failed to create address." }
      }

      addressId = createdAddressId
    }

    if (request.meeting_type === "virtual") {
      platform = request.platform?.trim() || null
      accessCode = request.access_code?.trim() || null

      if (!platform) {
        return { success: false, error: "Platform is required for a virtual meeting." }
      }

      if (!accessCode) {
        return { success: false, error: "Access code or link is required for a virtual meeting." }
      }
    }

    const { data: meeting, error: meetingError } = await supabase
      .from("meeting")
      .insert({
        negotiation_id: exchange.negotiation_id,
        address_id: addressId,
        meeting_type: request.meeting_type,
        platform,
        access_code: accessCode,
        scheduled_at: request.scheduled_at,
        due_date: request.due_date || null,
        created_by_user_id: request.creator_user_id,
      })
      .select("meeting_id")
      .single()

    if (meetingError || !meeting) {
      return { success: false, error: meetingError?.message ?? "Failed to create meeting." }
    }

    const inviteeRows = participantIds.map((userId) => ({
      meeting_id: meeting.meeting_id,
      user_id: userId,
      rsvp_status: userId === request.creator_user_id ? "accepted" : "pending",
    }))

    const { error: inviteeError } = await supabase
      .from("meeting_invitee")
      .insert(inviteeRows)

    if (inviteeError) {
      await supabase.from("meeting").delete().eq("meeting_id", meeting.meeting_id)
      return { success: false, error: inviteeError.message }
    }

    await notifyInvitees(meeting.meeting_id, request.creator_user_id, participantIds)

    return {
      success: true,
      data: { meeting_id: meeting.meeting_id },
      message: "Meeting created successfully.",
    }
  } catch (err) {
    console.error("Error creating meeting:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    }
  }
}

export async function updateMeeting(
  request: UpdateMeetingRequest
): Promise<ApiResponse<null>> {
  try {
    const supabase = await createClient()

    if (!request.meeting_id?.trim()) {
      return { success: false, error: "Meeting is required." }
    }

    if (!request.actor_user_id?.trim()) {
      return { success: false, error: "User is required." }
    }

    const { data: existingMeeting, error: existingError } = await supabase
      .from("meeting")
      .select("meeting_id,created_by_user_id,scheduled_at")
      .eq("meeting_id", request.meeting_id)
      .single()

    if (existingError || !existingMeeting) {
      return { success: false, error: existingError?.message ?? "Meeting not found." }
    }

    if (existingMeeting.created_by_user_id !== request.actor_user_id) {
      return { success: false, error: "Only the meeting creator can edit this meeting." }
    }

    if (new Date(existingMeeting.scheduled_at) <= new Date()) {
      return { success: false, error: "Past meetings cannot be edited." }
    }

    const timing = validateMeetingTiming(request.scheduled_at, request.due_date)
    if (timing.error || !timing.scheduledDate) {
      return { success: false, error: timing.error }
    }

    let addressId: string | null = null
    let platform: string | null = null
    let accessCode: string | null = null

    if (request.meeting_type === "physical") {
      if (!request.address) {
        return { success: false, error: "Address is required for a physical meeting." }
      }

      const parsedAddress = AddressSchema.safeParse(request.address)
      if (!parsedAddress.success) {
        const message = parsedAddress.error.errors.map((e) => e.message).join(" ")
        return { success: false, error: message }
      }

      const { addressId: createdAddressId, error: addressError } =
        await createAddressRecord(normalizeAddress(parsedAddress.data))

      if (addressError || !createdAddressId) {
        return { success: false, error: addressError ?? "Failed to create address." }
      }

      addressId = createdAddressId
    }

    if (request.meeting_type === "virtual") {
      platform = request.platform?.trim() || null
      accessCode = request.access_code?.trim() || null

      if (!platform) {
        return { success: false, error: "Platform is required for a virtual meeting." }
      }

      if (!accessCode) {
        return { success: false, error: "Access code or link is required for a virtual meeting." }
      }
    }

    const { error: updateError } = await supabase
      .from("meeting")
      .update({
        address_id: addressId,
        meeting_type: request.meeting_type,
        platform,
        access_code: accessCode,
        scheduled_at: request.scheduled_at,
        due_date: request.due_date || null,
      })
      .eq("meeting_id", request.meeting_id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return {
      success: true,
      data: null,
      message: "Meeting updated successfully.",
    }
  } catch (err) {
    console.error("Error updating meeting:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    }
  }
}