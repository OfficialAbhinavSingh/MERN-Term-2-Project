# ShopKart

A full-stack e-commerce web application built with the MERN stack (MongoDB, Express, React, Node.js) for the Term 2 project submission.

## Features

- **Customer authentication**: register, login, session check, logout, change password. JWT-based sessions (httpOnly cookie + bearer token), passwords hashed with bcrypt.
- **Product catalog**: browse, search (debounced), filter by category, sort by price, product detail pages with live stock status.
- **Wishlist**: add/remove/toggle products, live count badge in the navbar, move items straight to the cart.
- **Shopping cart**: persistent per-customer cart, quantity stepper capped at available stock, free-shipping progress indicator.
- **Checkout & payments**: shipping address form with validation, Razorpay checkout integration, server-side HMAC-SHA256 payment signature verification, atomic stock decrement on successful payment.
- **Order tracking**: order history, order detail view with a live delivery status timeline (`PLACED` → `CONFIRMED` → `SHIPPED` → `DELIVERED`) and a demo status-progression control.

## Tech Stack

**Backend**: Node.js, Express 5, MongoDB with Mongoose, JWT + bcrypt, Razorpay SDK, Vitest + Supertest + mongodb-memory-server for tests.

**Frontend**: React 18, Vite, React Router, Axios, Context API for cart state, plain CSS.

## Project Structure

```
backend/
  config/        # DB connection, Razorpay client
  models/        # Customer, Product, Order schemas
  controllers/   # route handlers
  routes/        # Express routers
  middlewares/   # JWT auth middleware
  utils/         # token generation
  tests/         # Vitest + Supertest suites
  seedProducts.js

frontend/
  src/
    components/  # Navbar, Footer, ProductCard, CartItem, WishlistCard, ...
    pages/       # Login, Register, Home, Products, Cart, Checkout, Orders, ...
    context/      # CartContext
    services/    # Axios client
```

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
npm run seed            # populates the product catalog
npm run dev             # starts the API on http://localhost:8081
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL=http://localhost:8081
npm run dev             # starts the app on http://localhost:5173
```

### 3. Run backend tests

```bash
cd backend
npm test
```

## Environment Variables

**backend/.env**

| Variable | Description |
| --- | --- |
| `PORT` | Port the API listens on (default 8081) |
| `MONGO_URI` | MongoDB connection string (Atlas or local) |
| `JWT_SECRET` | Secret used to sign JWTs |
| `RAZORPAY_KEY_ID` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API key secret |

**frontend/.env**

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL of the backend API |
