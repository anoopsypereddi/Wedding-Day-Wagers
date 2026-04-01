-- ============================================================
-- Seed Data: Wedding Prediction Questions
-- Pick Your Side of the Aisle - Wedding Gambling Game
-- ============================================================

INSERT INTO questions (text, options, category, correct_answer_index, display_order, is_active)
VALUES

-- 1. Groom tears
(
    'Will the groom cry during the vows?',
    '["Absolutely — full waterworks", "Just a single dignified tear", "Eyes will glisten but he holds it together", "Dry-eyed and composed"]'::JSONB,
    'Ceremony',
    NULL,
    1,
    TRUE
),

-- 2. Longest speech
(
    'Who will give the longest speech?',
    '["The best man", "The maid of honor", "A proud parent", "The couple themselves"]'::JSONB,
    'Reception',
    NULL,
    2,
    TRUE
),

-- 3. Dance floor packed time
(
    'What time will the dance floor get packed?',
    '["Before 8 PM — this crowd needs no warm-up", "8–9 PM after dinner settles", "9–10 PM once the DJ turns it up", "After 10 PM — fashionably late"]'::JSONB,
    'Reception',
    NULL,
    3,
    TRUE
),

-- 4. Bouquet catch
(
    'Will someone catch the bouquet on the first throw?',
    '["Yes, a clean first-throw catch!", "It takes two throws to find a winner", "Three or more throws needed", "Bouquet hits the floor — no takers"]'::JSONB,
    'Traditions',
    NULL,
    4,
    TRUE
),

-- 5. Songs before full dance floor
(
    'How many songs will play before the dance floor is completely full?',
    '["1–2 songs — instant party", "3–4 songs", "5–7 songs", "8+ songs — a slow burn"]'::JSONB,
    'Reception',
    NULL,
    5,
    TRUE
),

-- 6. Rain on the wedding day
(
    'Will it rain on the wedding day?',
    '["Not a cloud in sight", "Overcast but dry", "A brief sprinkle — good luck!", "Full-on rain — embrace it"]'::JSONB,
    'Weather',
    NULL,
    6,
    TRUE
),

-- 7. Last guest on the dance floor
(
    'Who will be the last guest on the dance floor at the end of the night?',
    '["A groomsman going all out", "A bridesmaid who came to dance", "An unexpected relative surprising everyone", "The couple themselves closing it down", "A mystery guest nobody expected"]'::JSONB,
    'Reception',
    NULL,
    7,
    TRUE
);
