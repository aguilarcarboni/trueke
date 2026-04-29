"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminTransactionChart } from "./admin-transaction-chart"
import { AdminTrafficChart } from "./admin-traffic-chart"
import { AdminPlatformStats } from "./admin-platform-stats"

export function AdminAnalytics() {
  return (
    <Tabs defaultValue="transactions" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="traffic">Traffic</TabsTrigger>
        <TabsTrigger value="platform">Platform Stats</TabsTrigger>
      </TabsList>

      <TabsContent value="transactions">
        <AdminTransactionChart />
      </TabsContent>

      <TabsContent value="traffic">
        <AdminTrafficChart />
      </TabsContent>

      <TabsContent value="platform">
        <AdminPlatformStats />
      </TabsContent>
    </Tabs>
  )
}
