import { z } from "zod";
import type { GeneratedSchema } from "../schemas/index.js";

export const SCHEMA_TYPES = [
  "Article",
  "Product",
  "FAQPage",
  "BreadcrumbList",
  "Organization",
] as const;

export type SchemaType = (typeof SCHEMA_TYPES)[number];

export const schemaGeneratorInputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("Article"),
    headline: z.string().min(1),
    description: z.string().optional(),
    url: z.string().url().optional(),
    image: z.string().url().optional(),
    authorName: z.string().optional(),
    datePublished: z.string().optional(),
    dateModified: z.string().optional(),
    publisherName: z.string().optional(),
  }),
  z.object({
    type: z.literal("Product"),
    name: z.string().min(1),
    description: z.string().optional(),
    image: z.string().url().optional(),
    brand: z.string().optional(),
    sku: z.string().optional(),
    price: z.string().optional(),
    priceCurrency: z.string().optional(),
    availability: z.string().optional(),
    ratingValue: z.number().optional(),
    reviewCount: z.number().int().optional(),
  }),
  z.object({
    type: z.literal("FAQPage"),
    questions: z
      .array(
        z.object({
          question: z.string().min(1),
          answer: z.string().min(1),
        }),
      )
      .min(1),
  }),
  z.object({
    type: z.literal("BreadcrumbList"),
    items: z
      .array(
        z.object({
          name: z.string().min(1),
          url: z.string().url(),
        }),
      )
      .min(1),
  }),
  z.object({
    type: z.literal("Organization"),
    name: z.string().min(1),
    url: z.string().url().optional(),
    logo: z.string().url().optional(),
    sameAs: z.array(z.string().url()).optional(),
  }),
]);

export type SchemaGeneratorInput = z.infer<typeof schemaGeneratorInputSchema>;

function toJsonLdScript(jsonLd: Record<string, unknown>): string {
  return `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
}

function buildArticle(input: Extract<SchemaGeneratorInput, { type: "Article" }>) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    ...(input.description ? { description: input.description } : {}),
    ...(input.url ? { url: input.url, mainEntityOfPage: input.url } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.authorName
      ? { author: { "@type": "Person", name: input.authorName } }
      : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    ...(input.publisherName
      ? { publisher: { "@type": "Organization", name: input.publisherName } }
      : {}),
  };
  return jsonLd;
}

function buildProduct(input: Extract<SchemaGeneratorInput, { type: "Product" }>) {
  const offers =
    input.price || input.priceCurrency || input.availability
      ? {
          "@type": "Offer",
          ...(input.price ? { price: input.price } : {}),
          ...(input.priceCurrency ? { priceCurrency: input.priceCurrency } : {}),
          ...(input.availability
            ? { availability: `https://schema.org/${input.availability}` }
            : {}),
        }
      : undefined;

  const aggregateRating =
    input.ratingValue !== undefined || input.reviewCount !== undefined
      ? {
          "@type": "AggregateRating",
          ...(input.ratingValue !== undefined
            ? { ratingValue: input.ratingValue }
            : {}),
          ...(input.reviewCount !== undefined
            ? { reviewCount: input.reviewCount }
            : {}),
        }
      : undefined;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.brand ? { brand: { "@type": "Brand", name: input.brand } } : {}),
    ...(input.sku ? { sku: input.sku } : {}),
    ...(offers ? { offers } : {}),
    ...(aggregateRating ? { aggregateRating } : {}),
  };
  return jsonLd;
}

function buildFaqPage(input: Extract<SchemaGeneratorInput, { type: "FAQPage" }>) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: input.questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
  return jsonLd;
}

function buildBreadcrumbList(
  input: Extract<SchemaGeneratorInput, { type: "BreadcrumbList" }>,
) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return jsonLd;
}

function buildOrganization(
  input: Extract<SchemaGeneratorInput, { type: "Organization" }>,
) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    ...(input.url ? { url: input.url } : {}),
    ...(input.logo ? { logo: input.logo } : {}),
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
  };
  return jsonLd;
}

export function generateSchema(input: SchemaGeneratorInput): GeneratedSchema {
  let jsonLd: Record<string, unknown>;

  switch (input.type) {
    case "Article":
      jsonLd = buildArticle(input);
      break;
    case "Product":
      jsonLd = buildProduct(input);
      break;
    case "FAQPage":
      jsonLd = buildFaqPage(input);
      break;
    case "BreadcrumbList":
      jsonLd = buildBreadcrumbList(input);
      break;
    case "Organization":
      jsonLd = buildOrganization(input);
      break;
  }

  return {
    type: input.type,
    jsonLd,
    html: toJsonLdScript(jsonLd),
  };
}
