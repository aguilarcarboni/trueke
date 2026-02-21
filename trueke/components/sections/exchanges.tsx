"use client"

import { useState } from "react"
import { ArrowLeftRight, Check, X, Clock, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { exchanges } from "@/lib/data"

const statusStyles: Record<string, string> = {
  open: "bg-primary/10 text-primary border-primary/20",
  accepted: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  expired: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-muted text-muted-foreground border-border",
}

export function Exchanges() {
  const [activeTab, setActiveTab] = useState("all")

  const filteredExchanges = activeTab === "all"
    ? exchanges
    : exchanges.filter((e) => e.status === activeTab)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exchanges</h1>
          <p className="text-muted-foreground mt-1">Manage your trade proposals and negotiations.</p>
        </div>
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <ArrowLeftRight className="h-4 w-4" />
          New Trade
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({exchanges.length})</TabsTrigger>
          <TabsTrigger value="open">Open ({exchanges.filter(e => e.status === "open").length})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {filteredExchanges.map((ex) => (
            <Card key={ex.id} className="transition-all hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={ex.initiator.avatar} alt={ex.initiator.name} />
                      <AvatarFallback>{ex.initiator.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-card-foreground">{ex.initiator.name}</p>
                        <Badge variant="outline" className="capitalize text-xs">
                          {ex.type === "group" && <Users className="mr-1 h-3 w-3" />}
                          {ex.type} trade
                        </Badge>
                        <Badge className={`text-xs border ${statusStyles[ex.status]}`}>
                          {ex.status}
                        </Badge>
                      </div>

                      {/* Items */}
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Offering:</span>
                          {ex.itemsOffered.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 rounded-md bg-muted px-2 py-1">
                              <img src={item.images[0]} alt={item.title} className="h-6 w-6 rounded object-cover" crossOrigin="anonymous" />
                              <span className="text-xs font-medium text-foreground truncate max-w-32">{item.title}</span>
                            </div>
                          ))}
                        </div>
                        <ArrowLeftRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Wants:</span>
                          {ex.itemsRequested.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 rounded-md bg-muted px-2 py-1">
                              <img src={item.images[0]} alt={item.title} className="h-6 w-6 rounded object-cover" crossOrigin="anonymous" />
                              <span className="text-xs font-medium text-foreground truncate max-w-32">{item.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {ex.message && (
                        <p className="text-sm text-muted-foreground mt-3 italic">
                          {'"'}{ex.message}{'"'}
                        </p>
                      )}

                      {/* Participants */}
                      {ex.type === "group" && (
                        <div className="mt-3 flex items-center gap-1">
                          <span className="text-xs text-muted-foreground mr-1">Participants:</span>
                          <div className="flex -space-x-2">
                            {ex.participants.map((p) => (
                              <Avatar key={p.id} className="h-6 w-6 border-2 border-card">
                                <AvatarImage src={p.avatar} alt={p.name} />
                                <AvatarFallback className="text-[10px]">{p.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground/70 mt-2">
                        <Clock className="inline-block h-3 w-3 mr-1" />
                        {new Date(ex.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {ex.status === "open" && (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" className="gap-1 bg-success text-success-foreground hover:bg-success/90">
                        <Check className="h-3.5 w-3.5" />
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10">
                        <X className="h-3.5 w-3.5" />
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredExchanges.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <ArrowLeftRight className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground mt-3">No exchanges found with this filter.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
