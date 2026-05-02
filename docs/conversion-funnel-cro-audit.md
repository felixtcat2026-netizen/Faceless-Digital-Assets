# Conversion Funnel Design + CRO Audit (NAM-60)

Prepared by: Blake  
Project: Faceless Digital Assets  
Workspace: C:\labs\Faceless Digital Assets  
Date: 2026-05-02  
Status: Ready for review

---

## 1) Executive summary

The current storefront has a clean core path and a credible lightweight offer structure:

Traffic source -> Home / Lead Magnet / Catalog -> Product detail -> Stripe Checkout -> Stripe webhook -> Order persistence

Strengths:
- Clear value proposition and modern visual treatment on the home page
- Transparent one-time pricing on the catalog
- Product detail pages already support direct checkout with low friction
- Free starter-pack capture gives the funnel a lower-intent conversion path
- Stripe-hosted checkout reduces implementation complexity and payment trust burden

Primary CRO risks:
- The funnel has almost no true measurement between page view and completed order
- Home hero presents three competing CTAs, including a dashboard path that can distract from revenue actions
- Catalog pages use a soft browse CTA only, which adds an extra click for hot traffic
- Most product pages have limited proof, objection handling, and differentiation above the checkout CTA
- Order persistence records completed purchases only after the Stripe webhook, so checkout drop-off is not observable today
- Lead capture stores sourcePath, but checkout flow does not capture traffic source, page origin, or step-by-step abandonment

Current local baseline from placeholder data:
- Leads captured: 2
- Lead source: 100% from /lead-magnet
- Lead goal: 100% new-product
- Orders persisted: 0

Bottom line: the storefront is structurally sound, but the largest immediate opportunity is instrumentation plus CTA-path simplification. Without event tracking, the team can discuss CRO ideas but cannot confidently rank or validate them.

---

## 2) Evidence reviewed

Code reviewed:
- apps/web/src/main.ts
- apps/web/src/catalog.ts
- apps/web/src/server/api.ts
- apps/web/src/server/validators.ts
- apps/web/src/server/persistence.ts

Visual evidence reviewed:
- docs/screenshots/redesign-home-v2.png
- docs/screenshots/redesign-catalog-v2.png

Placeholder data reviewed:
- apps/web/.local-data/leads.jsonl
- apps/web/.local-data/orders.jsonl

Related deliverables already in repo:
- docs/cro-test-plan.md
- docs/conversion-copy-variants.md

This audit complements those documents by focusing on the current funnel design, likely drop-off points, and a prioritized experiment backlog grounded in the actual implementation.

---

## 3) Current funnel map

### Entry paths

1. Home page (/)
   Main CTAs:
   - Browse Assets Built to Convert
   - Get the Free Starter Pack
   - See the Launch Dashboard

2. Catalog (/catalog)
   Product cards list:
   - Creator Launch Kit
   - Carousel Copy Bundle
   - Notion Ops Dashboard
   CTA on each card: See the Offer Details

3. Lead magnet (/lead-magnet)
   Form submits to POST /api/lead-magnet
   Captures:
   - email
   - goal
   - sourcePath

4. Product detail (/product/:slug)
   Standard product pages include:
   - price
   - promise
   - best-for / outcome / implementation time
   - feature bullets
   - bonus
   - checkout form with optional purchase email
   - CTA button mapped per product

5. Checkout
   Product form submits to POST /api/stripe/checkout-session
   Then redirects to hosted Stripe Checkout

6. Purchase completion
   Stripe webhook at POST /api/stripe/webhook
   Completed orders are written to orders.jsonl

### Simplified funnel diagram

Cold / warm traffic
  -> Home page
    -> Catalog
      -> Product detail
        -> Stripe checkout session created
          -> Hosted Stripe checkout
            -> Payment complete
              -> Webhook persists order

Alternative lower-intent path
  -> Home page or direct traffic
    -> Lead magnet
      -> Starter-pack signup
        -> future email nurture / retargeting opportunity

Non-revenue distraction path
  -> Home page
    -> Paperclip Dashboard

---

## 4) Funnel-stage assessment

### Stage A: Traffic landing -> first meaningful click

Current design strengths:
- Strong hero headline and polished mockup presentation
- Immediate dual intent support: buy now vs. free starter pack
- Quantified proof chips help early credibility

Likely drop-off causes:
- Three hero CTAs split attention
- The Paperclip Dashboard CTA is operationally interesting but commercially weak
- No explicit source-specific messaging for paid vs. organic vs. referral traffic
- Proof metrics are present, but they are not attributed to case studies, named customers, or visible testimonials

Primary risk:
Visitors may bounce or choose a non-revenue path before they understand the best next action.

### Stage B: Home -> catalog / lead magnet

Current design strengths:
- Catalog CTA is clear for high-intent buyers
- Starter pack offers a low-friction path for not-yet-ready visitors

Likely drop-off causes:
- No decision guide telling users which path fits their maturity or pain point
- No segmenting language like “Start here if you need X” or “Best for first-time launchers” at the home-page CTA level
- No urgency or reason to act now

Primary risk:
Users understand the brand but do not know which path is right for them.

