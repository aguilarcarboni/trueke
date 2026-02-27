"use client"

import { Heart, Plus, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { items, users } from "@/lib/data"

export function Favorites() {
  const favoriteItems = items.slice(0, 4)
  const frequentUsers = users.slice(1, 4)

  const customLists = [
    { name: "Want to Trade", count: 3 },
    { name: "Gift Ideas", count: 5 },
    { name: "Collectibles", count: 2 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Favorites & Lists</h1>
          <p className="text-muted-foreground mt-1">Save items and organize your interests.</p>
        </div>
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          New List
        </Button>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Favorite Items</TabsTrigger>
          <TabsTrigger value="users">Frequent Users</TabsTrigger>
          <TabsTrigger value="lists">Custom Lists</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {favoriteItems.map((item) => (
              <Card key={item.id} className="group overflow-hidden cursor-pointer transition-all hover:shadow-md">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    crossOrigin="anonymous"
                  />
                  <button className="absolute top-2 right-2 rounded-full bg-card/90 p-1.5 backdrop-blur-sm transition-colors hover:bg-destructive hover:text-destructive-foreground">
                    <Heart className="h-4 w-4 fill-current text-destructive" />
                  </button>
                </div>
                <CardContent className="pt-3 pb-4">
                  <p className="text-sm font-medium text-card-foreground truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={item.owner.avatar} alt={item.owner.name} />
                      <AvatarFallback className="text-[10px]">{item.owner.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{item.owner.name}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {frequentUsers.map((user) => (
              <Card key={user.id} className="transition-all hover:shadow-md">
                <CardContent className="pt-6 flex items-center gap-4">
                  <Avatar className="h-14 w-14 shrink-0">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-card-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{user.location}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{user.totalTrades} trades</Badge>
                      <span className="text-xs text-muted-foreground">Rating: {user.rating}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Message</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="lists" className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customLists.map((list) => (
              <Card key={list.name} className="cursor-pointer transition-all hover:shadow-md">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-card-foreground">{list.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{list.count} items</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            <Card className="cursor-pointer border-dashed transition-all hover:shadow-md hover:border-primary">
              <CardContent className="pt-6 flex items-center justify-center gap-2 text-muted-foreground">
                <Plus className="h-5 w-5" />
                <span className="font-medium">Create New List</span>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
