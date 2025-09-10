import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

/**
 * Component that displays the fisherman's personal note/message to customers.
 * 
 * Features:
 * - Fetches fisherman's note from the database
 * - Only displays if note exists and is not empty
 * - Shows loading state while fetching data
 * - Supports multi-line text with whitespace preservation
 * - Styled with italics for personal touch
 * - Only shows notes marked to display on homepage
 * 
 * The note allows fishermen to communicate directly with their customers,
 * sharing personal messages, fishing updates, or special announcements.
 * 
 * @returns The fisherman note component or null if no note exists
 */
export const FishermanNote = () => {
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches the fisherman's note from the database
   * Only retrieves notes that are marked to display on homepage
   */
  useEffect(() => {
    const fetchFishermanNote = async () => {
      try {
        const { data, error } = await supabase
          .from('fisherman_profiles')
          .select('fishermans_note')
          .eq('display_on_homepage', true)
          .maybeSingle();

        if (error) {
          console.error('Error fetching fisherman note:', error);
          return;
        }

        // Only set the note if it exists and is not empty
        if (data?.fishermans_note && data.fishermans_note.trim() !== '') {
          setNote(data.fishermans_note);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFishermanNote();
  }, []);

  // Don't render anything if loading, no note, or note is empty
  if (loading || !note) {
    return null;
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="font-caveat" style={{ fontSize: '1.5rem' }}>Kalastajan muistio:</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap italic">
          {note}
        </p>
      </CardContent>
    </Card>
  );
};