// ============================================================
// BLENDIFY — Iced Tea Product Extended Data
// Flavour families, pack options, offers, accordions, reviews
// All content is Blendify-original. No Impulse copy used.
// ============================================================

// ── Flavour family ────────────────────────────────────────────
export interface FlavourSibling {
  slug: string;
  label: string;
  color: string; // background tint for swatch
}

// ── Pack options ──────────────────────────────────────────────
export interface PackOption {
  id: string;
  label: string;       // "Pack of 1"
  qty: number;
  price: number;       // in INR
  comparePrice?: number;
  saving?: number;     // INR saved
  perServing: number;  // INR per serving
  bestValue?: boolean;
}

// ── Offers ────────────────────────────────────────────────────
export interface Offer {
  id: string;
  headline: string;
  description: string;
  couponCode: string;
}

// ── Accordion ────────────────────────────────────────────────
export interface FAQItem {
  q: string;
  a: string;
}

export interface AccordionData {
  description: string;
  ingredients: string[];
  whatsInside: {
    intro: string;
    items: { flavour: string; description: string }[];
  };
  differentiators: string[];
  howToMake: string[];
  faqs: FAQItem[];
}

// ── Review ────────────────────────────────────────────────────
export interface ReviewItem {
  id: string;
  author: string;
  initials: string;
  verified: boolean;
  date: string;
  rating: number;
  title: string;
  body: string;
}

export interface ReviewData {
  average: number;
  count: number;
  distribution: { stars: number; count: number; pct: number }[];
  items: ReviewItem[];
}

// ── Full extended product profile ─────────────────────────────
export interface IcedTeaProfile {
  slug: string;
  flavourFamily: FlavourSibling[];
  packOptions: PackOption[];
  offers: Offer[];
  accordion: AccordionData;
  reviews: ReviewData;
}

// ── Shared flavour family ─────────────────────────────────────
const ICED_TEA_FAMILY: FlavourSibling[] = [
  { slug: 'guilt-free-ice-tea-assorted',    label: 'Assorted Pack',  color: '#e8f4e8' },
  { slug: 'guilt-free-ice-tea-strawberry',  label: 'Strawberry',     color: '#fde8e8' },
  { slug: 'guilt-free-ice-tea-guava-chilli',label: 'Guava Chilli',   color: '#fdf0e0' },
  { slug: 'guilt-free-ice-tea-lemon',       label: 'Lemon',          color: '#fdfbe0' },
  { slug: 'guilt-free-ice-tea-pineapple',   label: 'Pineapple',      color: '#fdf5e0' },
  { slug: 'guilt-free-ice-tea-blueberry',   label: 'Blueberry',      color: '#ede8fd' },
  { slug: 'guilt-free-ice-tea-peach',       label: 'Peach',          color: '#fde8da' },
  { slug: 'guilt-free-ice-tea-mango',       label: 'Mango',          color: '#fdf3d8' },
  { slug: 'guilt-free-ice-tea-passion-fruit', label: 'Passion Fruit', color: '#fce8f5' },
  { slug: 'guilt-free-ice-tea-cranberry',   label: 'Cranberry',      color: '#fde8ec' },
];

// ── Shared pack tiers (same across all single-flavour SKUs, ₹399 base) ──
// Assorted pack uses these pack options too.
// Pack pricing verified from reference JSON-LD:
//   Pack 1 = ₹399, Pack 4 = ₹1,449 (vs 1,596 → save 147), Pack 8 = ₹2,799 (vs 3,192 → save 393)
const PACK_OPTIONS_399: PackOption[] = [
  {
    id: 'pack-1',
    label: 'Pack of 1',
    qty: 1,
    price: 399,
    perServing: 80,  // ₹399 / 5 sachets ≈ ₹80/sachet = ₹80/serving
  },
  {
    id: 'pack-4',
    label: 'Pack of 4',
    qty: 4,
    price: 1449,
    comparePrice: 1596,
    saving: 147,
    perServing: 72,  // ₹1449 / 20 sachets ≈ ₹72.45/serving
  },
  {
    id: 'pack-8',
    label: 'Pack of 8',
    qty: 8,
    price: 2799,
    comparePrice: 3192,
    saving: 393,
    perServing: 70,  // ₹2799 / 40 sachets ≈ ₹69.97/serving
    bestValue: true,
  },
];

