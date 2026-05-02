# CRO Test Plan - Faceless Digital Assets

**Issue:** NAM-43  
**Owner:** Blake  
**Date:** 2026-04-26  
**Status:** Ready for review

---

## Executive Summary

This document outlines prioritized A/B test hypotheses for the landing → catalog → product → checkout funnel. Tests are ranked by expected impact, effort, and confidence level.

---

## Funnel Overview

```
Landing Page → Catalog → Product Page → Checkout → Purchase
     ↓            ↓           ↓            ↓
  Awareness    Browse      Consider    Conversion
```

**Current Baseline Assumptions:**
- Landing → Catalog CTR: ~40% (industry avg: 35-50%)
- Catalog → Product CTR: ~25% (industry avg: 20-30%)
- Product → Cart Add Rate: ~15% (industry avg: 10-20%)
- Cart → Purchase: ~60% (industry avg: 50-70%)
- **Overall Conversion Rate: ~3.6%** (0.40 × 0.25 × 0.15 × 0.60)

---

## Prioritized Test Hypotheses

### Priority 1: High Impact, Low Effort

#### Test 1.1: Landing Page Value Proposition Clarity
- **Hypothesis:** Leading with concrete outcomes ("Launch in 48 hours") vs. abstract benefits ("Build your brand") will increase landing → catalog CTR by 15-25%.
- **Variant A (Control):** Abstract benefit-focused headline
- **Variant B (Test):** Outcome-specific headline with time bound
- **Success Metric:** Landing → Catalog CTR
- **Expected Lift:** +20%
- **Sample Size:** ~2,000 visitors per variant (95% confidence, 80% power)
- **Effort:** Low (copy change only)
- **Instrumentation:** Track CTA click events, scroll depth, time on page

#### Test 1.2: Product Page Social Proof Placement
- **Hypothesis:** Moving testimonials/reviews above the fold (near CTA) will increase product → cart add rate by 10-20%.
- **Variant A (Control):** Reviews below product description
- **Variant B (Test):** Review snippets + star rating adjacent to CTA
- **Success Metric:** Product → Cart Add Rate
- **Expected Lift:** +15%
- **Sample Size:** ~5,000 product page views per variant
- **Effort:** Low-Medium (layout change)
- **Instrumentation:** Track "Add to Cart" clicks, review section interactions

#### Test 1.3: Checkout Progress Indicator
- **Hypothesis:** Adding a visible 3-step progress indicator (Info → Payment → Confirm) will reduce checkout abandonment by 10-15%.
- **Variant A (Control):** No progress indicator
- **Variant B (Test):** Visual progress bar with step labels
- **Success Metric:** Checkout Completion Rate
- **Expected Lift:** +12%
- **Sample Size:** ~3,000 checkout sessions per variant
- **Effort:** Low (UI component)
- **Instrumentation:** Track step-by-step drop-off, time per step

---

### Priority 2: Medium Impact, Medium Effort

#### Test 2.1: Catalog Filter/Sort Optimization
- **Hypothesis:** Default sort by "Best Sellers" (vs. "Newest") will increase catalog → product CTR by 10-15%.
- **Variant A (Control):** Default sort = Newest
- **Variant B (Test):** Default sort = Best Sellers
- **Success Metric:** Catalog → Product CTR, Time to First Click
- **Expected Lift:** +12%
- **Sample Size:** ~4,000 catalog sessions per variant
- **Effort:** Medium (backend + frontend)
- **Instrumentation:** Track sort changes, product clicks, filter usage

#### Test 2.2: Product Page Urgency Signals
- **Hypothesis:** Adding low-stock indicators ("Only 3 left") on products with <10 inventory will increase cart add rate by 8-12%.
- **Variant A (Control):** No inventory visibility
- **Variant B (Test):** "Only X left" badge when inventory < 10
- **Success Metric:** Product → Cart Add Rate
- **Expected Lift:** +10%
- **Sample Size:** ~6,000 product page views per variant
- **Effort:** Medium (inventory integration + UI)
- **Instrumentation:** Track cart adds by inventory level, badge visibility events
- **Risk:** Potential trust erosion if overused; cap at 15% of product views

#### Test 2.3: Checkout Guest vs. Account Creation
- **Hypothesis:** Defaulting to guest checkout (with optional account creation post-purchase) will increase checkout completion by 8-15%.
- **Variant A (Control):** Account creation required upfront
- **Variant B (Test):** Guest checkout default, account offer after payment
- **Success Metric:** Checkout Completion Rate
- **Expected Lift:** +12%
- **Sample Size:** ~4,000 checkout sessions per variant
- **Effort:** Medium (auth flow change)
- **Instrumentation:** Track checkout abandonment by step, account creation rate post-purchase

