import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MeetingFormDialog } from "./meeting-form-dialog";
import type { MeetingSummary } from "@/lib/entities/meeting";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const createMeetingForExchange = vi.fn();
const updateMeeting = vi.fn();

vi.mock("@/app/actions/meeting", () => ({
  createMeetingForExchange: (...args: unknown[]) =>
    createMeetingForExchange(...args),
  updateMeeting: (...args: unknown[]) => updateMeeting(...args),
}));

function makeMeeting(overrides: Partial<MeetingSummary> = {}): MeetingSummary {
  return {
    meeting_id: "meeting-1",
    negotiation_id: "negotiation-1",
    meeting_type: "virtual",
    scheduled_at: "2099-01-01T15:00:00.000Z",
    due_date: null,
    platform: "Zoom",
    access_code: "zoom-link",
    created_by_user_id: "user-1",
    address: null,
    invitees: [],
    ...overrides,
  };
}

describe("MeetingFormDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createMeetingForExchange.mockResolvedValue({
      success: true,
      data: { meeting_id: "meeting-1" },
      message: "Meeting created successfully.",
    });
    updateMeeting.mockResolvedValue({
      success: true,
      data: null,
      message: "Meeting updated successfully.",
    });
  });

  it("renders create title when no meeting is provided", () => {
    render(
      <MeetingFormDialog
        open
        onOpenChange={vi.fn()}
        exchangeId="exchange-1"
        currentUserId="user-1"
      />,
    );

    expect(screen.getByText(/schedule meeting/i)).toBeInTheDocument();
  });

  it("renders edit title when meeting is provided", () => {
    render(
      <MeetingFormDialog
        open
        onOpenChange={vi.fn()}
        exchangeId="exchange-1"
        currentUserId="user-1"
        meeting={makeMeeting()}
      />,
    );

    expect(screen.getByText(/edit meeting/i)).toBeInTheDocument();
  });

  it("shows virtual fields when virtual type is selected", () => {
    render(
      <MeetingFormDialog
        open
        onOpenChange={vi.fn()}
        exchangeId="exchange-1"
        currentUserId="user-1"
      />,
    );

    fireEvent.click(screen.getAllByRole("combobox")[0]);
    fireEvent.click(screen.getByText("Virtual"));

    expect(screen.getByLabelText(/platform/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/access code or link/i)).toBeInTheDocument();
  });

  it("calls createMeetingForExchange when creating a virtual meeting", async () => {
    const onOpenChange = vi.fn();
    const onSuccess = vi.fn();

    render(
      <MeetingFormDialog
        open
        onOpenChange={onOpenChange}
        exchangeId="exchange-1"
        currentUserId="user-1"
        onSuccess={onSuccess}
      />,
    );

    fireEvent.click(screen.getAllByRole("combobox")[0]);
    fireEvent.click(screen.getByText("Virtual"));

    fireEvent.change(screen.getByLabelText(/platform/i), {
      target: { value: "Google Meet" },
    });
    fireEvent.change(screen.getByLabelText(/access code or link/i), {
      target: { value: "meet-link" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create meeting/i }));

    await waitFor(() => {
      expect(createMeetingForExchange).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("calls updateMeeting when editing", async () => {
    render(
      <MeetingFormDialog
        open
        onOpenChange={vi.fn()}
        exchangeId="exchange-1"
        currentUserId="user-1"
        meeting={makeMeeting()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/platform/i), {
      target: { value: "Discord" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(updateMeeting).toHaveBeenCalled();
    });
  });
});
