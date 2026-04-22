"use client"

import { useState, useCallback } from "react"
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
import { cn } from "@/lib/utils"
import { UserListFormSchema } from "@/lib/entities/user-list"

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
  const [nameError, setNameError] = useState<string | null>(null)
  const [descError, setDescError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [shakeField, setShakeField] = useState<"name" | "description" | "both" | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  function triggerShake(field: "name" | "description" | "both") {
    setShakeField(field)
    setTimeout(() => setShakeField(null), 400)
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      setName("")
      setDescription("")
      setNameError(null)
      setDescError(null)
      setServerError(null)
      setShakeField(null)
    }
    onOpenChange(value)
  }

  const validateFields = useCallback(() => {
    const parsed = UserListFormSchema.safeParse({
      name: name.trim(),
      description: description.trim() || undefined,
    })

    if (parsed.success) {
      setNameError(null)
      setDescError(null)
      return true
    }

    let hasNameErr = false
    let hasDescErr = false
    for (const err of parsed.error.errors) {
      if (err.path[0] === "name" && !hasNameErr) {
        setNameError(err.message)
        hasNameErr = true
      } else if (err.path[0] === "description" && !hasDescErr) {
        setDescError(err.message)
        hasDescErr = true
      }
      if (hasNameErr && hasDescErr) break
    }

    if (hasNameErr && hasDescErr) triggerShake("both")
    else if (hasNameErr) triggerShake("name")
    else if (hasDescErr) triggerShake("description")

    return false
  }, [name, description])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateFields()) return

    setLoading(true)
    setServerError(null)

    const result = await createCustomListAction(
      name.trim(),
      description.trim() || undefined
    )

    setLoading(false)

    if (!result.success || !result.data) {
      setServerError(result.error ?? "Something went wrong.")
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
              onChange={(e) => { setName(e.target.value); setNameError(null) }}
              disabled={loading}
              autoFocus
              maxLength={50}
              className={cn(
                nameError && "border-destructive focus-visible:ring-destructive",
                (shakeField === "name" || shakeField === "both") && "animate-shake"
              )}
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="list-description">Description (optional)</Label>
            <Textarea
              id="list-description"
              placeholder="What is this list for?"
              value={description}
              onChange={(e) => { setDescription(e.target.value); setDescError(null) }}
              disabled={loading}
              rows={3}
              maxLength={200}
              className={cn(
                descError && "border-destructive focus-visible:ring-destructive",
                (shakeField === "description" || shakeField === "both") && "animate-shake"
              )}
            />
            {descError && (
              <p className="text-xs text-destructive">{descError}</p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
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
