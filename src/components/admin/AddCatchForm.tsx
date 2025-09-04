import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FulfillmentSlot {
  start_time: string;
  end_time: string;
  type: 'PICKUP' | 'DELIVERY';
}

const catchFormSchema = z.object({
  species: z.string().min(1, 'Laji on pakollinen'),
  form: z.string().min(1, 'Muoto on pakollinen'),
  price_per_kg: z.number().min(0.01, 'Kilohinta on pakollinen'),
  available_quantity: z.number().min(0.01, 'Määrä on pakollinen'),
  catch_date: z.date({ required_error: 'Pyyntipäivä on pakollinen' })
});

interface AddCatchFormProps {
  fishermanProfileId: string;
  onSuccess: () => void;
}

export const AddCatchForm = ({ fishermanProfileId, onSuccess }: AddCatchFormProps) => {
  const [slots, setSlots] = useState<FulfillmentSlot[]>([
    { start_time: '09:00', end_time: '17:00', type: 'PICKUP' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof catchFormSchema>>({
    resolver: zodResolver(catchFormSchema),
    defaultValues: {
      catch_date: new Date()
    }
  });

  const addSlot = () => {
    setSlots([...slots, { start_time: '09:00', end_time: '17:00', type: 'PICKUP' }]);
  };

  const removeSlot = (index: number) => {
    if (slots.length > 1) {
      setSlots(slots.filter((_, i) => i !== index));
    }
  };

  const updateSlot = (index: number, field: keyof FulfillmentSlot, value: string) => {
    const updatedSlots = [...slots];
    updatedSlots[index] = { ...updatedSlots[index], [field]: value };
    setSlots(updatedSlots);
  };

  const onSubmit = async (values: z.infer<typeof catchFormSchema>) => {
    if (slots.length === 0) {
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Lisää vähintään yksi noutoa/toimitusaika.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // First, create the product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({
          fisherman_id: fishermanProfileId,
          species: values.species,
          form: values.form,
          price_per_kg: values.price_per_kg,
          available_quantity: values.available_quantity,
          catch_date: values.catch_date.toISOString()
        })
        .select()
        .single();

      if (productError) throw productError;

      // Then create fulfillment slots
      const fulfillmentSlots = slots.map(slot => {
        const startDateTime = new Date(values.catch_date);
        const [startHour, startMinute] = slot.start_time.split(':');
        startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

        const endDateTime = new Date(values.catch_date);
        const [endHour, endMinute] = slot.end_time.split(':');
        endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

        return {
          fisherman_id: fishermanProfileId,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          type: slot.type
        };
      });

      const { error: slotsError } = await supabase
        .from('fulfillment_slots')
        .insert(fulfillmentSlots);

      if (slotsError) throw slotsError;

      toast({
        title: "Saalis lisätty onnistuneesti",
        description: `${values.species} on nyt myynnissä.`,
      });

      form.reset();
      setSlots([{ start_time: '09:00', end_time: '17:00', type: 'PICKUP' }]);
      onSuccess();
    } catch (error) {
      console.error('Error adding catch:', error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Saaliin lisääminen epäonnistui. Yritä uudelleen.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lisää uusi saalis</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="species"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Laji *</FormLabel>
                    <FormControl>
                      <Input placeholder="esim. Kuha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="form"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Muoto *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Valitse muoto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Fileoitu">Fileoitu</SelectItem>
                        <SelectItem value="Perattu">Perattu</SelectItem>
                        <SelectItem value="Perkaamaton">Perkaamaton</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price_per_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kilohinta (€) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="available_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saatavilla (kg) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="catch_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Pyyntipäivä *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd.MM.yyyy")
                          ) : (
                            <span>Valitse päivä</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Nouto- ja toimitusajat *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSlot}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Lisää aika
                </Button>
              </div>

              {slots.map((slot, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor={`start-${index}`}>Alkuaika</Label>
                      <Input
                        id={`start-${index}`}
                        type="time"
                        value={slot.start_time}
                        onChange={(e) => updateSlot(index, 'start_time', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`end-${index}`}>Loppuaika</Label>
                      <Input
                        id={`end-${index}`}
                        type="time"
                        value={slot.end_time}
                        onChange={(e) => updateSlot(index, 'end_time', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`type-${index}`}>Tyyppi</Label>
                      <Select
                        value={slot.type}
                        onValueChange={(value) => updateSlot(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PICKUP">Nouto</SelectItem>
                          <SelectItem value="DELIVERY">Kotiinkuljetus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      {slots.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSlot(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Lisätään...' : 'Lisää saalis myyntiin'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};