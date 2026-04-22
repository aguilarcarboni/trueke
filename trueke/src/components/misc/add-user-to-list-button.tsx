"use client"

import { useEffect, useState } from "react"
import { ChevronDown, Loader2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { getUserListFilteredAction, addUserToListAction } from "@/app/actions/user-list"
import type { UserList } from "@/lib/entities/user-list"

interface AddUserToListButtonProps {
  /** The user ID of the person to add to a list. */
  targetUserId: string
  /** Display name used in the success toast. */
  targetUsername: string
  /** Extra classes forwarded to the trigger button. */
  className?: string
}

export function AddUserToListButton({ targetUserId, targetUsername, className }: AddUserToListButtonProps) {
  const { toast } = useToast()
  const [userLists, setUserLists] = useState<UserList[]>([])
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (!targetUserId) return
    getUserListFilteredAction(targetUserId).then((res) => {
      if (res.success && res.data) setUserLists(res.data)
    })
  }, [targetUserId])

  const handleAdd = async (list: UserList) => {
    setIsAdding(true)
    const res = await addUserToListAction(list.listId, targetUserId)
    setIsAdding(false)

    if (!res.success) {
      toast({
        title: "Couldn't add user",
        description: res.error ?? "Something went wrong.",
        variant: "destructive",
      })
      return
    }

    // Remove the list from the dropdown so it can't be added twice
    setUserLists((prev) => prev.filter((l) => l.listId !== list.listId))

    toast({
      title: "User added",
      description: `${targetUsername} was added to "${list.name}".`,
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className={`gap-1.5 border-red-300 text-red-600 hover:bg-red-600 hover:text-white dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950 ${className ?? ""}`} disabled={isAdding}>
          {isAdding ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" />
          )}
          Add to List
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-bold">Your Lists</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userLists.length === 0 ? (
          <DropdownMenuItem disabled>No lists available</DropdownMenuItem>
        ) : (
          userLists.map((list) => (
            <DropdownMenuItem key={list.listId} onClick={() => handleAdd(list)}>
              {list.name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
