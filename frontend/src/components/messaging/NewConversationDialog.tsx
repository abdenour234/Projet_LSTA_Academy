/**
 * NewConversationDialog - Dialog for creating new conversations
 * Features:
 * - Search users by school
 * - Dropdown list of all teachers + admins
 * - Optional conversation subject
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Plus, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { auth } from '@/lib/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  schoolId: number;
}

interface NewConversationDialogProps {
  schoolId: number;
  currentUserId: string;
  onConversationCreated: () => void;
}

export default function NewConversationDialog({
  schoolId,
  currentUserId,
  onConversationCreated,
}: NewConversationDialogProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [subject, setSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Load users when dialog opens
  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.firstName.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(term)
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('[NEW_CONVERSATION] Loading users for school:', schoolId);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/school/${schoolId}`,
        {
          headers: {
            Authorization: `Bearer ${auth.getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Impossible de charger les utilisateurs');
      }

      const data = await response.json();
      console.log('[NEW_CONVERSATION] Loaded users:', data);

      // Filter out current user
      const otherUsers = data.filter((u: User) => u.id !== currentUserId);
      setUsers(otherUsers);
      setFilteredUsers(otherUsers);
    } catch (error) {
      console.error('[NEW_CONVERSATION] Error loading users:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la liste des utilisateurs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!selectedUser) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un destinataire',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreating(true);
      console.log('[NEW_CONVERSATION] Creating conversation with:', selectedUser);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/messaging/conversations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.getToken()}`,
          },
          body: JSON.stringify({
            participantId: selectedUser.id,
            subject: subject.trim() || null,
            schoolId: schoolId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la conversation');
      }

      const conversation = await response.json();
      console.log('[NEW_CONVERSATION] Conversation created:', conversation);

      toast({
        title: 'Succès',
        description: `Conversation créée avec ${selectedUser.firstName} ${selectedUser.lastName}`,
      });

      // Reset form
      setSelectedUser(null);
      setSubject('');
      setSearchTerm('');
      setOpen(false);

      // Notify parent
      onConversationCreated();
    } catch (error) {
      console.error('[NEW_CONVERSATION] Error creating conversation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la conversation',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const getInitials = (user: User) => {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle conversation
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvelle conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search input */}
          <div className="space-y-2">
            <Label>Rechercher un destinataire</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Nom, prénom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users list */}
          <div className="space-y-2">
            <Label>
              Sélectionner un destinataire ({filteredUsers.length} disponible{filteredUsers.length > 1 ? 's' : ''})
            </Label>
            <ScrollArea className="h-64 border rounded-md">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Chargement...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchTerm ? 'Aucun résultat' : 'Aucun utilisateur disponible'}
                </div>
              ) : (
                <div className="p-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedUser?.id === user.id
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <Avatar>
                        <AvatarFallback>{getInitials(user)}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {user.firstName} {user.lastName}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.role)}`}
                          >
                            {user.role === 'ADMIN' ? 'Administrateur' : 'Professeur'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>

                      {selectedUser?.id === user.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Optional subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Sujet (optionnel)</Label>
            <Input
              id="subject"
              placeholder="Ex: Réunion du 15 décembre"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-gray-500">
              Le sujet aide à identifier rapidement le contexte de la conversation
            </p>
          </div>

          {/* Selected user preview */}
          {selectedUser && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Destinataire sélectionné:</p>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{getInitials(selectedUser)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>
              Annuler
            </Button>
            <Button onClick={handleCreateConversation} disabled={!selectedUser || creating}>
              {creating ? 'Création...' : 'Créer la conversation'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
