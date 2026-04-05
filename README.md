# Smart Campus Operations Hub  
### IT3030 – Programming Applications & Frameworks (PAF) Assignment 2026  
### SLIIT – Faculty of Computing

This repository contains the group project for the **Smart Campus Operations Hub**, developed as part of the IT3030 PAF module (Semester 1 – 2026).

The system modernizes university operations by providing a unified platform for:

- Facilities & asset catalogue  
- Booking management  
- Maintenance & incident ticketing  
- Notifications  
- OAuth-based authentication & role management  

---

## 🚀 Tech Stack

### **Backend (Spring Boot)**
- Java 17  
- Spring Web  
- Spring Data JPA  
- Spring Security + OAuth 2.0 (Google Login)  
- MySQL / PostgreSQL  
- Maven  

### **Frontend (React)**
- React + Vite / CRA  
- Axios  
- React Router  
- Context API / Redux (optional)  

### **DevOps**
- GitHub Actions (CI pipeline)  
- GitHub Issues & Projects  

---

## 📦 Project Structure

```text
it3030-paf-2026-smart-campus/
│
├── backend/
│   ├── src/
│   ├── pom.xml
│   └── README.md
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── README.md
│
├── docs/
│   ├── architecture-diagrams/
│   ├── requirements/
│   ├── testing/
│   └── final-report/
│
├── .github/
│   └── workflows/
│       └── ci.yml   (GitHub Actions)
│
├── .gitignore
└── README.md
```

---

## 🧩 Core Modules

### **Module A – Facilities & Assets**
- Resource catalogue  
- Search & filtering  
- Availability & status  

### **Module B – Booking Management**
- Booking workflow: PENDING → APPROVED/REJECTED → CANCELLED  
- Conflict prevention  
- Admin review panel  

### **Module C – Incident Ticketing**
- Ticket creation with attachments  
- Technician assignment  
- Status workflow  
- Comments  

### **Module D – Notifications**
- Booking updates  
- Ticket updates  
- Comment notifications  

### **Module E – Authentication & Authorization**
- Google OAuth login  
- Roles: USER, ADMIN, TECHNICIAN  
- Protected routes & endpoints  

---

## 🧪 Testing
- JUnit tests  
- Integration tests  
- Postman collection  
- UI workflow screenshots  

---

## 👥 Team & Contributions
Each member implements at least **4 REST API endpoints** and corresponding UI components.  

|IT Number| Name | Role |
| :---| :--- | :--- |
| IT23256378 | Kalubowila K S U |... |
| IT23265806 | Navoda D G H | .... |
| IT23242340 | Perera N R S D | ... |
| IT23150102 | Hapugoda H K D S | ... |
---

## 📄 License
This project is for academic purposes only (SLIIT – IT3030 PAF 2026).
