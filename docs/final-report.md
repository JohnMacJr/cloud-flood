# Daily Flood: Cloud-Native Architecture Final Report

## 1. Executive Summary

Daily Flood is a modern, cloud-native web application designed as a daily puzzle game. Rather than a simple standalone frontend, it operates as a full-stack, distributed system demonstrating robust cloud computing principles. The project leverages managed hosting, secure authentication, serverless computing, managed NoSQL storage, and automated CI pipelines to deliver a scalable, highly secure, and cost-efficient application.

## 2. Cloud Architecture & Technology Stack

The application relies on a modular, decoupled architecture prioritizing serverless and fully managed infrastructure. For a comprehensive overview, refer to the [Architecture Document](architecture.md).

### 2.1 Frontend: Static Site Generation & Managed Hosting
- **Stack**: React, TypeScript, Vite, Tailwind CSS.
- **Hosting**: Deployed via **Firebase Hosting**. This provides global CDN distribution, automatic SSL certificate provisioning, and fast load times. The SPA (Single Page Application) is heavily decoupled from the backend logic.
- **Game Features**: A responsive 9×9 dynamic color-flood grid, utilizing deterministic seeded generation for universally identical daily challenges.

### 2.2 Identity & Privacy: Firebase Authentication
- **Service**: **Firebase Auth (Google Provider)**.
- **Implementation**: The application uses OAuth 2.0 to securely authenticate users via Google. However, to prioritize user privacy, Google names and profile photos are discarded. Instead, the application generates anonymous, collision-resistant nicknames stored securely in Firestore. 
- **Security**: Authentication directly integrates with Cloud Run and Firestore, allowing identity verification across both serverless endpoints and database rules via secure JWTs (JSON Web Tokens).

### 2.3 Database: Fully Managed NoSQL (Firestore)
- **Service**: **Cloud Firestore**.
- **Data Model**: The NoSQL schema is optimized for independent scaling of reads and writes:
  - `leaderboards/{dateKey}/scores/{uid}`: Indexed for real-time, global querying of today's top puzzle solvers.
  - `users/{uid}`: Private profiles tracking anonymous nicknames.
  - `users/{uid}/scores/{dateKey}`: Isolated historical statistics.

### 2.4 Serverless Backend Compute: Cloud Run
- **Service**: **Google Cloud Run**.
- **Implementation**: A containerized Node.js (Express + TypeScript) backend handles all authoritative writes. See the [Cloud Run Deployment Guide](cloud-run.md) for specifics.
- **Why Serverless?**: Cloud Run scales to zero during off-peak hours and scales automatically with concurrent traffic. This delivers a highly cost-efficient compute layer ideal for the bursty traffic profiles typical of "daily" challenge applications.

## 3. Security & Anti-Cheat Mechanisms

The most critical cloud engineering aspect of Daily Flood is its zero-trust security model. For an in-depth breakdown, see the [Security Plan](security-plan.md).

### 3.1 Server-Side Validation
Instead of trusting the client to report a "win," the frontend submits the user's raw move sequence to the Cloud Run API. The serverless backend:
1. Re-generates the deterministic 9×9 board seed.
2. Replays every move server-side.
3. Computes the validated score.
4. Prevents duplicate plays (enforcing a strict "one official play per UTC day" rule).

### 3.2 Database Protection
- **Firestore Security Rules**: All client-side writes are strictly **DENIED** (`allow write: if false`). 
- **Admin SDK**: The Cloud Run backend utilizes the Firebase Admin SDK combined with a least-privilege IAM service account (`roles/datastore.user`) to perform authoritative writes to Firestore on behalf of the user.

## 4. DevOps, CI/CD, & Observability

- **Continuous Integration**: Powered by **GitHub Actions**. Every push or pull request to the `main` branch triggers an automated CI workflow that validates formatting, executes unit tests, and verifies successful builds for both the React frontend and the Cloud Run Node.js API.
- **Logging & Observability**: **Google Cloud Logging** monitors the Cloud Run backend, providing structured logs of authentication attempts, duplicate score rejections, and server-side validation states without logging sensitive user PII or JWT payloads.

## 5. Conclusion

Daily Flood serves as a practical demonstration of modern cloud computing architectures. By combining scalable NoSQL storage with serverless event-driven validation, identity management, and automated pipelines, the application achieves a production-ready, highly secure posture while minimizing infrastructure management overhead and operating costs.
