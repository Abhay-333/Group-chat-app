# Real-Time One-to-One & Group Chat Application

A full-stack MERN chat app with React, Node.js, Express, Socket.IO, MongoDB, and JWT authentication. It supports private conversations, group chats, realtime message delivery, chat history, typing indicators, read status, online presence, last seen, and message deletion.

## Tech Stack

- Frontend: React, Vite, Socket.IO Client, Axios, Lucide React
- Backend: Node.js, Express, Socket.IO, MongoDB, Mongoose
- Auth: JWT with bcrypt password hashing
- Database: MongoDB Atlas or local MongoDB

## Features

- User registration and login with JWT
- Search users and start one-to-one chats
- Create groups with multiple members
- Realtime room-based messaging with Socket.IO
- Persist private and group message history in MongoDB
- Message timestamps
- Typing indicators
- Read receipts
- Online and last-seen user status
- Message deletion for sender or hide-for-me for receivers

## Project Structure

```text
backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    socket/
frontend/
  src/
    api/
    components/
    context/
    socket/
```

## Local Setup

1. Install dependencies:

```bash
npm install
npm run install:all
```

2. Create backend environment file:

```bash
cp backend/.env.example backend/.env
```

3. Update `backend/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:5173
```

4. Optional frontend environment file:

```bash
cp frontend/.env.example frontend/.env
```

5. Run backend and frontend together:

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`, and backend runs at `http://localhost:5000`.

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/users?q=search`

### Chats

- `GET /api/chats`
- `POST /api/chats/private`
- `POST /api/chats/groups`
- `GET /api/chats/:chatId/messages`
- `POST /api/chats/:chatId/messages`
- `PATCH /api/chats/:chatId/read`
- `DELETE /api/chats/messages/:messageId`

## Socket.IO Events

### Client emits

- `chat:join`
- `message:send`
- `typing:start`
- `typing:stop`
- `message:read`

### Server emits

- `message:new`
- `typing:start`
- `typing:stop`
- `message:read`
- `user:online`
- `user:offline`

## Deployment

### Backend on Render

1. Create a new Web Service from the GitHub repository.
2. Set root directory to `backend`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables:
   - `PORT`
   - `MONGO_URI`
   - `JWT_SECRET`
   - `CLIENT_URL`

### Frontend on Vercel

1. Import the GitHub repository.
2. Set root directory to `frontend`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variables:
   - `VITE_API_URL=https://your-backend-url/api`
   - `VITE_SOCKET_URL=https://your-backend-url`

After deployment, update `CLIENT_URL` on the backend with the frontend live URL.

## Submission

- GitHub repository: add your GitHub repository link here.
- Live project link: add your deployed frontend link here.
