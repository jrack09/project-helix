-- ============================================================
-- 0008_seed_guides.sql — Essential GLP-1 companion guides
-- ============================================================
-- Inserted as draft so editors can review before publishing.
-- ============================================================

insert into public.guides (slug, title, subtitle, body_markdown, category, cover_emoji, ordinal, publication_status) values

(
  'what-is-a-glp1-medication',
  'What is a GLP-1 medication?',
  'Understanding how GLP-1 receptor agonists work and why they''re different from other weight-management approaches.',
  $body$
## What is a GLP-1 receptor agonist?

GLP-1 stands for **glucagon-like peptide-1** — a hormone your gut naturally releases after eating. GLP-1 medications mimic this hormone, amplifying signals your body already uses to regulate appetite and blood sugar.

These medications help by:

- **Slowing gastric emptying** — food moves through your stomach more slowly, so you feel full for longer after eating
- **Reducing appetite** — signals your brain that you have eaten enough, making it easier to eat smaller portions
- **Regulating blood sugar** — stimulates insulin release when blood glucose rises, and reduces glucagon (a hormone that raises blood sugar)

## Common GLP-1 medications

| Medication | Brand name(s) | How it's taken |
|---|---|---|
| Semaglutide | Wegovy, Ozempic | Weekly injection |
| Tirzepatide | Mounjaro, Zepbound | Weekly injection (also targets GIP) |
| Liraglutide | Saxenda | Daily injection |

**Tirzepatide** is technically a dual agonist — it targets both GLP-1 and GIP receptors. It works through a similar mechanism but may have a stronger effect on appetite and weight for some people.

## How is this different from dieting?

Traditional calorie restriction relies entirely on willpower. GLP-1 medications work at the hormonal level — they change the signals your brain receives about hunger and fullness. Many people describe a noticeable reduction in "food noise" (constant thoughts about food) within the first few weeks.

This is not a willpower shortcut. It is a tool that works alongside lifestyle changes — nutrition, movement, sleep, and stress management still matter significantly.

## What these medications are not

- They are not a cure for obesity or metabolic disease
- They do not replace the need for a healthy diet and regular movement
- They are not intended to be used indefinitely without prescriber guidance
- Results vary between individuals

## General information note

This guide provides general lifestyle information only. It is not medical advice. Always follow your prescriber's instructions and discuss any questions about your medication with your healthcare provider.
$body$,
  'getting_started', '💊', 1, 'draft'
),

(
  'your-first-week-what-to-expect',
  'Your first week — what to expect',
  'A realistic picture of the first seven days on a GLP-1 medication, including what''s normal and what to watch for.',
  $body$
## Starting your first week

The first week on a GLP-1 medication is often the most uncertain. Your body is adjusting to a new hormonal signal, and side effects — if they occur — are most likely to show up now. Understanding what is normal helps you stay on track.

## What many people notice in week 1

**Reduced appetite** — You may find that you feel full sooner than usual, or that food simply seems less appealing. This can feel strange at first, especially if you are used to larger portions.

**Mild nausea** — This is the most common side effect and tends to be mild in the first week at the starting dose. It is often worse after eating too quickly or eating fatty, rich foods.

**Fatigue** — Some people feel tired in the first few days. Your body is adjusting.

**No change in appetite** — Some people feel nothing at all in week one. This is also normal. The appetite-reducing effect typically becomes more noticeable as the dose increases over subsequent weeks.

## What to eat in week 1

Keep meals:
- **Small** — eat less than you think you need, even if you don't feel full yet
- **Low in fat** — fatty foods are harder to digest with slowed gastric emptying
- **Bland if nauseous** — plain rice, toast, crackers, and broth are good options
- **Eaten slowly** — take your time and stop at the first sign of fullness

Avoid:
- Large portions
- Greasy, fried, or very rich foods
- Eating right before bed
- Carbonated drinks (can worsen nausea and bloating)

## Hydration matters from day one

Drink water consistently throughout the day — aim for at least 1.5–2 litres. Nausea is often worsened by dehydration, and reduced food intake can mean less water from food sources.

## Injection day tips

- Inject on the same day each week (for weekly medications)
- Note any injection site reactions — mild redness or itching is common and normal
- Some people feel slightly worse the day of or after injection — plan lighter meals on that day

## When to contact your prescriber

- Severe or persistent vomiting (more than 2–3 days)
- Inability to keep fluids down
- Severe abdominal pain (not just mild discomfort)
- Signs of an allergic reaction (rash, swelling, difficulty breathing)

Contact your prescriber if anything concerns you. This guide is general information only — not medical advice.
$body$,
  'getting_started', '📅', 2, 'draft'
),

