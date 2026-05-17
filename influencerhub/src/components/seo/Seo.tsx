import { Helmet } from "react-helmet-async";

import { absoluteUrl, DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/site";

export interface SeoProps {
  /** Short page title (appended with ` · ${SITE_NAME}` unless `titleTemplate` override). */
  title: string;
  description?: string;
  /** Path only, e.g. `/directory` */
  canonicalPath: string;
  /** Dashboard / auth pages */
  noindex?: boolean;
  /** One or more JSON-LD objects */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath,
  noindex = false,
  jsonLd,
}: SeoProps) {
  const fullTitle = `${title} · ${SITE_NAME}`;
  const canonical = absoluteUrl(canonicalPath);
  const ld =
    jsonLd == null ? null : Array.isArray(jsonLd) ? jsonLd : [jsonLd];

  return (
    <Helmet htmlAttributes={{ lang: "en" }} prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonical.startsWith("http") ? <link rel="canonical" href={canonical} /> : null}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {canonical.startsWith("http") ? <meta property="og:url" content={canonical} /> : null}
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : (
        <meta name="robots" content="index, follow" />
      )}
      {ld?.length ? (
        <script type="application/ld+json">{JSON.stringify(ld.length === 1 ? ld[0] : ld)}</script>
      ) : null}
    </Helmet>
  );
}
