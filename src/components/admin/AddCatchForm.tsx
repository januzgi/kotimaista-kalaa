import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * Interface for fulfillment time slots
 */
interface FulfillmentSlot {
  date: Date;
  start_time: string;
  end_time: string;
  type: "PICKUP" | "DELIVERY";
}

/**
 * Available fish species options for the form
 */
const SPECIES_OPTIONS = [
  { value: "muikku", label: "Muikku" },
  { value: "kuha", label: "Kuha" },
  { value: "ahven", label: "Ahven" },
  { value: "hauki", label: "Hauki" },
  { value: "siika", label: "Siika" },
  { value: "taimen", label: "Taimen" },
  { value: "lohi", label: "Lohi" },
];

/**
 * Helper function to fetch default price from database for a species/form combination
 * @param fishermanId - The fisherman's profile ID
 * @param species - Fish species
 * @param form - Fish preparation form (whole, filleted, etc.)
 * @returns Default price per kg or null if not found
 */
const fetchDefaultPrice = async (
  fishermanId: string,
  species: string,
  form: string
): Promise<number | null> => {
  try {
    const { data, error } = await supabase
      .from("default_prices")
      .select("price_per_kg")
      .eq("fisherman_id", fishermanId)
      .eq("species", species)
      .eq("form", form)
      .maybeSingle();

    if (error) throw error;
    return data?.price_per_kg || null;
  } catch (error) {
    console.error("Error fetching default price:", error);
    return null;
  }
};

/**
 * Zod schemas for form validation
 */
const fishEntrySchema = z.object({
  species: z.string().min(1, "Laji on pakollinen"),
  form: z.string().min(1, "Muoto on pakollinen"),
  price_per_kg: z.number().min(0.01, "Kilohinta on pakollinen"),
  available_quantity: z.number().min(0.01, "Määrä on pakollinen"),
});

const catchFormSchema = z.object({
  fish_entries: z.array(fishEntrySchema).min(1, "Lisää vähintään yksi kala"),
  catch_date: z.date({ required_error: "Pyyntipäivä on pakollinen" }),
});

/**
 * Props for the AddCatchForm component
 */
interface AddCatchFormProps {
  /** ID of the fisherman's profile */
  fishermanProfileId: string;
  /** Callback called when catch is successfully added */
  onSuccess: () => void;
}

/**
 * Form component for adding new fish catch with products and fulfillment slots.
 *
 * Features:
 * - Multi-fish entry form with dynamic add/remove functionality
 * - Automatic default price lookup based on species/form combination
 * - Catch date selection with calendar widget
 * - Fulfillment slot management (pickup/delivery times)
 * - Form validation with Zod schemas
 * - Database integration for creating catches, products, and slots
 * - Email notification sending to subscribers
 * - Success feedback and form reset
 *
 * The component handles the complete workflow from catch entry to making
 * products available for sale with appropriate fulfillment options.
 *
 * @param props - The component props
 * @returns The add catch form component
 */
