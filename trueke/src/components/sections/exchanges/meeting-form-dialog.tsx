"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressForm } from "@/components/misc/address-form";
import { useToast } from "@/hooks/use-toast";
import { createMeetingForExchange, updateMeeting } from "@/app/actions/meeting";
import type { MeetingSummary, MeetingType } from "@/lib/entities/meeting";
import type { AddressFormData } from "@/lib/entities/address";

const EMPTY_ADDRESS: AddressFormData = {
  countryCode: "CR",
  province: "",
  city: "",
  zipCode: "",
  addressLine1: "",
  addressLine2: "",
  muniDistrict: "",
};

interface MeetingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exchangeId: string;
  currentUserId: string;
  meeting?: MeetingSummary | null;
  onSuccess?: () => void;
}

function toDateValue(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function toLocalSqlTimestamp(value?: Date): string {
  if (!value) return "";
  return format(value, "yyyy-MM-dd HH:mm:ss");
}

export function MeetingFormDialog({
  open,
  onOpenChange,
  exchangeId,
  currentUserId,
  meeting,
  onSuccess,
}: MeetingFormDialogProps) {
  const { toast } = useToast();
  const isEditing = Boolean(meeting);

  const [meetingType, setMeetingType] = useState<MeetingType>("physical");
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [platform, setPlatform] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [address, setAddress] = useState<AddressFormData>(EMPTY_ADDRESS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (meeting) {
      setMeetingType(meeting.meeting_type);
      setScheduledAt(toDateValue(meeting.scheduled_at));
      setDueDate(toDateValue(meeting.due_date));
      setPlatform(meeting.platform || "");
      setAccessCode(meeting.access_code || "");
      setAddress(
        meeting.address
          ? {
              countryCode: meeting.address.countryCode,
              province: meeting.address.province,
              city: meeting.address.city,
              zipCode: meeting.address.zipCode,
              addressLine1: meeting.address.addressLine1,
              addressLine2: meeting.address.addressLine2,
              muniDistrict: meeting.address.muniDistrict,
            }
          : EMPTY_ADDRESS,
      );
    } else {
      setMeetingType("physical");
      setScheduledAt(undefined);
      setDueDate(undefined);
      setPlatform("");
      setAccessCode("");
      setAddress(EMPTY_ADDRESS);
    }
  }, [open, meeting]);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const scheduledValue = toLocalSqlTimestamp(scheduledAt);
      const dueValue = dueDate ? toLocalSqlTimestamp(dueDate) : null;

      const payload = {
        meeting_type: meetingType,
        scheduled_at: scheduledValue,
        due_date: dueValue,
        address: meetingType === "physical" ? address : null,
        platform: meetingType === "virtual" ? platform : null,
        access_code: meetingType === "virtual" ? accessCode : null,
      };

      const result =
        meeting && isEditing
          ? await updateMeeting({
              meeting_id: meeting.meeting_id,
              actor_user_id: currentUserId,
              ...payload,
            })
          : await createMeetingForExchange({
              exchange_id: exchangeId,
              creator_user_id: currentUserId,
              ...payload,
            });

      if (!result.success) {
        toast({
          title: isEditing
            ? "Couldn't update meeting"
            : "Couldn't create meeting",
          description:
            result.error || "Please check the meeting details and try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: isEditing ? "Meeting updated" : "Meeting scheduled",
        description: result.message,
      });

      onOpenChange(false);
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Meeting" : "Schedule Meeting"}
          </DialogTitle>
          <DialogDescription>
            Add the meeting details for this accepted exchange.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-sm">Meeting type</Label>
            <Select
              value={meetingType}
              onValueChange={(value) => setMeetingType(value as MeetingType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select meeting type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="physical">Physical</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-sm">
                Date and time <span className="text-destructive">*</span>
              </Label>
              <DateTimePicker
                value={scheduledAt}
                onChange={setScheduledAt}
                granularity="minute"
                hourCycle={12}
                placeholder="Select scheduled time"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">
                End time
              </Label>
              <DateTimePicker
                value={dueDate}
                onChange={setDueDate}
                granularity="minute"
                hourCycle={12}
                placeholder="Select end time"
              />
            </div>
          </div>

          {meetingType === "physical" ? (
            <AddressForm value={address} onChange={setAddress} />
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="platform" className="text-sm">
                  Platform <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  placeholder="Zoom, Google Meet, Discord..."
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="accessCode" className="text-sm">
                  Access code or link{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="accessCode"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Meeting link, room code, or invite details"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Save Changes" : "Create Meeting"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
