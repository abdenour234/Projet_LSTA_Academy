import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Type, Image, FileText, Video, Save, Eye, Loader2, Files, X, File, ImageIcon } from 'lucide-react';
import { activityApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ActivityElement, ActivityElementType } from '@/types/activity';
import { Badge } from '@/components/ui/badge';
import { activityBuilderSchema, ActivityBuilderFormData } from '@/lib/validations/activityValidation';
import { InputSanitizer } from '@/lib/utils/sanitizer';

interface ActivityBuilderProps {
  activityId?: string;
  initialData?: {
    title: string;
    description: string;
    type: string;
    level: string;
    elements: ActivityElement[];
    classId?: string;
  };
  schoolId: string;
  classId?: string;
  onSave?: () => void;
}

export const ActivityBuilder = ({
                                  activityId: initialActivityId,
                                  initialData,
                                  schoolId,
                                  classId,
                                  onSave
                                }: ActivityBuilderProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activityId, setActivityId] = useState<string | undefined>(initialActivityId);
  const [elements, setElements] = useState<ActivityElement[]>(initialData?.elements || []);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Map<string, { file: File; preview?: string; elementId: string }>>(new Map());

  // Form validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues
  } = useForm<ActivityBuilderFormData>({
    resolver: zodResolver(activityBuilderSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      content: '',
      type: (initialData?.type as 'lesson' | 'exercise' | 'quiz' | 'project' | 'evaluation') || 'lesson',
      difficulty: 'medium' as 'easy' | 'medium' | 'hard',
      duration: '',
      subject: '',
      schoolIds: [parseInt(schoolId)],
      classId: classId
    },
    mode: 'onBlur'
  });

  // Watch form values
  const title = watch('title');
  const description = watch('description');

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
    // If updating text content, validate and sanitize
    if (updates.content && typeof updates.content === 'string') {
      try {
        InputSanitizer.validateSafe(updates.content, 'Contenu');
        updates.content = InputSanitizer.sanitizeText(updates.content);
      } catch (error) {
        toast({
          title: 'Contenu invalide',
          description: error instanceof Error ? error.message : 'Le contenu contient des caractères non autorisés',
          variant: 'destructive'
        });
        return;
      }
    }

    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement === id) setSelectedElement(null);
  };

  const validateFile = (file: File): boolean => {
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (file.size > maxSize) {
      toast({
        title: 'Fichier trop volumineux',
        description: 'La taille maximale est de 50MB',
        variant: 'destructive'
      });
      return false;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Type de fichier non autorisé',
        description: 'Seuls les images, vidéos et PDFs sont acceptés',
        variant: 'destructive'
      });
      return false;
    }

    // Sanitize filename
    const sanitizedName = InputSanitizer.sanitizeText(file.name);
    if (sanitizedName !== file.name) {
      toast({
        title: 'Nom de fichier modifié',
        description: 'Le nom du fichier contient des caractères non autorisés',
        variant: 'destructive'
      });
    }

    return true;
  };

  const handleFileUpload = async (elementId: string, file: File) => {
    if (!validateFile(file)) return;

    try {
      const tempUrl = URL.createObjectURL(file);
      const preview = file.type.startsWith('image/') ? tempUrl : undefined;

      setPendingFiles(prev => new Map(prev).set(elementId, {
        file,
        preview,
        elementId
      }));

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

    const validFiles: File[] = [];
    Array.from(files).forEach(file => {
      if (validateFile(file)) {
        validFiles.push(file);
      }
    });

    if (validFiles.length === 0) return;

    const newPendingFiles = new Map(pendingFiles);

    validFiles.forEach((file) => {
      let elementType: ActivityElementType = 'image';
      if (file.type.includes('pdf')) {
        elementType = 'pdf';
      } else if (file.type.includes('video')) {
        elementType = 'video';
      } else if (file.type.includes('image')) {
        elementType = 'image';
      }

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const preview = elementType === 'image' ? URL.createObjectURL(file) : undefined;

      newPendingFiles.set(fileId, {
        file,
        preview,
        elementId: fileId,
      });
    });

    setPendingFiles(newPendingFiles);

    toast({
      title: 'Fichiers ajoutés',
      description: `${validFiles.length} fichier(s) prêts à être uploadés`
    });
  };

  const removeFile = (fileId: string) => {
    const newPendingFiles = new Map(pendingFiles);
    const fileData = newPendingFiles.get(fileId);

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

  const onSubmit = async (data: ActivityBuilderFormData, publish: boolean = false) => {
    setSaving(true);

    try {
      // Sanitize all text inputs
      const sanitizedData = {
        title: InputSanitizer.sanitizeText(data.title),
        description: InputSanitizer.sanitizeText(data.description),
        content: InputSanitizer.sanitizeText(data.content),
        type: data.type, // Already validated by enum
        difficulty: data.difficulty, // Already validated by enum
        duration: InputSanitizer.sanitizeText(data.duration),
        subject: InputSanitizer.sanitizeText(data.subject),
        schoolIds: data.schoolIds,
        classId: data.classId,
      };

      // Validate for malicious content
      InputSanitizer.validateSafe(sanitizedData.title, 'Titre');
      InputSanitizer.validateSafe(sanitizedData.description, 'Description');
      InputSanitizer.validateSafe(sanitizedData.content, 'Contenu');
      InputSanitizer.validateSafe(sanitizedData.subject, 'Sujet');

      const activityData = {
        ...sanitizedData,
        layoutData: JSON.stringify({ elements }),
        isPublished: publish,
      };

      let currentActivityId = activityId;

      // Save activity
      if (activityId) {
        await activityApi.update(activityId, activityData);
      } else {
        const created = await activityApi.create(activityData);
        if (created && created.id) {
          currentActivityId = created.id;
          setActivityId(created.id);
        }
      }

      // Upload pending files
      if (pendingFiles.size > 0 && currentActivityId) {
        const newElements: ActivityElement[] = [];
        const formData = new FormData();
        const elementIds: string[] = [];

        Array.from(pendingFiles.entries()).forEach(([fileId, fileData], index) => {
          const file = fileData.file;

          let elementType: ActivityElementType = 'image';
          if (file.type.includes('pdf')) {
            elementType = 'pdf';
          } else if (file.type.includes('video')) {
            elementType = 'video';
          } else if (file.type.includes('image')) {
            elementType = 'image';
          }

          const element: ActivityElement = {
            id: fileId,
            type: elementType,
            content: '',
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

          if (result.success && result.files) {
            result.files.forEach((uploadedFile: any) => {
              const fullUrl = `http://localhost:8080${uploadedFile.url}`;
              const element = newElements.find(el => el.id === uploadedFile.elementId);
              if (element) {
                element.content = fullUrl;
                element.fileId = uploadedFile.id;
                element.fileName = uploadedFile.fileName;
              }
            });

            const uploadedElementIds = new Set(result.files.map((f: any) => f.elementId));
            const filteredElements = elements.filter(el => {
              if (uploadedElementIds.has(el.id)) {
                return el.content && !el.content.startsWith('blob:');
              }
              return true;
            });

            const allElements = [...filteredElements, ...newElements];
            setElements(allElements);

            const updatedActivityData = {
              ...sanitizedData,
              layoutData: JSON.stringify({ elements: allElements }),
              isPublished: publish,
            };

            await activityApi.update(currentActivityId, updatedActivityData);
          }

          pendingFiles.forEach(fileData => {
            if (fileData.preview) {
              URL.revokeObjectURL(fileData.preview);
            }
          });
          setPendingFiles(new Map());

          toast({
            title: 'Fichiers uploadés',
            description: `${result.files.length} fichier(s) uploadé(s) avec succès`
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

      // Handle validation errors from backend
      if (error instanceof Error && error.message.includes('Validation Failed')) {
        toast({
          title: 'Erreur de validation',
          description: 'Veuillez vérifier les champs du formulaire',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible d\'enregistrer l\'activité',
          variant: 'destructive'
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const selected = elements.find(el => el.id === selectedElement);

  return (
      <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="grid grid-cols-12 gap-4 h-full">
        {/* Sidebar - Metadata & Tools */}
        <div className="col-span-3 space-y-4 overflow-y-auto">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Informations</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="title">
                  Titre <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="title"
                    {...register('title')}
                    className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                    id="description"
                    {...register('description')}
                    rows={3}
                    className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="content">
                  Contenu <span className="text-red-500">*</span>
                </Label>
                <Textarea
                    id="content"
                    {...register('content')}
                    rows={4}
                    className={errors.content ? 'border-red-500' : ''}
                    placeholder="Décrivez le contenu de l'activité..."
                />
                {errors.content && (
                    <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="type">
                  Type <span className="text-red-500">*</span>
                </Label>
                <Select
                    value={watch('type')}
                    onValueChange={(value) => setValue('type', value as 'lesson' | 'exercise' | 'quiz' | 'project' | 'evaluation')}
                >
                  <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lesson">Cours</SelectItem>
                    <SelectItem value="exercise">Exercice</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="project">Projet</SelectItem>
                    <SelectItem value="evaluation">Évaluation</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                    <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="difficulty">
                  Difficulté <span className="text-red-500">*</span>
                </Label>
                <Select
                    value={watch('difficulty')}
                    onValueChange={(value) => setValue('difficulty', value as 'easy' | 'medium' | 'hard')}
                >
                  <SelectTrigger className={errors.difficulty ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Sélectionnez une difficulté" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Facile</SelectItem>
                    <SelectItem value="medium">Moyen</SelectItem>
                    <SelectItem value="hard">Difficile</SelectItem>
                  </SelectContent>
                </Select>
                {errors.difficulty && (
                    <p className="text-red-500 text-sm mt-1">{errors.difficulty.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="duration">
                  Durée <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="duration"
                    {...register('duration')}
                    placeholder="Ex: 2 heures, 45 minutes..."
                    className={errors.duration ? 'border-red-500' : ''}
                />
                {errors.duration && (
                    <p className="text-red-500 text-sm mt-1">{errors.duration.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="subject">
                  Sujet <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="subject"
                    {...register('subject')}
                    placeholder="Ex: Mathématiques, Sciences..."
                    className={errors.subject ? 'border-red-500' : ''}
                />
                {errors.subject && (
                    <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-4">Ajouter des éléments</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => addElement('text')}>
                <Type className="h-4 w-4 mr-1" />
                Texte
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addElement('image')}>
                <Image className="h-4 w-4 mr-1" />
                Image
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addElement('pdf')}>
                <FileText className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addElement('video')}>
                <Video className="h-4 w-4 mr-1" />
                Vidéo
              </Button>
            </div>

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
                      e.target.value = '';
                    }
                  }}
              />
              <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
              >
                <Files className="h-4 w-4 mr-2" />
                Upload Plusieurs Fichiers
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Sélectionnez plusieurs images, PDFs ou vidéos (Max 50MB)
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

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" title={fileData.file.name}>
                            {fileData.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(fileData.file.size)}
                          </p>
                        </div>

                        <Button
                            type="button"
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
                            maxLength={10000}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {selected.content.length} / 10000 caractères
                        </p>
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
                        min="50"
                        max="2000"
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
                        min="50"
                        max="2000"
                    />
                  </div>

                  <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteElement(selected.id)}
                      className="w-full"
                  >
                    Supprimer
                  </Button>
                </div>
              </Card>
          )}
        </div>

        {/* Canvas - No changes needed */}
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
          <Button
              type="submit"
              variant="outline"
              disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            Enregistrer brouillon
          </Button>
          <Button
              type="button"
              onClick={handleSubmit((data) => onSubmit(data, true))}
              disabled={saving}
          >
            {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
            ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Publier l'activité
                </>
            )}
          </Button>
        </div>
      </form>
  );
};