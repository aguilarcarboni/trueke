"use client";

import { CalendarClock, MapPin, Pencil, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MeetingSummary } from "@/lib/entities/meeting";

interface MeetingSummaryCardProps {
  meeting: MeetingSummary;
  currentUserId: string;
  onEdit?: () => void;
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
}: MeetingSummaryCardProps) {
  const isVirtual = meeting.meeting_type === "virtual";
  const isCreator = meeting.created_by_user_id === currentUserId;
  const canEdit = isCreator && new Date(meeting.scheduled_at) > new Date();

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

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        {isVirtual ? (
          <Video className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        ) : (
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        )}

        <span className="break-words">
          {isVirtual
            ? `${meeting.platform || "Virtual"}${meeting.access_code ? ` · ${meeting.access_code}` : ""}`
            : formatAddress(meeting)}
        </span>
      </div>

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
