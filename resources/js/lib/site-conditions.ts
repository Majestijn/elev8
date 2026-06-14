import type { ComponentType } from "react";
import { Building2, Cable, Construction, TreePine } from "lucide-react";

/** Eén locatie-bijzonderheid op de plek waar de lift moet komen. */
export interface SiteCondition {
  key: string;
  title: string;
  description: string;
  icon: ComponentType<{ size?: number }>;
}

/**
 * Bron van waarheid voor de locatie-kaarten. De keys worden opgeslagen in de
 * database; de titels gebruiken we in de flow én in Chris' inbox.
 */
export const SITE_CONDITIONS: SiteCondition[] = [
  {
    key: "trees",
    title: "Bomen / begroeiing",
    description: "Takken of struiken in de weg",
    icon: TreePine,
  },
  {
    key: "balconies",
    title: "Uitstekende balkons",
    description: "Balkon blokkeert de route omhoog",
    icon: Building2,
  },
  {
    key: "cables",
    title: "Kabels / leidingen",
    description: "Bovenleidingen of bekabeling",
    icon: Cable,
  },
  {
    key: "narrow_street",
    title: "Smalle straat / toegang",
    description: "Beperkte ruimte om de lift op te stellen",
    icon: Construction,
  },
];

/** Geef de leesbare titel bij een opgeslagen key (fallback: de key zelf). */
export function siteConditionTitle(key: string): string {
  return SITE_CONDITIONS.find((c) => c.key === key)?.title ?? key;
}
