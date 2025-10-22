import { useState, useEffect, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { fi } from "date-fns/locale";
import { FishermanProfile } from "@/lib/types";

/**
 * Props for the FishermanSchedule component
 */
interface FishermanScheduleProps {
  /** Fisherman profile data */
  fishermanProfile: FishermanProfile | null;
}

/**
 * Component for managing fisherman's planned fishing schedule.
 *
 * Features:
 * - Interactive calendar for selecting fishing dates
 * - Month-by-month schedule management
 * - Prevents selection of past dates
 * - Batch save functionality for selected dates
 * - Visual feedback for selected and saved dates
 * - Integration with public schedule display
 * - Finnish locale support
 *
 * The schedule is displayed on the public homepage to inform customers
 * about when fresh fish might be available based on planned fishing trips.
 *
 * @param props - The component props
 * @returns The fisherman schedule management component
 */
export const FishermanSchedule = ({
  fishermanProfile,
}: FishermanScheduleProps) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [currentPlannedTrips, setCurrentPlannedTrips] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { toast } = useToast();

  /**
   * Fetches planned trips for the specified month from the database
   * @param month - The month to fetch trips for
   */
  const fetchPlannedTrips = useCallback(
    async (month: Date) => {
      if (!fishermanProfile?.id) return;

      try {
        const startDate = startOfMonth(month);
        const endDate = endOfMonth(month);

        const { data, error } = await supabase
          .from("planned_trips")
          .select("trip_date")
          .eq("fisherman_id", fishermanProfile.id)
          .gte("trip_date", format(startDate, "yyyy-MM-dd"))
          .lte("trip_date", format(endDate, "yyyy-MM-dd"));

        if (error) throw error;

        const tripDates = data?.map((trip) => new Date(trip.trip_date)) || [];
        setCurrentPlannedTrips(tripDates);
        setSelectedDates(tripDates);
      } catch (error) {
        console.error("Error fetching planned trips:", error);
        toast({
          variant: "destructive",
          title: "Virhe",
          description: "Aikataulun lataaminen epäonnistui.",
        });
      }
    },
    [fishermanProfile?.id, toast]
  );

  useEffect(() => {
    fetchPlannedTrips(currentMonth);
  }, [currentMonth, fetchPlannedTrips]);

  /**
   * Handles date selection/deselection with validation
   * @param date - Date selected from the calendar
   */
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // Only allow future dates to be selected
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Et voi valita menneitä päivämääriä.",
      });
      return;
    }

    setSelectedDates((prev) => {
      const isAlreadySelected = prev.some(
        (selectedDate) => selectedDate.toDateString() === date.toDateString()
      );

      if (isAlreadySelected) {
        return prev.filter(
          (selectedDate) => selectedDate.toDateString() !== date.toDateString()
        );
      } else {
        return [...prev, date];
      }
    });
  };

  /**
   * Saves the selected schedule to the database
   * Replaces all existing trips for the current month with new selections
   */
  const handleSaveSchedule = async () => {
    setLoading(true);
    try {
      // Get the current month's date range
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);

      // Delete existing trips for this month
      await supabase
        .from("planned_trips")
        .delete()
        .eq("fisherman_id", fishermanProfile.id)
        .gte("trip_date", format(startDate, "yyyy-MM-dd"))
        .lte("trip_date", format(endDate, "yyyy-MM-dd"));

      // Insert new selected trips
      if (selectedDates.length > 0) {
        const tripsToInsert = selectedDates.map((date) => ({
          fisherman_id: fishermanProfile.id,
          trip_date: format(date, "yyyy-MM-dd"),
        }));

        const { error } = await supabase
          .from("planned_trips")
          .insert(tripsToInsert);

        if (error) throw error;
      }

      toast({
        title: "Aikataulu tallennettu",
        description: "Kalastusaikataulu on päivitetty onnistuneesti.",
      });

      // Refresh the data
      await fetchPlannedTrips(currentMonth);
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Aikataulun tallentaminen epäonnistui.",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles month navigation in the calendar
   * @param month - New month to display
   */
  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  };

  return (
    <Card className="max-w-[var(--admin-side-container-width)] mx-auto">
      <CardHeader>
        <CardTitle>Kalastajan aikataulu</CardTitle>
        <CardDescription>
          Tämä aikataulu näkyy sivuston etusivulla, josta vierailijat näkevät
          koska he voivat odottaa saalista kalastuspäivien mukaisesti ja koska
          ei vesillä edes käydä.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <Calendar
            mode="multiple"
            selected={selectedDates}
            onSelect={(dates) => {
              if (Array.isArray(dates)) {
                setSelectedDates(dates);
              }
            }}
            onDayClick={handleDateSelect}
            onMonthChange={handleMonthChange}
            locale={fi}
            className="rounded-md border"
            disabled={(date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return date < today;
            }}
          />
        </div>

        <div className="flex flex-col gap-4 items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Valittu {selectedDates.length} kalastuspäivää kuulle{" "}
            {format(currentMonth, "MMMM yyyy", { locale: fi })}
          </div>
          <Button
            onClick={handleSaveSchedule}
            disabled={loading}
            className="w-fit"
          >
            {loading ? "Tallennetaan..." : "Tallenna aikataulu"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