---

### Priority 3: High Impact, High Effort

#### Test 3.1: Landing Page Personalization by Traffic Source
- **Hypothesis:** Tailoring landing page hero content by traffic source (paid social vs. organic search vs. email) will increase landing → catalog CTR by 20-30%.
- **Variant A (Control):** Single generic landing page
- **Variant B (Test):** Source-specific headlines + imagery
- **Success Metric:** Landing → Catalog CTR by source
- **Expected Lift:** +25%
- **Sample Size:** ~3,000 visitors per source per variant
- **Effort:** High (segmentation logic + multiple variants)
- **Instrumentation:** Track UTM parameters, source-segmented conversion funnels

#### Test 3.2: One-Page Checkout vs. Multi-Step
- **Hypothesis:** Collapsing checkout into a single page (vs. 3-step wizard) will reduce abandonment by 15-25% for mobile users.
- **Variant A (Control):** 3-step checkout wizard
- **Variant B (Test):** Single-page accordion checkout
- **Success Metric:** Mobile Checkout Completion Rate
- **Expected Lift:** +20% (mobile only)
- **Sample Size:** ~5,000 mobile checkout sessions per variant
- **Effort:** High (checkout rebuild)
- **Instrumentation:** Track mobile vs. desktop completion, form field errors, time to complete

---

## Testing Infrastructure Requirements

### Analytics Events to Implement

```javascript
// Funnel tracking events
- funnel_step_viewed: { step: 'landing'|'catalog'|'product'|'checkout', userId, sessionId }
- funnel_step_completed: { step, userId, sessionId, timeOnStep }
- cta_clicked: { ctaType, location, userId, sessionId }
- cart_added: { productId, price, userId, sessionId }
- checkout_started: { cartValue, itemCount, userId }
- checkout_completed: { orderId, total, userId }
- checkout_abandoned: { step, cartValue, userId }

// Test exposure tracking
- ab_test_exposed: { testId, variant, userId, sessionId }
- ab_test_converted: { testId, variant, conversionType, userId }
```

### Sample Size Calculator Reference

For 95% confidence, 80% power:
- Baseline CR 10%, MDE 20% → ~3,900 per variant
- Baseline CR 5%, MDE 25% → ~6,200 per variant
- Baseline CR 20%, MDE 15% → ~8,700 per variant

### Recommended Tools
- **A/B Testing:** Optimizely, VWO, or custom feature flag system
- **Analytics:** Plausible, Fathom, or GA4 (privacy-compliant)
- **Heatmaps:** Microsoft Clarity (free), Hotjar
- **Session Recording:** Microsoft Clarity, LogRocket

---

## Test Execution Timeline

| Week | Test | Funnel Stage | Owner |
|------|------|--------------|-------|
| 1 | 1.1 Landing Value Prop | Landing | Blake |
| 2 | 1.2 Social Proof Placement | Product | Blake |
| 3 | 1.3 Checkout Progress | Checkout | Blake |
| 4 | 2.1 Catalog Sort Default | Catalog | Blake |
| 5 | 2.2 Urgency Signals | Product | Blake |
| 6 | 2.3 Guest Checkout | Checkout | Blake |
| 7-8 | 3.1 Traffic Personalization | Landing | Blake + Atlas |
| 9-10 | 3.2 One-Page Checkout | Checkout | Blake + Engineering |

---

## Success Criteria

**Phase 1 (Tests 1.1-1.3):** Achieve 10%+ improvement in overall funnel conversion within 6 weeks.

**Phase 2 (Tests 2.1-2.3):** Achieve additional 8%+ improvement, validate urgency signal safety.

**Phase 3 (Tests 3.1-3.2):** Evaluate high-effort tests for long-term roadmap based on Phase 1-2 learnings.

---

## Risk Mitigation

1. **Statistical Validity:** Do not peek at results before minimum sample size; use sequential testing if early stopping needed.
2. **Segmentation Bias:** Ensure even traffic distribution; monitor for source/device imbalances.
3. **Novelty Effects:** Run tests for minimum 2 full business cycles (14 days) to account for day-of-week variation.
4. **Trust Erosion:** Monitor support tickets and NPS during urgency/scarcity tests; pause if negative signals emerge.

---

## Next Steps

1. [ ] Review and approve test priorities with Felix/NAM-41 parent issue
2. [ ] Implement analytics event tracking (if not already in place)
3. [ ] Set up A/B testing infrastructure
4. [ ] Launch Test 1.1 (Landing Value Prop)
5. [ ] Establish weekly test review cadence

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-26  
**Next Review:** After Test 1.3 results (Week 3)
