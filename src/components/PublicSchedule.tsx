import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fi } from 'date-fns/locale';
import { FishermanNote } from '@/components/FishermanNote';

/**
 * Public schedule component that displays fisherman's planned fishing trips and notes.
 * 
 * Features:
 * - Calendar view showing planned fishing dates
 * - Month navigation to view different months
 * - Trip count display for current month
 * - Fisherman's personal notes display
 * - Responsive layout (side-by-side on desktop, stacked on mobile)
 * 
 * The calendar highlights planned fishing dates in blue and shows today's date
 * with a special border. Fishing dates are read-only for customers.
 * 
 * @returns The public schedule component with calendar and fisherman notes
 */
export const PublicSchedule = () => {
  const [plannedTrips, setPlannedTrips] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  /**
   * Fetches all planned fishing trips for the specified month from the database
   * @param month - The month to fetch trips for
   */
  const fetchPlannedTrips = async (month: Date) => {
    try {
      const startDate = startOfMonth(month);
      const endDate = endOfMonth(month);

      const { data, error } = await supabase
        .from('planned_trips')
        .select('trip_date')
        .gte('trip_date', format(startDate, 'yyyy-MM-dd'))
        .lte('trip_date', format(endDate, 'yyyy-MM-dd'));

      if (error) throw error;

      const tripDates = data?.map(trip => new Date(trip.trip_date)) || [];
      setPlannedTrips(tripDates);
    } catch (error) {
      console.error('Error fetching planned trips:', error);
    }
  };

  useEffect(() => {
    fetchPlannedTrips(currentMonth);
  }, [currentMonth]);

  /**
   * Handles month change events from the calendar component
   * @param month - The new month to display
   */
  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  };

  return (
    <section className="py-12 sm:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-dark mb-4">
            Kalastajan aikataulu
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Katso milloin kalastaja suunnittelee lähtevänsä vesille. <span style={{ color: '#000a43' }}>Sinisellä</span> merkatut päivät ovat suunniteltuja kalastuspäiviä.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Column - Calendar */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md">
              <CardContent>
                <div className="flex justify-center">
                  <Calendar
                    mode="multiple"
                    selected={plannedTrips}
                    onMonthChange={handleMonthChange}
                    locale={fi}
                    className="rounded-md"
                    classNames={{
                      day_today:
                        "bg-transparent text-foreground border-2 rounded-full border-[hsl(var(--primary))]",
                    }}
                    disabled={true} // Make it read-only
                    showOutsideDays={false}
                  />
                </div>
                
                {plannedTrips.length > 0 && (
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    {plannedTrips.length} suunniteltua kalastuspäivää tässä kuussa
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Fisherman's Note */}
          <div className="flex justify-center lg:justify-start">
            <div className="w-full max-w-md">
              <FishermanNote />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};