# OneBin Research — How Industrial Waste Sorting Actually Works

**Purpose:** Source material for the OneBin team's judge Q&A, pitch prep, and agent reference.
Every number below is manufacturer-published (TOMRA, Bühler, Key Technology, Satake, AMP,
Greyparrot, Steinert, Festo, Basler, SVS-Vistek, Specim, Teledyne DALSA datasheets) or
peer-reviewed, except where explicitly flagged as a secondary/trade estimate or unverifiable.
Prepared 2026-10-17 from two sourced research passes; full per-source notes live with the
team's Muse (research reports dated 2026-10-17/18).

---

## 1. The 30-second answer (if a judge asks "could this work at factory scale?")

> "One optical sorter moves 5 to 15 tons an hour at 90 to 99 percent purity, and a big recycling
> plant runs 20 to 50 tons an hour across several of them. The belt runs about 3 meters a second,
> roughly 10 feet every second. A line-scan camera reads every item, near-infrared reads the
> plastic's chemistry, and a bar of air jets with up to a few hundred nozzles fires each piece
> into the right chute. From scan to ejection is about 5 to 30 milliseconds, and most of that is
> the belt carrying the item to the nozzles — the electronics take only about 1 to 3. Our phone
> model is the same idea, slowed down: photo, classify, decide. The factory version never lets
> the item stop moving."

## 2. Scale numbers (headline facts)

| Fact | Figure | Notes |
|---|---|---|
| Belt speed | ~2.5–4.5 m/s (typical 3 m/s); TOMRA AUTOSORT SPEEDAIR up to 6 m/s | Key VERYX belt width max 2,750 mm |
| Single optical sorter | **5–15 t/h** at **90–99% output purity** | Bühler SORTEX rated up to 40 t/h on some duties |
| Whole MRF (materials recovery facility) | **20–50 t/h** typical large plants | Salt Lake City: 35 t/h, 6–7 optical sorters; Montreal (Ricova/Lachine): 52 t/h, 12 sorters — top of the published range |
| Air ejection | Jet bars of **170–330 nozzles** (TOMRA AUTOSORT), pitch down to 6.25 mm; up to 2,000 actuations/min per bar | AMP reports >90 billion real items handled to date |
| AI vision add-ons | Greyparrot Analyzer: ~2,800 objects/min counted on live belts | Analytics layer, not the sorting control loop |
| Food-line extremes (for "how fast can classification get?") | TOMRA 5B: >500 items/sec berries; Sortex S UltraVision: 64 t/h rice; pistachio defect sorting by **impact acoustics** at ~40 nuts/sec, ~97% accuracy (peer-reviewed) | Shows classification, not mechanics, is the frontier |

## 3. How a line works

**Singulate → Sense → Classify → Track → Eject.**

1. **Singulate** — vibratory feeders and acceleration belts spread items into a single layer;
   overlapping items are the #1 cause of missed ejections.
2. **Sense** — a line-scan camera (with near-infrared) images a continuous ribbon, line by line.
3. **Classify** — software decides material + target, per object.
4. **Track** — a rotary belt encoder counts belt travel, so the system knows exactly when each
   tracked item passes the jet bar — even if belt speed changes.
5. **Eject** — an FPGA fires the right nozzles at the right encoder count. Fractions: glass,
   paper, cardboard, metals, film, rigid plastics by resin (PET/HDPE/PP/PS/PVC), e-waste,
   organics, wood, textiles, batteries, WEEE — roughly **12–16 fractions per plant** (TOMRA).

### Latency budget (corrected, measured pieces)

| Segment | Typical | Source type |
|---|---|---|
| Per-line exposure | 10–50 µs | exposure < 1/line-rate (line period at 80 kHz = 12.5 µs) |
| Preprocessing + inference (FPGA) | Sub-ms to <2 ms | Review-paper figures for FPGA food-sorting classifiers |
| **Electronics subtotal** | **≈1–3 ms** | Sum of camera→decision→valve-driver path |
| Valve response (ON+OFF) | **0.4–1.1 ms** (Festo MHJ9: ON 0.8 ms, OFF 0.4 ms @ 24 V, 4 bar) | Datasheet-verified |
| **Total scan-to-eject** | **≈5–30 ms** | **Mostly belt transit time**, not compute |
| Windows/PC scheduling jitter | 1–50 ms | Why a plain PC can **never** sit in the firing path |
| Greyparrot analytics loop | <60 ms/frame on an RTX 4060 | **Analytics loop — counters/quality, NOT the ejection loop** |