(
  'understanding-dose-escalation',
  'Understanding dose escalation',
  'Why your dose increases gradually over weeks or months, and what to expect at each stage.',
  $body$
## Why does my dose start low?

GLP-1 medications are always started at a low dose and increased slowly over several weeks or months. This is called **dose escalation** or **titration**.

The reason is straightforward: side effects (especially nausea and digestive discomfort) are much more common when the dose increases too quickly. Starting low gives your body time to adapt to the medication's effects.

## Typical escalation pattern

Escalation schedules vary by medication and by individual prescriber guidance. As a general illustration:

**Weekly semaglutide (e.g. Wegovy)**
- Starting dose: 0.25 mg weekly for 4 weeks
- Gradually increased every 4 weeks
- Maintenance dose: typically 2.4 mg weekly (reached around week 17–20)

**Weekly tirzepatide (e.g. Mounjaro / Zepbound)**
- Starting dose: 2.5 mg weekly for 4 weeks
- Increased by 2.5 mg every 4 weeks
- Maintenance dose: 5–15 mg weekly, as guided by your prescriber

**Daily liraglutide (e.g. Saxenda)**
- Starting dose: 0.6 mg daily for 1 week
- Increased by 0.6 mg each week
- Maintenance dose: typically 3.0 mg daily (reached around week 5)

> **Important:** These are general examples only. Follow your prescriber's specific instructions for your medication and dose.

## What happens when my dose increases?

Each time your dose goes up, you may experience a temporary return of mild side effects — particularly nausea. This is normal. Your body needs 1–2 weeks to adjust to each new dose level.

## What if I can't tolerate a dose increase?

Some people need to stay at a lower dose for longer before moving up. This is a normal part of the process. Discuss with your prescriber if you are struggling — dose escalation is not a race.

## Will I always be on the highest dose?

Not necessarily. The goal is to find the dose that gives you the right balance of effect and tolerability. Some people do well at a lower maintenance dose.

## General information note

Dosing schedules mentioned in this guide are general examples for educational purposes only. Always follow your prescriber's specific instructions. Do not adjust your dose without speaking with your healthcare provider.
$body$,
  'getting_started', '📈', 3, 'draft'
),

