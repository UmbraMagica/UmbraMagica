import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Mail, MailOpen, Send, Reply, Search, Bird } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { cs } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

// Message form schema
const messageSchema = z.object({
  recipientCharacterId: z.number().min(1, "Vyberte adresáta"),
  subject: z.string().min(1, "Předmět je povinný").max(200),
  content: z.string().min(1, "Obsah zprávy je povinný").max(5000),
});

type MessageForm = z.infer<typeof messageSchema>;

interface Character {
  id: number;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  fullName: string;
}

interface OwlPostMessage {
  id: number;
  senderCharacterId: number;
  recipientCharacterId: number;
  subject: string;
  content: string;
  isRead: boolean;
  sentAt: string;
  readAt?: string | null;
  sender?: {
    firstName: string;
    middleName?: string | null;
    lastName: string;
  };
  recipient?: {
    firstName: string;
    middleName?: string | null;
    lastName: string;
  };
}

export default function OwlPost() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<OwlPostMessage | null>(null);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Get user's characters
  const { data: userCharacters = [] } = useQuery<any[]>({
    queryKey: ["/api/characters"],
    enabled: !!user,
  });

  // Get first alive character as default
  const firstAliveCharacter = userCharacters.find((char: any) => !char.deathDate);

  // Get all characters for recipient selection
  const { data: allCharacters = [] } = useQuery<Character[]>({
    queryKey: ["/api/owl-post/characters"],
    enabled: !!user,
  });

  // Get inbox messages
  const { data: inboxMessages = [] } = useQuery<OwlPostMessage[]>({
    queryKey: ["/api/owl-post/inbox", firstAliveCharacter?.id],
    enabled: !!firstAliveCharacter,
  });

  // Get sent messages
  const { data: sentMessages = [] } = useQuery<OwlPostMessage[]>({
    queryKey: ["/api/owl-post/sent", firstAliveCharacter?.id],
    enabled: !!firstAliveCharacter,
  });

  // Get unread count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/owl-post/unread-count", firstAliveCharacter?.id],
    enabled: !!firstAliveCharacter,
  });

  const unreadCount = unreadData?.count || 0;

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageForm & { senderCharacterId: number }) => {
      const response = await fetch("/api/owl-post/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Dopis byl úspěšně odeslán!" });
      setIsComposeOpen(false);
      setIsReplyOpen(false);
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/owl-post/sent"] });
    },
    onError: () => {
      toast({ title: "Chyba při odesílání dopisu", variant: "destructive" });
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await fetch(`/api/owl-post/mark-read/${messageId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to mark as read");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owl-post/inbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/owl-post/unread-count"] });
    },
  });

  const form = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      subject: "",
      content: "",
    },
  });

  const replyForm = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      subject: "",
      content: "",
    },
  });

  const onSubmit = (data: MessageForm) => {
    if (!firstAliveCharacter) return;
    
    sendMessageMutation.mutate({
      ...data,
      senderCharacterId: firstAliveCharacter.id,
    });
  };

  const onReplySubmit = (data: MessageForm) => {
    if (!firstAliveCharacter) return;
    
    sendMessageMutation.mutate({
      ...data,
      senderCharacterId: firstAliveCharacter.id,
    });
  };

  const handleReply = (message: OwlPostMessage) => {
    setSelectedMessage(message);
    replyForm.setValue("recipientCharacterId", message.senderCharacterId);
    replyForm.setValue("subject", message.subject.startsWith("Re: ") ? message.subject : `Re: ${message.subject}`);
    replyForm.setValue("content", "");
    setIsReplyOpen(true);
  };

  const handleOpenMessage = (message: OwlPostMessage) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const formatSenderName = (sender: { firstName: string; middleName?: string | null; lastName: string }) => {
    return `${sender.firstName} ${sender.middleName ? sender.middleName + ' ' : ''}${sender.lastName}`;
  };

  const formatRecipientName = (recipient: { firstName: string; middleName?: string | null; lastName: string }) => {
    return `${recipient.firstName} ${recipient.middleName ? recipient.middleName + ' ' : ''}${recipient.lastName}`;
  };

  if (!user) {
    return <div>Přihlaste se prosím</div>;
  }

  if (!firstAliveCharacter) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-8">
          <Bird className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nemáte vytvořenou žádnou postavu</p>
        </div>
      </div>
    );
  }

  const filteredInboxMessages = inboxMessages.filter(message =>
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (message.sender && formatSenderName(message.sender).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSentMessages = sentMessages.filter(message =>
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (message.recipient && formatRecipientName(message.recipient).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Bird className="h-8 w-8 text-amber-600" />
        <h1 className="text-3xl font-bold">Soví pošta</h1>
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hledat zprávy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Napsat dopis
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bird className="h-5 w-5" />
                  Napsat nový dopis
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="recipientCharacterId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresát</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Vyberte adresáta" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allCharacters.map((character) => (
                              <SelectItem key={character.id} value={character.id.toString()}>
                                {character.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Předmět</FormLabel>
                        <FormControl>
                          <Input placeholder="Předmět zprávy" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Obsah dopisu</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Napište zde svůj dopis..."
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Bird className="h-4 w-4" />
                      <span>Sova doručí dopis během několika minut</span>
                    </div>
                    <Button type="submit" disabled={sendMessageMutation.isPending}>
                      {sendMessageMutation.isPending ? "Odesílání..." : "Odeslat dopis"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Přijatá pošta
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Odeslaná pošta
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4">
          {filteredInboxMessages.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? "Žádné zprávy neodpovídají vašemu hledání" : "Zatím nemáte žádné dopisy"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredInboxMessages.map((message) => (
              <Card key={message.id} className={`cursor-pointer transition-colors hover:bg-muted/50 ${!message.isRead ? 'border-l-4 border-l-blue-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1" onClick={() => handleOpenMessage(message)}>
                      <div className="mt-1">
                        {message.isRead ? (
                          <MailOpen className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Mail className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-medium ${!message.isRead ? 'font-bold' : ''}`}>
                            {message.sender ? formatSenderName(message.sender) : 'Neznámý odesílatel'}
                          </p>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true, locale: cs })}
                          </span>
                        </div>
                        <h3 className={`text-sm mb-2 ${!message.isRead ? 'font-semibold' : ''}`}>
                          {message.subject}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {message.content}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReply(message);
                      }}
                    >
                      <Reply className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {filteredSentMessages.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? "Žádné zprávy neodpovídají vašemu hledání" : "Zatím jste neodeslali žádné dopisy"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredSentMessages.map((message) => (
              <Card key={message.id} className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3" onClick={() => setSelectedMessage(message)}>
                    <div className="mt-1">
                      <Send className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">
                          Pro: {message.recipient ? formatRecipientName(message.recipient) : 'Neznámý příjemce'}
                        </p>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true, locale: cs })}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium mb-2">{message.subject}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bird className="h-5 w-5" />
                  {selectedMessage.subject}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div>
                    <strong>Od:</strong> {selectedMessage.sender ? formatSenderName(selectedMessage.sender) : 'Neznámý odesílatel'}
                  </div>
                  <div>
                    {formatDistanceToNow(new Date(selectedMessage.sentAt), { addSuffix: true, locale: cs })}
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                    Zavřít
                  </Button>
                  {selectedMessage.sender && (
                    <Button onClick={() => handleReply(selectedMessage)}>
                      <Reply className="h-4 w-4 mr-2" />
                      Odpovědět
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="h-5 w-5" />
              Odpovědět na dopis
            </DialogTitle>
          </DialogHeader>
          <Form {...replyForm}>
            <form onSubmit={replyForm.handleSubmit(onReplySubmit)} className="space-y-4">
              <FormField
                control={replyForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Předmět</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={replyForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Odpověď</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Napište zde svou odpověď..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bird className="h-4 w-4" />
                  <span>Sova doručí odpověď během několika minut</span>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsReplyOpen(false)}>
                    Zrušit
                  </Button>
                  <Button type="submit" disabled={sendMessageMutation.isPending}>
                    {sendMessageMutation.isPending ? "Odesílání..." : "Odeslat odpověď"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}