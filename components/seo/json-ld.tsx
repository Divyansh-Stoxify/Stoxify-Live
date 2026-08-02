import React from "react";

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Stoxify",
    "legalName": "Stoxify Private Limited",
    "url": "https://www.stoxify.in",
    "logo": "https://www.stoxify.in/logo-primary.svg",
    "description": "India's PaRRVA-aligned compliance infrastructure platform for SEBI-registered Research Analysts and verified trader marketplace.",
    "foundingDate": "2026",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN"
    },
    "sameAs": [
      "https://twitter.com/stoxifyin",
      "https://linkedin.com/company/stoxify"
    ]
  };
}

export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Stoxify",
    "url": "https://www.stoxify.in",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.stoxify.in/profiles/{search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };
}
