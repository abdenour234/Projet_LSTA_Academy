import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Send, Plus, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Conversation {
  id: string;
  subject: string | null;
  participant_ids: string[];
  updated_at: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

export default function MessagingPage() {
  const { id: schoolId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [isNewConvDialogOpen, setIsNewConvDialogOpen] = useState(false);
  const [newConvSubject, setNewConvSubject] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");

  useEffect(() => {
    checkAuth();
    loadConversations();
  }, [schoolId]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      // Subscribe to realtime updates
      const channel = supabase
        .channel(`messages:${selectedConversation}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${selectedConversation}`,
          },
          (payload) => {
            loadMessages(selectedConversation);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate(`/school/${schoolId}/login`);
      return;
    }
    setUserId(user.id);
  };

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .contains("participant_ids", [user.id])
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des conversations");
      console.error(error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          profiles:sender_id (full_name)
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const messagesWithNames = data?.map((m: any) => ({
        ...m,
        sender_name: m.profiles?.full_name || "Utilisateur",
      })) || [];

      setMessages(messagesWithNames);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des messages");
      console.error(error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase.from("messages").insert([
        {
          conversation_id: selectedConversation,
          sender_id: userId,
          content: newMessage.trim(),
        },
      ]);

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedConversation);

      setNewMessage("");
      loadMessages(selectedConversation);
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const handleCreateConversation = async () => {
    try {
      // Find recipient by email
      const { data: recipientData, error: recipientError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", recipientEmail)
        .eq("school_id", schoolId)
        .single();

      if (recipientError || !recipientData) {
        toast.error("Destinataire introuvable");
        return;
      }

      const { data, error } = await supabase
        .from("conversations")
        .insert([
          {
            school_id: schoolId,
            participant_ids: [userId, recipientData.id],
            subject: newConvSubject,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("Conversation créée");
      setIsNewConvDialogOpen(false);
      setNewConvSubject("");
      setRecipientEmail("");
      loadConversations();
      setSelectedConversation(data.id);
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto p-8 h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Messagerie</h1>
        <Dialog open={isNewConvDialogOpen} onOpenChange={setIsNewConvDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle conversation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Email du destinataire"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
              <div>
                <Input
                  placeholder="Sujet (optionnel)"
                  value={newConvSubject}
                  onChange={(e) => setNewConvSubject(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateConversation} className="w-full">
                Créer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4 h-[calc(100%-5rem)]">
        {/* Conversations list */}
        <Card className="p-4">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation === conv.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5" />
                    <div className="flex-1">
                      <p className="font-medium">
                        {conv.subject || "Sans sujet"}
                      </p>
                      <p className="text-xs opacity-70">
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Aucune conversation
                </p>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Messages */}
        <Card className="col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.sender_id === userId ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Avatar>
                        <AvatarFallback>
                          {msg.sender_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`max-w-[70%] ${
                          msg.sender_id === userId ? "text-right" : ""
                        }`}
                      >
                        <p className="text-xs text-muted-foreground mb-1">
                          {msg.sender_name}
                        </p>
                        <div
                          className={`p-3 rounded-lg ${
                            msg.sender_id === userId
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="resize-none"
                  rows={2}
                />
                <Button onClick={handleSendMessage} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Sélectionnez une conversation
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
