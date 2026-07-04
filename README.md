# Debug App 🐛

An AI-powered differential debugger for competitive programming. Paste your buggy code alongside a correct solution and Debug automatically finds the failing test case, diagnoses the bug, and suggests a fix.

🔗 **Live Demo:** [debug-app-inky.vercel.app](https://debug-app-inky.vercel.app)

---

## Features

- 🔍 **Find Failing Test Cases** — AI generates adversarial edge-case inputs that expose bugs
- 🤖 **AI-Powered Diagnosis** — Pinpoints the exact line, root cause, and fix
- ⚡ **Run Single Tests** — Compare outputs of both codes on a custom input at the same place
- 🛡️ **Syntax & Runtime Detection** — Catches compile errors before wasting execution
- 💬 **AI Chat** — Context-aware chat assistant for every debugging session
- 📜 **Debug History** — All sessions saved for 3 months with full details
- 🌙 **Dark / Light Theme** — Clean developer-focused UI
- 📱 **Fully Responsive** — Works on mobile to desktop

---

## Tech Stack

**Frontend**
- React + Vite
- Bootstrap (responsive UI)
- Monaco Editor (VS Code-style code editor)
- Lucide React (icons)

**Backend**
- Node.js + Express
- PostgreSQL (Neon cloud)
- express-session + connect-pg-simple (session management)
- Passport.js (Google OAuth)
- Brevo (transactional email)

**AI & Execution**
- NVIDIA API — Nemotron (problem analysis + test generation)
- NVIDIA API — Llama 3.1 8B (syntax check + chat)
- NVIDIA API — Nemotron Super 49B (bug diagnosis)
- Judge0 (code execution, 3-level failover)
- OnlineCompiler.io (fallback executor)

**Deployment**
- Frontend: Vercel
- Backend: Render
- Database: Neon PostgreSQL

---

## How It Works

1. **Paste both codes** — your buggy code and a correct reference solution
2. **AI analyzes** — detects language, checks syntax, understands input format
3. **Test cases generated** — adversarial edge cases targeting the suspected bug
4. **Code executed** — both codes run against test cases via Judge0
5. **Bug diagnosed** — AI explains the exact issue with line numbers and fix

---

## Local Setup

### Prerequisites
- Node.js v18+
- PostgreSQL (local or Neon)
- NVIDIA API key (build.nvidia.com)
- Brevo API key (brevo.com)
- Google OAuth credentials (console.cloud.google.com)

### Backend Setup

```bash
# Clone the repo
git clone https://github.com/Deepak-0809/debug-app.git
cd debug-app/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Fill in your environment variables

# Run migrations
npm run migrate

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd debug-app/frontend

# Install dependencies
npm install

# Create .env.development
echo "VITE_API_URL=http://localhost:5000" > .env.development

# Start development server
npm run dev
```

---

## Environment Variables

### Backend `.env`

```env
PORT=5000
DB_HOST=your_neon_host
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
SESSION_SECRET=your_session_secret
MAIL_USER=your_gmail
BREVO_API_KEY=your_brevo_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
APP_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173
NVIDIA_API_KEY=your_nvidia_key
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
MODEL_REASONING=nvidia/nemotron-3-nano-30b-a3b
MODEL_FAST=meta/llama-3.1-8b-instruct
MODEL_DIAGNOSIS=nvidia/llama-3.3-nemotron-super-49b-v1
JUDGE0_BASE_URL=https://judge0-extra-ce1.p.rapidapi.com
JUDGE0_API_KEY=your_judge0_key
JUDGE0_API_HOST=judge0-extra-ce1.p.rapidapi.com
JUDGE0_FALLBACK_URL=https://ce.judge0.com
ONLINECOMPILER_BASE_URL=https://api.onlinecompiler.io
ONLINECOMPILER_API_KEY=your_onlinecompiler_key
RESEND_API_KEY=your_resend_key
NODE_ENV=development
```

### Frontend `.env.development`

```env
VITE_API_URL=http://localhost:5000
```

---

## API Routes

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/google` | Google OAuth |
| POST | `/api/auth/forgot-password` | Send OTP |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/reset-password` | Reset password |

### Debug
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/debug/run` | Full pipeline |
| POST | `/api/debug/run-single` | Single test |
| POST | `/api/debug/analyze` | Branch 1 only |
| POST | `/api/debug/syntax` | Branch 2a only |
| POST | `/api/debug/generate-tests` | Branch 2b only |
| POST | `/api/debug/execute` | Branch 2c only |
| POST | `/api/debug/diagnose` | Branch 3 only |

### Chat & History
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/chat` | AI chat message |
| GET | `/api/history` | Get all runs |
| GET | `/api/history/:runId` | Get run detail |

---

## Project Structure

```
debug-app/
├── backend/
│   ├── config/          — DB, logger, rate limiter, NVIDIA client, Judge0 client
│   ├── controllers/     — Auth, debug pipeline, chat, history logic
│   ├── middleware/      — Auth check, error handler
│   ├── migrations/      — Database schema
│   ├── models/          — User, run, test case, chat models
│   ├── routes/          — Auth, debug, chat, history routes
│   └── server.js        — Express app entry point
└── frontend/
    ├── src/
    │   ├── components/  — Navbar, CodeEditorPanel, ProtectedRoute
    │   ├── context/     — AuthContext, ThemeContext
    │   ├── pages/       — Login, Signup, Dashboard, History, etc.
    │   └── services/    — API call functions
    └── vite.config.js
```

---

## Author

**Deepak Reddy** — B.Tech Chemical Engineering, NIT Warangal  
GitHub: [github.com/Deepak-0809](https://github.com/DeepakReddy08K)  
Email: kondakindideepakreddy@gmail.com

---
