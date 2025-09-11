export type FishermanProfile = {
  id: string;
  user_id: string;
  public_phone_number: string | null;
  signature_image_url: string | null;
  pickup_address: string | null;
  default_delivery_fee: number | null;
  fishermans_note: string | null;
  display_on_homepage: boolean;
  created_at: string;
  updated_at: string;
};

export type DefaultPrice = {
  id: string;
  fisherman_id: string;
  species: string;
  form: string;
  price_per_kg: number;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  species: string;
  form: string;
  price_per_kg: number;
  available_quantity: number;
  catch?: {
    catch_date: string;
  } | null;
  fisherman_profile: {
    id?: string;
    pickup_address?: string;
    default_delivery_fee?: number;
    public_phone_number?: string | null;
    user: {
      full_name: string;
    };
  } | null;
};

export type Order = {
  id: string;
  customer_name: string;
  customer_address: string | null;
  customer_phone: string;
  fulfillment_type: "PICKUP" | "DELIVERY";
  final_delivery_fee: number | null;
  status: "NEW" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  created_at: string;
  fulfillment_slot: {
    start_time: string;
    end_time: string;
    type: "PICKUP" | "DELIVERY";
  } | null;
  order_items: {
    id: string;
    quantity: number;
    product: {
      species: string;
      form: string;
      price_per_kg: number;
    };
  }[];
};

export type CatchGroup = {
  catch_id: string;
  catch_date: string;
  products: Product[];
  fulfillment_slots: FulfillmentSlot[];
};

export type FulfillmentSlot = {
  id: string;
  start_time: string;
  end_time: string;
  type: "PICKUP" | "DELIVERY";
};
