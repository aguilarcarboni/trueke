"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type Path } from "react-hook-form";
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
import {
  AddressSchema,
  ADDRESS_LINE,
  LOCATION_TEXT,
  EMPTY_ADDRESS,
} from "@/lib/entities/address";
import { createClient } from "@/utils/supabase/client";

const categories = [
  "Electronics",
  "Fashion",
  "Music",
  "Education",
  "Services",
  "Sports",
  "Home",
  "Books",
  "Art",
] as const;

type Category = (typeof categories)[number];
type Condition = (typeof ITEM_CONDITIONS)[number];

const conditionOptions = [...ITEM_CONDITIONS] as [Condition, ...Condition[]];

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const dedupeFiles = (files: File[]) => {
  const seen = new Set<string>();

  return files.filter((file) => {
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getTodayDateInputValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const CreateItemSchema = z.object({
  title: z.string().trim().min(1, "Item title is required."),
  description: z.string().trim().optional(),
  category: z.enum(categories, {
    required_error: "Please select a category.",
  }),
  condition: z.enum(conditionOptions, {
    required_error: "Please select a condition.",
  }),
  itemType: z.enum(["physical", "digital"], {
    required_error: "Please select a type.",
  }),
  dateBought: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) return true;

      const [year, month, day] = value.split("-").map(Number);
      if (!year || !month || !day) return false;

      const selectedDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      const now = new Date();

      return selectedDate <= now;
    }, "Date bought cannot be in the future."),
  images: z.array(z.instanceof(File)).min(1, "At least one image is required."),
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
      .max(100, "District must be 100 characters or fewer.")
      .regex(LOCATION_TEXT, "District contains invalid characters.")
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
  images: [],
  address: {
    ...EMPTY_ADDRESS,
    countryCode: "CR",
  },
};

export function CreateItem({ open, onOpenChange }: CreateItemProps) {
  const router = useRouter();
  const supabase = createClient();
  const { data: session, status } = useSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const form = useForm<CreateItemFormValues>({
    resolver: zodResolver(CreateItemSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    clearErrors,
    reset,
    setError,
    formState: { errors },
    control,
  } = form;

  const selectedImages =
    useWatch({
      control,
      name: "images",
    }) ?? [];

  useEffect(() => {
    const urls = selectedImages.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedImages]);

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

  const todayDate = useMemo(() => getTodayDateInputValue(), []);

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

  const updateImages = (nextImages: File[]) => {
    setValue("images", nextImages, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleAddImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (incomingFiles.length === 0) {
      event.target.value = "";
      return;
    }

    const currentImages = getValues("images");
    const nextImages = dedupeFiles([...currentImages, ...incomingFiles]);

    updateImages(nextImages);
    clearErrors("images");
    event.target.value = "";
  };

  const removeImage = (indexToRemove: number) => {
    const currentImages = [...getValues("images")];
    currentImages.splice(indexToRemove, 1);
    updateImages(currentImages);
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const currentImages = [...getValues("images")];
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= currentImages.length) return;

    [currentImages[index], currentImages[nextIndex]] = [
      currentImages[nextIndex],
      currentImages[index],
    ];

    updateImages(currentImages);
  };

  const uploadItemImage = async (
    file: File,
  ): Promise<{ url: string; mediaType: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/items/upload-image", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json().catch(() => ({}))) as {
      url?: string;
      mediaType?: string;
      error?: string;
    };

    if (!response.ok || !payload.url) {
      throw new Error(
        payload.error || `Failed to upload image "${file.name}".`,
      );
    }

    return {
      url: payload.url,
      mediaType: payload.mediaType || ".jpg",
    };
  };

  const onSubmit = async (values: CreateItemFormValues) => {
    const ownerUserId = session?.user?.id;

    if (!ownerUserId) {
      setSubmitError("You must be signed in to create an item.");
      return;
    }

    if (values.images.length === 0) {
      setError("images", { message: "At least one image is required." });
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

    let createdItemId: string | null = null;
    let createdAddressId: string | null = null;

    try {
      const { data: itemData, error: itemError } = await supabase
        .from("item")
        .insert({
          owner_user_id: ownerUserId,
          title: values.title.trim(),
          description: values.description?.trim() || null,
          category: values.category,
          condition: values.condition,
          item_type: values.itemType,
          date_bought: values.dateBought || null,
        })
        .select("item_id")
        .single();

      if (itemError) {
        throw new Error(`Item insert failed: ${itemError.message}`);
      }

      createdItemId = itemData.item_id;

      const { data: matchingAddressRows, error: addressLookupError } =
        await supabase
          .from("address")
          .select("address_id")
          .match(normalizedAddress)
          .limit(1);

      if (addressLookupError) {
        throw new Error(`Address lookup failed: ${addressLookupError.message}`);
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
          throw new Error(
            `Address insert failed: ${addressInsertError.message}`,
          );
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
        throw new Error(
          `Item address insert failed: ${itemAddressError.message}`,
        );
      }

      const mediaRows = [];

      for (const [index, file] of values.images.entries()) {
        const uploadedImage = await uploadItemImage(file);

        mediaRows.push({
          item_id: createdItemId,
          url: uploadedImage.url,
          media_type: uploadedImage.mediaType,
          display_order: index,
        });
      }

      const { error: mediaError } = await supabase
        .from("item_media")
        .insert(mediaRows);

      if (mediaError) {
        throw new Error(`Media insert failed: ${mediaError.message}`);
      }

      reset(DEFAULT_VALUES);
      onOpenChange(false);
      router.push(`/items/${createdItemId}?created=1`);
    } catch (err) {
      console.error("Unexpected submit error:", err);

      if (createdItemId) {
        await supabase.from("item_media").delete().eq("item_id", createdItemId);
        await supabase
          .from("item_address")
          .delete()
          .eq("item_id", createdItemId);
        await supabase.from("item").delete().eq("item_id", createdItemId);
      }

      if (createdAddressId) {
        await supabase
          .from("address")
          .delete()
          .eq("address_id", createdAddressId);
      }

      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the item.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
      <DialogContent className="flex max-h-[90vh] w-full max-w-4xl flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Create New Item</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto pr-4">
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="mx-auto max-w-3xl space-y-6"
                >
                  {submitError && (
                    <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {submitError}
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">
                    Fields marked with{" "}
                    <span className="text-destructive">*</span> are required.
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Item Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Enter a descriptive title for your item"
                      {...register("title")}
                    />
                    {errors.title?.message && (
                      <p className="text-xs text-destructive">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category">
                        Category <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={watch("category")}
                        onValueChange={(value: Category) => {
                          setValue("category", value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
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
                        <p className="text-xs text-destructive">
                          {errors.category.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="itemType">
                        Type <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={watch("itemType")}
                        onValueChange={(value: "physical" | "digital") => {
                          setValue("itemType", value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
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
                        <p className="text-xs text-destructive">
                          {errors.itemType.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="condition">
                        Condition <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={watch("condition")}
                        onValueChange={(value: Condition) => {
                          setValue("condition", value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
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
                        <p className="text-xs text-destructive">
                          {errors.condition.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateBought">Date Bought</Label>
                      <Input
                        id="dateBought"
                        type="date"
                        max={todayDate}
                        {...register("dateBought")}
                      />
                      {errors.dateBought?.message && (
                        <p className="text-xs text-destructive">
                          {errors.dateBought.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <AddressForm
                    value={watch("address")}
                    onChange={(address) => {
                      setValue("address", address, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    errors={addressErrors}
                    onClearError={(field) =>
                      clearErrors(
                        `address.${field}` as Path<CreateItemFormValues>,
                      )
                    }
                  />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label>
                          Images <span className="text-destructive">*</span>
                        </Label>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Add one or more images. The first image will be the
                          cover photo.
                        </p>
                      </div>

                      {selectedImages.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isSubmitting}
                        >
                          Add More Images
                        </Button>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleAddImages}
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting}
                      className="flex min-h-40 w-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-6 py-8 text-center transition hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="text-sm font-medium">
                        {selectedImages.length > 0
                          ? "Add more images"
                          : "Click to upload images"}
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground">
                        JPG, PNG, WEBP and other image files from your device
                      </span>
                    </button>

                    {errors.images?.message && (
                      <p className="text-xs text-destructive">
                        {errors.images.message}
                      </p>
                    )}

                    {selectedImages.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          {selectedImages.length} image
                          {selectedImages.length === 1 ? "" : "s"} selected
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {selectedImages.map((file, index) => (
                            <div
                              key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                              className="overflow-hidden rounded-xl border bg-background shadow-sm"
                            >
                              <div className="aspect-[4-3] bg-muted">
                                {previewUrls[index] && (
                                  <img
                                    src={previewUrls[index]}
                                    alt={file.name}
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </div>

                              <div className="space-y-4 p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(file.size)}
                                    </p>
                                  </div>

                                  <span
                                    className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                                      index === 0
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {index === 0 ? "Cover" : `#${index + 1}`}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => moveImage(index, -1)}
                                    disabled={index === 0 || isSubmitting}
                                  >
                                    Earlier
                                  </Button>

                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => moveImage(index, 1)}
                                    disabled={
                                      index === selectedImages.length - 1 ||
                                      isSubmitting
                                    }
                                  >
                                    Later
                                  </Button>

                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => removeImage(index)}
                                    disabled={isSubmitting}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your item in detail. Include important condition notes, features, or history."
                      className="min-h-32"
                      {...register("description")}
                    />
                    {errors.description?.message && (
                      <p className="text-xs text-destructive">
                        {errors.description.message}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 border-t border-border pt-4">
                    <Button
                      variant="outline"
                      onClick={closeDialog}
                      type="button"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={
                        isSubmitting ||
                        status === "loading" ||
                        !session?.user?.id
                      }
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