Key correction to casual claims: "sorting takes 5–30 ms" is belt physics. The electronics are
1–3 ms. The FPGA owns firing; the GPU/PC owns CNN inference and analytics.

## 4. Minimum hardware to keep latency low (the seven things)

A chain is only as fast as its slowest link. Minimum viable industrial set:

1. **Line-scan camera — the eye.**
   ≥2k pixels per line (Basler racer 2k: 2,048 px) at **20–80+ kHz line rate** (80 kHz Camera
   Link HS, 51 kHz GigE). Plus a **NIR/SWIR spectral sensor** for plastic chemistry (Specim
   FX17: 900–1,700 nm SWIR linescan). Frame cameras (30–120 fps) smear at belt speed.
2. **High-intensity LED line light — the strobe.**
   Must deliver usable exposure in **10–50 µs per line**, synchronized to the camera. Without
   it, speed = blur.
3. **Rotary belt encoder — the clock.**
   Firing delay is counted in belt distance. Speed changes (ramp, load) don't shift aim.
4. **FPGA — the reflex.**
   Deterministic sub-ms to <2 ms classification + firing. A standard PC's 1–50 ms scheduling
   jitter is disqualifying in the firing path.
5. **Industrial PC + soft PLC on EtherCAT — the brain and spine.**
   EtherCAT cycle times ~100 µs (1,000 I/O in 30 µs, distributed clocks <1 µs jitter). Runs
   CNN inference, tracking, and plant coordination.
6. **Fast solenoid air-jet manifold — the muscle.**
   Valves **<1 ms** response (Festo MHJ9 datasheet: ON 0.8 ms / OFF 0.4 ms, 5-billion-cycle
   life, 9.5 mm width). Arrays of 70–240+, pitch down to 6.25 mm.
7. **The compressor plant — the forgotten seventh component.**
   Oil-free screw compressor delivering **100–300+ scfm at 90–100 psi (6–8 bar)**, with dryer
   + coalescing filtration (ISO 8573-1 air quality) and a receiver tank. Compressor load
   ≈ **20–40 kW** dwarfs the sorter's own ~1.4–11 kVA draw. Wet/dirty air kills valves and
   nozzles.

**Facility supplies around the machine:** 3-phase power (e.g., Key VERYX 400/480 V, 60 A
3-phase; Steinert UniSort 5–9 kVA), singulation equipment, takeaway conveyors, IP54-class dust
protection and cooled enclosures (recycling halls are brutally dusty), mounting/steelwork,
safety guarding and e-stops.

Full minimum-hardware checklist (17 items: per-line exposure <50 µs; encoder resolution fine
enough that one count = a few mm; FPGA/real-time OS in firing path; valve pitch matched to
smallest target; compressor CFM sized to worst-case simultaneous firing; air quality to
ISO 8573-1; 3-phase + UPS for controls; etc.) is in the companion research report.

## 5. Sensing modalities — what each can and cannot do

| Modality | Detects | Speed | Industrial use | Limits |
|---|---|---|---|---|
| RGB vision | Color, shape, labels, objects | Camera fps | Everywhere | Cannot ID polymer; black plastic difficult |
| **NIR spectroscopy** | Polymer type (PET/HDPE/PP/PS/PVC), paper grades | Belt speed | TOMRA AUTOSORT standard | **Blind to carbon-black plastics** |
| SWIR / hyperspectral | Finer chemistry, moisture | Belt speed | Premium lines | Cost |
| Laser (LIBS / 3D) | Alloys, depth/shape | Fast | Scrap metal (Steinert) | Cost, eye safety |
| X-ray (XRT) | Density, atomic number | Belt speed | E-waste, mining, food contaminants | Shielding, regulation |
| Eddy current | Non-ferrous metals | Passive | Metals lines | No ID beyond metal/non-metal |
| Magnetic | Ferrous | Passive | First pass everywhere | — |
| AI camera analytics | Composition, brand, quality audit | ~2,800 obj/min (Greyparrot) | Retrofit analytics | Overlay, not primary sorter |
| **Acoustics** (impact sound) | Internal defects (pistachio case study) | ~40 nuts/sec/station | Niche food sorting | Per-product tuning, peer-reviewed ~97% |
| Weight / robotic pick | Mass; physical grasp | ~80 picks/min (AMP class) | Final QC, problem items | Far slower than jets |

