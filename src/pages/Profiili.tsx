import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit2 } from "lucide-react";
import { FishermanProfile } from "@/lib/types";

/**
 * User profile management page component.
 *
 * Features:
 * - Profile picture upload and management
 * - Name editing with real-time updates
 * - User role detection (ADMIN/CUSTOMER)
 * - Fisherman-specific profile management for admins:
 *   - Personal note/memo for homepage display
 *   - Pickup address configuration
 *   - Public phone number setting
 *   - Default delivery fee setting
 * - Batch save functionality for all changes
 * - Sign out functionality
 * - Responsive design with form validation
 *
 * Admin users (fishermen) get additional profile fields that affect
 * their business operations and customer-facing information.
 *
 * @returns The user profile management page
 */
const Profiili = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userRole, setUserRole] = useState<string | null>(null);
  const [fishermanProfile, setFishermanProfile] =
    useState<FishermanProfile | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Profile editing states
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fisherman profile editing states
  const [pickupAddress, setPickupAddress] = useState("");
  const [publicPhone, setPublicPhone] = useState("");
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        // Fetch user role
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userError) {
          console.error("Error fetching user role:", userError);
          return;
        }

        setUserRole(userData.role);

        // Initialize name editing state
        setEditedName(user.user_metadata?.full_name || "");

        // If user is ADMIN, fetch fisherman profile
        if (userData.role === "ADMIN") {
          const { data: profileData, error: profileError } = await supabase
            .from("fisherman_profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (profileError) {
            console.error("Error fetching fisherman profile:", profileError);
          } else {
            setFishermanProfile(profileData);
            setNoteContent(profileData?.fishermans_note || "");
            setPickupAddress(profileData?.pickup_address || "");
            setPublicPhone(profileData?.public_phone_number || "");
            setDefaultDeliveryFee(profileData?.default_delivery_fee || 0);
          }
        }
      } catch (error) {
        console.error("Error in fetchUserData:", error);
      }
    };

    fetchUserData();
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setHasChanges(true);
    }
  };

  const handleNameEdit = () => {
    setIsEditingName(true);
  };

  const handleNameChange = (value: string) => {
    setEditedName(value);
    setHasChanges(true);
  };

  const handleNoteChange = (value: string) => {
    setNoteContent(value);
    setHasChanges(true);
  };

  const handlePickupAddressChange = (value: string) => {
    setPickupAddress(value);
    setHasChanges(true);
  };

  const handlePublicPhoneChange = (value: string) => {
    setPublicPhone(value);
    setHasChanges(true);
  };

  const handleDefaultDeliveryFeeChange = (value: number) => {
    setDefaultDeliveryFee(value);
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    if (!user || !hasChanges) return;

    setIsSaving(true);

    try {
      // Handle profile picture upload if a new file was selected
      if (selectedFile) {
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

        // Update user avatar_url
        const { error: updateError } = await supabase
          .from("users")
          .update({ avatar_url: data.publicUrl })
          .eq("id", user.id);

        if (updateError) throw updateError;

        // Also update auth metadata
        await supabase.auth.updateUser({
          data: { avatar_url: data.publicUrl },
        });
      }

      // Handle name update if it changed
      if (editedName !== (user.user_metadata?.full_name || "")) {
        const { error: nameError } = await supabase.auth.updateUser({
          data: { full_name: editedName },
        });

        if (nameError) throw nameError;
      }

      // Handle fisherman profile updates if user is ADMIN
      if (userRole === "ADMIN" && fishermanProfile) {
        const { error: profileError } = await supabase
          .from("fisherman_profiles")
          .update({
            fishermans_note: noteContent,
            pickup_address: pickupAddress,
            public_phone_number: publicPhone,
            default_delivery_fee: defaultDeliveryFee,
          })
          .eq("user_id", user.id);

        if (profileError) throw profileError;
      }

      // Reset editing states
      setIsEditingName(false);
      setIsEditingNote(false);
      setSelectedFile(null);
      setHasChanges(false);

      toast({
        title: "Onnistui!",
        description: "Profiili päivitetty onnistuneesti.",
      });

      // Refresh the page to show updates
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Profiilin päivitys epäonnistui.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ladataan profiilia...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getUserInitials = (name?: string) => {
    if (!name) return "K";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-dark">
              Profiili
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <Avatar className="w-24 h-24">
                  <AvatarImage
                    src={
                      selectedFile
                        ? URL.createObjectURL(selectedFile)
                        : user.user_metadata?.avatar_url
                    }
                    alt={user.user_metadata?.full_name || "Käyttäjä"}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {getUserInitials(user.user_metadata?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <button
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

              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  {isEditingName ? (
                    <Input
                      value={editedName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="text-center text-xl font-semibold max-w-48"
                      placeholder="Syötä nimesi"
                    />
                  ) : (
                    <h2 className="text-xl font-semibold text-dark">
                      {editedName || "Nimetön käyttäjä"}
                    </h2>
                  )}
                  <button
                    onClick={handleNameEdit}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground mt-1">{user.email}</p>
              </div>
            </div>

            {userRole === "ADMIN" && fishermanProfile && (
              <div className="pt-4 border-t space-y-6">
                {/* Fisherman's Note Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-dark">
                      Kalastajan muistio:
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingNote(!isEditingNote)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    Tämä muistio näkyy etusivulla kalenterin vieressä. Tähän voi
                    kirjoittaa ajatuksia mahdollisesta saaliista, terveiset
                    sivuilla kävijöille tai kertoa missä ja miten aiot kalastaa.
                    Se on asiakkaillekin mielenkiintoista.
                  </p>

                  {isEditingNote ? (
                    <Textarea
                      value={noteContent}
                      onChange={(e) => handleNoteChange(e.target.value)}
                      placeholder="Kirjoita muistiosi tähän..."
                      rows={4}
                    />
                  ) : (
                    <p className="text-muted-foreground text-sm bg-muted p-3 rounded-md min-h-[80px]">
                      {noteContent || "Ei muistiota lisätty."}
                    </p>
                  )}
                </div>

                {/* Pickup Address Section */}
                <div>
                  <h3 className="font-semibold text-dark mb-2">
                    Nouto-osoite:
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Tämä osoite näytetään asiakkaille kun he valitsevat
                    noutotoimituksen.
                  </p>
                  <Input
                    value={pickupAddress}
                    onChange={(e) => handlePickupAddressChange(e.target.value)}
                    placeholder="Syötä noutoosoite..."
                  />
                </div>

                {/* Public Phone Number Section */}
                <div>
                  <h3 className="font-semibold text-dark mb-2">
                    Julkinen puhelinnumero:
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Tämä numero voi näkyä asiakkaille yhteystiedoissa.
                  </p>
                  <Input
                    value={publicPhone}
                    onChange={(e) => handlePublicPhoneChange(e.target.value)}
                    placeholder="Syötä puhelinnumero..."
                    type="tel"
                  />
                </div>

                {/* Default Delivery Fee Section */}
                <div>
                  <h3 className="font-semibold text-dark mb-2">
                    Kotiinkuljetuksen oletusmaksu (€):
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Tämä on oletusmaksu kotiinkuljetukselle. Voit muokata sitä
                    tilauskohtaisesti.
                  </p>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={defaultDeliveryFee}
                    onChange={(e) =>
                      handleDefaultDeliveryFeeChange(
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            {hasChanges && (
              <div className="pt-4 border-t">
                <Button
                  onClick={handleSaveAll}
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
            )}

            <div className="pt-4">
              <Button onClick={signOut} variant="outline" className="w-full">
                Kirjaudu ulos
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Profiili;
