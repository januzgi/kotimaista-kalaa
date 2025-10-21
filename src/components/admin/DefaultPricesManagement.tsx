import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Trash2, Plus } from "lucide-react";
import { FishermanProfile, DefaultPrice } from "@/lib/types";

/**
 * Zod schema for adding new default prices
 * Updated to reflect the 0.50 minimum.
 */
const addPriceSchema = z.object({
  species: z.string().min(1, "Laji on pakollinen"),
  form: z.string().min(1, "Muoto on pakollinen"),
  price_per_kg: z
    .number()
    .min(0.5, "Kilohinnan on oltava vähintään 0.50 €")
    .max(100, "Kilohinta ei voi ylittää 100 €"),
});

type AddPriceForm = z.infer<typeof addPriceSchema>;

/**
 * Props for the DefaultPricesManagement component
 */
interface DefaultPricesManagementProps {
  /** Fisherman profile data */
  fishermanProfile: FishermanProfile | null;
}

/**
 * Available species options for price management
 */
const speciesOptions = [
  { value: "muikku", label: "Muikku" },
  { value: "kuha", label: "Kuha" },
  { value: "ahven", label: "Ahven" },
  { value: "hauki", label: "Hauki" },
  { value: "siika", label: "Siika" },
  { value: "taimen", label: "Taimen" },
  { value: "lohi", label: "Lohi" },
];

/**
 * Available form options for price management
 */
const formOptions = [
  { value: "kokonainen", label: "Kokonainen" },
  { value: "fileoitu", label: "Fileoitu" },
  { value: "perattu", label: "Perattu" },
];

/**
 * Component for managing default prices for fish species and preparation forms.
 *
 * Features:
 * - Add new default prices with robust, user-friendly input
 * - List existing default prices with inline editing
 * - Delete default prices
 * - Form validation with Zod schemas
 * - Duplicate prevention for species/form combinations
 * - Real-time price updates with rounding to 0.50
 * - Responsive layout with mobile-friendly decimal input
 *
 * @param props - The component props
 * @returns The default prices management component
 */
