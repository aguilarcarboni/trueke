"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Path } from "react-hook-form";
import { useSession } from "next-auth/react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form } from "@/components/ui/form";
import { AddressForm } from "@/components/misc/address-form";
import { ITEM_CONDITIONS, ITEM_CONDITION_LABELS } from "@/lib/entities/item";
import { AddressSchema, ADDRESS_LINE, LOCATION_TEXT, EMPTY_ADDRESS } from "@/lib/entities/address";
import { createClient } from "@/utils/supabase/client";

const categories = [
  "All",
  "Electronics",
  "Fashion",
  "Music",
  "Education",
  "Services",
  "Sports",
  "Home",
  "Books",
  "Art",
]


const CreateItemSchema = z.object({
  title: z.string().trim().min(1, "Item title is required."),
  description: z.string().trim().min(1, "Description is required."),
  category: z.string().trim().min(1, "Category is required."),
  condition: z
    .string()
    .refine((value) => ITEM_CONDITIONS.includes(value as (typeof ITEM_CONDITIONS)[number]), {
      message: "Please select a valid condition.",
    }),
  itemType: z.enum(["physical", "digital"]),
  dateBought: z.string().optional().or(z.literal("")),
  image: z.instanceof(File).nullable().optional(),
  address: z.object({
    countryCode: AddressSchema.shape.countryCode,
    province: AddressSchema.shape.province,
    city: AddressSchema.shape.city,
    zipCode: AddressSchema.shape.zipCode,
    addressLine1: z
      .string()
      .max(100, "Address line 1 must be 100 characters or fewer.")
      .regex(ADDRESS_LINE, "Address line 1 contains invalid characters.")
      .or(z.literal("")),
    addressLine2: z
      .string()
      .max(100, "Address line 2 must be 100 characters or fewer.")
      .regex(ADDRESS_LINE, "Address line 2 contains invalid characters.")
      .or(z.literal("")),
    muniDistrict: z
      .string()
      .max(100, "Municipality must be 100 characters or fewer.")
      .regex(LOCATION_TEXT, "Municipality contains invalid characters.")
      .or(z.literal("")),
  }),
});

type CreateItemFormValues = z.infer<typeof CreateItemSchema>;

interface CreateItemProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateItemFormValues = {
  title: "",
  description: "",
  category: "Electronics",
  condition: "like new",
  itemType: "physical",
  dateBought: "",
  image: null,
  address: {
    ...EMPTY_ADDRESS,
    countryCode: "CR",
  },
};

