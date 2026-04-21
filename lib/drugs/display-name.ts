/**
 * Display labels for companion drugs. When `brand_names` is populated (US trade names
 * from FDA labeling / Orange Book–aligned editorial data), we lead with those instead of
 * the catalog `name` field (often "Generic (Brand)" clinical style).
 */

export function parseBrandNames(brandNames: unknown): string[] {
  if (!Array.isArray(brandNames)) return [];
  return brandNames
    .filter((b): b is string => typeof b === 'string' && b.trim().length > 0)
    .map((b) => b.trim());
}

/** Primary headline: first FDA-style trade name, else catalog name. */
export function primaryDrugDisplayName(row: { name: string; brand_names: unknown }): string {
  const brands = parseBrandNames(row.brand_names);
  if (brands.length > 0) return brands[0];
  return row.name;
}

/** Additional trade names when the headline uses `brands[0]`. */
export function secondaryBrandNames(brandNames: unknown): string[] {
  return parseBrandNames(brandNames).slice(1);
}

function formatInn(genericName: string | null): string | null {
  if (!genericName?.trim()) return null;
  const t = genericName.trim();
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

/**
 * Generic / INN line when leading with a brand (subtitle under card title or h1).
 */
export function genericIngredientLabel(row: { name: string; generic_name: string | null; brand_names: unknown }): string | null {
  const brands = parseBrandNames(row.brand_names);
  if (brands.length === 0) return null;

  const inn = formatInn(row.generic_name);
  if (inn) return inn;

  const m = row.name.match(/^(.+?)\s*\([^)]+\)\s*$/);
  if (m) return m[1].trim();

  return row.name;
}

export function sortDrugsByDisplayName<T extends { name: string; brand_names: unknown }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    primaryDrugDisplayName(a).localeCompare(primaryDrugDisplayName(b), undefined, { sensitivity: 'base' }),
  );
}
