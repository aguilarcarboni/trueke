"use client"

import { ChevronLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { categories } from "@/lib/data"
import { useState } from "react"

interface CreateItemProps {
  onBack: () => void
}

const conditionLabel: Record<string, string> = {
  "like-new": "Like New",
  good: "Good",
  fair: "Fair",
  worn: "Worn",
  bad: "Bad",
}

export function CreateItem({ onBack }: CreateItemProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Electronics",
    condition: "like-new",
    images: [] as string[],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would submit to a backend API
    console.log("Creating new item:", formData)
    onBack()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create New Item</h1>
          <p className="text-muted-foreground mt-1">Add a new item to your inventory for trading.</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Item Title *</Label>
              <Input
                id="title"
                placeholder="Enter a descriptive title for your item"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Category & Condition */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                  <SelectTrigger id="condition">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(conditionLabel).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your item in detail. Include any important information about condition, features, or history."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-32"
                required
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={onBack} type="button">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Create Item
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
