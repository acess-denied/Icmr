# ICMR STS 2026 — Architecture & Multi-Cloud Deployment Guide

## 1. Cloud Comparison: Cloudflare vs. Vercel vs. Railway

| Criteria | **Cloudflare (Workers + D1 + R2 + Pages)** | **Vercel** | **Railway / Docker** |
| :--- | :--- | :--- | :--- |
| **Recommendation** | ★ **BEST for ICMR STS 2026** | **Good for Frontend Only** | **Best for Monolith/Containers** |
| **Total Cost** | **$0 / Month (100% Free Tier)**<br>100k requests/day, 5GB SQLite D1, 10GB R2 storage | **Free for Hobby**<br>(Commercial limits apply; external DB needed) | **~$5 / Month**<br>($5 trial credit, then pay-as-you-go) |
| **Database Support** | **Built-in D1 (SQLite at the Edge)**<br>Zero config, 9-table schema auto-initialized | Requires external DB (Supabase, Neon, PlanetScale) | Real PostgreSQL or SQLite container volume |
| **File / Dossier Storage** | **Built-in R2 (S3 compatible)**<br>Stores raw Kubios screenshots & signed PDFs | Requires AWS S3 or Vercel Blob (paid add-on) | Container filesystem or AWS S3 |
| **Python PDF Engine** | Cloudflare Workers run JavaScript/V8 Isolates. PDF generated via client-side canvas or external microservice | Serverless functions (Node or Python separately) | **Runs both Node and Python natively** in Docker |
| **Edge Latency in India** | **Fastest (<20ms)**: Mumbai, Delhi, Bengaluru, Chennai, Hyderabad, Kolkata edge nodes | Fast CDN edge caching | US / EU servers (higher round-trip latency to India) |

---

## 2. Verdict: Is Railway or Vercel Better or Worse?

### Why Cloudflare is **Better** for this Research Study:
1. **Zero Recurring Budget**: Cloudflare provides Pages (unlimited bandwidth), Workers (Edge API), D1 (Relational Database), and R2 (Object Storage) within their generous free tier.
2. **Native Architecture**: The repo's backend (`phase1-cloudflare-worker`) and schema (`d1/schema.sql`) are already built specifically for Cloudflare D1 and R2.
3. **Low Latency Across India**: Cloudflare routes traffic to local edge data centers in India, ensuring fast response times for medical students submitting questionnaires on mobile data.

### When **Railway** is Better:
- If you want **everything running inside a single container** (the React portal, Express API, and Python ReportLab PDF service `generate_crf_pdf.py` all in one place without separate cloud services).
- We have provided `Dockerfile` and `railway.json` in the root directory so you can deploy to Railway in 1 click if you have a Railway account.

### When **Vercel** is Better:
- If you only want to host the React user interface and tablet signing portal with automated GitHub preview URLs.
- We have provided `vercel.json` in the root directory for 1-click Vercel deployment.

---

## 3. Automated Dependency Installation

Both `setup.sh` (Linux/macOS) and `setup.ps1` / `setup.bat` (Windows) now **automatically install all required dependencies before doing anything else**:

### On Linux / macOS (`setup.sh`):
1. Detects your package manager (`apt-get`, `dnf`, `pacman`, or `brew`).
2. If Node.js is missing or below version 18, it automatically installs Node.js 20 LTS via official NodeSource repositories.
3. Installs `python3`, `python3-pip`, `git`, `curl`, and `openssl`.
4. Runs `npm install` for both the root application and the Cloudflare Worker backend.
5. Installs Python PDF packages (`reportlab`, `pypdf`, `pillow`, `requests`).

### On Windows (`setup.bat` or `setup.ps1`):
1. Detects `winget` (Windows Package Manager built into Windows 10 & 11) or `choco`.
2. If Node.js is missing, it runs silent installation of `OpenJS.NodeJS.LTS`.
3. If neither package manager is found, it automatically downloads the official Node.js 20 LTS MSI installer and executes silent installation.
4. Refreshes the environment `PATH` immediately so no terminal restart is needed.
5. Runs `npm install` for root and backend worker.

---

## 4. How to Get Cloudflare Keys (Step-by-Step)

If you choose the Cloudflare deployment option:

### Method 1: Interactive Browser Login (Easiest — No Key Copying Needed!)
1. When prompted for `CLOUDFLARE_API_TOKEN`, simply **press ENTER**.
2. The setup script will execute `npx wrangler login`.
3. Your web browser will open to Cloudflare. Click **Allow** to authenticate Wrangler with your account.
4. The deployment will continue automatically!

### Method 2: Manual API Token (For CI/CD or Headless Servers)
1. Go to the Cloudflare API Tokens page: **[dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)**
2. Click **Create Token** -> scroll to **Create Custom Token** -> click **Get started**.
3. Set Token Name: `ICMR-STS-Deploy-Token`
4. Under **Permissions**, add these 4 permissions:
   - `Account` → `Workers D1 Storage` → `Edit`
   - `Account` → `Workers R2 Storage` → `Edit`
   - `Account` → `Cloudflare Pages` → `Edit`
   - `Account` → `Workers Scripts` → `Edit`
5. Under **Account Resources**, select `Include` → `All accounts` (or your account name).
6. Click **Continue to summary** → **Create Token**.
7. Copy the secret API token and paste it into the setup prompt.
