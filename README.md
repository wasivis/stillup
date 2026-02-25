<div align="center">
  <h1>📡 StillUp</h1>
  <p><strong>Automated Uptime Monitoring & Status Tracking</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
    <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
    <img src="https://img.shields.io/badge/Cron_Job-444444?style=for-the-badge&logo=clockify&logoColor=white" />
  </p>
</div>

---

## 📖 Overview

StillUp is a lightweight, reliable service monitoring tool that ensures your web applications stay online. It provides automated status checks, historical uptime data, and a clean dashboard for developers to monitor their digital assets at a glance.

## ✨ Key Features

* **Automated 30-Minute Polling:** A background worker triggers every 30 minutes to ping registered URLs and log response codes.
* **Real-time Status Dashboard:** Visual indicators (Online/Offline) with timestamped history of the last successful check.
* **Response Time Tracking:** Measures and stores latency data to identify performance degradation over time.
* **Multi-User Monitoring:** Allows users to manage a personal watchlist of critical services.

## 🛠️ Technical Deep Dive



### 1. The Monitoring Engine
Built with Node.js, the engine performs asynchronous `HEAD` or `GET` requests to minimize bandwidth while accurately detecting server availability. It handles redirects, timeouts, and SSL errors gracefully to prevent false positives.

### 2. Scheduled Tasks (Cron)
StillUp utilizes **Vercel Cron Jobs** (or a similar scheduling layer) to maintain a consistent 30-minute heartbeat. This ensures the monitoring logic runs independently of user sessions.

### 3. Data Persistence & Trends
- **Database:** PostgreSQL stores a time-series log of every "ping" event.
- **Relational Logic:** Links uptime events to specific user-owned URLs, allowing for personalized "Uptime Percentage" calculations.