// ── Shared offers ─────────────────────────────────────────────
const SHARED_OFFERS: Offer[] = [
  {
    id: 'offer-1',
    headline: 'FREE SHIPPING ON 2+',
    description: 'Buy any 2 packs and get free shipping across India. Use code at checkout.',
    couponCode: 'SHIP2FREE',
  },
  {
    id: 'offer-2',
    headline: 'FREE GIFT ON ₹1999+',
    description: 'Order above ₹1,999 and get a Blendify Frother absolutely free!',
    couponCode: 'GIFT1999',
  },
];

// ── Shared accordion ──────────────────────────────────────────
// Content is Blendify-authored. Structure mirrors reference section order:
// Description → Ingredients → What's Inside? → Differentiators → How to Make → FAQs
const ASSORTED_ACCORDION: AccordionData = {
  description: `Why choose one flavour when you can enjoy all five? The Blendify Guilt Free Iced Tea Assorted Pack is made for people who love variety, bold taste, and smarter sipping — without the sugar overload.

This refreshing iced tea brings together fruity, citrusy, tropical, and spicy flavours in convenient single-serve sachets you can enjoy anytime. Whether you need a morning pick-me-up, a post-workout cooler, or a mid-day refresher, this pack fits every mood.

Fortified with Vitamin C and Vitamin B Complex, and created for people seeking a healthy everyday drink. Light, flavourful, and ready in under 30 seconds.`,

  ingredients: [
    'Each 200ml glass has ~70 calories.',
    'Sorbitol',
    'Black Tea Extract',
    'Acidity Regulators (E330 & E296)',
    'Vitamin Premix (Vitamin B Complex & Vitamin C)',
    'Sucralose (no refined sugar)',
    'Nature Identical Flavouring Substances (guava, strawberry, lemon, blueberry, pineapple)',
  ],

  whatsInside: {
    intro: 'Each pack contains 5 sachets × 20g (100g total), one of each flavour:',
    items: [
      {
        flavour: 'Lemon',
        description: 'Bright, crisp and refreshing with a clean citrus finish. Great for everyday sipping or as an instant lemon iced tea at home.',
      },
      {
        flavour: 'Blueberry',
        description: 'Smooth tea notes blended with juicy berry flavour. Rich in natural blueberry taste — refreshing and full of personality.',
      },
      {
        flavour: 'Strawberry',
        description: 'Playful and familiar. Ripe strawberry flavour that tastes like summer — lighter and cleaner because it\'s tea-based, not syrup.',
      },
      {
        flavour: 'Pineapple',
        description: 'Tropical and punchy. Starts juicy, slightly tangy, and gives that holiday-in-a-glass vibe. The tea finish keeps it fresh and light.',
      },
      {
        flavour: 'Guava Chilli',
        description: 'Bold and adventurous. Juicy guava with a subtle chilli kick at the finish. For those who like their iced tea with a little heat.',
      },
    ],
  },

  differentiators: [
    '5 distinct iced tea flavours in one assorted pack',
    'Zero refined sugar',
    'Easy-to-use single-serve sachets — no measuring needed',
    'Fortified with Vitamin B Complex & Vitamin C',
    'Only ~70 calories per 200ml serving',
    'No artificial colours or preservatives',
    'Ready in under 30 seconds — just add cold water',
    'Better than sugary sodas or bottled iced teas',
    'Ideal for health-conscious refreshment seekers',
  ],

  howToMake: [
    'Tear open 1 sachet.',
    'Add to 200ml cold water.',
    'Stir or shake well for 10 seconds.',
    'Pour into your favourite glass.',
    'Add ice cubes and enjoy instantly.',
  ],

  faqs: [
    {
      q: 'Is this iced tea good for hydration?',
      a: 'Yes — it\'s designed as a light, refreshing drink. The electrolyte-friendly formula and low-calorie profile make it a smart alternative to sugary hydration drinks.',
    },
    {
      q: 'How many sachets are in a pack?',
      a: 'Each pack contains 5 sachets of 20g each (100g total). The assorted pack includes one sachet of each flavour: Lemon, Blueberry, Strawberry, Pineapple, and Guava Chilli.',
    },
    {
      q: 'Is the lemon flavour good for everyday use?',
      a: 'Absolutely. Many of our customers use it as their daily go-to drink. It\'s crisp, clean, and refreshing without being overpowering.',
    },
    {
      q: 'Is this a good summer beverage?',
      a: 'It\'s one of the best! Just tear, mix with cold water, and add ice. You\'re done in under 30 seconds — perfect for hot days.',
    },
    {
      q: 'Is this better than soft drinks?',
      a: 'Yes. Zero refined sugar, fortified with vitamins, and only ~70 calories per serving versus 140+ in most sodas. It\'s the smarter, more refreshing choice.',
    },
    {
      q: 'Does it contain any allergens?',
      a: 'The product is vegetarian, contains no nuts, and is made without gluten ingredients. Please check the ingredient list if you have specific sensitivities.',
    },
  ],
};

