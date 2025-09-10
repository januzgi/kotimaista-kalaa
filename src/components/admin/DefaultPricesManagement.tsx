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
 */
const addPriceSchema = z.object({
  species: z.string().min(1, "Laji on pakollinen"),
  form: z.string().min(1, "Muoto on pakollinen"),
  price_per_kg: z.number().min(0.01, "Kilohinta on pakollinen"),
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
 * - Add new default prices for species/form combinations
 * - List existing default prices with inline editing
 * - Delete default prices
 * - Form validation with Zod schemas
 * - Duplicate prevention for species/form combinations
 * - Real-time price updates
 * - Responsive layout
 *
 * Default prices are used to automatically populate pricing when adding
 * new catch entries, streamlining the catch entry process.
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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<AddPriceForm>({
    resolver: zodResolver(addPriceSchema),
    defaultValues: {
      species: "",
      form: "",
      price_per_kg: 0,
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
      fetchDefaultPrices();
    } catch (error: unknown) {
      console.error("Error adding default price:", error);
      // Check if the error is an object with a 'code' property
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
            "Tämän lajin ja muodon yhdistelmälle on jo kilohinta määritelty.",
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
    setEditingPrice(currentPrice.toString());
  };

  /**
   * Saves the edited price to the database
   * @param id - ID of the price entry to update
   */
  const handleSaveEdit = async (id: string) => {
    const price = parseFloat(editingPrice);
    if (isNaN(price) || price <= 0) {
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Kilohinta ei ole kelvollinen.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("default_prices")
        .update({ price_per_kg: price })
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
    return <div>Ladataan...</div>;
  }

  return (
    <div className="space-y-6">
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kilohinta (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
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

              <Button type="submit" className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
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
            Muokkaa tai poista olemassa olevia oletuskilohintoja
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
                      <span className="font-medium">
                        {getSpeciesLabel(price.species)}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        - {getFormLabel(price.form)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {editingId === price.id ? (
                      <>
                        <Input
                          type="number"
                          step="0.01"
                          value={editingPrice}
                          onChange={(e) => setEditingPrice(e.target.value)}
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
                          className="text-right font-medium hover:underline"
                          onClick={() =>
                            handleEdit(price.id, price.price_per_kg)
                          }
                        >
                          {price.price_per_kg} €/kg
                        </button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(price.id)}
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
