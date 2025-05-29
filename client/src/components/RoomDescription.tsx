import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  longDescription?: string;
  isPublic: boolean;
  createdAt: string;
}

interface RoomDescriptionProps {
  description: string;
}

export function RoomDescription({ description }: RoomDescriptionProps) {
  const [, setLocation] = useLocation();
  
  const { data: rooms = [] } = useQuery<ChatRoom[]>({
    queryKey: ["/api/chat/rooms"],
    staleTime: 60000, // Cache for 1 minute
  });

  const createLinkedDescription = (text: string) => {
    // Find room names in brackets like [Ulice] or [Příčná ulice]
    const linkRegex = /\[([^\]]+)\]/g;
    
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const roomName = match[1];
      const targetRoom = rooms.find(room => 
        room.name.toLowerCase() === roomName.toLowerCase()
      );

      if (targetRoom) {
        // Create clickable link
        parts.push(
          <span
            key={match.index}
            className="text-accent hover:text-accent/80 cursor-pointer underline"
            onClick={() => setLocation(`/chat/room/${targetRoom.id}`)}
          >
            {roomName}
          </span>
        );
      } else {
        // If room not found, just show the text without brackets
        parts.push(roomName);
      }

      lastIndex = linkRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  // Process HTML formatting and room links
  const processDescription = (text: string) => {
    const linkedContent = createLinkedDescription(text);
    
    return (
      <div 
        className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed"
        style={{ 
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {linkedContent.map((part, index) => {
          if (typeof part === 'string') {
            // Process HTML formatting for string parts
            return (
              <span
                key={index}
                dangerouslySetInnerHTML={{ __html: part }}
              />
            );
          }
          return part; // React element (link)
        })}
      </div>
    );
  };

  return processDescription(description);
}