export const DefaultPricesManagement = ({
  fishermanProfile,
}: DefaultPricesManagementProps) => {
  const [defaultPrices, setDefaultPrices] = useState<DefaultPrice[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>("");
  const [newPrice, setNewPrice] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<AddPriceForm>({
    resolver: zodResolver(addPriceSchema),
    defaultValues: {
      species: "",
      form: "",
      price_per_kg: undefined,
    },
  });

  /**
   * Fetches default prices from the database for the fisherman
   */
  const fetchDefaultPrices = useCallback(async () => {
    if (!fishermanProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from("default_prices")
        .select("*")
        .eq("fisherman_id", fishermanProfile.id)
        .order("species", { ascending: true });

      if (error) throw error;
      setDefaultPrices(data || []);
    } catch (error) {
      console.error("Error fetching default prices:", error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Kilohintoja ei voitu ladata.",
      });
    } finally {
      setLoading(false);
    }
  }, [fishermanProfile, toast]);

  useEffect(() => {
    fetchDefaultPrices();
  }, [fetchDefaultPrices]);

  /**
   * Rounds a number to the nearest 0.5.
   * @param value - The number to round.
   * @returns The number rounded to the nearest 0.5.
   */
  const roundToHalf = (value: number) => {
    return Math.round(value * 2) / 2;
  };

  /**
   * Handles change events for price inputs, allowing only valid decimal patterns.
   *
   * @param value - The raw input value.
   * @param setter - The React state setter function (e.g., setNewPrice or setEditingPrice).
   */
  const handlePriceInputChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const formattedValue = value.replace(",", ".");

    // Allow empty string or valid numeric/decimal patterns
    if (formattedValue === "" || /^[0-9]*\.?[0-9]*$/.test(formattedValue)) {
      const numValue = parseFloat(formattedValue);
      // Enforce max value of 100
      if (!isNaN(numValue) && numValue > 100) {
        setter("100");
      } else if (
        // Prevent values like "00" or "05" but allow "0."
        formattedValue.length > 1 &&
        formattedValue.startsWith("0") &&
        !formattedValue.startsWith("0.")
      ) {
        setter(formattedValue.substring(1));
      } else {
        setter(formattedValue);
      }
    }
  };

  /**
   * Handles blur event for the "new price" input.
   * It formats, rounds, and updates both the local string state and the RHF state.
   */
  const handleNewPriceBlur = () => {
    let numericValue = parseFloat(newPrice) || 0;

    // Enforce max
    if (numericValue > 100) {
      numericValue = 100;
    }

    // Enforce minimum and round
    if (numericValue > 0 && numericValue < 0.5) {
      numericValue = 0.5;
    }
    const roundedValue = roundToHalf(numericValue);

    if (roundedValue > 0) {
      // Update local string state (formatted)
      setNewPrice(roundedValue.toFixed(2));
      // Update react-hook-form state (numeric)
      form.setValue("price_per_kg", roundedValue, { shouldValidate: true });
    } else {
      // Handle empty or zero input
      setNewPrice("");
      form.setValue("price_per_kg", undefined, { shouldValidate: true });
    }
  };

  /**
   * Handles blur event for the "editing price" input.
   * It formats and rounds the value in the local editingPrice state.
   */
  const handleEditingPriceBlur = () => {
    let numericValue = parseFloat(editingPrice) || 0;

    // Enforce max
    if (numericValue > 100) {
      numericValue = 100;
    }

    // Enforce minimum and round
    if (numericValue > 0 && numericValue < 0.5) {
      numericValue = 0.5;
    }
    const roundedValue = roundToHalf(numericValue);

    // Update local string state (formatted)
    // We must ensure a minimum of 0.50 if user entered anything
    if (roundedValue < 0.5) {
      setEditingPrice(
        defaultPrices
          .find((p) => p.id === editingId)
          ?.price_per_kg.toFixed(2) || "0.50"
      ); // Revert to original or 0.50
    } else {
      setEditingPrice(roundedValue.toFixed(2));
    }
  };

  /**
   * Handles form submission to add a new default price
   * @param data - Form data from the add price form
   */
  const onSubmit = async (data: AddPriceForm) => {
    if (!fishermanProfile?.id) return;

    try {
      const { error } = await supabase.from("default_prices").insert({
        fisherman_id: fishermanProfile.id,
        species: data.species,
        form: data.form,
        price_per_kg: data.price_per_kg,
      });

      if (error) throw error;

      toast({
        title: "Onnistui!",
        description: "Kilohinta lisätty onnistuneesti.",
      });

      form.reset();
      setNewPrice("");
      fetchDefaultPrices();
    } catch (error: unknown) {
      console.error("Error adding default price:", error);
      // Check if the error is an object with a 'code' property
      // and if the code is '23505' (unique constraint violation)
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: unknown }).code === "23505"
      ) {
        toast({
          variant: "destructive",
          title: "Virhe",
          description:
            "Tämän lajin ja muodon yhdistelmälle on jo kilohinta määritelty. Jos haluat muokata kilohintaa, käytä 'Poista' -painiketta ja lisää uusi kilohinta.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Virhe",
          description: "Kilohintaa ei voitu lisätä.",
        });
      }
    }
  };

  /**
   * Enables edit mode for a specific price entry
   * @param id - ID of the price entry to edit
   * @param currentPrice - Current price value
   */
  const handleEdit = (id: string, currentPrice: number) => {
    setEditingId(id);
    setEditingPrice(currentPrice.toFixed(2));
  };

  /**
   * Saves the edited price to the database
   * @param id - ID of the price entry to update
   */
  const handleSaveEdit = async (id: string) => {
    // Parse the value from state, rounding it on save
    let price = parseFloat(editingPrice.replace(",", ".")) || 0; // <-- Change to 'let'

    // Enforce max
    if (price > 100) {
      price = 100;
    }

    if (price < 0.5) {
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Kilohinnan on oltava vähintään 0.50 €.",
      });
      return;
    }

    const roundedPrice = roundToHalf(price);

    try {
      const { error } = await supabase
        .from("default_prices")
        .update({ price_per_kg: roundedPrice })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Onnistui!",
        description: "Kilohinta päivitetty onnistuneesti.",
      });

      setEditingId(null);
      fetchDefaultPrices();
    } catch (error) {
      console.error("Error updating price:", error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Kilohintaa ei voitu päivittää.",
      });
    }
  };

  /**
   * Deletes a default price entry
   * @param id - ID of the price entry to delete
   */
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("default_prices")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Onnistui!",
        description: "Kilohinta poistettu onnistuneesti.",
      });

      fetchDefaultPrices();
    } catch (error) {
      console.error("Error deleting price:", error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Kilohintaa ei voitu poistaa.",
      });
    }
  };

  /**
   * Gets the display label for a fish species
   * @param species - Species value
   * @returns Display label for the species
   */
  const getSpeciesLabel = (species: string) => {
    return (
      speciesOptions.find((option) => option.value === species)?.label ||
      species
    );
  };

  /**
   * Gets the display label for a fish form
   * @param form - Form value
   * @returns Display label for the form
   */
  const getFormLabel = (form: string) => {
    return formOptions.find((option) => option.value === form)?.label || form;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Ladataan kilohintoja...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[var(--admin-side-container-width)] mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Lisää uusi kilohinta</CardTitle>
          <CardDescription>
            Määrittele oletuskilohinta laji- ja muotoyhdistelmälle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="species"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Laji</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Valitse laji" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {speciesOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
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
                  name="form"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Muoto</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Valitse muoto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {formOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
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
                  name="price_per_kg"
                  render={() => (
                    <FormItem>
                      <FormLabel>Kilohinta (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={newPrice}
                          onChange={(e) =>
                            handlePriceInputChange(e.target.value, setNewPrice)
                          }
                          onBlur={handleNewPriceBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full md:w-auto">
                <Plus className="w-4 h-4" />
                Lisää kilohinta
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Olemassa olevat kilohintasi</CardTitle>
          <CardDescription>
            Poista olemassa olevia oletuskilohintoja.
            <br /> Jos haluat muokata kilohintaa, käytä 'Poista' -painiketta ja
            lisää uusi kilohinta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {defaultPrices.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Et ole vielä määrittänyt kilohintoja. Lisää ensimmäinen kilohinta
              yllä olevalla lomakkeella.
            </p>
          ) : (
            <div className="space-y-4">
              {defaultPrices.map((price) => (
                <div
                  key={price.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div>
                      <span className="font-medium lowercase">
                        {getSpeciesLabel(price.species)}
                      </span>
                      <span className="text-muted-foreground lowercase">
                        {" "}
                        - {getFormLabel(price.form)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {editingId === price.id ? (
                      <>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={editingPrice}
                          onChange={(e) =>
                            handlePriceInputChange(
                              e.target.value,
                              setEditingPrice
                            )
                          }
                          onBlur={handleEditingPriceBlur}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">
                          €/kg
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(price.id)}
                        >
                          Tallenna
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          Peruuta
                        </Button>
                      </>
                    ) : (
                      <>
                        <button
                          className="text-right font-medium hover:underline p-2"
                          onClick={() =>
                            handleEdit(price.id, price.price_per_kg)
                          }
                        >
                          {price.price_per_kg.toFixed(2)} €/kg
                        </button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(price.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
