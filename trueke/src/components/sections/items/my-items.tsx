"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ItemWithAddress,
  getStatusLabel,
  getStatusStyle,
  ITEM_CONDITION_LABELS,
} from "@/lib/entities/item";
import type { ItemCondition } from "@/lib/entities/item";
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  Package,
  Send,
  Archive,
  RotateCcw,
  Search,
  Grid3X3,
  List,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { changeItemStatus, deleteItem } from "@/app/actions/item";
import { Country } from "country-state-city";

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

type MessageDialogState = {
  open: boolean;
  title: string;
  description: string;
};

export function MyItems({ userItems, onCreateItem }: MyItemsProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"current" | "archived">("current");
  const [myItems, setMyItems] = useState<ItemWithAddress[]>(userItems || []);
  const [editingItem, setEditingItem] = useState<ItemWithAddress | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [draftingId, setDraftingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCondition, setSelectedCondition] = useState<
    ItemCondition | ""
  >("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

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

  const categories = useMemo(
    () =>
      Array.from(
        new Set(myItems.map((i) => i.category).filter(Boolean)),
      ).sort(),
    [myItems],
  );

  const countries = useMemo(
    () =>
      Array.from(
        new Set(
          myItems
            .map((i) => i.address?.countryCode)
            .filter(Boolean) as string[],
        ),
      ).sort(),
    [myItems],
  );

  const cities = useMemo(
    () =>
      Array.from(
        new Set(
          myItems
            .filter(
              (i) =>
                !selectedCountry || i.address?.countryCode === selectedCountry,
            )
            .map((i) => i.address?.city)
            .filter(Boolean) as string[],
        ),
      ).sort(),
    [myItems, selectedCountry],
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();

    return myItems.filter((item) => {
      if (
        q &&
        !item.title.toLowerCase().includes(q) &&
        !(item.description ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }

      if (selectedCategory && item.category !== selectedCategory) return false;
      if (selectedCondition && item.condition !== selectedCondition)
        return false;
      if (selectedStatus && item.status !== selectedStatus) return false;
      if (selectedCountry && item.address?.countryCode !== selectedCountry)
        return false;
      if (selectedCity && item.address?.city !== selectedCity) return false;

      return true;
    });
  }, [
    myItems,
    searchQuery,
    selectedCategory,
    selectedCondition,
    selectedStatus,
    selectedCountry,
    selectedCity,
  ]);

  const allCurrentItems = useMemo(
    () => myItems.filter((item) => item.status !== "deleted"),
    [myItems],
  );

  const allArchivedItems = useMemo(
    () => myItems.filter((item) => item.status === "deleted"),
    [myItems],
  );

  const currentItems = useMemo(
    () => filteredItems.filter((item) => item.status !== "deleted"),
    [filteredItems],
  );

  const archivedItems = useMemo(
    () => filteredItems.filter((item) => item.status === "deleted"),
    [filteredItems],
  );

  const visibleItems = activeTab === "current" ? currentItems : archivedItems;

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== "" ||
    selectedCondition !== "" ||
    selectedStatus !== "" ||
    selectedCountry !== "" ||
    selectedCity !== "";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedCondition("");
    setSelectedStatus("");
    setSelectedCountry("");
    setSelectedCity("");
  };

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
    setEditingItem((prev) =>
      prev?.item_id === updatedItem.item_id ? updatedItem : prev,
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

  const handlePublishItem = async (itemId: string) => {
    setPublishingId(itemId);
    const result = await changeItemStatus(itemId, "publish");
    if (!result.error) {
      setMyItems((prevItems) =>
        prevItems.map((item) =>
          item.item_id === itemId ? { ...item, status: "active" } : item,
        ),
      );
    }
    setPublishingId(null);
  };

  const handleSetDraftItem = async (itemId: string) => {
    setDraftingId(itemId);
    const result = await changeItemStatus(itemId, "set-draft");
    if (!result.error) {
      setMyItems((prevItems) =>
        prevItems.map((item) =>
          item.item_id === itemId ? { ...item, status: "draft" } : item,
        ),
      );
    }
    setDraftingId(null);
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
            <div className="text-2xl font-bold">{allCurrentItems.length}</div>
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
              {allCurrentItems.filter((i) => i.status === "active").length}
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
              {allCurrentItems.filter((i) => i.status === "traded").length}
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
            <div className="text-2xl font-bold">{allArchivedItems.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={selectedCategory || "__all__"}
              onValueChange={(v) =>
                setSelectedCategory(v === "__all__" ? "" : v)
              }
            >
              <SelectTrigger className="flex-1 min-w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedCondition || "__all__"}
              onValueChange={(v) =>
                setSelectedCondition(
                  v === "__all__" ? "" : (v as ItemCondition),
                )
              }
            >
              <SelectTrigger className="flex-1 min-w-[140px]">
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All conditions</SelectItem>
                {(
                  Object.entries(ITEM_CONDITION_LABELS) as [
                    ItemCondition,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedStatus || "__all__"}
              onValueChange={(v) => setSelectedStatus(v === "__all__" ? "" : v)}
            >
              <SelectTrigger className="flex-1 min-w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="traded">Traded</SelectItem>
                <SelectItem value="contested">Contested</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedCountry || "__all__"}
              onValueChange={(v) => {
                setSelectedCountry(v === "__all__" ? "" : v);
                setSelectedCity("");
              }}
            >
              <SelectTrigger className="flex-1 min-w-[140px]">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All countries</SelectItem>
                {countries.map((code) => (
                  <SelectItem key={code} value={code}>
                    {Country.getCountryByCode(code)?.name ?? code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedCity || "__all__"}
              onValueChange={(v) => setSelectedCity(v === "__all__" ? "" : v)}
            >
              <SelectTrigger className="flex-1 min-w-[140px]">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto flex shrink-0 rounded-lg border border-border">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-r-none"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="shrink-0 gap-1.5 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {filteredItems.length === myItems.length
            ? `${myItems.length} items`
            : `${filteredItems.length} of ${myItems.length} items`}
        </p>

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
      </div>

      {myItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <p className="mb-2 text-lg font-semibold text-foreground">
                No items yet
              </p>
              <p className="mb-6 text-muted-foreground">
                Start by adding your first item to the marketplace.
              </p>
              <Button variant="outline" onClick={onCreateItem}>
                Add Your First Item
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : visibleItems.length === 0 ? (
        hasActiveFilters ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <p className="mb-2 text-lg font-semibold text-foreground">
                  No items match your filters
                </p>
                <p className="mb-6 text-muted-foreground">
                  Try adjusting or clearing your search criteria.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          renderEmptyState()
        )
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-3"
          }
        >
          {visibleItems.map((item) => {
            const isDeleted = item.status === "deleted";

            return viewMode === "grid" ? (
              <Card
                key={item.item_id}
                className={isDeleted ? "border-dashed" : ""}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col">
                    <div className="relative h-40 w-full overflow-hidden rounded-t-lg bg-muted">
                      {item.images && item.images.length > 0 ? (
                        <img
                          key={item.images[0]}
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

                        {isDeleted ? (
                          <Badge variant="secondary">Archived</Badge>
                        ) : (
                          <Badge className={getStatusStyle(item.status)}>
                            {getStatusLabel(item.status)}
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

                      <div className="flex flex-col items-start">
                        {item.address && (
                          <p className="mb-4 text-xs text-muted-foreground">
                            {item.address.city}, {item.address.province},{" "}
                            {Country.getCountryByCode(item.address.countryCode)
                              ?.name ?? item.address.countryCode}
                          </p>
                        )}
                      </div>

                      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                        {item.description || "No description"}
                      </p>

                      <div className="space-y-2">
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

                          {!isDeleted && (
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
                                className="flex-1"
                                onClick={() => requestDeleteItem(item)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>

                        {!isDeleted && item.status === "draft" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="flex-1 gap-1"
                              disabled={publishingId === item.item_id}
                              onClick={() => handlePublishItem(item.item_id)}
                            >
                              <Send className="h-3.5 w-3.5" />
                              {publishingId === item.item_id
                                ? "Publishing..."
                                : "Publish"}
                            </Button>
                          </div>
                        )}

                        {!isDeleted && item.status === "active" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 gap-1"
                              disabled={draftingId === item.item_id}
                              onClick={() => handleSetDraftItem(item.item_id)}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              {draftingId === item.item_id
                                ? "Unpublishing..."
                                : "Unpublish"}
                            </Button>
                          </div>
                        )}

                        {!isDeleted && item.status === "archived" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 gap-1"
                              disabled={draftingId === item.item_id}
                              onClick={() => handleSetDraftItem(item.item_id)}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              {draftingId === item.item_id
                                ? "Drafting..."
                                : "Set as Draft"}
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              className="flex-1 gap-1"
                              disabled={publishingId === item.item_id}
                              onClick={() => handlePublishItem(item.item_id)}
                            >
                              <Send className="h-3.5 w-3.5" />
                              {publishingId === item.item_id
                                ? "Publishing..."
                                : "Publish"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card
                key={item.item_id}
                className={isDeleted ? "border-dashed" : ""}
              >
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded">
                      {item.images && item.images.length > 0 ? (
                        <img
                          key={item.images[0]}
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
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="truncate font-semibold text-foreground">
                          {item.title}
                        </h3>
                        {isDeleted ? (
                          <Badge variant="secondary">Archived</Badge>
                        ) : (
                          <Badge className={getStatusStyle(item.status)}>
                            {getStatusLabel(item.status)}
                          </Badge>
                        )}
                      </div>

                      <p className="mb-1 text-xs text-muted-foreground">
                        {item.category} • {conditionLabel[item.condition]}
                      </p>

                      {item.address && (
                        <p className="mb-1 text-xs text-muted-foreground">
                          {item.address.city}, {item.address.province},{" "}
                          {Country.getCountryByCode(item.address.countryCode)
                            ?.name ?? item.address.countryCode}
                        </p>
                      )}

                      <p className="line-clamp-1 text-sm text-muted-foreground">
                        {item.description || "No description"}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleViewClick(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {!isDeleted && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleEditClick(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {item.status === "draft" && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                disabled={publishingId === item.item_id}
                                onClick={() => handlePublishItem(item.item_id)}
                                title="Publish"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          {item.status === "active" && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                disabled={draftingId === item.item_id}
                                onClick={() => handleSetDraftItem(item.item_id)}
                                title="Unpublish"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          {item.status === "archived" && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                disabled={draftingId === item.item_id}
                                onClick={() => handleSetDraftItem(item.item_id)}
                                title="Set as Draft"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                disabled={publishingId === item.item_id}
                                onClick={() => handlePublishItem(item.item_id)}
                                title="Publish"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => requestDeleteItem(item)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
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
