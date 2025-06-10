import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CharacterAvatar } from "@/components/CharacterAvatar";

interface Character {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  avatar?: string | null;
}

interface RoomPresenceProps {
  roomId: number;
  onlineCharacters: Character[];
}

export function RoomPresence({ roomId, onlineCharacters }: RoomPresenceProps) {
  const getCharacterInitials = (character: Character) => {
    return `${character.firstName.charAt(0)}${character.lastName.charAt(0)}`;
  };

  if (onlineCharacters.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Přítomné postavy
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            Žádné postavy nejsou aktuálně přítomny
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Přítomné postavy
          <Badge variant="secondary" className="text-xs">
            {onlineCharacters.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {onlineCharacters.map((character) => (
            <div key={character.id} className="flex items-center gap-2">
              <CharacterAvatar character={character} size="xs" />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Link 
                  href={`/characters/${character.id}`}
                  className="text-xs text-foreground truncate hover:text-primary hover:underline cursor-pointer"
                >
                  {character.fullName}
                </Link>
                <Circle className="h-2 w-2 text-green-500 fill-current flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}