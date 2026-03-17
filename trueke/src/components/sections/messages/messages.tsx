"use client"
import { Card } from "@/components/ui/card"
export function Messages() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">Negotiate trades and communicate with other users.</p>
      </div>

      <Card className="overflow-hidden">
      </Card>
    </div>
  )
}
