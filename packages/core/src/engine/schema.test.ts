import { describe, it, expect } from "vitest";
import {
  generateSchema,
  schemaGeneratorInputSchema,
  SCHEMA_TYPES,
} from "./schema.js";

describe("generateSchema", () => {
  it("exports all essential schema types", () => {
    expect(SCHEMA_TYPES).toEqual([
      "Article",
      "Product",
      "FAQPage",
      "BreadcrumbList",
      "Organization",
    ]);
  });

  it("builds Article JSON-LD with nested author and publisher", () => {
    const result = generateSchema({
      type: "Article",
      headline: "SEO tools guide",
      description: "How to pick SEO tools.",
      url: "https://example.com/guide",
      authorName: "Jane Doe",
      publisherName: "Example Co",
    });

    expect(result.type).toBe("Article");
    expect(result.jsonLd["@type"]).toBe("Article");
    expect(result.jsonLd.headline).toBe("SEO tools guide");
    expect(result.jsonLd.author).toEqual({ "@type": "Person", name: "Jane Doe" });
    expect(result.html).toContain("application/ld+json");
  });

  it("builds Product with offers and aggregateRating", () => {
    const result = generateSchema({
      type: "Product",
      name: "RankMySEO Pro",
      price: "49.00",
      priceCurrency: "USD",
      availability: "InStock",
      ratingValue: 4.8,
      reviewCount: 128,
    });

    expect(result.jsonLd["@type"]).toBe("Product");
    expect(result.jsonLd.offers).toMatchObject({
      "@type": "Offer",
      price: "49.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    });
    expect(result.jsonLd.aggregateRating).toMatchObject({
      "@type": "AggregateRating",
      ratingValue: 4.8,
      reviewCount: 128,
    });
  });

  it("builds FAQPage mainEntity array", () => {
    const result = generateSchema({
      type: "FAQPage",
      questions: [
        { question: "What is RankMySEO?", answer: "An SEO toolkit." },
        { question: "Is it free?", answer: "Open source." },
      ],
    });

    expect(result.jsonLd["@type"]).toBe("FAQPage");
    expect(result.jsonLd.mainEntity).toHaveLength(2);
    expect(result.jsonLd.mainEntity).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": "Question",
          name: "What is RankMySEO?",
        }),
      ]),
    );
  });

  it("builds BreadcrumbList itemListElement", () => {
    const result = generateSchema({
      type: "BreadcrumbList",
      items: [
        { name: "Home", url: "https://example.com" },
        { name: "Blog", url: "https://example.com/blog" },
      ],
    });

    expect(result.jsonLd.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://example.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://example.com/blog",
      },
    ]);
  });

  it("builds Organization with sameAs", () => {
    const result = generateSchema({
      type: "Organization",
      name: "RankMySEO",
      url: "https://example.com",
      sameAs: ["https://github.com/madebyaris/rankmyseo"],
    });

    expect(result.jsonLd["@type"]).toBe("Organization");
    expect(result.jsonLd.sameAs).toEqual([
      "https://github.com/madebyaris/rankmyseo",
    ]);
  });
});

describe("schemaGeneratorInputSchema", () => {
  it("rejects unknown schema type", () => {
    const parsed = schemaGeneratorInputSchema.safeParse({
      type: "Recipe",
      name: "Test",
    });
    expect(parsed.success).toBe(false);
  });
});
