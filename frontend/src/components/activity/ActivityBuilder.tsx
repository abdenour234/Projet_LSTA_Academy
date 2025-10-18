import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Type, Image, FileText, Video, Save, Eye, Loader2 } from 'lucide-react';
import { activityApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ActivityElement, ActivityElementType } from '@/types/activity';
import { uploadActivityFile } from '@/lib/uploadToStorage';

interface ActivityBuilderProps {
  activityId?: string;
  initialData?: {
    title: string;
    description: string;
    type: string;
    level: string;
    elements: ActivityElement[];
  };
  schoolId: string;
  onSave?: () => void;
}

export const ActivityBuilder = ({ activityId: initialActivityId, initialData, schoolId, onSave }: ActivityBuilderProps) => {
  const { toast } = useToast();
  const [activityId, setActivityId] = useState<string | undefined>(initialActivityId);
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [type, setType] = useState(initialData?.type || 'Cours');
  const [level, setLevel] = useState(initialData?.level || 'Primaire');
  const [elements, setElements] = useState<ActivityElement[]>(initialData?.elements || []);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const addElement = (elementType: ActivityElementType) => {
    const newElement: ActivityElement = {
      id: `element-${Date.now()}`,
      type: elementType,
      content: elementType === 'text' ? 'Nouveau texte' : '',
      position: { x: 50, y: 50 },
      size: { width: 300, height: elementType === 'text' ? 100 : 200 },
      style: {
        fontSize: '16px',
        color: 'hsl(var(--foreground))',
        backgroundColor: 'transparent',
        padding: '8px',
      },
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<ActivityElement>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement === id) setSelectedElement(null);
  };

  const handleFileUpload = async (elementId: string, file: File) => {
    setUploading(true);
    try {
      // Si pas d'activityId, sauvegarder d'abord l'activité
      if (!activityId) {
        toast({ 
          title: 'Enregistrement requis',
          description: 'Veuillez d\'abord enregistrer l\'activité avant d\'ajouter des fichiers',
          variant: 'destructive'
        });
        setUploading(false);
        return;
      }

      // Upload via nouvelle API
      const formData = new FormData();
      formData.append('files', file);
      formData.append('elementIds', elementId);

      const response = await fetch(`http://localhost:8080/api/activity-files/upload/${activityId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload');
      }

      const result = await response.json();
      
      if (result.success && result.files && result.files.length > 0) {
        const uploadedFile = result.files[0];
        // Mettre l'URL du fichier dans l'élément
        updateElement(elementId, { 
          content: uploadedFile.url,
          fileId: uploadedFile.id,
          fileName: uploadedFile.fileName
        });
        
        toast({ 
          title: 'Fichier uploadé avec succès',
          description: `${uploadedFile.fileName} ajouté (TTL: 7 jours)`
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({ 
        title: 'Erreur lors de l\'upload',
        description: error instanceof Error ? error.message : 'Impossible d\'uploader le fichier',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (publish: boolean = false) => {
    if (!title.trim()) {
      toast({ 
        title: 'Titre requis',
        description: 'Veuillez ajouter un titre à l\'activité',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const activityData = {
        title,
        description,
        type,
        level,
        schoolId,
        layoutData: JSON.stringify({ elements }),
        isPublished: publish,
      };

      if (activityId) {
        await activityApi.update(activityId, activityData);
      } else {
        const created = await activityApi.create(activityData);
        // Stocker l'ID de l'activité créée pour les uploads ultérieurs
        if (created && created.id) {
          setActivityId(created.id);
        }
      }

      toast({ 
        title: publish ? 'Activité publiée' : 'Activité enregistrée',
        description: activityId ? 'L\'activité a été mise à jour' : 'L\'activité a été créée - Vous pouvez maintenant ajouter des fichiers'
      });
      
      if (onSave) onSave();
    } catch (error) {
      console.error('Save error:', error);
      toast({ 
        title: 'Erreur',
        description: 'Impossible d\'enregistrer l\'activité',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const selected = elements.find(el => el.id === selectedElement);

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      {/* Sidebar - Metadata & Tools */}
      <div className="col-span-3 space-y-4 overflow-y-auto">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Informations</h3>
          <div className="space-y-3">
            <div>
              <Label>Titre</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Type</Label>
              <Input value={type} onChange={(e) => setType(e.target.value)} />
            </div>
            <div>
              <Label>Niveau</Label>
              <Input value={level} onChange={(e) => setLevel(e.target.value)} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Ajouter des éléments</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => addElement('text')}>
              <Type className="h-4 w-4 mr-1" />
              Texte
            </Button>
            <Button variant="outline" size="sm" onClick={() => addElement('image')}>
              <Image className="h-4 w-4 mr-1" />
              Image
            </Button>
            <Button variant="outline" size="sm" onClick={() => addElement('pdf')}>
              <FileText className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => addElement('video')}>
              <Video className="h-4 w-4 mr-1" />
              Vidéo
            </Button>
          </div>
        </Card>

        {selected && (
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Propriétés</h3>
            <div className="space-y-3">
              {selected.type === 'text' && (
                <div>
                  <Label>Contenu</Label>
                  <Textarea
                    value={selected.content}
                    onChange={(e) => updateElement(selected.id, { content: e.target.value })}
                    rows={4}
                  />
                </div>
              )}
              
              {['image', 'pdf', 'video'].includes(selected.type) && (
                <div>
                  <Label>Fichier</Label>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept={
                        selected.type === 'image' ? 'image/*' :
                        selected.type === 'pdf' ? 'application/pdf' :
                        'video/*'
                      }
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(selected.id, file);
                      }}
                      disabled={uploading}
                    />
                    {uploading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Upload en cours...</span>
                      </div>
                    )}
                    {selected.content && (
                      <p className="text-xs text-muted-foreground">
                        Fichier chargé
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label>Largeur (px)</Label>
                <Input
                  type="number"
                  value={selected.size.width}
                  onChange={(e) => updateElement(selected.id, {
                    size: { ...selected.size, width: parseInt(e.target.value) || 300 }
                  })}
                />
              </div>

              <div>
                <Label>Hauteur (px)</Label>
                <Input
                  type="number"
                  value={selected.size.height}
                  onChange={(e) => updateElement(selected.id, {
                    size: { ...selected.size, height: parseInt(e.target.value) || 200 }
                  })}
                />
              </div>

              <Button variant="destructive" size="sm" onClick={() => deleteElement(selected.id)} className="w-full">
                Supprimer
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Canvas */}
      <div className="col-span-9 bg-muted/20 rounded-lg relative overflow-auto" style={{ minHeight: '600px' }}>
        {elements.map((element) => (
          <div
            key={element.id}
            className={`absolute cursor-move border-2 ${
              selectedElement === element.id ? 'border-primary' : 'border-transparent'
            } hover:border-primary/50 transition-colors`}
            style={{
              left: element.position.x,
              top: element.position.y,
              width: element.size.width,
              height: element.size.height,
              ...element.style,
            }}
            onClick={() => setSelectedElement(element.id)}
            draggable
            onDragEnd={(e) => {
              const rect = e.currentTarget.parentElement?.getBoundingClientRect();
              if (rect) {
                updateElement(element.id, {
                  position: {
                    x: e.clientX - rect.left - element.size.width / 2,
                    y: e.clientY - rect.top - element.size.height / 2,
                  }
                });
              }
            }}
          >
            {element.type === 'text' && (
              <div className="p-2 h-full overflow-auto">{element.content}</div>
            )}
            {element.type === 'image' && element.content && (
              <img src={element.content} alt="" className="w-full h-full object-cover rounded" />
            )}
            {element.type === 'pdf' && element.content && (
              <div className="w-full h-full flex items-center justify-center bg-secondary">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            {element.type === 'video' && element.content && (
              <video src={element.content} controls className="w-full h-full rounded" />
            )}
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="col-span-12 flex justify-end gap-2">
        <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          Enregistrer brouillon
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving}>
          <Eye className="h-4 w-4 mr-2" />
          Publier l'activité
        </Button>
      </div>
    </div>
  );
};
