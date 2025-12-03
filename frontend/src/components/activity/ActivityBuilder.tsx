import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  Type, 
  Image, 
  FileText, 
  Video, 
  Save, 
  Eye, 
  Loader2, 
  Files, 
  X, 
  File, 
  ImageIcon,
  BookOpen   // AJOUTÉ ICI
} from 'lucide-react';
import { activityApi, API_CONFIG, classApi, subjectApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ActivityElement, ActivityElementType } from '@/types/activity';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ActivityBuilderProps {
  activityId?: string;
  initialData?: {
    title: string;
    description: string;
    type: string;
    elements: ActivityElement[];
    level?: string;
    classId?: string;
    nature?: string;
  };
  schoolId: string;
  classId?: string;
  subjectId?: string;   // AJOUTÉ ICI
  nature?: string;
  approvalStatus?: string;
  onSave?: () => void;
}

export const ActivityBuilder = ({
  activityId: initialActivityId,
  initialData,
  schoolId,
  classId,
  subjectId,           // AJOUTÉ ICI
  nature: propNature = 'Classe',
  approvalStatus = 'PENDING',  // ✅ AJOUTEZ CETTE LIGNE
  onSave
}: ActivityBuilderProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activityId, setActivityId] = useState<string | undefined>(initialActivityId);
  const [title, setTitle] = useState(initialData?.title || '');
  const [nature, setNature] = useState<string>(initialData?.nature || propNature || 'Classe');
  const [description, setDescription] = useState(initialData?.description || '');
  
  // Type limité à Lecture / Écriture / Orale
  const [type, setType] = useState(initialData?.type || 'Lecture');

  const [selectedClassId, setSelectedClassId] = useState<string>(classId || initialData?.classId || '');
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [elements, setElements] = useState<ActivityElement[]>(initialData?.elements || []);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Map<string, { file: File; preview?: string; elementId: string }>>(new Map());
  const [level, setLevel] = useState<string>(initialData?.level || 'Primaire');
  // Synchroniser nature si la prop change
  useEffect(() => {
    if (propNature && propNature !== nature) {
      setNature(propNature);
    }
  }, [propNature]);

  // Charger classes et matières
  useEffect(() => {
    const loadData = async () => {
      try {
        const [classesData, subjectsData] = await Promise.all([
          classApi.getBySchoolId(schoolId.toString()),
          subjectApi.getBySchoolId(parseInt(schoolId))
        ]);
        setClasses(classesData);
        setSubjects(subjectsData);

        if (!selectedClassId && classesData.length > 0) {
          setSelectedClassId(classesData[0].id);
        }
      } catch (error) {
        toast({
          title: 'Erreur de chargement',
          description: 'Impossible de charger les classes ou matières',
          variant: 'destructive'
        });
      }
    };
    loadData();
  }, [schoolId]);

  // === ÉLÉMENTS & FICHIERS (inchangé) ===
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
    const tempUrl = URL.createObjectURL(file);
    const preview = file.type.startsWith('image/') ? tempUrl : undefined;

    setPendingFiles(prev => new Map(prev).set(elementId, { file, preview, elementId }));
    updateElement(elementId, { content: tempUrl, fileName: file.name, hasPendingUpload: true as any });

    toast({ title: 'Fichier ajouté', description: `${file.name} sera uploadé lors de la sauvegarde` });
  };

  const handleMultipleFilesUpload = (files: FileList) => {
    if (!files?.length) return;
    const newPending = new Map(pendingFiles);

    Array.from(files).forEach(file => {
      const elementType: ActivityElementType = file.type.includes('pdf') ? 'pdf' : file.type.includes('video') ? 'video' : 'image';
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const preview = elementType === 'image' ? URL.createObjectURL(file) : undefined;
      newPending.set(fileId, { file, preview, elementId: fileId });
    });

    setPendingFiles(newPending);
    toast({ title: 'Fichiers ajoutés', description: `${files.length} fichier(s) prêts` });
  };

  const removeFile = (fileId: string) => {
    const fileData = pendingFiles.get(fileId);
    if (fileData?.preview) URL.revokeObjectURL(fileData.preview);
    setPendingFiles(prev => { const m = new Map(prev); m.delete(fileId); return m; });
    toast({ title: 'Fichier retiré' });
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return <ImageIcon className="h-5 w-5" />;
    if (ext === 'pdf') return <FileText className="h-5 w-5" />;
    if (['mp4', 'mov', 'webm'].includes(ext || '')) return <Video className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // === SAUVEGARDE ===
  const handleSave = async (publish: boolean = false) => {
    if (!title.trim()) return toast({ title: 'Titre requis', variant: 'destructive' });
 // ...existing code...
        // PLUS BESOIN DE VÉRIFIER selectedSubjectId → c’est imposé par le parent
    if (!subjectId) {
      return toast({ title: 'Erreur', description: 'Matière non définie (bug)', variant: 'destructive' });
    }

    setSaving(true);
    try {
      const activityData = {
        title,
        description,
        type,
        level,
        schoolId,
        classId: classId || null,
        subjectId: subjectId,  // UNIQUEMENT LA PROP → plus de fallback
        layoutData: JSON.stringify({ elements }),
        isPublished: publish,
        nature,
        approvalStatus,
      };

      let currentActivityId = activityId;
      if (activityId) {
        await activityApi.update(activityId, activityData);
      } else {
        const created = await activityApi.create(activityData);
        if (created?.id) {
          currentActivityId = created.id;
          setActivityId(created.id);
        }
      }

      // === Upload des fichiers (inchangé) ===
      if (pendingFiles.size > 0 && currentActivityId) {
        setUploading(true);
        const formData = new FormData();
        const elementIds: string[] = [];
        const newElements: ActivityElement[] = [];

        pendingFiles.forEach((data, fileId) => {
          const ext = data.file.name.split('.').pop()?.toLowerCase();
          const type: ActivityElementType = ext === 'pdf' ? 'pdf' : data.file.type.startsWith('video/') ? 'video' : 'image';

          newElements.push({
            id: fileId,
            type,
            content: '',
            position: { x: 50, y: 50 },
            size: { width: 400, height: type === 'pdf' ? 500 : 300 },
            style: { fontSize: '16px', color: 'hsl(var(--foreground))', backgroundColor: 'transparent', padding: '8px' },
          });

          formData.append('files', data.file);
          elementIds.push(fileId);
        });

        elementIds.forEach(id => formData.append('elementIds', id));

        const token = localStorage.getItem('auth_token');
        const res = await fetch(API_CONFIG.getUrl(`/activity-files/upload/${currentActivityId}`), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (res.ok) {
          const result = await res.json();
          const map = new Map(result.files.map((f: any) => [f.elementId, f]));
          const updated = elements.map(el => {
            const uploaded = map.get(el.id);
            if (uploaded) {
              return { ...el, content: API_CONFIG.getUrl(uploaded.url), fileId: uploaded.id, fileName: uploaded.fileName, hasPendingUpload: undefined };
            }
            return el;
          });
          const added = newElements.map(el => {
            const uploaded = map.get(el.id);
            return { ...el, content: API_CONFIG.getUrl(uploaded.url), fileId: uploaded.id, fileName: uploaded.fileName };
          });
          setElements([...updated, ...added]);

          // Re-sauvegarde avec vraies URLs
          await activityApi.update(currentActivityId, {
            ...activityData,
            layoutData: JSON.stringify({ elements: [...updated, ...added] }),
          });

          pendingFiles.forEach(d => d.preview && URL.revokeObjectURL(d.preview));
          setPendingFiles(new Map());
          toast({ title: 'Fichiers uploadés avec succès' });
        }
        setUploading(false);
      }

      toast({ title: publish ? 'Activité publiée' : 'Brouillon enregistré', description: `Type: ${type} | Nature: ${nature}` });
      onSave?.();
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const selected = elements.find(el => el.id === selectedElement);

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      {/* Sidebar */}
      <div className="col-span-3 space-y-4 overflow-y-auto">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Informations</h3>
          <div className="space-y-3">
            <div>
              <Label>Titre *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Dictée n°5" />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Consignes, objectifs..." />
            </div>

            {/* Type limité */}
            <div>
              <Label>Type d'activité *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lecture">Lecture</SelectItem>
                  <SelectItem value="Écriture">Écriture</SelectItem>
                  <SelectItem value="Orale">Orale</SelectItem>
                </SelectContent>
              </Select>
            </div>

           <div>
  <Label>Classe cible</Label>
  <div className="p-3 bg-muted rounded-lg text-sm font-medium flex items-center gap-2">
    {classId && classes.find(c => c.id === classId)?.name || 'Classe inconnue'}
    
  </div>
</div>

<div>
  <Label>Matière</Label>
  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-sm font-medium text-emerald-800 flex items-center gap-2">
    <BookOpen className="h-4 w-4" />
    {subjects.find(s => s.id === subjectId)?.name || 'Matière inconnue'}
  </div>
</div>
          </div>
        </Card>

        {/* === Ajouter éléments & upload === */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Ajouter du contenu</h3>
          <div className="grid grid-cols.2 gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={() => addElement('text')}><Type className="h-4 w-4 mr-1" />Texte</Button>
            <Button variant="outline" size="sm" onClick={() => addElement('image')}><Image className="h-4 w-4 mr-1" />Image</Button>
            <Button variant="outline" size="sm" onClick={() => addElement('pdf')}><FileText className="h-4 w-4 mr-1" />PDF</Button>
            <Button variant="outline" size="sm" onClick={() => addElement('video')}><Video className="h-4 w-4 mr-1" />Vidéo</Button>
          </div>

          <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,application/pdf" className="hidden"
            onChange={e => e.target.files && handleMultipleFilesUpload(e.target.files)} />
          <Button variant="default" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()}>
            <Files className="h-4 w-4 mr-2" />Upload plusieurs fichiers
          </Button>
        </Card>

        {/* Fichiers en attente */}
        {pendingFiles.size > 0 && (
          <Card className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-sm">Fichiers à uploader ({pendingFiles.size})</h4>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Array.from(pendingFiles.entries()).map(([id, data]) => (
                <div key={id} className="flex items-center gap-3 p-2 bg-muted rounded group">
                  <div className="w-10 h-10 bg-background border rounded flex items-center justify-center overflow-hidden">
                    {data.preview ? <img src={data.preview} alt="" className="w-full h-full object-cover" /> : getFileIcon(data.file.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{data.file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(data.file.size)}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => removeFile(id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Propriétés élément sélectionné */}
        {selected && (
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Édition</h3>
            {selected.type === 'text' && (
              <Textarea value={selected.content} onChange={e => updateElement(selected.id, { content: e.target.value })} rows={5} />
            )}
            {['image', 'pdf', 'video'].includes(selected.type) && (
              <Input type="file" accept={selected.type === 'pdf' ? '.pdf' : selected.type === 'video' ? 'video/*' : 'image/*'}
                onChange={e => e.target.files?.[0] && handleFileUpload(selected.id, e.target.files[0])} />
            )}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div><Label>Largeur</Label><Input type="number" value={selected.size.width} onChange={e => updateElement(selected.id, { size: { ...selected.size, width: +e.target.value || 300 } })} /></div>
              <div><Label>Hauteur</Label><Input type="number" value={selected.size.height} onChange={e => updateElement(selected.id, { size: { ...selected.size, height: +e.target.value || 200 } })} /></div>
            </div>
            <Button variant="destructive" size="sm" className="w-full mt-4" onClick={() => deleteElement(selected.id)}>Supprimer</Button>
          </Card>
        )}
      </div>

      {/* Canvas */}
      <div className="col-span-9 bg-muted/20 rounded-lg relative overflow-auto min-h-[600px]">
        {elements.map(el => (
          <div
            key={el.id}
            className={`absolute border-2 ${selectedElement === el.id ? 'border-primary' : 'border-transparent'} hover:border-primary/50 cursor-move`}
            style={{ left: el.position.x, top: el.position.y, width: el.size.width, height: el.size.height, ...el.style }}
            onClick={() => setSelectedElement(el.id)}
            draggable
            onDragEnd={e => {
              const rect = e.currentTarget.parentElement?.getBoundingClientRect();
              if (rect) {
                updateElement(el.id, {
                  position: {
                    x: e.clientX - rect.left - el.size.width / 2,
                    y: e.clientY - rect.top - el.size.height / 2,
                  }
                });
              }
            }}
          >
            {el.type === 'text' && <div className="p-2 h-full overflow-auto whitespace-pre-wrap">{el.content}</div>}
            {el.type === 'image' && el.content && <img src={el.content} alt="" className="w-full h-full object-cover rounded" />}
            {el.type === 'pdf' && el.content && <div className="w-full h-full flex items-center justify-center bg-secondary"><FileText className="h-16 w-16 text-muted-foreground" /></div>}
            {el.type === 'video' && el.content && <video src={el.content} controls className="w-full h-full rounded" />}
          </div>
        ))}
      </div>

      {/* Boutons sauvegarde */}
      <div className="col-span-12 flex justify-end gap-3">
        <Button variant="outline" onClick={() => handleSave(false)} disabled={saving || uploading}>
          {saving || uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {uploading ? 'Upload...' : 'Enregistrer brouillon'}
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving || uploading}>
          {saving || uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
          Publier
        </Button>
      </div>
    </div>
  );
};