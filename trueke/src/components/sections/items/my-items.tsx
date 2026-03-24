"use client";

import { deleteItem } from "@/app/actions/item";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ItemWithAddress } from "@/lib/entities/item";
import { Plus, Trash2, Edit, Eye, Package, Archive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditItemDialog } from "@/components/sections/items/edit-item-dialog";
import { ConfirmActionDialog } from "@/components/sections/exchanges/confirm-action-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/utils/supabase/client";

function ImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-muted ${className}`}>
      <Package className="h-12 w-12 text-muted-foreground" />
    </div>
  );
}

interface MyItemsProps {
  userItems: ItemWithAddress[] | null;
  onSelectItem?: (item: ItemWithAddress) => void;
  onCreateItem?: () => void;
}

const conditionLabel: Record<string, string> = {
  new: "New",
  "like new": "Like New",
  used: "Used",
  "heavily used": "Heavily Used",
  broken: "Broken",
};

const statusColors: Record<string, string> = {
  active: "bg-success/20 text-success",
  draft: "bg-muted/20 text-muted-foreground",
  traded: "bg-accent/20 text-accent-foreground",
  contested: "bg-warning/20 text-warning-foreground",
  deleted: "bg-destructive/15 text-destructive",
};

type MessageDialogState = {
  open: boolean;
  title: string;
  description: string;
};

export function MyItems({ userItems, onCreateItem }: MyItemsProps) {
  const router = useRouter();
  const [viewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"current" | "archived">("current");
  const [myItems, setMyItems] = useState<ItemWithAddress[]>(userItems || []);
  const [editingItem, setEditingItem] = useState<ItemWithAddress | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<ItemWithAddress | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [messageDialog, setMessageDialog] = useState<MessageDialogState>({
    open: false,
    title: "",
    description: "",
  });

  useEffect(() => {
    setMyItems(userItems || []);
  }, [userItems]);

  const currentItems = useMemo(
    () => myItems.filter((item) => item.status !== "deleted"),
    [myItems],
  );

  const archivedItems = useMemo(
    () => myItems.filter((item) => item.status === "deleted"),
    [myItems],
  );

  const visibleItems = activeTab === "current" ? currentItems : archivedItems;

  const openMessageDialog = (title: string, description: string) => {
    setMessageDialog({
      open: true,
      title,
      description,
    });
  };

  const requestDeleteItem = (item: ItemWithAddress) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    console.log("[client] attempting delete for item:", itemToDelete);

    setIsDeleting(true);

    try {
      const result = await deleteItem(itemToDelete.item_id);

      console.log("[client] delete result:", result);

      if (result.error) {
        setIsDeleteDialogOpen(false);

        switch (result.code) {
          case "CONTESTED":
          case "PENDING":
          case "PENDING_AND_CONTESTED":
            openMessageDialog("Item cannot be deleted", result.error);
            break;
          case "FORBIDDEN":
            openMessageDialog("Permission denied", result.error);
            break;
          case "UNAUTHORIZED":
            openMessageDialog("Not logged in", result.error);
            break;
          case "NOT_FOUND":
            openMessageDialog("Item not found", result.error);
            break;
          default:
            openMessageDialog("Delete failed", result.error);
            break;
        }

        return;
      }

      setMyItems((prev) =>
        prev.map((item) =>
          item.item_id === itemToDelete.item_id
            ? { ...item, status: "deleted" }
            : item,
        ),
      );

      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("[client] handleDeleteItem crashed:", error);
      openMessageDialog(
        "Delete failed",
        "Unexpected client error while deleting item.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewClick = (item: ItemWithAddress) => {
    router.push(`/items/${encodeURIComponent(item.item_id)}`);
  };

  const handleEditClick = (item: ItemWithAddress) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleItemUpdated = (updatedItem: ItemWithAddress) => {
    setMyItems((prevItems) =>
      prevItems.map((item) =>
        item.item_id === updatedItem.item_id ? updatedItem : item,
      ),
    );
  };

  const renderEmptyState = () => {
    if (activeTab === "archived") {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Archive className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="mb-2 text-lg font-semibold text-foreground">
              No archived items
            </p>
            <p className="text-muted-foreground">
              Deleted items will show up here for your history.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="mb-2 text-lg font-semibold text-foreground">
            No current items
          </p>
          <p className="mb-6 text-muted-foreground">
            Start by adding your first item to the marketplace.
          </p>
          <Button variant="outline" onClick={onCreateItem}>
            Add Your First Item
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Items</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your current listings and archived history.
          </p>
        </div>
        <Button className="w-full gap-2 sm:w-auto" onClick={onCreateItem}>
          <Plus className="h-4 w-4" />
          Add New Item
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentItems.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentItems.filter((i) => i.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Traded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentItems.filter((i) => i.status === "traded").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Archived
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{archivedItems.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex w-full gap-2 rounded-lg border bg-muted/30 p-1 sm:w-fit">
        <Button
          variant={activeTab === "current" ? "default" : "ghost"}
          className="gap-2"
          onClick={() => setActiveTab("current")}
        >
          Current Items
          <Badge variant="secondary">{currentItems.length}</Badge>
        </Button>

        <Button
          variant={activeTab === "archived" ? "default" : "ghost"}
          className="gap-2"
          onClick={() => setActiveTab("archived")}
        >
          Archived History
          <Badge variant="secondary">{archivedItems.length}</Badge>
        </Button>
      </div>

      {visibleItems.length === 0 ? (
        renderEmptyState()
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-3"
          }
        >
          {visibleItems.map((item) => {
            const isArchived = item.status === "deleted";

            return (
              <Card
                key={item.item_id}
                className={isArchived ? "border-dashed" : ""}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col">
                    <div className="relative h-40 w-full overflow-hidden rounded-t-lg bg-muted">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove(
                              "hidden",
                            );
                          }}
                        />
                      ) : null}

                      <ImagePlaceholder
                        className={`h-full w-full ${item.images && item.images.length > 0 ? "hidden" : ""}`}
                      />

                      <div className="absolute right-2 top-2 flex gap-2">
                        {item.images && item.images.length > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            {item.images.length} images
                          </Badge>
                        )}

                        {isArchived ? (
                          <Badge variant="secondary">Archived</Badge>
                        ) : (
                          <Badge className={statusColors[item.status] || ""}>
                            {item.status.charAt(0).toUpperCase() +
                              item.status.slice(1)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-foreground">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.category}
                          </p>
                        </div>
                      </div>

                      <Badge variant="secondary" className="mb-3">
                        {conditionLabel[item.condition]}
                      </Badge>

                      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                        {item.description || "No description"}
                      </p>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1"
                          onClick={() => handleViewClick(item)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>

                        {!isArchived && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 gap-1"
                              onClick={() => handleEditClick(item)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Edit
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => requestDeleteItem(item)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <EditItemDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        item={editingItem}
        onItemUpdated={handleItemUpdated}
      />

      <ConfirmActionDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete item?"
        description="This item will be removed from the marketplace and moved to archived history."
        confirmLabel="Delete Item"
        cancelLabel="Cancel"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDeleteItem}
      />

      <AlertDialog
        open={messageDialog.open}
        onOpenChange={(open) =>
          setMessageDialog((prev) => ({
            ...prev,
            open,
          }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{messageDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {messageDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() =>
                setMessageDialog((prev) => ({
                  ...prev,
                  open: false,
                }))
              }
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
