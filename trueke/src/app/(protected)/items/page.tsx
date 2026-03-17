"use client";

import { useEffect, useState } from "react";
import { MyItems } from "@/components/sections/items/my-items";
import { CreateItem } from "@/components/sections/items/create-item";
import { getItemsWithAddressByOwner } from "@/app/actions/item";
import { useSession } from "next-auth/react";
import type { ItemWithAddress } from "@/lib/entities/item";

const Page = () => {
  const { data: session } = useSession();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [userItems, setUserItems] = useState<ItemWithAddress[] | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    async function fetchItems() {
      if (!session?.user?.id) return;
      const result = await getItemsWithAddressByOwner(session.user.id);
      if (result.success && result.data) {
        setUserItems(result.data);
      } else {
        setUserItems([]);
        console.error("Failed to load user items:", result.error);
      }
    }

    fetchItems();
  }, [session?.user?.id]);

  return (
    <>
      <MyItems userItems={userItems} onCreateItem={() => setIsCreateDialogOpen(true)} />
      <CreateItem open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </>
  );
};

export default Page;
