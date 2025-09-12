import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit2 } from "lucide-react";

interface ProfileCompletionModalProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
}

export const ProfileCompletionModal = ({
  open,
  onOpenChange,
  onSuccess,
}: ProfileCompletionModalProps) => {
  const [fullName, setFullName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Nimi on pakollinen tieto.",
      });
      return;
    }

    setIsSaving(true);

    try {
      let avatarUrl = null;

      // Handle profile picture upload if a file was selected
      if (selectedFile) {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error("User not found");

        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, selectedFile, { upsert: true });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        avatarUrl = data.publicUrl;

        // Update user avatar_url in users table
        const { error: updateError } = await supabase
          .from("users")
          .update({ avatar_url: avatarUrl })
          .eq("id", user.id);

        if (updateError) throw updateError;
      }

      // Update user auth metadata
      const updateData: any = { full_name: fullName.trim() };
      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: updateData,
      });

      if (authError) throw authError;

      toast({
        title: "Onnistui!",
        description: "Profiili luotu onnistuneesti.",
      });

      onSuccess();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Profiilin tallennus epäonnistui.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return "K";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Viimeistele profiilisi</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <Avatar className="w-20 h-20">
                <AvatarImage
                  src={selectedFile ? URL.createObjectURL(selectedFile) : undefined}
                  alt={fullName || "Käyttäjä"}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {getUserInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={handleAvatarClick}
                className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Edit2 className="h-3 w-3" />
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fullName">Nimi</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Syötä nimesi"
            />
          </div>
          
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background"></div>
                Tallennetaan...
              </div>
            ) : (
              "Tallenna"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};