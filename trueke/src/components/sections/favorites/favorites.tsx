"use client"

import { Heart, Plus, MoreHorizontal } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function Favorites() {

  const customLists = [
    { name: "Want to Trade", count: 3 },
    { name: "Gift Ideas", count: 5 },
    { name: "Collectibles", count: 2 },
  ]

  return (
    <div className="flex min-h-full w-full flex-1 flex-col space-y-6">
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
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
