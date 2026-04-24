import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  getUserListMembers,
  addUserToList,
  removeUserFromList,
} from "./user-list"
import { createClient } from "@/utils/supabase/server"

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}))

type QueryResult = {
  data: any
  error: any
}

function createQueryBuilder(result: QueryResult) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    insert: vi.fn(() => Promise.resolve(result)),
    delete: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: QueryResult) => unknown) => Promise.resolve(result).then(resolve),
  }

  return builder
}

function createSupabaseMock(results: Record<string, QueryResult | QueryResult[]>) {
  const tableCalls: string[] = []

  const supabase = {
    from: vi.fn((table: string) => {
      tableCalls.push(table)

      const tableResult = results[table] ?? { data: null, error: null }
      const result = Array.isArray(tableResult)
        ? tableResult.shift() ?? { data: null, error: null }
        : tableResult

      return createQueryBuilder(result)
    }),
  }

  return { supabase, tableCalls }
}

describe("user-list privacy", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns members when the list is owned by the user", async () => {
    const { supabase } = createSupabaseMock({
      user_list: {
        data: { list_id: "list-1" },
        error: null,
      },
      user_list_member: {
        data: [
          {
            list_id: "list-1",
            added_date_time: "2026-01-01T00:00:00Z",
            member_user_id: "member-1",
            user: {
              user_id: "member-1",
              username: "janedoe",
              first_name: "Jane",
              last_name: "Doe",
              profile_picture_url: "https://example.com/avatar.jpg",
            },
          },
        ],
        error: null,
      },
      user_address: {
        data: [],
        error: null,
      },
      exchange_participant: {
        data: [],
        error: null,
      },
      user_rating_summary: {
        data: [
          {
            user_id: "member-1",
            average_rating: 4.5,
            total_reviews: 2,
          },
        ],
        error: null,
      },
    })

    vi.mocked(createClient).mockResolvedValue(supabase as any)

    const members = await getUserListMembers("owner-1", "list-1")

    expect(members).toHaveLength(1)
    expect(members[0]).toMatchObject({
      listId: "list-1",
      userId: "member-1",
      username: "janedoe",
      firstName: "Jane",
      lastName: "Doe",
      averageRating: 4.5,
      totalReviews: 2,
    })

    expect(supabase.from).toHaveBeenCalledWith("user_list")
    expect(supabase.from).toHaveBeenCalledWith("user_list_member")
  })

  it("does not return members when the list is not owned by the user", async () => {
    const { supabase } = createSupabaseMock({
      user_list: {
        data: null,
        error: null,
      },
    })

    vi.mocked(createClient).mockResolvedValue(supabase as any)

    const members = await getUserListMembers("owner-1", "someone-elses-list")

    expect(members).toEqual([])
    expect(supabase.from).toHaveBeenCalledTimes(1)
    expect(supabase.from).toHaveBeenCalledWith("user_list")
    expect(supabase.from).not.toHaveBeenCalledWith("user_list_member")
  })

  it("adds a member when the list is owned by the user", async () => {
    const { supabase } = createSupabaseMock({
      user_list: {
        data: { list_id: "list-1" },
        error: null,
      },
      user_list_member: {
        data: null,
        error: null,
      },
    })

    vi.mocked(createClient).mockResolvedValue(supabase as any)

    const result = await addUserToList("owner-1", "list-1", "member-1")

    expect(result).toEqual({ error: null })
    expect(supabase.from).toHaveBeenCalledWith("user_list")
    expect(supabase.from).toHaveBeenCalledWith("user_list_member")
  })

  it("does not add a member when the list is not owned by the user", async () => {
    const { supabase } = createSupabaseMock({
      user_list: {
        data: null,
        error: null,
      },
    })

    vi.mocked(createClient).mockResolvedValue(supabase as any)

    const result = await addUserToList("owner-1", "someone-elses-list", "member-1")

    expect(result).toEqual({ error: "List not found." })
    expect(supabase.from).toHaveBeenCalledTimes(1)
    expect(supabase.from).toHaveBeenCalledWith("user_list")
    expect(supabase.from).not.toHaveBeenCalledWith("user_list_member")
  })

  it("removes a member when the list is owned by the user", async () => {
    const { supabase } = createSupabaseMock({
      user_list: {
        data: { list_id: "list-1" },
        error: null,
      },
      user_list_member: {
        data: null,
        error: null,
      },
    })

    vi.mocked(createClient).mockResolvedValue(supabase as any)

    const result = await removeUserFromList("owner-1", "list-1", "member-1")

    expect(result).toEqual({ error: null })
    expect(supabase.from).toHaveBeenCalledWith("user_list")
    expect(supabase.from).toHaveBeenCalledWith("user_list_member")
  })

  it("does not remove a member when the list is not owned by the user", async () => {
    const { supabase } = createSupabaseMock({
      user_list: {
        data: null,
        error: null,
      },
    })

    vi.mocked(createClient).mockResolvedValue(supabase as any)

    const result = await removeUserFromList("owner-1", "someone-elses-list", "member-1")

    expect(result).toEqual({ error: "List not found." })
    expect(supabase.from).toHaveBeenCalledTimes(1)
    expect(supabase.from).toHaveBeenCalledWith("user_list")
    expect(supabase.from).not.toHaveBeenCalledWith("user_list_member")
  })

  it("returns duplicate member errors without creating notifications", async () => {
    const { supabase } = createSupabaseMock({
      user_list: {
        data: { list_id: "list-1" },
        error: null,
      },
      user_list_member: {
        data: null,
        error: {
          code: "23505",
          message: "duplicate key value violates unique constraint",
        },
      },
    })

    vi.mocked(createClient).mockResolvedValue(supabase as any)

    const result = await addUserToList("owner-1", "list-1", "member-1")

    expect(result).toEqual({ error: "User is already in this list." })
    expect(supabase.from).toHaveBeenCalledWith("user_list_member")
  })
})