export const AddCatchForm = ({
  fishermanProfileId,
  onSuccess,
}: AddCatchFormProps) => {
  const [slots, setSlots] = useState<FulfillmentSlot[]>([
    {
      date: new Date(),
      start_time: "09:00",
      end_time: "17:00",
      type: "PICKUP",
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof catchFormSchema>>({
    resolver: zodResolver(catchFormSchema),
    defaultValues: {
      fish_entries: [
        {
          species: "",
          form: "",
          price_per_kg: 0,
          available_quantity: 0,
        },
      ],
      catch_date: new Date(),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fish_entries",
  });

  /**
   * Handles species or form field changes and updates default pricing
   * @param index - Index of the fish entry being modified
   * @param field - Field name being changed (species or form)
   * @param value - New field value
   */
  const handleFieldChange = async (
    index: number,
    field: "species" | "form",
    value: string
  ) => {
    form.setValue(`fish_entries.${index}.${field}`, value);

    // Get current values
    const currentSpecies =
      field === "species"
        ? value
        : form.getValues(`fish_entries.${index}.species`);
    const currentForm =
      field === "form" ? value : form.getValues(`fish_entries.${index}.form`);

    // If both species and form are selected, fetch default price
    if (currentSpecies && currentForm) {
      const defaultPrice = await fetchDefaultPrice(
        fishermanProfileId,
        currentSpecies,
        currentForm
      );
      if (defaultPrice !== null) {
        form.setValue(`fish_entries.${index}.price_per_kg`, defaultPrice);
      }
    }
  };

  /**
   * Adds a new fish entry to the form
   */
  const addFishEntry = () => {
    append({
      species: "",
      form: "",
      price_per_kg: 0,
      available_quantity: 0,
    });
  };

  /**
   * Removes a fish entry from the form (minimum one entry required)
   * @param index - Index of the fish entry to remove
   */
  const removeFishEntry = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  /**
   * Adds a new fulfillment slot with default values
   */
  const addSlot = () => {
    const catchDate = form.getValues("catch_date");
    setSlots([
      ...slots,
      {
        date: catchDate || new Date(),
        start_time: "09:00",
        end_time: "17:00",
        type: "PICKUP",
      },
    ]);
  };

  /**
   * Removes a fulfillment slot (minimum one slot required)
   * @param index - Index of the slot to remove
   */
  const removeSlot = (index: number) => {
    if (slots.length > 1) {
      setSlots(slots.filter((_, i) => i !== index));
    }
  };

  /**
   * Updates a specific field in a fulfillment slot
   * @param index - Index of the slot to update
   * @param field - Field name to update
   * @param value - New field value
   */
  const updateSlot = (
    index: number,
    field: keyof FulfillmentSlot,
    value: string | Date
  ) => {
    const updatedSlots = [...slots];
    updatedSlots[index] = { ...updatedSlots[index], [field]: value };
    setSlots(updatedSlots);
  };

  /**
   * Handles form submission - creates catch, products, and fulfillment slots
   * @param values - Form values from the catch form schema
   */
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
      // First, create the catch record
      const { data: catchData, error: catchError } = await supabase
        .from("catches")
        .insert({
          fisherman_id: fishermanProfileId,
          catch_date: values.catch_date.toISOString().split("T")[0], // Convert to date string
        })
        .select()
        .single();

      if (catchError) throw catchError;

      // Create products for each fish entry using the catch_id
      const productPromises = values.fish_entries.map(async (fishEntry) => {
        const { data: productData, error: productError } = await supabase
          .from("products")
          .insert({
            fisherman_id: fishermanProfileId,
            catch_id: catchData.id,
            species: fishEntry.species,
            form: fishEntry.form,
            price_per_kg: fishEntry.price_per_kg,
            available_quantity: fishEntry.available_quantity,
          })
          .select()
          .single();

        if (productError) throw productError;
        return productData;
      });

      const products = await Promise.all(productPromises);

      // Create fulfillment slots using the same catch_id
      const fulfillmentSlots = slots.map((slot) => {
        const startDateTime = new Date(slot.date);
        const [startHour, startMinute] = slot.start_time.split(":");
        startDateTime.setHours(
          parseInt(startHour),
          parseInt(startMinute),
          0,
          0
        );

        const endDateTime = new Date(slot.date);
        const [endHour, endMinute] = slot.end_time.split(":");
        endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

        return {
          fisherman_id: fishermanProfileId,
          catch_id: catchData.id,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          type: slot.type,
        };
      });

      const { error: slotsError } = await supabase
        .from("fulfillment_slots")
        .insert(fulfillmentSlots);

      if (slotsError) throw slotsError;

      const fishCount = values.fish_entries.length;
      const speciesList = values.fish_entries.map((f) => f.species).join(", ");

      toast({
        title: "Saalis lisätty onnistuneesti",
        description: `${fishCount} kalaa (${speciesList}) on nyt myynnissä.`,
      });

      // Send email notifications to subscribers
      try {
        const { error: emailError } = await supabase.functions.invoke(
          "send-new-catch-notifications"
        );
        if (emailError) {
          console.error("Email notification error:", emailError);
        }
      } catch (emailError) {
        // Don't fail the whole operation if emails fail
        console.error("Failed to send email notifications:", emailError);
      }

      form.reset({
        fish_entries: [
          {
            species: "",
            form: "",
            price_per_kg: 0,
            available_quantity: 0,
          },
        ],
        catch_date: new Date(),
      });
      setSlots([
        {
          date: new Date(),
          start_time: "09:00",
          end_time: "17:00",
          type: "PICKUP",
        },
      ]);
      onSuccess();
    } catch (error) {
      console.error("Error adding catch:", error);
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
            {/* Fish Entries Section */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Kalat *</Label>

              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`fish_entries.${index}.species`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Laji *</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              handleFieldChange(index, "species", value)
                            }
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Valitse laji" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SPECIES_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`fish_entries.${index}.form`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Muoto *</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              handleFieldChange(index, "form", value)
                            }
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Valitse muoto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="kokonainen">
                                Kokonainen
                              </SelectItem>
                              <SelectItem value="fileoitu">Fileoitu</SelectItem>
                              <SelectItem value="perattu">Perattu</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`fish_entries.${index}.price_per_kg`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kilohinta (€) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`fish_entries.${index}.available_quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Saatavilla (kg) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="0.0"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {fields.length > 1 && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFishEntry(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Poista
                      </Button>
                    </div>
                  )}
                </Card>
              ))}

              {/* Add another fish button after all fish entries */}
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFishEntry}
                >
                  <Plus className="h-4 w-4" />
                  Lisää toinen kala
                </Button>
              </div>
            </div>

            {/* Catch Date Section */}
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

            {/* Fulfillment Slots Section */}
            <div className="space-y-4">
              <Label className="text-base font-medium">
                Nouto- ja toimitusajat *
              </Label>

              {slots.map((slot, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <Label htmlFor={`date-${index}`}>Päivämäärä *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !slot.date && "text-muted-foreground"
                            )}
                          >
                            {slot.date ? (
                              format(slot.date, "dd.MM.yyyy")
                            ) : (
                              <span>Valitse päivä</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={slot.date}
                            onSelect={(date) =>
                              date && updateSlot(index, "date", date)
                            }
                            disabled={(date) =>
                              date <
                              new Date(
                                new Date().setDate(new Date().getDate() - 1)
                              )
                            }
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor={`start-${index}`}>Alkuaika</Label>
                      <Input
                        id={`start-${index}`}
                        type="time"
                        value={slot.start_time}
                        onChange={(e) =>
                          updateSlot(index, "start_time", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`end-${index}`}>Loppuaika</Label>
                      <Input
                        id={`end-${index}`}
                        type="time"
                        value={slot.end_time}
                        onChange={(e) =>
                          updateSlot(index, "end_time", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`type-${index}`}>Tyyppi</Label>
                      <Select
                        value={slot.type}
                        onValueChange={(value) =>
                          updateSlot(index, "type", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PICKUP">Nouto</SelectItem>
                          <SelectItem value="DELIVERY">
                            Kotiinkuljetus
                          </SelectItem>
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

              {/* Add another time slot button after all fulfillment slots */}
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSlot}
                >
                  <Plus className="h-4 w-4" />
                  Lisää aika
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Lisätään..." : "Lisää saalis myyntiin"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