(
  'how-to-do-a-subcutaneous-injection',
  'How to do a subcutaneous injection',
  'A step-by-step walkthrough of the injection process, including site rotation and what to expect.',
  $body$
## What is a subcutaneous injection?

A subcutaneous injection delivers medication into the layer of fat just under the skin. It is not a deep muscle injection — the needle is short and the process is straightforward once you have done it a few times.

Most GLP-1 medications come in pre-filled auto-injector pens, which are designed to make self-injection as simple as possible.

## Injection sites

You can inject into three areas of your body:

1. **Abdomen** — at least 5 cm away from your belly button
2. **Front of the thighs** — the outer third of each thigh
3. **Back of the upper arms** — the fatty area at the back (easier with help or a mirror)

**Rotate your injection site** each week. Injecting into the same spot repeatedly can cause a lump of fatty tissue to build up (lipohypertrophy), which can affect how well the medication absorbs.

## Step-by-step guide

**Before you start:**
- Wash your hands thoroughly with soap and water
- Take your pen out of the fridge 30 minutes before injecting — room temperature is more comfortable
- Check the pen label matches your prescribed medication and dose
- Check the expiry date
- Inspect the medication — it should be clear and colourless

**The injection:**

1. Clean the injection site with an alcohol swab and let it dry completely (wet skin stings)
2. Remove the pen cap
3. If your pen requires a new needle, attach it now and remove the inner and outer needle caps
4. Prime the pen if required (your pharmacist or prescriber will show you this on your specific pen)
5. Press the pen firmly against your skin at the chosen site
6. Press the injection button and hold it down until you hear/feel a click
7. Keep the pen pressed against your skin for 5–10 seconds after clicking
8. Remove the pen and dispose of the needle in a sharps container

**After:**
- You may see a small red dot or a tiny drop of blood — this is normal
- Mild itching or redness at the site is common and usually resolves within a day or two
- Do not rub the site after injecting

## Common concerns

**"I can see a small bubble in the pen"** — this is normal and does not affect your dose.

**"The injection stung"** — letting the pen reach room temperature helps. Make sure the skin is fully dry after using an alcohol swab.

**"I'm not sure I injected properly"** — if you are unsure, do not inject a second dose. Contact your prescriber or pharmacist.

## Sharps disposal

Never put used needles in a regular bin. Use a designated sharps container, available from your pharmacy. When full, return it to your pharmacy for safe disposal.

## General information note

This guide provides general educational information. Always follow the specific instructions provided with your medication and by your prescriber or pharmacist. If you are unsure about any step, ask your pharmacist to walk you through your specific pen device.
$body$,
  'administration', '💉', 1, 'draft'
),

(
  'storing-your-medication',
  'Storing and handling your medication',
  'How to store your GLP-1 pen correctly to keep it effective, and what to do if you''re travelling.',
  $body$
## Why storage matters

GLP-1 medications are biological compounds that degrade if exposed to heat, light, or freezing temperatures. Improper storage can reduce the medication's effectiveness.

## Unopened pens (in the fridge)

Store unopened pens in the refrigerator at **2°C to 8°C**. Keep them:
- Away from the freezer compartment (freezing destroys the medication)
- Away from the back of the fridge (where it can get too cold)
- Out of direct light
- In their original carton

## In-use pens (at room temperature)

Once you have opened and used a pen, it can be stored at room temperature — up to **30°C** — for a period of time. General guidelines (check your specific product information):

| Medication | Room temperature storage after first use |
|---|---|
| Semaglutide pens | Up to 6 weeks |
| Tirzepatide pens | Up to 21 days |
| Liraglutide pens | Up to 30 days |

> Always check the storage instructions in your specific medication's product information leaflet or with your pharmacist — these can vary by brand and formulation.

## Signs that medication may be compromised

Do not use your pen if:
- The liquid appears cloudy, discoloured, or contains visible particles
- It has been frozen and thawed
- It has been exposed to temperatures above 30°C for an extended period
- It is past its expiry date

When in doubt, contact your pharmacist.

## Travelling with your medication

**Short trips (under 8 hours):** Keeping the pen at room temperature in a cool bag is usually sufficient.

**Flying:** Pack medication in your carry-on luggage — hold baggage can experience extreme temperatures. Carry your prescription or a letter from your prescriber in case you are questioned at security.

**Extended travel:** A portable medication cooler or travel medical fridge can keep your pen within the required temperature range on longer journeys.

**Crossing time zones:** If you use a weekly injection, a day's difference in timing is generally fine — your prescriber can advise if you are concerned.

## General information note

Storage guidelines vary by brand and formulation. Always read the product information leaflet included with your medication and confirm storage requirements with your pharmacist.
$body$,
  'administration', '🧊', 2, 'draft'
),

