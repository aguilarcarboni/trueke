import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExchangeCard } from "./exchange-card";
import type { ExchangeListItemEnriched } from "@/lib/entities/exchange";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/app/actions/review", () => ({
  hasUserReviewedExchange: vi
    .fn()
    .mockResolvedValue({ success: true, data: false }),
}));

vi.mock("@/components/sections/exchanges/user-profile-dialog", () => ({
  UserProfileDialog: () => null,
}));

vi.mock("@/components/sections/exchanges/review-dialog", () => ({
  ReviewDialog: () => null,
}));

vi.mock("@/components/sections/exchanges/counteroffer-dialog", () => ({
  CounterOfferDialog: () => null,
}));

vi.mock("@/components/sections/exchanges/exchange-history", () => ({
  ExchangeHistory: () => null,
}));

vi.mock("@/components/misc/add-user-to-list-button", () => ({
  AddUserToListButton: () => null,
}));

vi.mock("@/components/sections/exchanges/meeting-form-dialog", () => ({
  MeetingFormDialog: () => null,
}));

function makeExchange(
  overrides: Partial<ExchangeListItemEnriched> = {},
): ExchangeListItemEnriched {
  return {
    exchange_id: "exchange-1",
    negotiation_id: "negotiation-1",
    initiator_id: "user-1",
    initiator_name: "alice",
    target_user_id: "user-2",
    target_name: "bob",
    status: "accepted",
    message: "Trade?",
    created_at: "2026-01-01T00:00:00Z",
    expires_at: "2026-01-08T00:00:00Z",
    offered_count: 1,
    requested_count: 1,
    parent_exchange_id: null,
    offered_items: [
      {
        item_id: "item-1",
        title: "Book",
        condition: "used",
        owner_id: "user-1",
        images: [],
      },
    ],
    requested_items: [
      {
        item_id: "item-2",
        title: "Headphones",
        condition: "like new",
        owner_id: "user-2",
        images: [],
      },
    ],
    meetings: [],
    ...overrides,
  };
}

const baseProps = {
  currentUserId: "user-1",
  isLoading: false,
  onAccept: vi.fn(),
  onReject: vi.fn(),
  onCancel: vi.fn(),
  onComplete: vi.fn(),
};

describe("ExchangeCard meeting UI", () => {
  it("shows Schedule Meeting for accepted exchange without meeting", () => {
    render(<ExchangeCard exchange={makeExchange()} {...baseProps} />);

    expect(
      screen.getByRole("button", { name: /schedule meeting/i }),
    ).toBeInTheDocument();
  });

  it("does not show Schedule Meeting for pending exchange", () => {
    render(
      <ExchangeCard
        exchange={makeExchange({ status: "pending" })}
        {...baseProps}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /schedule meeting/i }),
    ).not.toBeInTheDocument();
  });

  it("shows meeting summary for accepted exchange with meeting", () => {
    render(
      <ExchangeCard
        exchange={makeExchange({
          meetings: [
            {
              meeting_id: "meeting-1",
              negotiation_id: "negotiation-1",
              meeting_type: "virtual",
              scheduled_at: "2099-01-01T15:00:00.000Z",
              due_date: null,
              platform: "Zoom",
              access_code: "zoom-link",
              address: null,
              created_by_user_id: "user-1",
              invitees: [],
            },
          ],
        })}
        {...baseProps}
      />,
    );

    expect(screen.getByText(/zoom/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /edit meeting/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/zoom/i)).toBeInTheDocument();
  });
});
