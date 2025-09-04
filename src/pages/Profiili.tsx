import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Camera, Edit2 } from 'lucide-react';

const Profiili = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [userRole, setUserRole] = useState<string | null>(null);
  const [fishermanProfile, setFishermanProfile] = useState<any>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        // Fetch user role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('Error fetching user role:', userError);
          return;
        }

        setUserRole(userData.role);

        // If user is ADMIN, fetch fisherman profile
        if (userData.role === 'ADMIN') {
          const { data: profileData, error: profileError } = await supabase
            .from('fisherman_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (profileError) {
            console.error('Error fetching fisherman profile:', profileError);
          } else {
            setFishermanProfile(profileData);
            setNoteContent(profileData?.fishermans_note || '');
          }
        }
      } catch (error) {
        console.error('Error in fetchUserData:', error);
      }
    };

    fetchUserData();
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);

    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: data.publicUrl }
      });

      if (updateError) throw updateError;

      toast({
        title: "Onnistui!",
        description: "Profiilikuva päivitetty onnistuneesti.",
      });

      // Refresh the page to show new avatar
      window.location.reload();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Profiilikuvan päivitys epäonnistui.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!fishermanProfile || !user) return;

    try {
      const { error } = await supabase
        .from('fisherman_profiles')
        .update({ fishermans_note: noteContent })
        .eq('user_id', user.id);

      if (error) throw error;

      setIsEditingNote(false);
      toast({
        title: "Onnistui!",
        description: "Muistio tallennettu onnistuneesti.",
      });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Muistion tallennus epäonnistui.",
      });
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
    if (!name) return 'K';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
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
                <Avatar className="w-24 h-24 cursor-pointer" onClick={handleAvatarClick}>
                  <AvatarImage 
                    src={user.user_metadata?.avatar_url} 
                    alt={user.user_metadata?.full_name || 'Käyttäjä'} 
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {getUserInitials(user.user_metadata?.full_name)}
                  </AvatarFallback>
                </Avatar>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-6 w-6 text-foreground" />
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <div className="text-center">
                <h2 className="text-xl font-semibold text-dark">
                  {user.user_metadata?.full_name || 'Nimetön käyttäjä'}
                </h2>
                <p className="text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>

            {userRole === 'ADMIN' && fishermanProfile && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-dark">Kalastajan muistio:</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingNote(!isEditingNote)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  Tämä muistio näkyy etusivulla kalenterin vieressä. Tähän voi kirjoittaa ajatuksia mahdollisesta saaliista, terveiset sivuilla kävijöille tai kertoa missä ja miten aiot kalastaa. Se on asiakkaillekin mielenkiintoista.
                </p>
                
                {isEditingNote ? (
                  <div className="space-y-2">
                    <Textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Kirjoita muistiosi tähän..."
                      rows={4}
                    />
                    <Button onClick={handleSaveNote} size="sm">
                      Tallenna
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm bg-muted p-3 rounded-md min-h-[80px]">
                    {noteContent || 'Ei muistiota lisätty.'}
                  </p>
                )}
              </div>
            )}

            <div className="pt-4">
              <Button 
                onClick={signOut}
                variant="outline"
                className="w-full"
              >
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