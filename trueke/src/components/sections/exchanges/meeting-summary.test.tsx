import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MeetingSummaryCard } from "./meeting-summary";
import type { MeetingSummary } from "@/lib/entities/meeting";

function makeMeeting(overrides: Partial<MeetingSummary> = {}): MeetingSummary {
  return {
    meeting_id: "meeting-1",
    negotiation_id: "negotiation-1",
    meeting_type: "physical",
    scheduled_at: "2099-01-01T15:00:00.000Z",
    due_date: null,
    platform: null,
    access_code: null,
    created_by_user_id: "user-1",
    address: {
      address_id: "address-1",
      countryCode: "CR",
      province: "San José",
      city: "San José",
      zipCode: "10101",
      addressLine1: "Central Market",
      addressLine2: "",
      muniDistrict: "Carmen",
    },
    invitees: [
      {
        user_id: "user-1",
        username: "creator",
        rsvp_status: "accepted",
      },
      {
        user_id: "user-2",
        username: "other",
        rsvp_status: "pending",
      },
    ],
    ...overrides,
  };
}

describe("MeetingSummaryCard", () => {
  it("renders physical meeting details", () => {
    render(
      <MeetingSummaryCard meeting={makeMeeting()} currentUserId="user-1" />,
    );

    expect(screen.getByText(/meeting/i)).toBeInTheDocument();
    expect(screen.getByText(/physical/i)).toBeInTheDocument();
    expect(screen.getByText(/central market/i)).toBeInTheDocument();
  });

  it("renders virtual meeting details", () => {
    render(
      <MeetingSummaryCard
        currentUserId="user-1"
        meeting={makeMeeting({
          meeting_type: "virtual",
          address: null,
          platform: "Google Meet",
          access_code: "https://meet.google.com/test",
        })}
      />,
    );

    expect(screen.getByText(/virtual/i)).toBeInTheDocument();
    expect(screen.getByText(/google meet/i)).toBeInTheDocument();
    expect(screen.getByText(/meet.google.com/i)).toBeInTheDocument();
  });

  it("shows edit button for creator before scheduled time", () => {
    render(
      <MeetingSummaryCard
        meeting={makeMeeting()}
        currentUserId="user-1"
        onEdit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /edit meeting/i }),
    ).toBeInTheDocument();
  });

  it("does not show edit button for non-creator", () => {
    render(
      <MeetingSummaryCard
        meeting={makeMeeting()}
        currentUserId="user-2"
        onEdit={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /edit meeting/i }),
    ).not.toBeInTheDocument();
  });

  it("does not show edit button for past meetings", () => {
    render(
      <MeetingSummaryCard
        currentUserId="user-1"
        onEdit={vi.fn()}
        meeting={makeMeeting({ scheduled_at: "2020-01-01T15:00:00.000Z" })}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /edit meeting/i }),
    ).not.toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", () => {
    const onEdit = vi.fn();

    render(
      <MeetingSummaryCard
        meeting={makeMeeting()}
        currentUserId="user-1"
        onEdit={onEdit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /edit meeting/i }));

    expect(onEdit).toHaveBeenCalledOnce();
  });
});
