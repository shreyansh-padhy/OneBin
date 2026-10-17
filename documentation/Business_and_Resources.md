# OneBin: Business & Resources

## 1. Project Overview & Pitch
**OneBin** is an AI-powered waste classification and automated sorting system engineered for hackathon presentation and real-world deployment. By combining computer vision with the Google Gemini API, OneBin categorizes household and commercial waste items into three distinct streams:
- **Compost**
- **Recycling**
- **Trash**

### Core Business Pitch
Improper waste sorting leads to recycling batch contamination, organic waste in landfills generating methane, and massive financial penalties for municipalities and recycling facilities. OneBin automates point-of-disposal classification using intelligent visual recognition. Users simply present an item to a camera, and the system delivers instant, transparent classification with confidence scores and sorting rationale.

---

## 2. Team Structure & Responsibilities
The project is built by a two-person human engineering team:
1. **Model & CV Engineer**: Focuses on model training, fine-tuning, dataset curation, and computer vision pipelines.
2. **Architecture & Full-Stack Engineer**: Designs system architecture, multi-agent workflows, API integrations, and frontend deployment.

---

## 3. Technology Stack & Current Resources

| Component | Technology | Purpose |
|---|---|---|
| **Repository** | [GitHub](https://github.com/shreyansh-padhy/OneBin) | Source code management, version control, collaboration, and CI/CD triggers. |
| **Vision & Reasoning** | [Google Gemini API](https://ai.google.dev/) | Multimodal image understanding, zero-shot item categorization, contamination warnings, and sorting rationale. |
| **Frontend & Presentation** | [Vercel](https://vercel.com/) | Cloud hosting, frontend presentation layer, fast global CDN, and serverless API proxying. |
| **Baseline Machine Learning** | PyTorch / EfficientNetV2-S / Gradio | Local ML baseline and evaluation pipeline (`train.py`, `bins.py`, `app.py`) classifying across 10 fine-grained categories mapped to the 3 bins. |

---

## 4. Backend Database Scope Evaluation (Supabase) [Placeholder]

*Status: Under Scope Evaluation*

### Potential Use Cases for Supabase:
- **Disposal History & Telemetry**: Logging classification events, user scans, timestamps, and predicted waste categories.
- **Analytics & Metrics**: Aggregating diversion rates (% recycled vs. composted vs. trashed) to demonstrate impact during judging.
- **Dynamic Bin Configurations**: Storing municipality-specific sorting rules (e.g., whether specific plastics are recyclable locally) without requiring code redeployments.
- **User Authentication / Admin Dashboard**: Allowing facility managers or event organizers to monitor bin usage.

### Evaluation Criteria:
1. Does the hackathon MVP require persistent scan history and user profiles?
2. Can metrics be presented effectively client-side or via mock data if network latency is a risk during live demoing?
3. What is the implementation overhead vs. core Gemini vision features within the hackathon timeframe?

*Decision checkpoint will be scheduled prior to Phase 2 implementation.*
