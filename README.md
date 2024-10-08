## Directory to repos of working projects

This repository consolidates all the projects and services developed for the CRCT application.
It is designed to provide a single location for review in the Radar Hackathon of our microservices and
web application architecture. Each service remains modular to facilitate independent development and deployment,
yet together they form the backbone of the CRCT platform.

## 🔗 Directory to Repos of Working Projects

This section provides direct links to individual repositories within this monorepo for easy access and navigation:

### **Frontend**

- [Web Application](https://github.com/squint-sol/Extended-Blinks) – Next.js-powered web app serving as the main interface for users.

### **Backend Services**

- [Service-Monitoring-SQDS](https://github.com/squint-sol/monitoring-service) – Monitors specific Solana blockchain events and triggers relevant actions.
- [Service-Monitoring-USDC](https://github.com/squint-sol/usdc-monitor) – Dedicated monitoring service for USDC transaction tracking.
- [Service-Action-Builder](https://github.com/squint-sol/Action-Builder-Service) – Constructs actionable Blinks (Blockchain Links) based on specified triggers.
- [Service-Notification-Telegram](https://github.com/squint-sol/telegramBot) – Telegram bot service for delivering notifications to customers.
- [API](https://github.com/squint-sol/api) – Centralized API for managing user preferences and system interactions.

## Brief Overview

The CRCT Application is a sophisticated monitor that is leveraging a Next.js powered web app and then running services to support
customer actions in the backend to monitor blockchain events, support advanced and tailored Blink creation and delivery to the customer

Here you will find all the code consolidated into one place but we are largely following a microservices architecture and above linked to the working repos.

## 🛠️ Tech Stack

- **Frontend**: Next.js, Tailwind CSS, typescript
- **Backend**: FastAPI, Python, DynamoDB, vanilla javascript
- **Infrastructure**: AWS Lambda, Docker, Docker Compose, EC2, S3, Vercel, SQS
