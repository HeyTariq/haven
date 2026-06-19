"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MyWishlistView } from "./my-wishlist-view";
import type { InferSelectModel } from "drizzle-orm";
import type { wishlistItem } from "@/modules/wishlist/schema";

type WishlistItem = InferSelectModel<typeof wishlistItem>;

interface WishlistTabsProps {
  myItems: WishlistItem[];
  others: { userId: string; userName: string; count: number }[];
}

export function WishlistTabs({ myItems, others }: WishlistTabsProps) {
  const [activeTab, setActiveTab] = useState("mine");
  const [addOpen, setAddOpen] = useState(false);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="flex items-center justify-between gap-4 mb-4">
        <TabsList>
          <TabsTrigger value="mine">Your Wishlist</TabsTrigger>
          <TabsTrigger value="household">
            Household
            {others.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-px text-xs tabular-nums text-muted-foreground">
                {others.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        {activeTab === "mine" && (
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add item
          </Button>
        )}
      </div>

      <TabsContent value="mine">
        <MyWishlistView initialItems={myItems} addOpen={addOpen} onAddOpenChange={setAddOpen} />
      </TabsContent>

      <TabsContent value="household">
        {others.length === 0 ? (
          <p className="text-sm text-muted-foreground">No other members have wishlists yet.</p>
        ) : (
          <div className="space-y-2">
            {others.map(({ userId, userName, count }) => (
              <Card key={userId} className="relative hover:bg-muted/30 transition-colors">
                <Link href={`/wishlist/${userId}`} className="absolute inset-0" />
                <CardContent className="flex items-center justify-between py-3 pointer-events-none">
                  <div>
                    <p className="font-medium text-sm">{userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {count} {count === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
