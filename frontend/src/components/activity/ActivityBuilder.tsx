import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Type, Image, FileText, Video, Save, Eye, Loader2, Files, X, File, ImageIcon } from 'lucide-react';
import { activityApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ActivityElement, ActivityElementType } from '@/types/activity';
import { uploadActivityFile } from '@/lib/uploadToStorage';
import { Badge } from '@/components/ui/badge';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activityId, setActivityId] = useState<string | undefined>(initialActivityId);
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [type, setType] = useState(initialData?.type || 'Cours');
  const [level, setLevel] = useState(initialData?.level || 'Primaire');
  const [elements, setElements] = useState<ActivityElement[]>(initialData?.elements || []);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Stocker les fichiers en attente d'upload avec métadonnées
  const [pendingFiles, setPendingFiles] = useState<Map<string, { file: File; preview?: string; elementId: string }>>(new Map());

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
    try {
      // Créer une URL temporaire pour prévisualisation
      const tempUrl = URL.createObjectURL(file);
      const preview = file.type.startsWith('image/') ? tempUrl : undefined;
      
      // Stocker le fichier en attente avec les métadonnées correctes
      setPendingFiles(prev => new Map(prev).set(elementId, {
        file,
        preview,
        elementId
      }));
      
      // Mettre à jour l'élément avec l'URL temporaire
      updateElement(elementId, { 
        content: tempUrl,
        fileName: file.name
      });
      
      toast({ 
        title: 'Fichier ajouté',
        description: `${file.name} sera uploadé lors de la sauvegarde`
      });
    } catch (error) {
      console.error('File handling error:', error);
      toast({ 
        title: 'Erreur',
        description: 'Impossible d\'ajouter le fichier',
        variant: 'destructive'
      });
    }
  };

  const handleMultipleFilesUpload = (files: FileList) => {
    if (!files || files.length === 0) return;
    
    const newPendingFiles = new Map(pendingFiles);
    
    Array.from(files).forEach((file) => {
      // Déterminer le type d'élément selon le type MIME
      let elementType: ActivityElementType = 'image';
      if (file.type.includes('pdf')) {
        elementType = 'pdf';
      } else if (file.type.includes('video')) {
        elementType = 'video';
      } else if (file.type.includes('image')) {
        elementType = 'image';
      }
      
      // Créer un ID unique pour ce fichier
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Créer une URL temporaire pour prévisualisation (seulement pour les images)
      const preview = elementType === 'image' ? URL.createObjectURL(file) : undefined;
      
      // Stocker le fichier en attente avec métadonnées
      newPendingFiles.set(fileId, {
        file,
        preview,
        elementId: fileId,
      });
    });
    
    setPendingFiles(newPendingFiles);
    
    toast({ 
      title: 'Fichiers ajoutés',
      description: `${files.length} fichier(s) prêts à être uploadés`
    });
  };

  const removeFile = (fileId: string) => {
    const newPendingFiles = new Map(pendingFiles);
    const fileData = newPendingFiles.get(fileId);
    
    // Révoquer l'URL blob pour libérer la mémoire
    if (fileData?.preview) {
      URL.revokeObjectURL(fileData.preview);
    }
    
    newPendingFiles.delete(fileId);
    setPendingFiles(newPendingFiles);
    
    toast({
      title: 'Fichier retiré',
      description: 'Le fichier a été retiré de la sélection'
    });
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
      return <ImageIcon className="h-5 w-5" />;
    } else if (ext === 'pdf') {
      return <FileText className="h-5 w-5" />;
    } else if (['mp4', 'avi', 'mov', 'webm'].includes(ext || '')) {
      return <Video className="h-5 w-5" />;
    }
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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

      let currentActivityId = activityId;

      // Étape 1: Sauvegarder l'activité
      if (activityId) {
        await activityApi.update(activityId, activityData);
      } else {
        const created = await activityApi.create(activityData);
        if (created && created.id) {
          currentActivityId = created.id;
          setActivityId(created.id);
        }
      }

      // Étape 2: Créer des éléments pour les fichiers en attente et les uploader
      if (pendingFiles.size > 0 && currentActivityId) {
        const newElements: ActivityElement[] = [];
        const formData = new FormData();
        const elementIds: string[] = [];

        // Créer des éléments pour chaque fichier
        Array.from(pendingFiles.entries()).forEach(([fileId, fileData], index) => {
          const file = fileData.file;
          
          // Déterminer le type d'élément
          let elementType: ActivityElementType = 'image';
          if (file.type.includes('pdf')) {
            elementType = 'pdf';
          } else if (file.type.includes('video')) {
            elementType = 'video';
          } else if (file.type.includes('image')) {
            elementType = 'image';
          }
          
          // Créer un élément
          const element: ActivityElement = {
            id: fileId,
            type: elementType,
            content: '', // Sera rempli après l'upload
            position: { x: 50 + (index * 20), y: 50 + (index * 20) },
            size: { width: 400, height: elementType === 'pdf' ? 500 : 300 },
            style: {
              fontSize: '16px',
              color: 'hsl(var(--foreground))',
              backgroundColor: 'transparent',
              padding: '8px',
            },
          };
          
          newElements.push(element);
          formData.append('files', file);
          elementIds.push(fileId);
        });

        // Ajouter les elementIds
        elementIds.forEach(id => formData.append('elementIds', id));

        const response = await fetch(`http://localhost:8080/api/activity-files/upload/${currentActivityId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          
          // Mettre à jour les nouveaux éléments avec les vraies URLs
          if (result.success && result.files) {
            result.files.forEach((uploadedFile: any) => {
              // Ajouter l'URL complète du backend pour les fichiers
              const fullUrl = `http://localhost:8080${uploadedFile.url}`;
              const element = newElements.find(el => el.id === uploadedFile.elementId);
              if (element) {
                element.content = fullUrl;
                element.fileId = uploadedFile.id;
                element.fileName = uploadedFile.fileName;
              }
            });
            
            // Filtrer les éléments existants pour supprimer ceux qui ont des URLs blob ou vides
            // correspondant aux elementIds des fichiers uploadés
            const uploadedElementIds = new Set(result.files.map((f: any) => f.elementId));
            const filteredElements = elements.filter(el => {
              // Garder les éléments qui ne sont pas dans la liste des uploadés
              // ou qui ont déjà une vraie URL (pas blob: ni vide)
              if (uploadedElementIds.has(el.id)) {
                return el.content && !el.content.startsWith('blob:');
              }
              return true;
            });
            
            // Combiner les éléments filtrés avec les nouveaux
            const allElements = [...filteredElements, ...newElements];
            setElements(allElements);
            
            // RE-SAUVEGARDER l'activité avec les vraies URLs
            const updatedActivityData = {
              title,
              description,
              type,
              level,
              schoolId,
              layoutData: JSON.stringify({ elements: allElements }),
              isPublished: publish,
            };
            
            await activityApi.update(currentActivityId, updatedActivityData);
          }

          // Nettoyer les previews et vider les fichiers en attente
          pendingFiles.forEach(fileData => {
            if (fileData.preview) {
              URL.revokeObjectURL(fileData.preview);
            }
          });
          setPendingFiles(new Map());
          
          toast({ 
            title: 'Fichiers uploadés',
            description: `${result.files.length} fichier(s) uploadé(s) avec succès (TTL: 7 jours)`
          });
        }
      }

      toast({ 
        title: publish ? 'Activité publiée' : 'Activité enregistrée',
        description: pendingFiles.size > 0 ? 'Activité et fichiers enregistrés avec succès' : 'L\'activité a été enregistrée'
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
          
          {/* Upload multiple files at once */}
          <div className="mt-4 pt-4 border-t">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  handleMultipleFilesUpload(e.target.files);
                  e.target.value = ''; // Reset input
                }
              }}
            />
            <Button 
              variant="default" 
              size="sm" 
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Files className="h-4 w-4 mr-2" />
              Upload Plusieurs Fichiers
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Sélectionnez plusieurs images, PDFs ou vidéos
            </p>
          </div>
        </Card>

        {/* Fichiers sélectionnés */}
        {pendingFiles.size > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Files className="h-4 w-4" />
                Fichiers Sélectionnés
              </h3>
              <Badge variant="secondary">{pendingFiles.size}</Badge>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {Array.from(pendingFiles.entries()).map(([fileId, fileData]) => (
                <div 
                  key={fileId}
                  className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                >
                  {/* Preview ou Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-background border flex items-center justify-center">
                    {fileData.preview ? (
                      <img 
                        src={fileData.preview} 
                        alt={fileData.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground">
                        {getFileIcon(fileData.file.name)}
                      </div>
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={fileData.file.name}>
                      {fileData.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(fileData.file.size)}
                    </p>
                  </div>
                  
                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeFile(fileId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Ces fichiers seront uploadés lors de la sauvegarde
              </p>
            </div>
          </Card>
        )}

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
