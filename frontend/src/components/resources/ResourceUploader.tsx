import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { FileText, Video, Image as ImageIcon, Upload, Eye } from "lucide-react";
import { PDFViewer } from "@/components/activity/PDFViewer";
import { VideoViewer } from "@/components/activity/VideoViewer";

interface ResourceMetadata {
  title: string;
  description: string;
  level: string;
  competence: string;
  duration?: string;
}

interface ResourceUploaderProps {
  schoolId: string;
  onSuccess: () => void;
}

export function ResourceUploader({ schoolId, onSuccess }: ResourceUploaderProps) {
  const [resourceType, setResourceType] = useState<"pdf" | "video" | "image">("pdf");
  const [metadata, setMetadata] = useState<ResourceMetadata>({
    title: "",
    description: "",
    level: "",
    competence: "",
    duration: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<"metadata" | "upload" | "preview">("metadata");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = {
      pdf: ["application/pdf"],
      video: ["video/mp4", "video/webm", "video/ogg"],
      image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    };

    if (!validTypes[resourceType].includes(selectedFile.type)) {
      toast.error("Type de fichier invalide");
      return;
    }

    // Validate file size (50MB max)
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 50MB)");
      return;
    }

    setFile(selectedFile);

    // Generate preview
    if (resourceType === "image") {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(URL.createObjectURL(selectedFile));
    }

    setStep("preview");
  };

  const handleUpload = async () => {
    if (!file || !metadata.title || !metadata.level || !metadata.competence) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${schoolId}/resources/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("activity-files")
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: "3600",
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("activity-files")
        .getPublicUrl(filePath);

      // Create activity record
      const { error: activityError } = await supabase
        .from("activities")
        .insert({
          title: metadata.title,
          description: metadata.description,
          type: resourceType,
          level: metadata.level,
          school_id: schoolId,
          layout_data: {
            elements: [
              {
                id: "resource-1",
                type: resourceType,
                url: urlData.publicUrl,
                metadata: {
                  competence: metadata.competence,
                  duration: metadata.duration,
                },
              },
            ],
          },
          is_published: true,
        });

      if (activityError) throw activityError;

      toast.success("Ressource publiée avec succès");
      resetForm();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'upload");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setMetadata({
      title: "",
      description: "",
      level: "",
      competence: "",
      duration: "",
    });
    setFile(null);
    setPreview(null);
    setStep("metadata");
  };

  return (
    <Card className="p-6">
      <Tabs value={resourceType} onValueChange={(v) => setResourceType(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pdf">
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </TabsTrigger>
          <TabsTrigger value="video">
            <Video className="w-4 h-4 mr-2" />
            Vidéo
          </TabsTrigger>
          <TabsTrigger value="image">
            <ImageIcon className="w-4 h-4 mr-2" />
            Image
          </TabsTrigger>
        </TabsList>

        <TabsContent value={resourceType} className="space-y-6 mt-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className={`flex items-center gap-2 ${step === "metadata" ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center">1</div>
              <span>Métadonnées</span>
            </div>
            <div className="flex-1 h-px bg-border mx-4" />
            <div className={`flex items-center gap-2 ${step === "upload" ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center">2</div>
              <span>Upload</span>
            </div>
            <div className="flex-1 h-px bg-border mx-4" />
            <div className={`flex items-center gap-2 ${step === "preview" ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center">3</div>
              <span>Aperçu</span>
            </div>
          </div>

          {/* Step 1: Metadata */}
          {step === "metadata" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={metadata.title}
                  onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  placeholder="Ex: Les fractions - Exercices"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={metadata.description}
                  onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                  placeholder="Brève description de la ressource..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="level">Niveau *</Label>
                  <Select
                    value={metadata.level}
                    onValueChange={(value) => setMetadata({ ...metadata, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CP">CP</SelectItem>
                      <SelectItem value="CE1">CE1</SelectItem>
                      <SelectItem value="CE2">CE2</SelectItem>
                      <SelectItem value="CM1">CM1</SelectItem>
                      <SelectItem value="CM2">CM2</SelectItem>
                      <SelectItem value="6ème">6ème</SelectItem>
                      <SelectItem value="5ème">5ème</SelectItem>
                      <SelectItem value="4ème">4ème</SelectItem>
                      <SelectItem value="3ème">3ème</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Durée estimée</Label>
                  <Input
                    id="duration"
                    value={metadata.duration}
                    onChange={(e) => setMetadata({ ...metadata, duration: e.target.value })}
                    placeholder="Ex: 30 min"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="competence">Compétence visée *</Label>
                <Input
                  id="competence"
                  value={metadata.competence}
                  onChange={(e) => setMetadata({ ...metadata, competence: e.target.value })}
                  placeholder="Ex: Résoudre des problèmes avec les fractions"
                />
              </div>

              <Button onClick={() => setStep("upload")} className="w-full">
                Suivant
              </Button>
            </div>
          )}

          {/* Step 2: Upload */}
          {step === "upload" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-primary font-semibold">Cliquez pour uploader</span>
                  <span className="text-muted-foreground"> ou glissez-déposez</span>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept={
                    resourceType === "pdf"
                      ? ".pdf"
                      : resourceType === "video"
                      ? "video/*"
                      : "image/*"
                  }
                  onChange={handleFileChange}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {resourceType === "pdf" && "PDF jusqu'à 50MB"}
                  {resourceType === "video" && "MP4, WebM, OGG jusqu'à 50MB"}
                  {resourceType === "image" && "JPG, PNG, WebP, GIF jusqu'à 50MB"}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("metadata")} className="flex-1">
                  Retour
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === "preview" && preview && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/10">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Aperçu final
                </h3>

                {resourceType === "pdf" && <PDFViewer fileUrl={preview} height="500px" />}
                {resourceType === "video" && <VideoViewer fileUrl={preview} height="400px" />}
                {resourceType === "image" && (
                  <img src={preview} alt="Preview" className="max-w-full h-auto rounded-lg" />
                )}
              </div>

              <div className="bg-accent/10 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">{metadata.title}</h4>
                <p className="text-sm text-muted-foreground">{metadata.description}</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground">Niveau: {metadata.level}</span>
                  {metadata.duration && (
                    <span className="text-muted-foreground">Durée: {metadata.duration}</span>
                  )}
                </div>
                <p className="text-sm">
                  <strong>Compétence:</strong> {metadata.competence}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("upload");
                    setFile(null);
                    setPreview(null);
                  }}
                  className="flex-1"
                >
                  Changer le fichier
                </Button>
                <Button onClick={handleUpload} disabled={uploading} className="flex-1">
                  {uploading ? "Publication..." : "Publier"}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
