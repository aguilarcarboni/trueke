"use client";

import { useMemo, useState } from "react";
import { CalendarClock, MapPin, Pencil, Video, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MeetingSummary } from "@/lib/entities/meeting";
import { useToast } from "@/hooks/use-toast";
import { respondToMeeting } from "@/app/actions/meeting";

interface MeetingSummaryCardProps {
  meeting: MeetingSummary;
  currentUserId: string;
  onEdit?: () => void;
  onMeetingChanged?: () => void;
}

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    console.error("Failed to copy meeting link");
  }
}

function formatAddress(meeting: MeetingSummary): string {
  if (!meeting.address) return "Physical meeting";

  return [
    meeting.address.addressLine1,
    meeting.address.muniDistrict,
    meeting.address.city,
    meeting.address.province,
  ]
    .filter(Boolean)
    .join(", ");
}

export function MeetingSummaryCard({
  meeting,
  currentUserId,
  onEdit,
  onMeetingChanged,
}: MeetingSummaryCardProps) {
  const isVirtual = meeting.meeting_type === "virtual";
  const isCreator = meeting.created_by_user_id === currentUserId;
  const canEdit = isCreator && new Date(meeting.scheduled_at) > new Date();
  const canRespond = new Date(meeting.scheduled_at) > new Date();
  const { toast } = useToast();
  const [isSavingRsvp, setIsSavingRsvp] = useState(false);
  const myInvitee = meeting.invitees.find((invitee) => invitee.user_id === currentUserId);

  const rsvpSummary = useMemo(() => {
    const base = { accepted: 0, declined: 0, maybe: 0, pending: 0, overdue: 0 };
    for (const invitee of meeting.invitees) {
      base[invitee.rsvp_status] += 1;
    }
    return base;
  }, [meeting.invitees]);

  const handleRespond = async (response: "accepted" | "declined" | "maybe") => {
    if (!myInvitee) return;
    setIsSavingRsvp(true);
    try {
      const result = await respondToMeeting(
        meeting.meeting_id,
        currentUserId,
        response,
      );

      if (!result.success) {
        toast({
          title: "Couldn't update RSVP",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "RSVP updated",
        description: `You responded "${response}".`,
      });
      onMeetingChanged?.();
    } finally {
      setIsSavingRsvp(false);
    }
  };

  return (
    <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          Meeting
        </div>

        <Badge variant="outline" className="capitalize">
          {meeting.meeting_type}
        </Badge>
      </div>

      <div className="text-xs text-muted-foreground">
        {new Date(meeting.scheduled_at).toLocaleString()}
      </div>

      {myInvitee && (
        <div className="text-xs text-muted-foreground">
          Your RSVP: <span className="capitalize">{myInvitee.rsvp_status}</span>
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        {isVirtual ? (
          <Video className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        ) : (
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        )}

        <div className="break-words text-xs text-muted-foreground">
          {isVirtual ? (
            <div className="space-y-1">
              <div>{meeting.platform || "Virtual meeting"}</div>

              {meeting.access_code && (
                <div className="flex items-center gap-2 flex-wrap">
                  {looksLikeUrl(meeting.access_code) ? (
                    <a
                      href={meeting.access_code}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      Join meeting
                    </a>
                  ) : (
                    <span>{meeting.access_code}</span>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={async () => {
                      await copyToClipboard(meeting.access_code!);

                      toast({
                        title: "Copied",
                        description:
                          "Meeting access details copied to clipboard.",
                      });
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <span>{formatAddress(meeting)}</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        <Badge variant="secondary">Accepted {rsvpSummary.accepted}</Badge>
        <Badge variant="secondary">Declined {rsvpSummary.declined}</Badge>
        <Badge variant="secondary">Maybe {rsvpSummary.maybe}</Badge>
        <Badge variant="secondary">Pending {rsvpSummary.pending}</Badge>
        <Badge variant="secondary">Overdue {rsvpSummary.overdue}</Badge>
      </div>

      {myInvitee && canRespond && (
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            size="sm"
            variant="default"
            className="h-7 text-xs"
            onClick={() => handleRespond("accepted")}
            disabled={isSavingRsvp}
          >
            Accept
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => handleRespond("declined")}
            disabled={isSavingRsvp}
          >
            Decline
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-7 text-xs"
            onClick={() => handleRespond("maybe")}
            disabled={isSavingRsvp}
          >
            Maybe
          </Button>
        </div>
      )}

      {canEdit && onEdit && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 w-full gap-1 text-xs"
          onClick={onEdit}
        >
          <Pencil className="h-3 w-3" />
          Edit Meeting
        </Button>
      )}
    </div>
  );
}
