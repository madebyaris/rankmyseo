import { useMemo, useState } from "react";
import { Braces, Copy, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { useSchemaGenerator } from "@rankmyseo/react";
import type { SchemaGeneratorInput, SchemaType } from "@rankmyseo/core";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Empty, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
import { Alert, AlertTitle } from "@/components/ui/alert";

const SCHEMA_TYPES: SchemaType[] = [
  "Article",
  "Product",
  "FAQPage",
  "BreadcrumbList",
  "Organization",
];

type FormState = Record<string, string>;

const DEFAULTS: Record<SchemaType, FormState> = {
  Article: {
    headline: "How to choose the best SEO tools for small teams",
    description:
      "A practical guide comparing rank tracking, audits, and reporting for small teams.",
    url: "https://example.com/best-seo-tools",
    image: "https://example.com/hero.jpg",
    authorName: "Jane Doe",
    datePublished: "2026-06-01",
    dateModified: "2026-06-26",
    publisherName: "RankMySEO",
  },
  Product: {
    name: "RankMySEO Pro",
    description: "Composable SEO toolkit for JavaScript apps.",
    image: "https://example.com/product.jpg",
    brand: "RankMySEO",
    sku: "RMS-PRO-001",
    price: "49.00",
    priceCurrency: "USD",
    availability: "InStock",
    ratingValue: "4.8",
    reviewCount: "128",
  },
  FAQPage: {
    questions:
      "What is RankMySEO?|An open-source SEO toolkit for JS apps.\nHow do I install it?|npm i @rankmyseo/core @rankmyseo/server-hono",
  },
  BreadcrumbList: {
    items: "Home|https://example.com\nBlog|https://example.com/blog\nSEO Tools|https://example.com/blog/seo-tools",
  },
  Organization: {
    name: "RankMySEO",
    url: "https://example.com",
    logo: "https://example.com/logo.png",
    sameAs: "https://github.com/madebyaris/rankmyseo",
  },
};

function parseFaqQuestions(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [question, answer] = line.split("|");
      return {
        question: (question ?? "").trim(),
        answer: (answer ?? "").trim(),
      };
    })
    .filter((q) => q.question && q.answer);
}

function parseBreadcrumbItems(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, url] = line.split("|");
      return { name: (name ?? "").trim(), url: (url ?? "").trim() };
    })
    .filter((item) => item.name && item.url);
}

function buildInput(type: SchemaType, form: FormState): SchemaGeneratorInput {
  switch (type) {
    case "Article":
      return {
        type: "Article",
        headline: form.headline ?? "",
        description: form.description || undefined,
        url: form.url || undefined,
        image: form.image || undefined,
        authorName: form.authorName || undefined,
        datePublished: form.datePublished || undefined,
        dateModified: form.dateModified || undefined,
        publisherName: form.publisherName || undefined,
      };
    case "Product":
      return {
        type: "Product",
        name: form.name ?? "",
        description: form.description || undefined,
        image: form.image || undefined,
        brand: form.brand || undefined,
        sku: form.sku || undefined,
        price: form.price || undefined,
        priceCurrency: form.priceCurrency || undefined,
        availability: form.availability || undefined,
        ratingValue: form.ratingValue ? Number(form.ratingValue) : undefined,
        reviewCount: form.reviewCount ? Number(form.reviewCount) : undefined,
      };
    case "FAQPage":
      return { type: "FAQPage", questions: parseFaqQuestions(form.questions ?? "") };
    case "BreadcrumbList":
      return {
        type: "BreadcrumbList",
        items: parseBreadcrumbItems(form.items ?? ""),
      };
    case "Organization":
      return {
        type: "Organization",
        name: form.name ?? "",
        url: form.url || undefined,
        logo: form.logo || undefined,
        sameAs: form.sameAs
          ? form.sameAs
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      };
  }
}

