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
  catch: {
    catch_date: string;
  } | null;
  fisherman_profile: {
    user: {
      full_name: string;
    };
  } | null;
};
