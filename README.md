# ShiftShield

**Predictive Parametric Micro-Insurance for Delivery Partners**

> We don't just detect rain. We detect whether the rain actually cost you money and we prove it using data the platforms already collect.

## Pitch Deck

[View ShiftShield Pitch Deck](https://drive.google.com/file/d/1IR0CAlN9mPBU786qDfKsMqLSKw55P9WC/view?usp=drivesdk)


---

## The Problem

Millions of gig delivery riders across India lose income every time heavy rain, flooding, bandh, or curfew disrupts their shifts. There is no insurance product from any startup, government scheme, or insurtech company that covers this. Existing solutions are either too slow (traditional claim-based insurance), too broad (city-level weather triggers), or completely absent (social disruption events).

The real pain is not just lost hourly wages. A rider who misses 3 deliveries during dinner rush loses their daily platform bonus which accounts for 30-40% of their daily income. No product today accounts for this.

## What We Are Building

A predictive, parametric micro-insurance platform that covers delivery partners before disruption hits not after.

Before a rider begins their evening shift, ShiftShield tells them:

_"Rain likely in your pincode during dinner rush. Your estimated loss including daily bonus = ₹420. Cover this shift for ₹5."_

One tap. If the disruption hits, money is in their account before the rain stops. No forms. No claims. No waiting.

## The Four Pillars

No startup, no government scheme, no insurtech company combines all four of these. We do.

### 1. Hyperlocal Pincode-Level Weather Triggers

Most parametric insurance products operate at city level. Rain in one neighborhood triggers payouts across the entire city inaccurate and expensive.

ShiftShield operates at **pincode-level granularity**. If Velachery floods but Adyar stays dry, only riders in Velachery get covered. This drastically reduces false payouts, lowers premiums, and builds rider trust because the system reflects what they actually experienced.

**Implementation plan:**

- Integrate a weather API (IMD / OpenWeatherMap) with pincode-level resolution
- Define rainfall and flood thresholds per pincode based on historical disruption patterns
- Build a real-time weather monitoring service that evaluates trigger conditions continuously during covered shift windows

### 2. App Activity Cross-Validation

Parametric insurance has a fraud problem if you only check weather, anyone can claim a payout whether they were working or not.

ShiftShield validates that the rider was **actually logged in and accepting orders** at the time of the disruption event. If you were offline or had the app closed, no payout triggers. Coverage is tied to active shift participation, not just location.

**Implementation plan:**

- Track rider app login status and order acceptance state during the coverage window
- Cross-reference disruption event timestamps with rider activity logs
- Implement a validation layer that requires both conditions (disruption event + active session) before any payout is approved

### 3. Platform Rank Drop as Income Proof

Traditional insurance requires riders to manually prove their income loss. Forms, screenshots, back-and-forth with adjusters. It does not work for a ₹5 premium product.

ShiftShield uses the **platform's own performance data** as claim evidence. If the delivery platform's system shows that a rider's completion rate, rank, or delivery count dropped during a weather event, that IS the proof. The platform already tracks this. We just read it.

**Implementation plan:**

- Build integrations to read rider performance metrics (rank, completion rate, delivery count) from platform APIs or exported data
- Establish baseline performance profiles per rider to detect statistically significant drops
- Automate the income-loss calculation by comparing actual shift performance against the rider's historical baseline for the same shift window

### 4. Social Disruption Coverage

Bandh. Curfew. Local strikes. Section 144. These events shut down delivery operations entirely and no insurance product in India covers them.

ShiftShield treats social disruption as a **first-class trigger category** alongside weather. If a verified bandh or curfew is declared in a rider's operating zone, coverage activates using the same parametric logic automatic, instant, no paperwork.

**Implementation plan:**

- Build a social disruption detection pipeline using news APIs, government alert feeds, and social media signals
- Define verification thresholds to confirm disruption events (multiple source corroboration before trigger activation)
- Map disruption events to affected pincodes and activate coverage for riders with active shifts in those zones

---

## Technical Architecture

```
Frontend (Next.js 15)          Backend (FastAPI)             Data Layer
─────────────────────          ─────────────────             ──────────
/app/page      ──── REST ────▶ POST /riders/register ──────▶ MongoDB Atlas
/app/shift                     GET  /riders/{id}
/app/claim     ◀─── JSON ───── POST /shifts/start
/app/quote                     GET  /shifts/active/{rider_id}
                               POST /claims/evaluate ────────▶ ML Pipeline
                               POST /premium/quote            OpenWeather API
```

## Tech Stack

| Layer    | Technology                                |
| -------- | ----------------------------------------- |
| Frontend | Next.js 15, TypeScript, Tailwind CSS v4   |
| Backend  | FastAPI, Python 3.11, Uvicorn             |
| Database | MongoDB (async via Motor)                 |
| ML       | scikit-learn 1.6.1, XGBoost 2.0.3, joblib |
| Weather  | OpenWeatherMap API (pincode-level)        |
| Auth     | Rider ID + localStorage (stateless)       |
| Deploy   | Render (backend), Vercel (frontend)       |

## ML Scoring Pipeline

Claims run through 5 sequential models before a decision is made:

```
Claim Input
    │
    ├─▶ M1: Weather Score        weather.joblib
    │       Rainfall intensity at rider's pincode
    │
    ├─▶ M2: App Activity         scoring_model.joblib
    │       Was the rider logged in and accepting orders?
    │
    ├─▶ M3: Rank Drop            m3_rank_model.joblib
    │       Did platform rank/completion rate fall?
    │
    ├─▶ M4: Shift Impact         shift_model.joblib
    │       How much did the disruption affect this shift?
    │
    └─▶ M5: Disruption Index     shiftshield_rf_calibrated.joblib
            Ensemble confidence score across all signals

        │
        ▼
    decision.py — APPROVED / PENDING / REJECTED
    Payout calculated: base_amount × disruption_multiplier
```

Each model outputs a binary signal (triggered / not triggered). `scoring.py` aggregates them into a `confidence_score`. If ≥ 3 signals fire AND confidence > threshold, the claim is approved automatically.

## API Reference

| Method | Endpoint                    | Description                        |
| ------ | --------------------------- | ---------------------------------- |
| POST   | `/riders/register`          | Register new rider                 |
| GET    | `/riders/{rider_id}`        | Fetch rider profile                |
| POST   | `/shifts/start`             | Start a shift (activates coverage) |
| POST   | `/shifts/end/{shift_id}`    | End active shift                   |
| GET    | `/shifts/active/{rider_id}` | Get current active shift           |
| POST   | `/claims/evaluate`          | Run ML pipeline on a shift         |
| POST   | `/premium/quote`            | Get premium quote                  |

## Local Development

```bash
# Backend
cd backend
py -3.11 -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 4000

# Frontend (separate terminal)
cd frontend
pnpm install                 # or: npm install
pnpm dev                     # runs on localhost:3000
```

Requires a `.env` in `backend/`:

```
MONGODB_URL=mongodb+srv://...
OPENWEATHER_API_KEY=...
```

## Deployment

- **Backend → Render**: `render.yaml` at repo root auto-configures the service. Add `MONGODB_URL` and `OPENWEATHER_API_KEY` as env vars in the Render dashboard.
- **Frontend → Vercel**: Set root directory to `frontend`, add `NEXT_PUBLIC_API_URL=https://your-render-url.onrender.com`.

---

## Team

_Guidewire DEVTrails 2026 — ZeroBias_

---
