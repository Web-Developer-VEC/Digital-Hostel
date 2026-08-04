# Digital Hostel Management System

![Digital Hostel Banner](./assets/digital_hostel_banner.png)

<p align="center">
  <a href="https://react.dev/">
    <img src="https://img.shields.io/badge/React-v18.3-blue?style=for-the-badge&logo=react" alt="React" />
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/Node-v20-green?style=for-the-badge&logo=node.js" alt="Node" />
  </a>
  <a href="https://expressjs.com/">
    <img src="https://img.shields.io/badge/Express-v4.21-lightgrey?style=for-the-badge&logo=express" alt="Express" />
  </a>
  <a href="https://www.mongodb.com/">
    <img src="https://img.shields.io/badge/MongoDB-v6-green?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  </a>
  <a href="https://aws.amazon.com/s3/">
    <img src="https://img.shields.io/badge/AWS_S3-storage-orange?style=for-the-badge&logo=amazons3" alt="AWS S3" />
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License" />
  </a>
</p>

An enterprise-grade, role-based hostel management platform designed to automate operations, manage student outpasses via barcode checkout workflows, process hostel vacate forms, dynamically reallocate warden student batches, and track food preferences in real-time.

---

## 🗺️ Workflows & Architecture

### 1. Student Outpass Lifecycle
```mermaid
sequenceDiagram
    autonumber
    participant Student
    participant DB as MongoDB Database
    participant Warden as Assistant Warden
    participant Security

    Student->>DB: Submit Outpass / Leave / OD Request
    DB-->>Warden: Render on Warden dashboard queue
    Warden->>DB: Approve / Decline Decision
    DB-->>Student: Update Request Status (Dashboard / SMS)
    Note over Student, Security: If Approved, Student obtains QR Code / Barcode
    Student->>Security: Present Outpass Barcode at Gate
    Security->>DB: Scan & Match Check-In / Check-Out
```

### 2. Hostel Vacating & No-Due Flow
```mermaid
graph TD
    A[Student Profile] -->|Request Vacate| B(Warden Permission Check)
    B -->|Permission Granted| C[Student Submits Vacate Form]
    C -->|Review Request| D{Superior Warden Approval}
    D -->|Approved| E[Generate No Due Receipt Form]
    D -->|Declined| F[Reset Form State]
    E -->|Click Print| G[Print Clean 1-Page Receipt without Headers]
```

### 3. Warden Deactivation & Batch Reallocation
```mermaid
graph LR
    A[Warden Account Deactivated] --> B{Check assigned batches}
    B -->|Has primary_batch| C[Prompt batch reallocation]
    C -->|Select Active Warden| D[Transfer batch to active warden]
    D -->|Update Database| E[active_warden.primary_batch += batch]
    E -->|Write Log Entry| F[Warden logs: track status, batch & date]
```

---

## ✨ Features Breakdown

### 📱 Student Portal
- **Smart Outpass Form:** Dynamic date/time range validators enforcing IST timezone synchronization and checking checkout policies.
- **Unified Vacate Request:** Integrated workflow checks if the Warden has granted vacate permission, handles superior warden approvals, and allows printing a bordered No Due Form receipt with zero browser headers/footers.
- **Dynamic Food Preference:** Toggles food preferences between **Veg** and **Non-Veg**, updating mess projections instantly.

### 📋 Warden Portal
- **Live Approval Dashboard:** Process pending leave and food preference requests for assigned batches.
- **Mess Monitoring:** Consolidated counts of active diners categorized by year and gender.
- **Student Tracker:** View active student directory details and mark students as vacated.

### 👑 Superior Warden Portal
- **Warden Management:** Perform CRUD operations on wardens, upload optimized profile photos (Sharp conversion to WebP), and toggle active statuses.
- **Batch Reallocations:** Safely transfer students to active wardens on deactivation to prevent orphaned batches.
- **Real-Time Analytics:** Interactive Recharts charts detailing pass distributions, average return delays, and student attendance logs.

### 🛡️ Security Desk
- **Campus Gate System:** Quick barcode reader interface to log check-in and check-out events directly.

---

## ⚙️ Configuration & Environment Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Community Server

### Backend Configuration (`Backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017
DB_NAME=VEC

CLIENT_URL=http://localhost:3000
NODE_ENV=development

# AWS S3 Storage
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_aws_bucket_name
AWS_REGION=ap-south-1

# Express Session
SESSION_SECRET=your_long_session_secret_hash
```

### Frontend Configuration (`Frontend/.env`)
```env
REACT_APP_QR_URL=https://your_aws_bucket_name.s3.ap-south-1.amazonaws.com
REACT_APP_BASE_URL=http://localhost:5000
```

---

## 🛠️ Installation & Quickstart

### 1. Start the API Backend
```bash
cd Backend
npm install
npm start
```
Server runs at `http://localhost:5000`.

### 2. Start the Frontend Client
```bash
cd Frontend
npm install
npm start
```
Client runs at `http://localhost:3000`.

---

## 🔗 Key API Routes

### Authentication
- `POST /api/login` - Authenticate user session
- `POST /api/logout` - Clear user session

### Student Operations
- `POST /api/verify_student` - Verify student existence via mobile number
- `POST /api/submit_vacate_form` - Submit vacate request
- `POST /api/get_student_pass_by_passid` - Fetch pass details

### Warden Operations
- `GET /api/sidebar_warden` - Fetch session details for active warden
- `GET /api/fetch_passes_` - Retrieve student outpasses by date/year
- `POST /api/warden_decision` - Approve or reject outpass requests
- `POST /api/approve_food_change` - Handle food preference change approvals

### Superior Warden Operations
- `GET /api/fetch_warden_details` - Fetch list of wardens
- `POST /api/add_warden` - Create a new assistant warden profile
- `POST /api/update_warden_by_superior` - Edit warden details
- `POST /api/warden_inactive_status_handling` - Deactivate warden and reallocate student batches
- `POST /api/warden_active_status_handling` - Reactivate warden
- `GET /api/fetch_logs` - Fetch deactivation activity logs
- `GET /api/fetch_student_details_superior` - View student database records
- `POST /api/increment_student_year` - Promote student batches
- `POST /api/delete_student` - Remove student profile