## 6. What our phone demo can and cannot claim (pitch honesty)

- **DO say:** same architecture as a plant (sense → classify → decide → actuate), scaled down;
  on-device inference, municipality rules, telemetry.
- **DO NOT claim** polymer-type identification from a phone photo — RGB cannot do it; industry
  needs NIR. Carbon-black plastic defeats even standard NIR; surfacing that fact unprompted
  reads as expertise.
- Throughput honesty: phone = seconds per item; jet line = thousands of items/minute. The gap
  is mechanics (singulation, tracking, air), not model quality.
- If asked about our roadmap to scale: same classifier core, swap the sensor (add NIR), the
  clock (encoder), the reflex (FPGA), and the actuator (jet bar) — Section 4 is the shopping list.

## 7. Judge Q&A (short forms)

- **"How accurate are factory systems?"** 90–99% purity per pass; plants stack passes for
  higher grades. Our model should be quoted with its own measured confidence behavior, not
  factory numbers.
- **"Why not just use bigger AI models?"** Inference isn't the bottleneck — belt transit is
  80%+ of scan-to-eject time. Determinism (FPGA) beats model size in the firing loop.
- **"What breaks first at scale?"** Singulation (overlaps), air supply (pressure droop when
  many valves fire), and dirty optics — not the classifier.
- **"Black plastic?"** NIR is blind to carbon-black pigment; industry workarounds are
  mid-wave IR, laser, or digital watermarks. Nobody has fully solved it cheaply.
- **"Cost?"** Vendors don't publish line prices (could not verify from primary sources);
  trade-press figures exist but should not be quoted as fact.
- **"What's actually inside a TOMRA/Bühler sorter computer?"** Vendors don't publish internal
  compute specs. The most specific public statement found: Steinert lists "Industry PC,
  Soft PLC". Anyone claiming exact internal specs is guessing.

## 8. Scaling bridge: OneBin → facility

| Layer | OneBin today | Facility version |
|---|---|---|
| Sensor | Phone RGB camera | Line-scan RGB + NIR/SWIR at 20–80 kHz |
| Clock | Button press / frame | Belt encoder |
| Classifier | ONNX in browser (WASM) | CNN on industrial PC/GPU + FPGA firing |
| Rules | Municipality rules engine (Seattle SPU etc.) | Plant recipe per output contract |
| Actuator | Arduino-driven bin (Web Serial) | Air-jet bar, <1 ms valves, 6–8 bar plant air |
| Telemetry | Supabase scans + stage dashboard | Plant SCADA + analytics (Greyparrot-class) |

## 9. Could not verify (do not quote)

- Per-sorter or per-line **prices** — vendors publish none.
- Sorter-internal **compute hardware** specs (see Q&A above).
- Exact nozzle counts/response for every vendor — TOMRA/Festo figures above are the verified
  ones; treat other vendors' as ranges.

## 10. Principal sources

TOMRA AUTOSORT / SPEEDAIR product literature and plant case studies; Bühler SORTEX S range;
Key Technology VERYX; Steinert UniSort datasheets; Satake food sorters; AMP Robotics and
Greyparrot published figures; Festo MHJ9 valve datasheet; Basler racer line-scan datasheets;
Specim FX17; SVS-Vistek and Teledyne DALSA line-scan references; EtherCAT Technology Group
figures; peer-reviewed pistachio acoustic-sorting study. Full citations with URLs are in the
underlying research reports (kept by the team).
