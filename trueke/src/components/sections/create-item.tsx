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
import { ITEM_CONDITIONS, ITEM_CONDITION_LABELS } from "@/lib/item-constants";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface CreateItemProps {
  onBack: () => void;
}

export function CreateItem({ onBack }: CreateItemProps) {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Electronics",
    condition: "like new",
    itemType: "physical",
    countryCode: "CR",
    addressLine1: "",
    addressLine2: "",
    muniDistrict: "",
    cantonCity: "",
    provinceState: "",
    zipCode: "",
    dateBought: "",
    image: null as File | null,
  });

  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);
    const normalizedCountryCode = formData.countryCode.trim().toUpperCase();
    const normalizedAddress = {
      country_code: normalizedCountryCode,
      address_line1: formData.addressLine1.trim(),
      address_line2: formData.addressLine2.trim(),
      muni_district: formData.muniDistrict.trim(),
      canton_city: formData.cantonCity.trim(),
      province_state: formData.provinceState.trim(),
      zip_code: formData.zipCode.trim(),
    };

    if (normalizedCountryCode.length !== 2) {
      setSubmitError(
        "Country code must be exactly 2 letters (for example, CR or US).",
      );
      setIsSubmitting(false);
      return;
    }

    try {
      let createdItemId: string | null = null;
      let createdAddressId: string | null = null;

      // Since auth is not integrated yet in this branch,
      // use a seeded user id temporarily.
      const { data: itemData, error: itemError } = await supabase
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

      if (itemError) {
        console.error("Item insert failed:", itemError);
        setSubmitError(itemError.message);
        setIsSubmitting(false);
        return;
      }

      createdItemId = itemData.item_id;

      const { data: matchingAddressRows, error: addressLookupError } =
        await supabase
          .from("address")
          .select("address_id")
          .match(normalizedAddress)
          .limit(1);

      if (addressLookupError) {
        await supabase.from("item").delete().eq("item_id", createdItemId);
        console.error("Address lookup failed:", addressLookupError);
        setSubmitError(addressLookupError.message);
        setIsSubmitting(false);
        return;
      }

      let addressId = matchingAddressRows?.[0]?.address_id as
        | string
        | undefined;

      if (!addressId) {
        const { data: insertedAddress, error: addressInsertError } =
          await supabase
            .from("address")
            .insert(normalizedAddress)
            .select("address_id")
            .single();

        if (addressInsertError) {
          await supabase.from("item").delete().eq("item_id", createdItemId);
          console.error("Address insert failed:", addressInsertError);
          setSubmitError(addressInsertError.message);
          setIsSubmitting(false);
          return;
        }

        addressId = insertedAddress.address_id;
        createdAddressId = insertedAddress.address_id;
      }

      const { error: itemAddressError } = await supabase
        .from("item_address")
        .insert({
          item_id: createdItemId,
          address_id: addressId,
          is_current: true,
        });

      if (itemAddressError) {
        await supabase.from("item").delete().eq("item_id", createdItemId);
        if (createdAddressId) {
          await supabase
            .from("address")
            .delete()
            .eq("address_id", createdAddressId);
        }
        console.error("Item address insert failed:", itemAddressError);
        setSubmitError(itemAddressError.message);
        setIsSubmitting(false);
        return;
      }

      router.push(`/items/${createdItemId}?created=1`);
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
                    {ITEM_CONDITIONS.map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {ITEM_CONDITION_LABELS[condition]}
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

            <div className="space-y-4 rounded-md border border-border p-4">
              <Label className="text-base">Item Address *</Label>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="countryCode">Country Code *</Label>
                  <Input
                    id="countryCode"
                    placeholder="CR"
                    maxLength={2}
                    value={formData.countryCode}
                    onChange={(e) =>
                      setFormData({ ...formData, countryCode: e.target.value.toUpperCase() })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip Code *</Label>
                  <Input
                    id="zipCode"
                    placeholder="10101"
                    value={formData.zipCode}
                    onChange={(e) =>
                      setFormData({ ...formData, zipCode: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input
                  id="addressLine1"
                  placeholder="Street and number"
                  value={formData.addressLine1}
                  onChange={(e) =>
                    setFormData({ ...formData, addressLine1: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  placeholder="Apartment, floor, etc. (optional)"
                  value={formData.addressLine2}
                  onChange={(e) =>
                    setFormData({ ...formData, addressLine2: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="muniDistrict">Municipality / District</Label>
                  <Input
                    id="muniDistrict"
                    placeholder="Escazu Centro"
                    value={formData.muniDistrict}
                    onChange={(e) =>
                      setFormData({ ...formData, muniDistrict: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cantonCity">Canton / City *</Label>
                  <Input
                    id="cantonCity"
                    placeholder="San Jose"
                    value={formData.cantonCity}
                    onChange={(e) =>
                      setFormData({ ...formData, cantonCity: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provinceState">Province / State *</Label>
                  <Input
                    id="provinceState"
                    placeholder="San Jose"
                    value={formData.provinceState}
                    onChange={(e) =>
                      setFormData({ ...formData, provinceState: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
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
