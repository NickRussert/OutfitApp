# 👗 Outfit App (MVP)

Mobile-first app for managing your closet and getting AI-ready outfit recommendations.  
Built with **Expo / React Native** for the frontend and **FastAPI + SQLite** for the backend.

---

## 🚀 Features (Current)
- **Closet tab**: Add, view, and delete clothing items.
- **Fit tab**: Pick an occasion, weather options, and get a recommended outfit from your closet.
- **Feed tab**: Placeholder for future global inspiration feed.

---

## 🛠 Tech Stack
**Frontend**:
- Expo Router (React Native)
- Zustand (state management)
- React Query (data fetching & caching)
- Expo Camera, Image Picker, Secure Store

**Backend**:
- FastAPI (Python)
- SQLModel + SQLite
- uvicorn for local dev

---

## 📦 Setup & Run

### 1️⃣ Backend
```bash
cd api
python -m venv .venv
. .venv/Scripts/activate  # Windows PowerShell
pip install --upgrade pip
pip install fastapi "uvicorn[standard]" sqlmodel python-multipart
uvicorn main:app --reload --port 8000
```
Backend will be available at:  
**http://127.0.0.1:8000**

---

### 2️⃣ Frontend
```bash
cd app
pnpm install
pnpm expo start
```
- Press **w** for web preview  
- Or scan QR in Expo Go (phone)

---

## 🗂 Project Structure
```
outfit-app/
│
├── api/                # FastAPI backend
│   ├── main.py
│   ├── models.py
│   ├── db.py
│   └── routers/
│
├── app/                # Expo React Native frontend
│   ├── (tabs)/         # Tab navigation
│   ├── _layout.tsx     # Root stack layout
│   └── index.tsx       # Redirects to /fit
│
├── README.md
└── .gitignore
```

---

## 📅 Roadmap (Pre-AI)
- Closet item **editing**, **filtering**, and color tags.
- Fit tab **save outfit** + history.
- Feed tab: local posts & image support.
- Image uploads with basic file serving (AI background removal later).
- API ready for AI integration.

---

## 🧠 AI Features (Coming Soon)
- Computer vision background removal for clothing images.
- Auto-label clothing items from images (e.g. “white t-shirt”).
- AI-powered outfit generation beyond hardcoded rules.
