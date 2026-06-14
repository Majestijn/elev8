export type JobType =
  | "Bank"
  | "Koelkast"
  | "Wasmachine"
  | "Volledige verhuizing"
  | "Piano"
  | "Bouwmaterialen"
  | "Anders";

/** Booking zoals de server het naar de frontend stuurt (camelCase). */
export interface Booking {
  id: number;
  code: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  jobType: JobType;
  description: string | null;
  heaviestObjectKg: number | null;
  postcode: string;
  street: string;
  city: string | null;
  date: string; // ISO date
  timeSlot: string;
  status: string;
  handledAt: string | null;
  createdAt: string;
}
