# 🪐 2D Metaverse Platform

A browser-based **2D Metaverse platform** enabling **real-time collaboration** with:
- 🖥️ WebRTC-powered **video conferencing**
- 💬 Live **chat system**
- 📝 Interactive **Excalidraw whiteboard**
- 🤖 **AI-driven conversational agents** powered by **Gemini AI**
- 🎭 Dynamic **avatar reactions**
- 🔗 Secure **multi-tenant experiences** with **PostgreSQL persistence**
- ⚡ Low-latency **WebSocket & HTTP architecture** for high availability

Built with **Next.js, Node.js, WebSockets, PostgreSQL, and Docker**, this platform ensures scalable, fault-tolerant, and cross-platform performance.

---

## 🚀 Features
- Real-time **video calls**, **chat messaging**, and **screen sharing**
- **Interactive whiteboard** for collaborative drawing and planning
- **AI-enhanced avatars** that react and converse with users
- **Persistent data storage** using PostgreSQL
- Scalable microservices deployed with **Docker**
- **Low-latency communication** using WebSocket and HTTP protocols
- Multi-tenant, secure architecture for multiple spaces/users

---

## 🏗️ Architecture

| Service | Container | Role |
|---------|-----------|------|
| Frontend | `sunnyrajput9198/meta-frontend` | Next.js UI, connects to WS & HTTP API |
| HTTP API | `sunnyrajput9198/meta-http` | Handles REST APIs, auth, database |
| WebSocket | `sunnyrajput9198/meta-ws` | Real-time events: movement, chat, reactions |
| Database | PostgreSQL | Stores users, spaces, chat, avatar states |

---