// ── Build per-flavour accordion (reuses shared structure with flavour-specific description) ──
function buildSingleFlavourAccordion(
  flavourName: string,
  description: string,
  howToMakeFlavourNote?: string
): AccordionData {
  return {
    description,
    ingredients: ASSORTED_ACCORDION.ingredients,
    whatsInside: {
      intro: `Each ${flavourName} pack contains 5 sachets × 20g (100g total):`,
      items: [
        {
          flavour: flavourName,
          description: `5 sachets of pure ${flavourName.toLowerCase()} flavour, made with black tea extract, no refined sugar, and enriched with Vitamin B Complex & C. Each sachet makes 200ml of ready-to-drink iced tea.`,
        },
      ],
    },
    differentiators: ASSORTED_ACCORDION.differentiators,
    howToMake: howToMakeFlavourNote
      ? [...ASSORTED_ACCORDION.howToMake.slice(0, -1), howToMakeFlavourNote]
      : ASSORTED_ACCORDION.howToMake,
    faqs: ASSORTED_ACCORDION.faqs,
  };
}

// ── Reviews (shared base, per-product counts come from products.ts) ──
// Distribution modelled on reference site (89%/11%/0%/0%/0% pattern)
function buildReviews(average: number, count: number): ReviewData {
  const fiveStarPct = Math.round((average - 1) / 4 * 100 * 0.88);
  const fourStarPct = 100 - fiveStarPct;
  return {
    average,
    count,
    distribution: [
      { stars: 5, count: Math.round(count * fiveStarPct / 100), pct: fiveStarPct },
      { stars: 4, count: Math.round(count * fourStarPct / 100), pct: fourStarPct },
      { stars: 3, count: 0, pct: 0 },
      { stars: 2, count: 0, pct: 0 },
      { stars: 1, count: 0, pct: 0 },
    ],
    items: [
      {
        id: 'rev-1',
        author: 'Priya Sharma',
        initials: 'PS',
        verified: true,
        date: 'Aug 2025',
        rating: 5,
        title: 'Absolutely love this!',
        body: 'Finally found a guilt-free iced tea that actually tastes amazing. The strawberry and lemon sachets are my morning ritual now. No sugar crash, no weird aftertaste — just pure refreshment. Will definitely reorder.',
      },
      {
        id: 'rev-2',
        author: 'Arjun Mehta',
        initials: 'AM',
        verified: true,
        date: 'Jul 2025',
        rating: 5,
        title: 'Game changer for summer',
        body: 'I replaced my afternoon soda habit with these iced teas and couldn\'t be happier. The guava chilli one has just the right amount of heat — it\'s addictive in the best way. Ordered the Pack of 8 and it\'s great value.',
      },
      {
        id: 'rev-3',
        author: 'Sneha Nair',
        initials: 'SN',
        verified: true,
        date: 'Jun 2025',
        rating: 4,
        title: 'Great taste, good value',
        body: 'The pineapple and blueberry are my favourites from the assorted pack. Mixing is super quick and the flavour is natural-tasting, not artificial at all. Would be perfect if the sachet was slightly easier to tear open.',
      },
      {
        id: 'rev-4',
        author: 'Rahul Verma',
        initials: 'RV',
        verified: true,
        date: 'May 2025',
        rating: 5,
        title: 'Perfect post-workout drink',
        body: 'Low calorie, great taste, and the vitamin boost is a nice bonus. Mixes instantly with cold water. This has become a staple in my gym bag. The lemon sachet is incredibly refreshing after a workout.',
      },
      {
        id: 'rev-5',
        author: 'Kavita Rao',
        initials: 'KR',
        verified: true,
        date: 'Apr 2025',
        rating: 5,
        title: 'Kids approved, mum approved',
        body: 'My teenage kids love these — no refined sugar means I feel good about letting them have one every day. The assorted pack is perfect for trying all flavours before committing to a single-flavour pack.',
      },
      {
        id: 'rev-6',
        author: 'Vikram Singh',
        initials: 'VS',
        verified: false,
        date: 'Mar 2025',
        rating: 4,
        title: 'Solid product, fast delivery',
        body: 'Good quality product. The blueberry is surprisingly good — rich flavour without being too sweet. Delivery was fast and packaging was secure. Good value for money.',
      },
    ],
  };
}