(
  'managing-nausea',
  'Managing nausea on a GLP-1',
  'Practical strategies for the most common side effect — including what helps, what to avoid, and when to seek help.',
  $body$
## Why does nausea happen?

Nausea is the most common side effect of GLP-1 medications, particularly in the first few weeks and after each dose increase. It happens because the medication slows the rate at which your stomach empties food into your small intestine.

The good news: for most people, nausea improves significantly within 2–4 weeks as their body adjusts. At each dose increase, mild nausea may return briefly before settling again.

## Practical strategies that help

### Eat smaller portions
This is the single most effective change you can make. Because your stomach empties more slowly, eating a full-sized meal can cause it to feel uncomfortably full — triggering nausea. Aim for half your usual portion and wait before deciding if you want more.

### Eat slowly
Put your fork down between bites. Eating too quickly overloads a slower-emptying stomach. Give your body time to send fullness signals.

### Avoid high-fat and high-sugar foods
Fatty foods take longest to leave the stomach. Fried food, creamy sauces, and greasy takeaways are the most common nausea triggers. Sugary foods can also worsen symptoms for some people.

### Time your meals around injections
Many people feel worse in the 24 hours after their weekly injection. Plan lighter, blander meals on injection day and the day after. Avoid large meals close to injection time.

### Stay upright after eating
Lying down after eating can worsen nausea. Wait at least 2 hours after a meal before lying down.

### Stay hydrated
Dehydration makes nausea worse. Sip water throughout the day — small, regular amounts are easier to manage than large glasses. Cold water or ice chips can help if you're feeling particularly nauseous.

### Ginger
Ginger has well-established evidence for reducing nausea. Options include:
- Ginger tea (fresh ginger steeped in hot water)
- Ginger chews or ginger biscuits
- Ginger ale (low sugar)

### Small, bland meals
When nausea is at its worst, fall back on simple, low-fat foods:
- Plain rice or pasta
- Toast with a small amount of nut butter or vegemite
- Plain crackers
- Banana or apple
- Broth-based soups

## What to avoid

- **Large meals** — the single biggest trigger
- **Greasy or fried foods** — significantly worsen gastric emptying symptoms
- **Eating while nauseous** — if you feel sick, wait until it passes
- **Carbonated drinks** — bloating worsens nausea
- **Alcohol** — irritates the stomach and worsens nausea

## When nausea is severe

Mild to moderate nausea that comes and goes is expected and manageable. However, contact your prescriber if:

- Nausea is severe and persistent (more than 2–3 days without improvement)
- You cannot keep any food or fluids down
- You are losing weight very rapidly due to inability to eat
- You experience severe abdominal pain alongside nausea

Do not adjust your dose or stop taking your medication without speaking with your prescriber first.

## General information note

This guide provides general lifestyle information only — not medical advice. Nausea management strategies vary between individuals. If symptoms are severe or concerning, contact your healthcare provider.
$body$,
  'side_effects', '🤢', 1, 'draft'
),