### Stage C: Catalog -> product detail

Current design strengths:
- Simple scan-friendly product list
- Transparent one-time pricing
- Outcome-led descriptions

Likely drop-off causes:
- Card CTA says See the Offer Details instead of offering a direct buy option
- No featured offer or “most popular” anchor
- No decision support on which product is best for which use case
- No social proof or conversion proof on the catalog itself

Primary risk:
Catalog encourages browsing, not decision-making.

### Stage D: Product detail -> checkout session

Current design strengths:
- Low-friction checkout initiation
- Optional email avoids forcing a field before purchase intent is confirmed
- Product detail contains useful outcome and implementation framing

Likely drop-off causes:
- Most standard product pages are comparatively thin on proof and objection handling
- Optional email means lost remarketing / attribution value if the user abandons in Stripe
- No guarantee, refund, FAQ, or objection stack near the CTA
- No urgency, bundle logic, or offer framing that increases conviction
- No indicator of what happens after clicking buy

Primary risk:
The page explains the product, but does not maximize confidence for skeptical buyers.

### Stage E: Redirect -> Stripe checkout completion

Current design strengths:
- Stripe is trusted and familiar
- Hosted checkout reduces in-app payment friction

Likely drop-off causes:
- No local visibility into checkout start, Stripe arrival, abandonment, or completion rates
- No recovery path for abandoned checkout if customer email was not captured
- No explicit pre-checkout reminder of instant delivery, payment security, or refund support beyond short reassurance copy

Primary risk:
This is currently a black box in the funnel.

### Stage F: Post-purchase / post-lead capture

Current design strengths:
- Order and lead persistence exists
- Lead capture stores sourcePath

Likely drop-off causes:
- No visible post-purchase upsell/cross-sell path in this implementation
- No lifecycle segmentation persisted for checkout origin or traffic source
- Lead goals are constrained to a small enum, limiting deeper segmentation

Primary risk:
The business captures transactions and leads, but not enough context to optimize follow-up.

---

## 5) Highest-confidence drop-off points

Ranked by likely impact and confidence based on the current implementation:

1. Product detail -> Stripe checkout
   Why: standard product pages lack strong proof, objection handling, and urgency near the CTA.

2. Home hero -> meaningful commercial click
   Why: three CTAs compete, including a non-revenue dashboard path.

3. Catalog -> product detail
   Why: catalog is informative but light on buyer guidance, proof, and momentum.

4. Stripe checkout -> purchase completion
   Why: likely meaningful drop-off exists, but it is invisible because only completed orders are persisted.

5. Lead capture -> qualified nurture segmentation
   Why: lead flow collects only basic goal/sourcePath, which limits personalized follow-up.

---

## 6) Instrumentation gaps that should be fixed before or alongside testing

Current measurement available:
- lead captures saved to leads.jsonl
- completed orders saved to orders.jsonl after webhook

Critical missing events:
- page_view by route
- hero CTA click by CTA label and route
- catalog product click by product slug and position
- product CTA click by product slug
- checkout session created
- checkout session creation failed
- redirect to Stripe started
- checkout completed
- checkout abandoned / expired
- lead form started
- lead form completed

Recommended event properties:
- route
- referrer
- source / medium / campaign / content / term (UTM values)
- productSlug
- CTA label
- device category
- experiment name / variant
- timestamp

Minimum viable implementation recommendation:
1. Add a lightweight client event helper for page and CTA events.
2. Extend checkout-session creation payload or metadata with route + UTM context.
3. Persist Stripe session id and product slug at checkout-session creation time, not only after webhook completion.
4. Add abandoned-checkout recovery capability where Stripe/customer email is available.

Without this layer, future A/B results will be mostly anecdotal.

---

## 7) Prioritized CRO experiment backlog

Priority scoring uses: Impact x Confidence x Ease.

### Tier 1 — Do first

#### Experiment 1: Remove or demote the dashboard CTA from the home hero
- Hypothesis: reducing top-of-funnel CTA competition will lift home -> catalog and home -> lead-magnet CTR.
- Control: current three-CTA hero.
- Variant: keep Catalog and Starter Pack primary; move Paperclip Dashboard lower on the page or into nav only.
- Primary metric: hero primary CTA CTR.
- Secondary metrics: catalog sessions, lead-magnet sessions, bounce rate.
- Why first: high confidence, minimal implementation cost.

#### Experiment 2: Add decision-guided CTAs on the home page
- Hypothesis: segment-based CTA copy will improve first click quality and reduce indecision.
- Control: generic Browse Assets / Get the Free Starter Pack copy.
- Variant: use role/problem-based framing such as:
  - I need a paid offer fast
  - I need better conversion copy
  - I need a simpler launch system
- Primary metric: downstream product-detail visits and lead submissions by CTA.
- Why first: likely improves both click-through and traffic quality.

#### Experiment 3: Add “Best for” guidance and proof snippets on catalog cards
- Hypothesis: better buyer self-selection on catalog will increase catalog -> product CTR.
- Control: current title + price + short description + See the Offer Details.
- Variant: add 1-line best-for label plus a proof chip or implementation-time chip.
- Primary metric: product detail click-through rate.
- Secondary metric: clicks by product slug.
- Why first: easy change, directly addresses decision friction.

