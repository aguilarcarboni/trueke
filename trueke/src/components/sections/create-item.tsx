"use client";

import { ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "@/lib/data";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface CreateItemProps {
  onBack: () => void;
}

const conditionLabel: Record<string, string> = {
  new: "New",
  "like new": "Like New",
  used: "Used",
  "heavily used": "Heavily Used",
  broken: "Broken",
};

export function CreateItem({ onBack }: CreateItemProps) {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Electronics",
    condition: "like new",
    itemType: "physical",
    approxLocation: "",
    dateBought: "",
    image: null as File | null,
  });

  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);

    try {
      // Since auth is not integrated yet in this branch,
      // use a seeded user id temporarily.
      const { data, error } = await supabase
        .from("item")
        .insert({
          owner_user_id: "f1d36273-3359-4eab-9968-bb180ce23246",
          title: formData.title,
          description: formData.description,
          category: formData.category,
          condition: formData.condition,
          item_type: formData.itemType,
          date_bought: formData.dateBought || null,
        })
        .select("item_id")
        .single();

      if (error) {
        console.error("Insert failed:", error);
        setSubmitError(error.message);
        setIsSubmitting(false);
        return;
      }

      router.push(`/items/${data.item_id}`);
    } catch (err) {
      console.error("Unexpected submit error:", err);
      setSubmitError("Something went wrong while creating the item.");
      setIsSubmitting(false);
    }
  };

  const categoryNote =
    formData.category === "Books"
      ? "No additional category-specific attributes are required right now."
      : `Additional attributes for ${formData.category} can be added later.`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-10 w-10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Create New Item
          </h1>
          <p className="text-muted-foreground mt-1">
            Fill out the required fields below to publish your item.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            {submitError && (
              <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Item Title *</Label>
              <Input
                id="title"
                placeholder="Enter a descriptive title for your item"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
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
                <Label htmlFor="itemType">Type *</Label>
                <Select
                  value={formData.itemType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, itemType: value })
                  }
                >
                  <SelectTrigger id="itemType">
                    <SelectValue placeholder="Select item type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Physical</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) =>
                    setFormData({ ...formData, condition: value })
                  }
                >
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

              <div className="space-y-2">
                <Label htmlFor="dateBought">Date Bought (optional)</Label>
                <Input
                  id="dateBought"
                  type="date"
                  value={formData.dateBought}
                  onChange={(e) =>
                    setFormData({ ...formData, dateBought: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="approxLocation">Approx. Location *</Label>
              <Input
                id="approxLocation"
                placeholder="Ex: San José, Escazú, or nearby area"
                value={formData.approxLocation}
                onChange={(e) =>
                  setFormData({ ...formData, approxLocation: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                This field is shown in the form now for AC coverage. Backend
                storage can be wired once the DB is updated.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    image: e.target.files?.[0] || null,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Image upload UI is present. File storage will be implemented in
                a later sprint.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your item in detail. Include important condition notes, features, or history."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="min-h-32"
                required
              />
            </div>

            <div className="space-y-2 rounded-md border border-border p-4">
              <Label>Category-Specific Attributes</Label>
              <p className="text-sm text-muted-foreground">{categoryNote}</p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={onBack}
                type="button"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Creating Item..." : "Create Item"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
