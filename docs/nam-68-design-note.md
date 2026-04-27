# NAM-68 design direction and conversion rationale

Design direction: premium editorial + performance marketing hybrid.

What changed
- Rebuilt `/product/carousel-copy-bundle` with a strong above-the-fold hero, premium gradient treatment, and clear value framing.
- Introduced visual hierarchy with modular cards, proof badges, and distinct section rhythm.
- Added channel-specific product preview gallery (Instagram, X/Twitter, YouTube, Meta ads) with alt text and funnel-role labeling.
- Preserved checkout implementation and Stripe behavior by keeping the existing checkout form contract (`data-checkout-form`, product slug handling, and `/api/stripe/checkout-session` flow).
- Added specialist contribution section to reflect Iris/Lyra/Nova integration in content, visual language, and funnel strategy.

Why this should improve conversion
- Reduced cognitive load: users can scan the offer in a few seconds before reading details.
- Increased trust: social-proof framing and concrete in-channel outputs reduce perceived risk.
- Stronger intent capture: CTA placement appears in hero and checkout section, matching high-intent moments.
- Better paid-social fit: buyers arriving from ads can immediately see “what they get” in native channel contexts.
- Mobile resilience: responsive card grids collapse cleanly while preserving hierarchy.
