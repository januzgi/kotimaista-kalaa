import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fi } from 'date-fns/locale';

export const PublicSchedule = () => {
  const [plannedTrips, setPlannedTrips] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch all planned trips for the current month
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
            Katso milloin kalastaja suunnittelee lähtevänsä vesille. Merkatut päivät ovat suunniteltuja kalastuspäiviä.
          </p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: fi })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Calendar
                mode="multiple"
                selected={plannedTrips}
                onMonthChange={handleMonthChange}
                locale={fi}
                className="rounded-md [&_.day_today]:text-white"
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
    </section>
  );
};