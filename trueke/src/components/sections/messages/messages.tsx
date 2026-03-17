"use client"

import { useState } from "react"
import { Send, Paperclip, ArrowLeftRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { conversations, currentUser } from "@/lib/data"
import type { Conversation } from "@/lib/data"

export function Messages() {
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(conversations[0])

  const otherParticipant = (convo: Conversation) =>
    convo.participants.find((p) => p.id !== currentUser.id) || convo.participants[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">Negotiate trades and communicate with other users.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="flex h-[600px]">
          {/* Conversation list */}
          <div className="w-80 border-r border-border shrink-0">
            <div className="p-4 border-b border-border">
              <Input placeholder="Search conversations..." className="h-9" />
            </div>
            <ScrollArea className="h-[calc(600px-57px)]">
              {conversations.map((convo) => {
                const other = otherParticipant(convo)
                const isActive = selectedConvo?.id === convo.id
                return (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedConvo(convo)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                      isActive ? "bg-primary/5" : "hover:bg-muted"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={other.avatar} alt={other.name} />
                        <AvatarFallback>{other.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {convo.unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                          {convo.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium truncate ${convo.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                          {other.name}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          {new Date(convo.lastMessageTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 truncate ${convo.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {convo.lastMessage}
                      </p>
                    </div>
                  </button>
                )
              })}
            </ScrollArea>
          </div>

          {/* Chat area */}
          {selectedConvo ? (
            <div className="flex flex-1 flex-col">
              {/* Chat header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={otherParticipant(selectedConvo).avatar} alt={otherParticipant(selectedConvo).name} />
                    <AvatarFallback>{otherParticipant(selectedConvo).name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{otherParticipant(selectedConvo).name}</p>
                    <p className="text-xs text-muted-foreground">{otherParticipant(selectedConvo).location}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  Propose Trade
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-5">
                <div className="space-y-4">
                  {selectedConvo.messages.map((msg) => {
                    const isMe = msg.sender.id === currentUser.id
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? "flex-row-reverse" : ""}`}>
                          {!isMe && (
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarImage src={msg.sender.avatar} alt={msg.sender.name} />
                              <AvatarFallback className="text-[10px]">{msg.sender.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted text-foreground rounded-bl-md"
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {new Date(msg.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t border-border p-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input placeholder="Type a message..." className="flex-1" />
                  <Button size="icon" className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-muted-foreground">Select a conversation to start chatting.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
