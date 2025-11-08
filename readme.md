# 🪐 2D Metaverse Platform

A **browser-based 2D Metaverse** enabling real-time collaboration and interaction with:

🖥️ WebRTC-powered video conferencing  
💬 Live chat system  
📝 Interactive Excalidraw whiteboard  
🤖 AI-driven conversational agents powered by Gemini AI  
🎭 Dynamic avatar reactions  
🔗 Secure multi-tenant architecture with PostgreSQL persistence  
⚡ Low-latency WebSocket & HTTP backend for high availability  

Built using **Next.js, Node.js, WebSockets, PostgreSQL, and Docker**, this platform ensures scalable, fault-tolerant, and cross-platform performance.

---

## 🚀 Features

- 🎥 Real-time **video calls**, **chat messaging**, and **screen sharing**
- ✏️ Interactive **whiteboard** for collaborative drawing and planning
- 🤖 AI-enhanced avatars that **react and converse** with users
- 🗄️ Persistent data storage with **PostgreSQL**
- 🐳 Scalable microservices deployed using **Docker Compose**
- ⚡ **Low-latency communication** using WebSocket and HTTP protocols
- 🧩 Multi-tenant, secure architecture for multiple spaces/users

---

## 🎥 Demo Video

> ▶️ **Watch the full project walkthrough:**  
[![Watch the demo](https://img.youtube.com/vi/YOUR_VIDEO_ID/maxresdefault.jpg)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)

*(Click the image to watch on YouTube — or replace with Loom link if preferred.)*

> 💡 Tip: If your video is on Loom or Google Drive, replace the link accordingly.  
> Example: `[🎥 Watch Demo on Loom](https://www.loom.com/share/xyz123)`

---

## 📸 Screenshots

| Lobby View | Real-Time Collaboration | Video Call & Emoji Reactions |
|-------------|-------------------------|-------------------------------|
| ![Lobby](./metaverse/meta/apps/frontend/public/img1.png) | ![Image](./metaverse/meta/apps/frontend/public/img2.png) | ![Image](./metaverse/meta/apps/frontend/public/img3.png) |![Video](./metaverse/meta/apps/frontend/public/img3.png) |![Image](./metaverse/meta/apps/frontend/public/img4.png) |![Image](./metaverse/meta/apps/frontend/public/img5.png) |![Image](./metaverse/meta/apps/frontend/public/img6.png) |![Image](./metaverse/meta/apps/frontend/public/img7.png) | ![Video](https://drive.google.com/file/d/1f3qEucKRSz9y7dIgs1s9Hm6Y2U2ReqwH/view?usp=drive_link) 



> Add 3–5 of your best screenshots or animated GIFs inside `/assets` folder.  
> Use GIFs (`.gif`) to show small animations like avatar movement or emoji reactions.

---

## 🏗️ Architecture

| Service | Container | Role |
|----------|------------|------|
| **Frontend** | `sunnyrajput9198/meta-frontend` | Next.js UI, connects to WS & HTTP API |
| **HTTP API** | `sunnyrajput9198/meta-http` | Handles REST APIs, authentication, database queries |
| **WebSocket** | `sunnyrajput9198/meta-ws` | Real-time events: movement, chat, reactions |
| **Database** | PostgreSQL | Stores users, spaces, chat messages, avatar states |

---

## 🧠 Tech Stack

**Frontend:** Next.js, TailwindCSS, Zustand  
**Backend:** Node.js, WebSocket (ws), Express, Prisma  
**Database:** PostgreSQL  
**Infra:** Docker, Turborepo  
**AI:** Gemini API (LLM-based conversational agents)

---

## 💡 Highlights

- Built **real-time multiplayer world** with synchronized avatar movement and emoji reactions.  
- Integrated **LiveKit SFU** for scalable group video calls.  
- Designed **singleton RoomManager** for efficient state handling across distributed WebSocket clusters.  
- Achieved **<100ms latency** in event broadcasting through optimized message batching.  
- Fully containerized stack for easy scaling and CI/CD pipeline integration.

---