#### Experiment 4: Add a direct-buy CTA on catalog cards for high-intent traffic
- Hypothesis: hot traffic will convert better if it can start checkout without the extra details click.
- Control: See the Offer Details only.
- Variant: primary Buy Now / Get Instant Access plus secondary See Details.
- Primary metric: checkout-session creation rate from catalog visitors.
- Risk: may reduce education for colder visitors, so keep the details path present.

### Tier 2 — Do next

#### Experiment 5: Strengthen standard product pages with proof + objections near CTA
- Hypothesis: adding social proof, outcomes, and FAQ/objection handling above or beside the checkout form will improve checkout-session creation.
- Control: current standard product layout.
- Variant: add a compact proof block, “who this is for / not for,” FAQ, and guarantee or reassurance section.
- Primary metric: product detail -> checkout-session rate.
- Why next: likely one of the biggest lifts in the funnel.

#### Experiment 6: Capture email earlier for checkout-intent users
- Hypothesis: making email recommended rather than optional-and-empty, with clear value explanation, will increase recoverable checkout intent without materially hurting starts.
- Control: optional blank purchase email.
- Variant: pre-CTA framing such as “Enter email to receive your receipt and instant-access link,” possibly with inline validation and stronger reassurance.
- Primary metric: percent of checkout sessions with customerEmail captured.
- Secondary metric: checkout-session creation rate.
- Risk: more friction if executed poorly; test copy before making it required.

#### Experiment 7: Add outcome-based comparison or bundle anchor
- Hypothesis: a featured offer or bundle anchor increases confidence and average order value.
- Control: equal-weight catalog cards.
- Variant: highlight one “Best place to start” product or add “Get all 3” bundle framing.
- Primary metric: product detail CTR by featured product; eventual AOV once cart/bundle support exists.
- Why next: useful once baseline intent measurement is live.

### Tier 3 — Requires instrumentation or deeper implementation

#### Experiment 8: Traffic-source-specific landing variants
- Hypothesis: aligning the hero to paid-social, organic-search, or email intent will increase first-click quality.
- Control: one generic home page.
- Variant: source-specific headline, proof, and CTA ordering.
- Primary metric: route-specific CTR and downstream checkout-session rate by source.
- Dependency: UTM capture and experiment tagging.

#### Experiment 9: Recover abandoned Stripe sessions
- Hypothesis: abandoned-checkout email recovery will increase total completed orders from existing intent.
- Control: no recovery.
- Variant: recovery sequence triggered by incomplete session with known email.
- Primary metric: recovered purchase rate.
- Dependency: email capture plus Stripe session-state tracking.

#### Experiment 10: Personalize product recommendation path from lead-magnet goal
- Hypothesis: routing leads into product recommendations based on goal improves nurture-to-purchase conversion.
- Control: generic follow-up.
- Variant: goal-specific recommendation and CTA path.
- Primary metric: lead-to-product-click rate; eventual purchase rate by goal.
- Dependency: richer CRM / email follow-up instrumentation.

---

## 8) Recommended near-term rollout order

Week 1
- Implement baseline event tracking for page view, CTA click, product click, checkout session created, checkout session failed.
- Remove or demote the dashboard CTA from the home hero.

Week 2
- Launch home-page decision-guided CTA test.
- Add best-for guidance and proof chips on catalog cards.

Week 3
- Test direct-buy CTA on catalog cards.
- Add proof + FAQ + reassurance blocks to standard product pages.

Week 4+
- Add checkout intent capture and abandoned-session observability.
- Start source-specific landing-page tests once UTM tracking is stable.

---

## 9) Immediate design recommendations without waiting for a test

These are safe improvements with low downside:

1. Move Paperclip Dashboard out of the hero and leave it in navigation only.
2. Add “Best for” labels to every catalog product.
3. Add at least one proof/reassurance block above the checkout form on standard product pages.
4. Add a small FAQ section answering:
   - What do I get?
   - How fast can I use it?
   - Is this for beginners?
   - How is delivery handled?
5. Start persisting checkout-session creation events before payment completion.

---

## 10) What success should look like

In the next optimization cycle, the team should aim to answer these questions with real data:
- Which home CTA path produces the highest purchase intent?
- Which product receives the highest click-through and checkout-start rate?
- What percent of product visitors start checkout?
- What percent of checkout starters complete payment?
- What percent of leads by goal eventually view a product page or buy?
- Which traffic source produces the highest-value visits?

If those answers become measurable, the storefront can move from aesthetic optimization to actual revenue optimization.

---

## 11) Deliverable summary

Delivered in this audit:
- Current-state funnel map
- Funnel-stage risk assessment
- Highest-confidence drop-off diagnosis
- Instrumentation gap analysis
- 10-item prioritized CRO experiment backlog
- Recommended rollout order for the next optimization sprint

Suggested companion docs:
- docs/cro-test-plan.md for earlier A/B test framing
- docs/conversion-copy-variants.md for page-level messaging variants
