import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2 } from 'lucide-react';

interface SchoolFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const SchoolFormDialog = ({ open, onOpenChange, onSuccess }: SchoolFormDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    address: '',
    city: '',
    region: 'Casablanca-Settat',
    level: 'Primaire',
    students: 0,
    status: 'Public',
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id || !formData.name) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      let logoUrl = '';

      // Upload logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const filePath = `${formData.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('school-logos')
          .upload(filePath, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('school-logos')
          .getPublicUrl(filePath);

        logoUrl = publicUrl;
      }

      // Insert school
      const { error } = await supabase
        .from('schools')
        .insert([{
          ...formData,
          logo_url: logoUrl,
        }]);

      if (error) throw error;

      toast({
        title: 'École ajoutée',
        description: 'La nouvelle école a été créée avec succès',
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        id: '',
        name: '',
        address: '',
        city: '',
        region: 'Casablanca-Settat',
        level: 'Primaire',
        students: 0,
        status: 'Public',
      });
      setLogoFile(null);
      setLogoPreview('');
    } catch (error: any) {
      console.error('Error creating school:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer l\'école',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle école</DialogTitle>
          <DialogDescription>
            Ajoutez une nouvelle école à la plateforme
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logo Upload */}
          <div>
            <Label htmlFor="logo">Logo de l'école</Label>
            <div className="mt-2 flex items-center gap-4">
              {logoPreview && (
                <img 
                  src={logoPreview} 
                  alt="Aperçu du logo" 
                  className="h-20 w-20 object-cover rounded-lg border"
                />
              )}
              <div className="flex-1">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="id">ID de l'école *</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="ex: 123"
                required
              />
            </div>

            <div>
              <Label htmlFor="name">Nom de l'école *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: École Pasteur"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Adresse complète"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="ex: Casablanca"
              />
            </div>

            <div>
              <Label htmlFor="region">Région</Label>
              <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Casablanca-Settat">Casablanca-Settat</SelectItem>
                  <SelectItem value="Rabat-Salé-Kénitra">Rabat-Salé-Kénitra</SelectItem>
                  <SelectItem value="Fès-Meknès">Fès-Meknès</SelectItem>
                  <SelectItem value="Marrakech-Safi">Marrakech-Safi</SelectItem>
                  <SelectItem value="Tanger-Tétouan-Al Hoceïma">Tanger-Tétouan-Al Hoceïma</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="level">Niveau</Label>
              <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primaire">Primaire</SelectItem>
                  <SelectItem value="Collège">Collège</SelectItem>
                  <SelectItem value="Lycée">Lycée</SelectItem>
                  <SelectItem value="Primaire et Collège">Primaire et Collège</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="students">Nombre d'élèves</Label>
              <Input
                id="students"
                type="number"
                value={formData.students}
                onChange={(e) => setFormData({ ...formData, students: parseInt(e.target.value) || 0 })}
                placeholder="ex: 500"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Statut</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Public">Public</SelectItem>
                <SelectItem value="Privé">Privé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Créer l'école
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
