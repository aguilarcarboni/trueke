"use client"

import { ArrowLeft, Star, MapPin, ArrowLeftRight, Heart, Share2, Flag, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { Item } from "@/lib/data"

interface ItemDetailProps {
  item: Item
  onBack: () => void
}

const conditionLabel: Record<string, string> = {
  "like-new": "Like New",
  good: "Good",
  fair: "Fair",
  worn: "Worn",
  bad: "Bad",
}

const conditionColor: Record<string, string> = {
  "like-new": "bg-success text-success-foreground",
  good: "bg-primary text-primary-foreground",
  fair: "bg-warning text-warning-foreground",
  worn: "bg-accent text-accent-foreground",
  bad: "bg-destructive text-primary-foreground",
}

export function ItemDetail({ item, onBack }: ItemDetailProps) {
  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Marketplace
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Image & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Image */}
          <Card className="overflow-hidden">
            <div className="relative aspect-[16/10]">
              <img
                src={item.images[0]}
                alt={item.title}
                className="h-full w-full object-cover"
                crossOrigin="anonymous"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button size="icon" variant="secondary" className="h-9 w-9 bg-card/90 backdrop-blur-sm hover:bg-card">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="secondary" className="h-9 w-9 bg-card/90 backdrop-blur-sm hover:bg-card">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Item Info */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-card-foreground">{item.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="secondary">{item.category}</Badge>
                    <Badge variant="outline" className="capitalize">{item.type}</Badge>
                    <Badge className={conditionColor[item.condition]}>
                      {conditionLabel[item.condition]}
                    </Badge>
                  </div>
                </div>
                <Badge variant="outline" className="text-sm capitalize">{item.state}</Badge>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold text-card-foreground mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>

              {item.metadata && Object.keys(item.metadata).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold text-card-foreground mb-3">Details</h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {Object.entries(item.metadata).map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-muted p-3">
                          <p className="text-xs text-muted-foreground">{key}</p>
                          <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-card-foreground">Listed by</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={item.owner.avatar} alt={item.owner.name} />
                  <AvatarFallback>{item.owner.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-card-foreground">{item.owner.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{item.owner.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 text-warning fill-warning" />
                    <span className="text-sm font-bold text-foreground">{item.owner.rating}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Rating</p>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center">
                  <span className="text-sm font-bold text-foreground">{item.owner.totalTrades}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Trades</p>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center">
                  <span className="text-sm font-bold text-foreground">{item.owner.joinedDate.split("-")[0]}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Joined</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <ArrowLeftRight className="h-4 w-4" />
                Propose Trade
              </Button>
              <Button variant="outline" className="w-full gap-2">
                <MessageSquare className="h-4 w-4" />
                Send Message
              </Button>
              <Separator />
              <Button variant="ghost" className="w-full gap-2 text-muted-foreground text-sm">
                <Flag className="h-4 w-4" />
                Report Item
              </Button>
            </CardContent>
          </Card>

          {/* Listed date */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">
                Listed on {new Date(item.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