// ── SITE-WIDE FAQ ─────────────────────────────────────────────
export const SITE_WIDE_FAQS: FAQItem[] = [
  {
    q: 'How long does delivery take?',
    a: 'Orders are typically dispatched within 1–2 business days. Standard delivery across India takes 3–5 business days. Express delivery (1–2 days) is available in select cities at checkout.',
  },
  {
    q: 'Do you offer Cash on Delivery (COD)?',
    a: 'Yes, COD is available across most pincodes in India. A nominal COD handling fee may apply for orders below ₹499.',
  },
  {
    q: 'Are Blendify products 100% vegetarian?',
    a: 'Yes. All Blendify Guilt Free Iced Tea products are 100% vegetarian, contain no animal-derived ingredients, and are made without gluten-containing ingredients.',
  },
  {
    q: 'What is your return/refund policy?',
    a: 'We offer a 7-day return window from the date of delivery. If you receive a damaged or incorrect product, contact us at hello@blendify.coffee with your order ID and photos, and we\'ll resolve it within 48 hours.',
  },
  {
    q: 'Are the products tested for safety and quality?',
    a: 'Yes. All Blendify products are manufactured in FSSAI-certified facilities and undergo third-party lab testing for safety, nutritional accuracy, and quality before reaching you.',
  },
  {
    q: 'Can I track my order?',
    a: 'Yes. Once your order is dispatched, you\'ll receive a tracking link via email and SMS. You can also track your order at any time from the "Track Order" page on our website.',
  },
];

