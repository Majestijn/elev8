export type JobType =
  | "Bank"
  | "Koelkast"
  | "Wasmachine"
  | "Volledige verhuizing"
  | "Piano"
  | "Bouwmaterialen"
  | "Anders";

/** Eén object dat omhoog moet; afmetingen in cm zijn optioneel. */
export interface BookingItem {
  type: JobType;
  /** Aantal van dit object (≥ 1). */
  quantity: number;
  length: number | null;
  width: number | null;
  height: number | null;
}

/** Booking zoals de server het naar de frontend stuurt (camelCase). */
export interface Booking {
  id: number;
  code: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  items: BookingItem[];
  siteConditions: string[];
  photos: string[];
  description: string | null;
  heaviestObjectKg: number | null;
  floor: number;
  heightMeters: number | null;
  postcode: string;
  street: string;
  city: string | null;
  date: string; // ISO date
  timeSlot: string;
  status: string;
  /** Werkelijke duur op locatie in minuten (door Chris ingevuld bij afronden). */
  durationMinutes: number | null;
  handledAt: string | null;
  createdAt: string;
}
