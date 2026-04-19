"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createCustomListAction } from "@/app/actions/user-list"
import { useToast } from "@/hooks/use-toast"

interface CreateCustomListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the new list id after successful creation. */
  onCreated: (listId: string, name: string) => void
}

export function CreateCustomListDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateCustomListDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  function handleOpenChange(value: boolean) {
    if (!value) {
      setName("")
      setDescription("")
      setError(null)
    }
    onOpenChange(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError("List name is required.")
      return
    }

    setLoading(true)
    setError(null)

    const result = await createCustomListAction(
      name.trim(),
      description.trim() || undefined
    )

    setLoading(false)

    if (!result.success || !result.data) {
      setError(result.error ?? "Something went wrong.")
      return
    }

    onCreated(result.data.listId, name.trim())
    handleOpenChange(false)
    toast({ title: "List created", description: `"${name.trim()}" has been added to your lists.` })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Custom List</DialogTitle>
          <DialogDescription>
            Organize your contacts by creating a new list.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="list-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="list-name"
              placeholder="e.g. Close Friends"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoFocus
              maxLength={50}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="list-description">Description (optional)</Label>
            <Textarea
              id="list-description"
              placeholder="What is this list for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
              maxLength={200}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create List
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
