import type {
  AuditCheckResult,
  KeywordIntent,
  Recommendation,
} from "../schemas/index.js";

const SEVERITY_PRIORITY: Record<
  AuditCheckResult["severity"],
  Recommendation["priority"]
> = {
  error: "high",
  warning: "medium",
  info: "low",
};

const RULE_ADVICE: Record<string, string> = {
  "title-length":
    "Write a unique <title> between 30 and 60 characters that leads with the target keyword.",
  "meta-description":
    "Add a compelling meta description of 70–160 characters that summarizes the page and includes the keyword.",
  canonical:
    "Add a <link rel=\"canonical\"> pointing to the preferred URL to avoid duplicate-content dilution.",
  "single-h1":
    "Use exactly one <h1> that states the page topic; demote extra headings to <h2>/<h3>.",
  "og-tags":
    "Add Open Graph tags (og:title, og:description, og:image) so shares render rich previews.",
  "json-ld":
    "Add JSON-LD structured data so search engines can build rich results.",
  "cwv-lcp":
    "Improve Largest Contentful Paint: optimize the hero image, preload critical assets, and reduce server response time.",
  "cwv-cls":
    "Reduce Cumulative Layout Shift: set explicit width/height on media and reserve space for dynamic content.",
  "cwv-inp":
    "Improve Interaction to Next Paint (replaced FID in 2024): break up long tasks, defer non-critical JS, and keep the main thread responsive.",
  https:
    "Serve the site over HTTPS with a valid TLS certificate and redirect all HTTP traffic to HTTPS.",
  "robots-indexable":
    "Remove the noindex directive (meta robots / X-Robots-Tag) so this page can be indexed — unless it is intentionally hidden.",
  "viewport-meta":
    "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> so the page is mobile-friendly under mobile-first indexing.",
  "lang-attribute":
    "Set a <html lang=\"…\"> attribute so search engines and assistive tech know the page language.",
  "heading-structure":
    "Break the content into sections with descriptive <h2>/<h3> subheadings so it is scannable and easier to rank for sub-topics.",
  "image-alt":
    "Add descriptive alt text to every meaningful image for accessibility and image-search visibility.",
  "content-depth":
    "Expand thin content to fully cover the topic and match search intent; aim for substantive depth, not padding.",
};

/** Turn failed audit checks into prioritized, actionable recommendations. */
export function buildAuditRecommendations(
  checks: AuditCheckResult[],
): Recommendation[] {
  return checks
    .filter((check) => !check.passed)
    .map((check) => ({
      id: `audit:${check.ruleId}`,
      title: check.message,
      detail: RULE_ADVICE[check.ruleId] ?? check.message,
      priority: SEVERITY_PRIORITY[check.severity],
      category: "on-page",
    }));
}

const INTENT_ADVICE: Record<KeywordIntent, { title: string; detail: string }> = {
  informational: {
    title: "Structure for informational intent",
    detail:
      "Answer the question directly in the first paragraph, add an FAQ section, and mark it up with FAQPage/HowTo schema.",
  },
  navigational: {
    title: "Optimize for navigational intent",
    detail:
      "Lead with the brand/product name in the title, add breadcrumb schema, and link prominently to the destination page.",
  },
  commercial: {
    title: "Support commercial-investigation intent",
    detail:
      "Add comparison tables, pros/cons, and aggregateRating schema so buyers can evaluate options on-page.",
  },
  transactional: {
    title: "Drive transactional intent",
    detail:
      "Place a clear primary CTA above the fold, surface pricing, and add Product/Offer schema.",
  },
};

export interface BlogRecommendationInput {
  intent: KeywordIntent;
  targetKeyword?: string;
  metaTitle?: string;
  metaDescription?: string;
  content?: string;
}

/** Recommendations for a blog post based on keyword intent and meta coverage. */
export function buildBlogRecommendations(
  input: BlogRecommendationInput,
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (!input.metaTitle?.trim()) {
    recs.push({
      id: "blog:meta-title",
      title: "Add a meta title",
      detail:
        "This post has no meta title. Generate one so search and social previews are controlled.",
      priority: "high",
      category: "meta",
    });
  }

  if (!input.metaDescription?.trim()) {
    recs.push({
      id: "blog:meta-description",
      title: "Add a meta description",
      detail:
        "Without a meta description, search engines pick arbitrary snippets. Generate one to improve CTR.",
      priority: "high",
      category: "meta",
    });
  }

  const keyword = input.targetKeyword?.trim();
  const content = input.content ?? "";
  if (keyword && content && !content.toLowerCase().includes(keyword.toLowerCase())) {
    recs.push({
      id: "blog:keyword-in-body",
      title: "Use the target keyword in the body",
      detail: `The target keyword "${keyword}" does not appear in the content. Work it into the intro and a subheading naturally.`,
      priority: "medium",
      category: "content",
    });
  }

  const intentAdvice = INTENT_ADVICE[input.intent];
  recs.push({
    id: `blog:intent-${input.intent}`,
    title: intentAdvice.title,
    detail: intentAdvice.detail,
    priority: "medium",
    category: "intent",
  });

  return recs;
}
