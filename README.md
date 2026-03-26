# Contact Manager - Full Stack MERN Application

A professional and modern Contact Management Web Application built with the MERN stack (MongoDB, Express, React, Node.js).

## 🚀 Features

- **Authentication System**: Secure signup and login using JWT and bcrypt password hashing.
- **Contact Management**: Complete CRUD (Create, Read, Update, Delete) operations.
- **Advanced Search**: Filter contacts by name, email, or phone number with debounced search.
- **Pagination & Sorting**: Efficiently manage large lists of contacts.
- **CSV Export**: Export your entire contact list as a CSV file.
- **Personal Dashboard**: User-specific contacts with a clean, glassmorphic UI.
- **Dark/Light Mode**: Full theme support with system preference detection.
- **Responsive Design**: Mobile-friendly interface for managing contacts on the go.
- **Analytics**: Basic contact count summary on the dashboard.

## 🛠 Tech Stack

- **Frontend**: React (Vite), Axios, React Router, Lucide Icons, React Toastify.
- **Backend**: Node.js, Express.
- **Database**: MongoDB (Mongoose).
- **Security**: JWT (Secret-based), bcryptjs.

## 📦 Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository
`git clone <repository-url>`

### 2. Backend Setup
1. Navigate to the server folder: `cd server`
2. Install dependencies: `npm install`
3. Create a `.env` file and add your credentials:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```
4. Start the server: `npm run dev`

### 3. Frontend Setup
1. Navigate to the client folder: `cd client`
2. Install dependencies: `npm install`
3. Start the Vite dev server: `npm run dev`
4. Access the app at `http://localhost:5173`

## 📂 Project Structure

```text
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # Auth state management
│   │   ├── pages/       # Page components (Login, Dashboard, etc.)
│   │   ├── services/    # API communication (Axios)
│   │   └── App.jsx      # Main routing
├── server/              # Node.js backend
│   ├── config/          # DB connection
│   ├── controllers/     # Route logic
│   ├── middleware/      # Auth & Error handling
│   ├── models/          # Database schemas
│   ├── routes/          # API endpoints
│   └── index.js         # Entry point
```

## 🔐 Security Note
In production, ensure you use a strong `JWT_SECRET` and set `NODE_ENV=production`. Always keep your MongoDB URI private.