(
  'common-side-effects-explained',
  'Common side effects explained',
  'A plain-language guide to what side effects are common, which are temporary, and what warrants a call to your prescriber.',
  $body$
## Understanding side effects

Side effects are a normal part of starting any new medication. With GLP-1 medications, most side effects relate to the digestive system — a direct result of how the medication works (slowing gastric emptying and affecting gut hormones).

Most side effects are mild, occur early in treatment, and improve within a few weeks.

## Digestive side effects (very common)

### Nausea
The most frequently reported side effect. Usually mild to moderate, most common in the first 4–8 weeks and after each dose increase. See our dedicated [Managing nausea](/guides/managing-nausea) guide for strategies.

### Constipation
Because food moves through your system more slowly, constipation is common. Strategies that help:
- Increase fluid intake — aim for 2+ litres of water daily
- Eat more fibre: vegetables, legumes, wholegrains
- Stay physically active — even a daily walk helps gut motility
- If constipation is persistent, talk to your pharmacist about appropriate options

### Diarrhoea
Less common than constipation, but some people experience loose stools, particularly early in treatment. Usually resolves on its own. Staying hydrated is important.

### Bloating and gas
A side effect of slower gastric emptying. Eating smaller meals, avoiding carbonated drinks, and reducing foods that cause gas (cabbage, beans, onions) can help.

### Vomiting
Less common than nausea. If vomiting is severe or persistent, contact your prescriber.

### Heartburn / acid reflux
Slowed stomach emptying can worsen reflux in some people. Eating smaller meals, avoiding lying down after eating, and reducing acidic or spicy foods can help.

## Injection site reactions (common)

Mild redness, bruising, or itching at the injection site is normal and usually resolves within a day or two. Rotating injection sites helps prevent localised reactions. If you notice a hard lump or significant swelling at a site, discuss with your prescriber.

## Fatigue (less common)

Some people feel tired in the first few weeks. This often improves as your body adjusts. Ensure you are eating enough — significantly reduced calorie intake can contribute to fatigue.

## Headaches (less common)

Headaches in the early weeks are usually related to dehydration or reduced calorie intake rather than a direct drug effect. Ensure you are drinking enough water and eating regular small meals.

## Side effects that are uncommon but important to know about

### Gallstones
Rapid weight loss (from any cause) can increase the risk of gallstones. Symptoms include severe pain in the upper right abdomen, particularly after eating fatty foods. Contact your prescriber if you experience this.

### Pancreatitis (rare)
Severe, persistent abdominal pain that radiates to the back, accompanied by nausea and vomiting, could indicate pancreatitis. This is rare but serious. Seek medical attention promptly if you experience these symptoms.

### Thyroid concerns (rare)
Some GLP-1 medications carry a precautionary note about thyroid tumours based on animal studies. If you have a personal or family history of thyroid cancer or certain thyroid conditions, discuss this with your prescriber before starting treatment.

## Side effects checklist: when to contact your prescriber

Contact your prescriber if you experience:
- Severe or persistent vomiting
- Inability to keep fluids down
- Severe abdominal pain
- Signs of an allergic reaction (rash, swelling, difficulty breathing)
- Symptoms of low blood sugar (shakiness, sweating, confusion) — more relevant if you also take other diabetes medications
- Any new or concerning symptoms you are unsure about

## General information note

This guide provides general educational information only — not medical advice. Side effect experiences vary between individuals. Always discuss any concerns with your prescriber or pharmacist.
$body$,
  'side_effects', '⚠️', 2, 'draft'
),