// ── Full profiles map ─────────────────────────────────────────
export const ICED_TEA_PROFILES: Record<string, IcedTeaProfile> = {
  'guilt-free-ice-tea-assorted': {
    slug: 'guilt-free-ice-tea-assorted',
    flavourFamily: ICED_TEA_FAMILY,
    packOptions: PACK_OPTIONS_399,
    offers: SHARED_OFFERS,
    accordion: ASSORTED_ACCORDION,
    reviews: buildReviews(4.9, 248),
  },
  'guilt-free-ice-tea-strawberry': {
    slug: 'guilt-free-ice-tea-strawberry',
    flavourFamily: ICED_TEA_FAMILY,
    packOptions: PACK_OPTIONS_399,
    offers: SHARED_OFFERS,
    accordion: buildSingleFlavourAccordion(
      'Strawberry',
      `Sweet, tangy, and totally guilt-free — Blendify Strawberry Iced Tea captures the luscious taste of ripe strawberries without any refined sugar. Enriched with Vitamin B Complex & C, it's the perfect fruity refresher for any time of day.

Ready in under 30 seconds: just mix one sachet with 200ml cold water, add ice, and enjoy.`
    ),
    reviews: buildReviews(4.9, 186),
  },
  'guilt-free-ice-tea-lemon': {
    slug: 'guilt-free-ice-tea-lemon',
    flavourFamily: ICED_TEA_FAMILY,
    packOptions: PACK_OPTIONS_399,
    offers: SHARED_OFFERS,
    accordion: buildSingleFlavourAccordion(
      'Lemon',
      `Bright, zesty lemon meets the goodness of Vitamin C enrichment. Blendify Lemon Iced Tea is your crisp everyday refresher — newly launched and already a crowd favourite. Zero refined sugar, just clean citrus refreshment.`
    ),
    reviews: buildReviews(4.8, 97),
  },
  'guilt-free-ice-tea-guava-chilli': {
    slug: 'guilt-free-ice-tea-guava-chilli',
    flavourFamily: ICED_TEA_FAMILY,
    packOptions: PACK_OPTIONS_399,
    offers: SHARED_OFFERS,
    accordion: buildSingleFlavourAccordion(
      'Guava Chilli',
      `For the adventurous palate — Blendify Guava Chilli Iced Tea combines the tropical sweetness of guava with a fiery chilli finish. Bold, unexpected, and completely addictive. A customer favourite that keeps selling out.`
    ),
    reviews: buildReviews(4.8, 134),
  },
  'guilt-free-ice-tea-pineapple': {
    slug: 'guilt-free-ice-tea-pineapple',
    flavourFamily: ICED_TEA_FAMILY,
    packOptions: PACK_OPTIONS_399,
    offers: SHARED_OFFERS,
    accordion: buildSingleFlavourAccordion(
      'Pineapple',
      `Close your eyes and taste the tropics. Blendify Pineapple Iced Tea brings the sweet, tangy flavour of fresh pineapple to your glass — completely guilt-free. The ultimate summer refresher.`
    ),
    reviews: buildReviews(4.7, 89),
  },
  'guilt-free-ice-tea-blueberry': {
    slug: 'guilt-free-ice-tea-blueberry',
    flavourFamily: ICED_TEA_FAMILY,
    packOptions: PACK_OPTIONS_399,
    offers: SHARED_OFFERS,
    accordion: buildSingleFlavourAccordion(
      'Blueberry',
      `Packed with the natural goodness of blueberries and rich antioxidants, Blendify Blueberry Iced Tea is both delicious and nutritious. A consistent top seller that our customers come back to again and again.`
    ),
    reviews: buildReviews(4.9, 217),
  },
  'guilt-free-ice-tea-peach': {
    slug: 'guilt-free-ice-tea-peach',
    flavourFamily: ICED_TEA_FAMILY,
    packOptions: PACK_OPTIONS_399,
    offers: SHARED_OFFERS,
    accordion: buildSingleFlavourAccordion(
      'Peach',
      `The delicate sweetness of ripe peaches, now in a refreshing iced tea format. Blendify Peach Iced Tea is freshly launched and already turning heads. No refined sugar, just natural peach perfection.`
    ),
    reviews: buildReviews(4.8, 72),
  },
  'guilt-free-ice-tea-mango': {
    slug: 'guilt-free-ice-tea-mango',
    flavourFamily: ICED_TEA_FAMILY,
    packOptions: PACK_OPTIONS_399,
    offers: SHARED_OFFERS,
    accordion: buildSingleFlavourAccordion(
      'Mango',
      `India's most beloved fruit, now in a guilt-free iced tea. Blendify Mango Iced Tea captures the authentic flavour of the king of fruits in every sip. Zero refined sugar. All the joy of mango season, year-round.`
    ),
    reviews: buildReviews(4.9, 303),
  },
  'guilt-free-ice-tea-passion-fruit': {
    slug: 'guilt-free-ice-tea-passion-fruit',
    flavourFamily: ICED_TEA_FAMILY,
    packOptions: PACK_OPTIONS_399,
    offers: SHARED_OFFERS,
    accordion: buildSingleFlavourAccordion(
      'Passion Fruit',
      `Discover the exotic taste of passion fruit in a refreshing iced tea format. Blendify Passion Fruit Iced Tea is your escape to the tropics — without any refined sugar. Vibrant, aromatic, and irresistible.`
    ),
    reviews: buildReviews(4.7, 58),
  },
  'guilt-free-ice-tea-cranberry': {
    slug: 'guilt-free-ice-tea-cranberry',
    flavourFamily: ICED_TEA_FAMILY,
    packOptions: PACK_OPTIONS_399,
    offers: SHARED_OFFERS,
    accordion: buildSingleFlavourAccordion(
      'Cranberry',
      `Packed with the natural tartness of cranberries and immune-supporting properties, Blendify Cranberry Iced Tea is the smart choice for health-conscious refreshment. Zero refined sugar, full of flavour.`
    ),
    reviews: buildReviews(4.8, 161),
  },
};

export function getIcedTeaProfile(slug: string): IcedTeaProfile | null {
  return ICED_TEA_PROFILES[slug] ?? null;
}