export function CreateItem({ open, onOpenChange }: CreateItemProps) {
  const router = useRouter();
  const supabase = createClient();
  const { data: session, status } = useSession();
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateItemFormValues>({
    resolver: zodResolver(CreateItemSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    reset,
    formState: { errors },
  } = form;

  const addressErrors = useMemo(() => {
    return {
      countryCode: errors.address?.countryCode?.message,
      province: errors.address?.province?.message,
      city: errors.address?.city?.message,
      zipCode: errors.address?.zipCode?.message,
      addressLine1: errors.address?.addressLine1?.message,
      addressLine2: errors.address?.addressLine2?.message,
      muniDistrict: errors.address?.muniDistrict?.message,
    } as Record<string, string>;
  }, [errors.address]);

  const selectedCategory = watch("category");
  const categoryNote =
    selectedCategory === "Books"
      ? "No additional category-specific attributes are required right now."
      : `Additional attributes for ${selectedCategory} can be added later.`;

  const closeDialog = () => {
    if (isSubmitting) return;
    setSubmitError("");
    reset(DEFAULT_VALUES);
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) return;
    setSubmitError("");
    reset(DEFAULT_VALUES);
  }, [open, reset]);

  const onSubmit = async (values: CreateItemFormValues) => {
    const ownerUserId = session?.user?.id;
    if (!ownerUserId) {
      setSubmitError("You must be signed in to create an item.");
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);

    const normalizedAddress = {
      country_code: values.address.countryCode.trim().toUpperCase(),
      address_line1: values.address.addressLine1.trim(),
      address_line2: values.address.addressLine2.trim(),
      muni_district: values.address.muniDistrict.trim(),
      canton_city: values.address.city.trim(),
      province_state: values.address.province.trim(),
      zip_code: values.address.zipCode.trim(),
    };

    try {
      let createdItemId: string | null = null;
      let createdAddressId: string | null = null;

      const { data: itemData, error: itemError } = await supabase
        .from("item")
        .insert({
          owner_user_id: ownerUserId,
          title: values.title,
          description: values.description,
          category: values.category,
          condition: values.condition,
          item_type: values.itemType,
          date_bought: values.dateBought || null,
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

      const { data: matchingAddressRows, error: addressLookupError } = await supabase
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

      let addressId = matchingAddressRows?.[0]?.address_id as string | undefined;

      if (!addressId) {
        const { data: insertedAddress, error: addressInsertError } = await supabase
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

      const { error: itemAddressError } = await supabase.from("item_address").insert({
        item_id: createdItemId,
        address_id: addressId,
        is_current: true,
      });

      if (itemAddressError) {
        await supabase.from("item").delete().eq("item_id", createdItemId);
        if (createdAddressId) {
          await supabase.from("address").delete().eq("address_id", createdAddressId);
        }
        console.error("Item address insert failed:", itemAddressError);
        setSubmitError(itemAddressError.message);
        setIsSubmitting(false);
        return;
      }

      reset(DEFAULT_VALUES);
      onOpenChange(false);
      router.push(`/items/${createdItemId}?created=1`);
    } catch (err) {
      console.error("Unexpected submit error:", err);
      setSubmitError("Something went wrong while creating the item.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return;
        if (!nextOpen) closeDialog();
        else onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="flex flex-col w-full max-w-3xl max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>Create New Item</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto pr-4">
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
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
                      {...register("title")}
                    />
                    {errors.title?.message && (
                      <p className="text-xs text-destructive">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={watch("category")}
                        onValueChange={(value) => {
                          setValue("category", value, { shouldDirty: true, shouldValidate: true });
                        }}
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
                      {errors.category?.message && (
                        <p className="text-xs text-destructive">{errors.category.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="itemType">Type *</Label>
                      <Select
                        value={watch("itemType")}
                        onValueChange={(value: "physical" | "digital") => {
                          setValue("itemType", value, { shouldDirty: true, shouldValidate: true });
                        }}
                      >
                        <SelectTrigger id="itemType">
                          <SelectValue placeholder="Select item type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="physical">Physical</SelectItem>
                          <SelectItem value="digital">Digital</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.itemType?.message && (
                        <p className="text-xs text-destructive">{errors.itemType.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition *</Label>
                      <Select
                        value={watch("condition")}
                        onValueChange={(value) => {
                          setValue("condition", value, { shouldDirty: true, shouldValidate: true });
                        }}
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
                      {errors.condition?.message && (
                        <p className="text-xs text-destructive">{errors.condition.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateBought">Date Bought (optional)</Label>
                      <Input id="dateBought" type="date" {...register("dateBought")} />
                    </div>
                  </div>

                  <AddressForm
                    value={watch("address")}
                    onChange={(address) => {
                      setValue("address", address, { shouldDirty: true, shouldValidate: true });
                    }}
                    errors={addressErrors}
                    onClearError={(field) => clearErrors(`address.${field}` as Path<CreateItemFormValues>)}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="image">Image</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        setValue("image", e.target.files?.[0] || null, { shouldDirty: true });
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Image upload UI is present. File storage will be implemented in a later sprint.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your item in detail. Include important condition notes, features, or history."
                      className="min-h-32"
                      {...register("description")}
                    />
                    {errors.description?.message && (
                      <p className="text-xs text-destructive">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 rounded-md border border-border p-4">
                    <Label>Category-Specific Attributes</Label>
                    <p className="text-sm text-muted-foreground">{categoryNote}</p>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Button variant="outline" onClick={closeDialog} type="button" disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isSubmitting || status === "loading" || !session?.user?.id}
                    >
                      {isSubmitting ? "Creating Item..." : "Create Item"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
