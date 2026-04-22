"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, MessageSquare, Send } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ExchangeStatusBadge } from "@/components/sections/exchanges/exchange-status-badge"
import type { ExchangeStatus } from "@/lib/entities/exchange"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { AddUserToListButton } from "@/components/misc/add-user-to-list-button"
import { useToast } from "@/hooks/use-toast"
import { getFriendlyErrorMessage } from "@/lib/error-messages"
import {
  formatMessageTimestamp,
  MESSAGE_MAX_LENGTH,
  QUICK_MESSAGE_TEMPLATES,
  type ConversationEntry,
  type ConversationListItem,
} from "@/lib/entities/message"
import {
  getConversationMessages,
  getMyConversations,
  sendMessage,
} from "@/app/actions/message"


const POLL_INTERVAL_MS = 30_000

interface MessagesProps {
  currentUserId: string
}

export function Messages({ currentUserId }: MessagesProps) {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const requestedConversationId = searchParams.get("conversationId")
  const requestedExchangeId = searchParams.get("exchangeId")

  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [entries, setEntries] = useState<ConversationEntry[]>([])
  const [draft, setDraft] = useState("")
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.conversation_id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  )

  const unreadTotal = useMemo(
    () => conversations.reduce((acc, conversation) => acc + conversation.unread_count, 0),
    [conversations]
  )

  const loadConversations = useCallback(async (silent = false) => {
    if (!currentUserId) return

    if (!silent) setIsLoadingConversations(true)
    try {
      const result = await getMyConversations(currentUserId)

      if (result.success && result.data) {
        setConversations(result.data)
      } else if (!silent) {
        toast({
          title: "Couldn't load conversations",
          description: getFriendlyErrorMessage(result.error),
          variant: "destructive",
        })
      }
    } catch {
      if (!silent) {
        toast({
          title: "Connection error",
          description: "We couldn't reach the server. Please try again.",
          variant: "destructive",
        })
      }
    }

    if (!silent) setIsLoadingConversations(false)
  }, [currentUserId, toast])

  const loadConversationEntries = useCallback(
    async (conversationId: string, silent = false) => {
      if (!currentUserId || !conversationId) return

      if (!silent) setIsLoadingMessages(true)

      try {
        const result = await getConversationMessages(currentUserId, conversationId)
        if (result.success && result.data) {
          setEntries(result.data)
        } else if (!silent) {
          toast({
            title: "Couldn't load messages",
            description: getFriendlyErrorMessage(result.error),
            variant: "destructive",
          })
        }
      } catch {
        if (!silent) {
          toast({
            title: "Connection error",
            description: "We couldn't reach the server. Please try again.",
            variant: "destructive",
          })
        }
      }

      if (!silent) setIsLoadingMessages(false)
    },
    [currentUserId, toast]
  )

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (conversations.length === 0) {
      setSelectedConversationId(null)
      setEntries([])
      return
    }

    if (
      requestedConversationId &&
      conversations.some((conversation) => conversation.conversation_id === requestedConversationId)
    ) {
      setSelectedConversationId(requestedConversationId)
      return
    }

    if (requestedExchangeId) {
      const byExchange = conversations.find(
        (conversation) => conversation.exchange_id === requestedExchangeId
      )
      if (byExchange) {
        setSelectedConversationId(byExchange.conversation_id)
        return
      }
    }

    if (
      selectedConversationId &&
      conversations.some((conversation) => conversation.conversation_id === selectedConversationId)
    ) {
      return
    }

    setSelectedConversationId(conversations[0].conversation_id)
  }, [conversations, requestedConversationId, requestedExchangeId, selectedConversationId])

  useEffect(() => {
    if (!selectedConversationId) return

    loadConversationEntries(selectedConversationId).then(() => {
      loadConversations(true)
    })
  }, [selectedConversationId, loadConversationEntries, loadConversations])

  useEffect(() => {
    if (!currentUserId) return

    const pollId = setInterval(() => {
      loadConversations(true)
      if (selectedConversationId) {
        loadConversationEntries(selectedConversationId, true)
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(pollId)
  }, [currentUserId, loadConversations, loadConversationEntries, selectedConversationId])

  const handleSendMessage = async () => {
    if (!selectedConversationId || !draft.trim()) return

    setIsSending(true)
    try {
      const result = await sendMessage({
        conversation_id: selectedConversationId,
        sender_user_id: currentUserId,
        content: draft,
      })

      if (result.success) {
        setDraft("")
        await Promise.all([
          loadConversationEntries(selectedConversationId, true),
          loadConversations(true),
        ])
      } else {
        toast({
          title: "Couldn't send message",
          description: getFriendlyErrorMessage(result.error),
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Connection error",
        description: "We couldn't reach the server. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const isSendDisabled =
    !selectedConversationId ||
    !draft.trim() ||
    draft.length > MESSAGE_MAX_LENGTH ||
    isSending

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="mt-1 text-muted-foreground">
          Discuss your exchanges with the other participant.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="flex h-[70vh] min-h-0 flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              Conversations
              {unreadTotal > 0 ? (
                <Badge variant="destructive">{unreadTotal > 99 ? "99+" : unreadTotal}</Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto p-2">
            {isLoadingConversations ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8" />
                <p className="text-sm">No conversations yet.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => {
                  const isActive = conversation.conversation_id === selectedConversationId

                  return (
                    <button
                      key={conversation.conversation_id}
                      onClick={() => setSelectedConversationId(conversation.conversation_id)}
                      className={`w-full rounded-md p-3 text-left transition-colors ${
                        isActive
                          ? "bg-primary/10"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={conversation.other_user.profile_picture_url || undefined}
                            alt={conversation.other_user.username}
                          />
                          <AvatarFallback>
                            {conversation.other_user.username.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium">
                              {conversation.other_user.username}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatMessageTimestamp(conversation.updated_at)}
                            </span>
                          </div>

                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {conversation.last_message_preview}
                          </p>

                          {conversation.unread_count > 0 ? (
                            <Badge className="mt-2" variant="destructive">
                              {conversation.unread_count}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex h-[70vh] min-h-0 flex-col overflow-hidden">
          {!selectedConversation ? (
            <CardContent className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10" />
              <p>Select a conversation to view your message history.</p>
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2"> 
                    <span>{selectedConversation.other_user.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExchangeStatusBadge status={selectedConversation.exchange_status as ExchangeStatus} />
                    <AddUserToListButton
                      targetUserId={selectedConversation.other_user.user_id}
                      targetUsername={selectedConversation.other_user.username}
                    />
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="flex min-h-0 flex-1 flex-col p-0">
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                  {isLoadingMessages ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {entries.map((entry) => {
                        const isMine = entry.sender_user_id === currentUserId

                        if (entry.type === "proposal") {
                          return (
                            <div key={entry.entry_id} className="rounded-lg border bg-muted/40 p-4">
                              <p className="text-sm font-semibold">Trade Proposal</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Started by {entry.sender_name} · {formatMessageTimestamp(entry.created_at)}
                              </p>

                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Items offered
                                  </p>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {(entry.proposal_details?.offered_items || []).map((item) => (
                                      <Badge key={`offered-${entry.entry_id}-${item}`} variant="secondary">
                                        {item}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Items requested
                                  </p>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {(entry.proposal_details?.requested_items || []).map((item) => (
                                      <Badge key={`requested-${entry.entry_id}-${item}`} variant="secondary">
                                        {item}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {entry.proposal_details?.initial_message ? (
                                <p className="mt-3 rounded-md bg-background p-3 text-sm italic text-muted-foreground">
                                  “{entry.proposal_details.initial_message}”
                                </p>
                              ) : null}
                            </div>
                          )
                        }

                        return (
                          <div
                            key={entry.entry_id}
                            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                                isMine
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-foreground"
                              }`}
                            >
                              {!isMine ? (
                                <p className="mb-1 text-[11px] font-semibold opacity-80">
                                  {entry.sender_name}
                                </p>
                              ) : null}
                              <p className="whitespace-pre-wrap text-sm">{entry.content}</p>
                              <p className="mt-1 text-[10px] opacity-80">
                                {formatMessageTimestamp(entry.created_at)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t px-4 py-3">
                  <div className="mb-2 flex flex-wrap gap-2">
                    {QUICK_MESSAGE_TEMPLATES.map((template) => (
                      <button
                        key={template}
                        type="button"
                        className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                        onClick={() => setDraft(template)}
                      >
                        {template}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={draft}
                      maxLength={MESSAGE_MAX_LENGTH}
                      onChange={(event) => setDraft(event.target.value)}
                      rows={3}
                      className="resize-none"
                    />

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">
                        {draft.length}/{MESSAGE_MAX_LENGTH}
                      </p>

                      <Button
                        onClick={handleSendMessage}
                        disabled={isSendDisabled}
                        className="gap-2 self-end sm:self-auto"
                      >
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Send a message
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
