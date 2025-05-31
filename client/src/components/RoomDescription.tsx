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

interface Character {
  id: number;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  residence?: string | null;
}

interface RoomDescriptionProps {
  description: string;
  roomName?: string;
}

export function RoomDescription({ description, roomName }: RoomDescriptionProps) {
  const [, setLocation] = useLocation();
  
  const { data: rooms = [] } = useQuery<ChatRoom[]>({
    queryKey: ["/api/chat/rooms"],
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch characters for dormitory housing if this is the dormitory room
  const isDormitory = roomName && roomName.includes("Ubytovna U starého Šeptáka");
  
  const { data: dormitoryCharacters = [] } = useQuery<Character[]>({
    queryKey: ["/api/characters/dormitory-residents"],
    enabled: !!isDormitory,
    staleTime: 60000,
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

  // Convert markdown-style formatting to HTML
  const processMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **bold** -> <strong>bold</strong>
      .replace(/\*(.*?)\*/g, '<em>$1</em>')              // *italic* -> <em>italic</em>
      .replace(/__(.*?)__/g, '<u>$1</u>');               // __underline__ -> <u>underline</u>
  };

  // Process HTML formatting and room links
  const processDescription = (text: string) => {
    const linkedContent = createLinkedDescription(text);
    
    // Add dormitory residents section if this is the dormitory
    let displayContent = linkedContent;
    if (isDormitory && dormitoryCharacters.length > 0) {
      // Sort characters alphabetically by full name
      const sortedCharacters = [...dormitoryCharacters].sort((a, b) => {
        const fullNameA = `${a.firstName} ${a.middleName || ''} ${a.lastName}`.trim();
        const fullNameB = `${b.firstName} ${b.middleName || ''} ${b.lastName}`.trim();
        return fullNameA.localeCompare(fullNameB, 'cs');
      });

      // Add separator and residents section
      const residentsText = sortedCharacters.map((character, index) => {
        const fullName = `${character.firstName} ${character.middleName ? character.middleName + ' ' : ''}${character.lastName}`;
        return `${index + 1}. ${fullName}`;
      }).join('\n');
      
      displayContent = [
        ...linkedContent,
        '\n\n---\n\n**Ubytované osoby:**\n',
        residentsText
      ];
    }
    
    return (
      <div 
        className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed"
        style={{ 
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {displayContent.map((part, index) => {
          if (typeof part === 'string') {
            // Process markdown formatting for string parts
            const formattedText = processMarkdown(part);
            return (
              <span
                key={index}
                dangerouslySetInnerHTML={{ __html: formattedText }}
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