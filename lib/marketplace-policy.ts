const restrictedMarketplaceTerms = [
  "cannabis",
  "marijuana",
  "weed",
  "thc",
];

export function containsRestrictedMarketplaceContent(...values: Array<string | null | undefined>) {
  const text = values.filter(Boolean).join(" ").toLowerCase();
  return restrictedMarketplaceTerms.some((term) => text.includes(term));
}

export const marketplacePolicyNotice =
  "UTECH Marketplace allows lawful products. Cannabis, marijuana, weed, THC and other prohibited or unlawful products are not allowed.";
