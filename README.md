# MyRiteWallet Backend

MyRiteWallet is a digital Ajo/Esusu platform that provides savings and financial management features. This backend application powers the platform, handling user authentication, transaction processing, fraud detection, notifications, and more.

---

## **Features**
- **User Management**: Secure user authentication and role-based access control.
- **Savings and Transactions**: Manage savings plans, contributions, and withdrawals.
- **Fraud Detection**: Automated fraud detection and escalation workflows.
- **Notifications**: Real-time notifications via SMS and email.
- **Geolocation Services**: Geocoding and distance calculations for fraud detection and user tracking.
- **Logging and Monitoring**: Centralized logging with log rotation and error tracking.
- **Scheduled Jobs**: Automated tasks using cron jobs (e.g., reminders, cleanup).

---

## **Tech Stack**
- **Backend Framework**: [Express.js](https://expressjs.com/)
- **Database**: PostgreSQL with [Sequelize ORM](https://sequelize.org/)
- **Authentication**: [JWT](https://jwt.io/) for token-based authentication
- **Notifications**: [Africa's Talking](https://africastalking.com/) for SMS, [Nodemailer](https://nodemailer.com/) for email
- **Geolocation**: [OpenCage Geocoding API](https://opencagedata.com/) and [Geolib](https://github.com/manuelbieh/geolib)
- **Logging**: [Winston](https://github.com/winstonjs/winston) with daily log rotation
- **Testing**: [Jest](https://jestjs.io/) and [Supertest](https://github.com/visionmedia/supertest)

---

## **Getting Started**

### **Prerequisites**
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 13

### **Installation**
1. Clone the repository:
   ```bash
   git clone https://github.com/nextswitchio/myritewallet-backend.git
   cd myritewallet-backend
   ```