(
  'what-to-eat-on-a-glp1',
  'What to eat on a GLP-1',
  'Practical food guidance to reduce side effects, support your health, and get the most from your medication.',
  $body$
## Why nutrition still matters

GLP-1 medications reduce appetite, but they do not choose what you eat. The quality of your food choices significantly affects how you feel on the medication, how well you manage side effects, and your long-term health outcomes.

With reduced appetite comes an important responsibility: making every bite count nutritionally.

## Prioritise protein

This is the most important dietary principle on a GLP-1 medication.

When you eat less overall, there is a risk of losing muscle mass alongside fat. Adequate protein intake helps preserve muscle. It also:
- Keeps you full longer
- Supports energy levels
- Reduces the risk of the "skinny fat" outcome (weight loss that is mostly muscle)

**General target:** Most people benefit from 1.2–1.6g of protein per kilogram of body weight per day. Discuss a specific target with a dietitian or your prescriber.

**Good protein sources:**
- Chicken, turkey, fish, eggs
- Greek yoghurt, cottage cheese
- Legumes (lentils, chickpeas, beans)
- Tofu and tempeh
- Protein smoothies (useful when appetite is very low)

## Focus on whole, minimally processed foods

With less room in your stomach, processed foods that are high in calories but low in nutrients become a poor trade-off. Prioritise:

- **Vegetables** — especially non-starchy vegetables (broccoli, spinach, zucchini, capsicum)
- **Fruit** — whole fruit rather than juice
- **Wholegrains** — oats, brown rice, quinoa, wholegrain bread
- **Healthy fats** — avocado, olive oil, nuts, seeds (in moderate amounts)

## Foods to limit or avoid

**High-fat foods** are the biggest trigger for nausea and digestive discomfort. The medication slows stomach emptying, and fatty foods take the longest to clear. Limit:
- Fried foods
- Creamy sauces and dressings
- Very fatty cuts of meat
- Fast food

**Sugary foods and drinks** provide calories without nutritional benefit and can worsen digestive symptoms. Limit:
- Sugary drinks (soft drinks, juices, energy drinks)
- Lollies, chocolate, pastries
- High-sugar cereals

**Alcohol** — many people find alcohol affects them differently on GLP-1 medications (lower tolerance, worse nausea). It also adds empty calories and can worsen dehydration.

## Meal structure tips

**Eat smaller, more frequent meals** rather than 2–3 large ones. Your stomach empties more slowly — smaller portions are easier to manage and reduce nausea risk.

**Eat slowly and stop at the first sign of fullness.** The fullness signal arrives faster than it used to. Overeating past fullness causes significant discomfort.

**Do not skip meals** even if you are not hungry. Consistent eating supports blood sugar stability and prevents excessive fatigue.

**Separate liquids from solids.** Drinking large amounts of liquid with meals can worsen bloating. Drink water between meals rather than with them.

## When appetite is very low

In weeks where nausea is significant or appetite is minimal:
- Prioritise liquid nutrition: protein shakes, smoothies, yoghurt, soup
- Small, frequent snacks over meals
- Focus on protein and hydration above all else
- Do not force yourself to eat large amounts — this worsens nausea

## Consider working with a dietitian

A registered dietitian experienced with GLP-1 medications can create a personalised eating plan that fits your preferences, health goals, and how you are tolerating the medication. This is worth considering if you find nutrition challenging.

## General information note

This guide provides general lifestyle information only — not medical advice and not a prescription diet plan. Individual nutritional needs vary. Consult a registered dietitian or your healthcare provider for personalised guidance.
$body$,
  'nutrition', '🥗', 1, 'draft'
),

(
  'staying-hydrated',
  'Staying hydrated on a GLP-1',
  'Why hydration is especially important on GLP-1 medications, and practical strategies to hit your daily fluid target.',
  $body$
## Why hydration matters more on a GLP-1

Hydration is important for everyone, but it becomes particularly important on GLP-1 medications for several reasons:

**Reduced food intake = less water from food.** A significant portion of daily fluid normally comes from food — fruits, vegetables, soups, yoghurt. When appetite is reduced, so is this hidden hydration source.

**Nausea and vomiting cause fluid loss.** If you are experiencing these side effects, you are losing fluids that need to be replaced.

**Constipation is worsened by dehydration.** GLP-1 medications commonly slow gut motility. Adequate fluid is essential to keep things moving.

**Dehydration itself causes nausea and fatigue** — which can be mistaken for (or worsen) medication side effects.

## How much to drink

A general starting point for most adults is **1.5–2 litres of fluids per day** (approximately 6–8 glasses). Your needs may be higher if you exercise, live in a warm climate, or are experiencing vomiting or diarrhoea.

A simple check: your urine should be pale yellow. Dark yellow or amber urine is a sign you need more fluids.

## What counts as hydration?

- **Water** — the best option
- **Herbal teas** — a good alternative to plain water
- **Diluted fruit juice** — fine in small amounts (avoid high-sugar versions)
- **Broth / soup** — excellent for hydration when appetite is low
- **Milk** — counts towards fluid intake and adds protein
- **Sparkling water** — hydrating, but carbonation can worsen bloating for some

**Does not count (or works against hydration):**
- **Alcohol** — a diuretic that causes net fluid loss
- **Large amounts of caffeine** — moderate coffee and tea are fine, but excessive amounts can contribute to fluid loss

## Practical strategies

**Start the day with water.** Drink a glass of water before your first meal — it sets a good tone for the day and helps with morning nausea.

**Carry a water bottle.** Having water visible and accessible is the simplest habit change that makes a measurable difference.

**Sip throughout the day rather than drinking large amounts at once.** Large volumes of liquid at once can worsen bloating and nausea. Small, regular sips are easier to manage.

**Drink between meals, not with them.** Large amounts of liquid during meals can worsen bloating and fullness. Try to hydrate between eating.

**Set reminders if you forget.** A phone alarm at regular intervals is a simple tool if you tend to go hours without drinking.

**Flavour your water** if plain water is unappealing. A slice of lemon, cucumber, or mint can make it more palatable without adding significant sugar.

## Signs of dehydration

- Dark urine
- Headache (often one of the first signs)
- Fatigue
- Dizziness, especially when standing
- Dry mouth
- Constipation worsening

If you are experiencing vomiting and cannot keep fluids down, contact your prescriber. Oral rehydration solutions (available at pharmacies) can help restore electrolytes if you have been vomiting.

## General information note

This guide provides general lifestyle information only — not medical advice. Individual fluid requirements vary based on body size, activity level, climate, and health status. Consult your healthcare provider if you have concerns about hydration or if you cannot keep fluids down.
$body$,
  'nutrition', '💧', 2, 'draft'
),

