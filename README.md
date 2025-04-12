
# 🚗 MoveInSync - Park & Ride

A backend system for managing metro rides, vehicle parking, and ride sharing, built for the **MoveInSync** project. This application provides APIs to handle user subscriptions, payments, dynamic pricing, vehicle and ride bookings, and integrates various features like Redis caching, JWT authentication, and the Hungarian Algorithm for optimal allocations.

---

## 🚀 Features

- ✅ **JWT-based Authentication**: Secure login and API access using industry-standard JSON Web Tokens (JWT).
- ⚡ **Redis Caching**: Integrated Redis caching to boost performance, achieving up to 3x faster response times.
- 🛡️ **Rate Limiting**: Implemented API rate limiting to prevent abuse and protect against DDoS attacks.
- 🧩 **Scalable style APIs**: Each API is independently structured, enabling easier scaling, team collaboration, and streamlined debugging.
- 🔐 **Centralized Error Handling**: All controllers use consistent `try-catch` blocks for clean, predictable error management.
- 💸 **Dynamic Pricing Engine**: Dynamic pricing logic in place for parking and ride bookings based on demand and availability.
- 🧱 **Robust Mongoose Schemas**: Comprehensive data models with all essential parameters ensure strong data integrity and validation.
- 📦 **Modular Codebase Architecture**: Cleanly separated concerns — from `server.js` to `routes`, `controllers`, `models`, and `middleware`.
- 🔄 **Flexible Cancellation & Modifications**: Users can easily cancel or modify their bookings based on policy.
- 🚗 **RFID & License Plate Integration**: License plate recognition and RFID-enabled entry/exit validation for a seamless parking experience.
- 🔀 **Multi-Modal Booking System**: Supports integrated bookings across parking, metro, and ride-sharing for enhanced commuter convenience.

---

## 📁 Project Structure

```
moveinsync-park-ride/
├── config/
│   └── redisClient.js
│
├── controllers/
│   ├── allocationController.js
│   ├── metroController.js
│   ├── notificationController.js
│   ├── parkingController.js
│   ├── paymentController.js
│   ├── rideController.js
│   ├── subscriptionController.js
│   ├── userController.js
│   └── vehicleController.js
│
├── middleware/
│   └── auth.js
│
├── models/
│   ├── metro/
│   │   ├── MetroSchedule.js
│   │   └── MetroStation.js
│   ├── parking/
│   │   ├── ParkingBooking.js
│   │   ├── ParkingSpot.js
│   │   └── ParkingStation.js
│   ├── payment/
│   │   ├── DynamicPricing.js
│   │   ├── Payment.js
│   │   └── Subscription.js
│   ├── ride/
│   │   ├── Driver.js
│   │   ├── RideBooking.js
│   │   ├── RidePool.js
│   │   └── RideVehicle.js
│   ├── system/
|   |   ├── Notification.js
│   |   └── SystemLog.js
│   └── user/
│       ├── User.js
│       └── Vehicle.js
│
├── public/
│
├── routes/
│   ├── allocationRoutes.js
│   ├── metroRoutes.js
│   ├── notificationRoutes.js
│   ├── parkingRoutes.js
│   ├── paymentRoutes.js
│   ├── rideRoutes.js
│   ├── subscriptionRoutes.js
│   ├── userRoutes.js
│   └── vehicleRoutes.js
│
├── services/
│
├── utils/
│   ├── helpers.js
│   └── hungarianAlgorithm.js
│
├── validation/
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js
```

---

## ⚙️ Environment Variables

Place these values in your `.env` file:

```
NODE_ENV=development
PORT=5000
MONGODB_URI="mongodb://localhost:27017/parkAndRideDB"
JWT_SECRET=Your_JWT_Secret_key
JWT_EXPIRE=30d
```

---

## 📦 Dependencies

> Installed via `npm install`

### Core

- **express** – Web framework
- **mongoose** – MongoDB ORM
- **dotenv** – Environment variable manager
- **jsonwebtoken** – For handling JWT-based authentication
- **bcrypt / bcryptjs** – Password hashing
- **cors** – CORS middleware
- **helmet** – Securing HTTP headers
- **morgan** – HTTP request logging
- **compression** – Response compression
- **xss-clean** – Input sanitization
- **express-rate-limit** – Rate limiting
- **uuid** – Unique identifiers
- **ioredis** – Redis client
- **qrcode** – QR code generation
- **munkres-js** – Hungarian Algorithm implementation (used in optimal allocation)

### Dev Dependencies

- **nodemon** – Hot-reloading during development

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Rudragupta-1/moveInSync-park-ride.git
cd moveInSync-park-ride
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a `.env` file

```bash
touch .env
# Add the env vars listed above
```

### 4. Run the server

```bash
# For development (with live reload)
npm run dev

# For production
npm start
```

