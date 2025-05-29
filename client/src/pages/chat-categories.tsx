import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatCategory {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  sortOrder: number;
  children: ChatCategory[];
  rooms: ChatRoom[];
}

interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  categoryId?: number;
  isPublic: boolean;
  sortOrder: number;
}

function CategoryCard({ category }: { category: ChatCategory }) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {category.name}
        </CardTitle>
        {category.description && (
          <CardDescription>{category.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subcategories */}
        {category.children.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Oblasti</h4>
            <div className="grid gap-3">
              {category.children.map((subCategory) => (
                <div key={subCategory.id} className="border rounded-lg p-3">
                  <h5 className="font-medium mb-2">{subCategory.name}</h5>
                  {subCategory.description && (
                    <p className="text-sm text-muted-foreground mb-3">{subCategory.description}</p>
                  )}
                  {subCategory.rooms.length > 0 && (
                    <div className="grid gap-2">
                      {subCategory.rooms.map((room) => (
                        <Link key={room.id} href={`/chat/${room.id}`}>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start h-auto p-3"
                          >
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span className="font-medium">{room.name}</span>
                              </div>
                              {room.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {room.description}
                                </p>
                              )}
                            </div>
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Direct rooms under this category */}
        {category.rooms.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              {category.children.length > 0 ? "Další místa" : "Chatovací místnosti"}
            </h4>
            <div className="grid gap-2">
              {category.rooms.map((room) => (
                <Link key={room.id} href={`/chat/${room.id}`}>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto p-3"
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">{room.name}</span>
                      </div>
                      {room.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {room.description}
                        </p>
                      )}
                    </div>
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ChatCategories() {
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ["/api/chat/categories"],
    queryFn: async () => {
      const response = await fetch("/api/chat/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch chat categories");
      }
      return response.json() as Promise<ChatCategory[]>;
    },
  });

  const { data: allRooms } = useQuery({
    queryKey: ["/api/chat/rooms"],
    queryFn: async () => {
      const response = await fetch("/api/chat/rooms");
      if (!response.ok) {
        throw new Error("Failed to fetch chat rooms");
      }
      return response.json() as Promise<ChatRoom[]>;
    },
  });

  // Get rooms without categories (legacy rooms)
  const uncategorizedRooms = allRooms?.filter(room => !room.categoryId) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zpět na hlavní stranu
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Chatovací místnosti</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Chyba při načítání chatovacích místností.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zpět na hlavní stranu
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Chatovací místnosti</h1>
      </div>

      <div className="space-y-6">
        {/* Categorized rooms */}
        {categories?.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}

        {/* Uncategorized rooms (legacy) */}
        {uncategorizedRooms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Obecné chatovací místnosti
              </CardTitle>
              <CardDescription>
                Hlavní chatovací místnosti dostupné pro všechny hráče
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {uncategorizedRooms.map((room) => (
                  <Link key={room.id} href={`/chat/${room.id}`}>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-auto p-3"
                    >
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">{room.name}</span>
                        </div>
                        {room.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {room.description}
                          </p>
                        )}
                      </div>
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}