(
  'exercise-and-glp1-medications',
  'Exercise and GLP-1 medications',
  'How physical activity supports your treatment, what types of exercise to prioritise, and how to get started.',
  $body$
## Why exercise matters on a GLP-1

GLP-1 medications reduce appetite and support weight loss, but exercise makes the outcomes significantly better — both in the short and long term.

The key reason: **muscle preservation.** When you lose weight from any cause — diet, medication, or surgery — some of that loss is muscle unless you actively work to preserve it. Resistance exercise is the most effective way to maintain muscle while losing fat.

Exercise also:
- Improves insulin sensitivity (complementing the medication's mechanism)
- Supports mood and energy levels, which can dip during early treatment
- Improves cardiovascular health independently of weight
- Helps with constipation (physical activity stimulates gut motility)
- Supports long-term weight maintenance

## What type of exercise should I prioritise?

### Resistance training (strength training)
This is the most important type of exercise to incorporate while on a GLP-1 medication.

Resistance training includes:
- Lifting weights (at a gym or at home)
- Bodyweight exercises (push-ups, squats, lunges)
- Resistance band workouts
- Pilates-style strength work

**Aim for:** 2–3 sessions per week. You do not need to lift heavy — consistency and progressive challenge matter more than intensity.

### Walking
Walking is underrated. It is low-impact, accessible, supports gut health, and accumulates meaningful cardiovascular benefit. A 20–30 minute walk daily is a realistic goal for most people, regardless of fitness level.

### Cardiovascular exercise
Cycling, swimming, jogging, dancing, rowing — any sustained activity that raises your heart rate is beneficial. Aim for 150 minutes per week of moderate-intensity cardio, as a general target.

## Getting started if you are not currently active

Start small. A 10-minute walk is a legitimate starting point. Consistency over weeks matters more than any individual session.

Practical starting points:
- 3 x 10-minute walks per week, building to 5 x 30 minutes
- 2 sessions of bodyweight exercises (squats, wall push-ups, modified lunges)
- A beginner resistance band routine at home

If you have been inactive for a long time or have any health conditions, discuss an appropriate starting point with your prescriber before significantly increasing activity.

## Managing exercise around nausea

Nausea can make exercise feel difficult, particularly in the first weeks or after dose increases. Some strategies:

- **Exercise before eating** rather than after — a full, slow-emptying stomach worsens nausea during movement
- **Reduce intensity** when nausea is significant — a gentle walk is better than nothing
- **Avoid high-intensity exercise right after injection** — injection day is often the most challenging for some people
- **Stay well hydrated** before and during exercise

## Fuelling exercise with a reduced appetite

With lower appetite, it can be easy to under-eat for the demands of regular exercise. Ensure you:
- Eat enough protein (see the [nutrition guide](/guides/what-to-eat-on-a-glp1))
- Have a small snack containing protein and carbohydrate before longer or more intense sessions
- Refuel with protein after resistance training

## Tracking progress beyond the scale

Exercise does not always show up immediately on the scales — and that is fine. Muscle is denser than fat. Progress markers worth tracking alongside weight:
- How far you can walk without fatigue
- How many repetitions of an exercise you can complete
- Energy levels and sleep quality
- Waist and hip measurements
- How your clothes fit

## General information note

This guide provides general lifestyle information only — not medical advice. Exercise recommendations should be tailored to your individual health status and fitness level. Consult your prescriber or an exercise professional before starting a new exercise program, particularly if you have any health conditions.
$body$,
  'lifestyle', '🏃', 1, 'draft'
),

(
  'tracking-your-progress',
  'Tracking your progress',
  'What to measure, how often, and how to interpret the numbers — including why the scale doesn''t tell the whole story.',
  $body$
## Why tracking matters

Tracking creates objective data in a process that can feel very subjective week-to-week. Your weight can fluctuate significantly based on water retention, hormones, and what you ate the day before — making daily weigh-ins feel discouraging even when you are making real progress.

Regular, consistent tracking helps you see the actual trend over time, stay motivated, and identify patterns.

## What to track

### Body weight
- Weigh yourself at the **same time of day** (morning, before eating, after using the bathroom)
- Weigh yourself **weekly, not daily** — daily fluctuations of 1–2 kg are normal and tell you nothing meaningful
- Focus on the **trend over 4+ weeks**, not any single reading

### Body measurements
The scale does not capture changes in body composition — you can lose centimetres without losing kilograms, particularly if you are building muscle.

Useful measurements to take monthly:
- **Waist circumference** — measured at the narrowest point, or at your belly button
- **Hip circumference**
- **Waist-to-hip ratio** — an indicator of health risk that changes even when weight plateaus

### Energy and wellbeing
Track subjectively each week:
- Energy levels (1–10)
- Sleep quality
- Hunger levels throughout the day
- Mood

These metrics often improve significantly before the scale reflects meaningful change.

### Food and fluid intake
During the early weeks, logging your meals can be helpful to ensure you are eating enough protein and staying hydrated, even with reduced appetite. This does not need to be permanent — a few weeks of logging builds awareness.

## What you should not track obsessively

- **Daily weight** — too much noise, causes unnecessary stress
- **Calories burned** from exercise (fitness tracker estimates are notoriously inaccurate)

## Viora tracking features

Your Viora app is designed to integrate with your GLP-1 companion experience. You can track:
- Weekly weigh-ins with trend visualisation
- Waist measurements
- Nausea and side effect scores
- Hydration (daily fluid intake)
- Appetite levels
- Energy scores

These data points are surfaced as contextual prompts aligned with your drug companion timeline.

## Interpreting slow progress

A common concern: "I have been on the medication for 4 weeks and barely lost anything."

Some context:
- The first 4 weeks are typically at the lowest starting dose — meaningful appetite reduction often kicks in at higher doses
- The body takes time to respond to hormonal changes
- Medication efficacy varies between individuals — some people respond more strongly than others
- Weight loss is rarely linear — plateaus and slower weeks are normal

If you feel you are not responding to the medication after 3 months at the maintenance dose, discuss this with your prescriber.

## General information note

This guide provides general lifestyle information only — not medical advice. Tracking methods should be adapted to your individual needs and preferences. Discuss any concerns about your progress with your prescriber.
$body$,
  'lifestyle', '📊', 2, 'draft'
)

on conflict (slug) do nothing;