function SchemaFields({
  type,
  form,
  onChange,
}: {
  type: SchemaType;
  form: FormState;
  onChange: (key: string, value: string) => void;
}) {
  const field = (key: string, label: string, multiline = false) => (
    <div key={key} className="flex flex-col gap-1.5">
      <Label htmlFor={`schema-${key}`}>{label}</Label>
      {multiline ? (
        <Textarea
          id={`schema-${key}`}
          rows={4}
          value={form[key] ?? ""}
          onChange={(e) => onChange(key, e.target.value)}
        />
      ) : (
        <Input
          id={`schema-${key}`}
          value={form[key] ?? ""}
          onChange={(e) => onChange(key, e.target.value)}
        />
      )}
    </div>
  );

  switch (type) {
    case "Article":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {field("headline", "Headline")}
          {field("description", "Description", true)}
          {field("url", "URL")}
          {field("image", "Image URL")}
          {field("authorName", "Author name")}
          {field("datePublished", "Date published")}
          {field("dateModified", "Date modified")}
          {field("publisherName", "Publisher name")}
        </div>
      );
    case "Product":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {field("name", "Product name")}
          {field("description", "Description", true)}
          {field("image", "Image URL")}
          {field("brand", "Brand")}
          {field("sku", "SKU")}
          {field("price", "Price")}
          {field("priceCurrency", "Currency")}
          {field("availability", "Availability (e.g. InStock)")}
          {field("ratingValue", "Rating value")}
          {field("reviewCount", "Review count")}
        </div>
      );
    case "FAQPage":
      return (
        <div className="flex flex-col gap-1.5">
          {field(
            "questions",
            "Questions (one per line: Question|Answer)",
            true,
          )}
        </div>
      );
    case "BreadcrumbList":
      return (
        <div className="flex flex-col gap-1.5">
          {field("items", "Items (one per line: Name|URL)", true)}
        </div>
      );
    case "Organization":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {field("name", "Organization name")}
          {field("url", "Website URL")}
          {field("logo", "Logo URL")}
          {field("sameAs", "Same-as URLs (one per line)", true)}
        </div>
      );
  }
}

export function SchemaPanel() {
  const { result, generating, error, generate } = useSchemaGenerator();
  const [type, setType] = useState<SchemaType>("Article");
  const [forms, setForms] = useState<Record<SchemaType, FormState>>(DEFAULTS);

  const form = forms[type];
  const jsonPreview = useMemo(
    () => (result ? JSON.stringify(result.schema.jsonLd, null, 2) : ""),
    [result],
  );

  const setField = (key: string, value: string) => {
    setForms((prev) => ({
      ...prev,
      [type]: { ...prev[type], [key]: value },
    }));
  };

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Schema generator</CardTitle>
          <CardDescription>
            Build Schema.org JSON-LD for rich results (Article, Product, FAQ,
            Breadcrumbs, Organization).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {SCHEMA_TYPES.map((t) => (
              <Button
                key={t}
                type="button"
                size="sm"
                variant={type === t ? "default" : "outline"}
                onClick={() => setType(t)}
              >
                {t}
              </Button>
            ))}
          </div>

          <SchemaFields type={type} form={form} onChange={setField} />

          <div>
            <Button
              disabled={generating}
              onClick={() =>
                void generate(buildInput(type, form)).catch(() => {})
              }
            >
              {generating ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Sparkles data-icon="inline-start" />
              )}
              {generating ? "Generating…" : "Generate schema"}
            </Button>
          </div>

          {error ? (
            <Alert variant="destructive">
              <X />
              <AlertTitle>{error.message}</AlertTitle>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>{result.schema.type} JSON-LD</CardTitle>
            <CardDescription>
              Copy the script tag into your page head or CMS template.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">JSON-LD</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard?.writeText(jsonPreview);
                    toast.success("JSON-LD copied");
                  }}
                >
                  <Copy data-icon="inline-start" />
                  Copy JSON
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">
                {jsonPreview}
              </pre>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Script tag</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard?.writeText(result.schema.html);
                    toast.success("Script tag copied");
                  }}
                >
                  <Copy data-icon="inline-start" />
                  Copy script
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-foreground p-4 text-xs leading-relaxed text-background">
                {result.schema.html}
              </pre>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Empty>
          <EmptyMedia variant="icon">
            <Braces />
          </EmptyMedia>
          <EmptyDescription>
            Pick a schema type, fill the fields, and generate JSON-LD here.
          </EmptyDescription>
        </Empty>
      )}
    </div>
  );
}
