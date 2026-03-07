# Solcial API Documentation

Base URL: `https://solcial-backend.onrender.com/api` or `http://localhost:3000/api`

## Authentication

All endpoints except `/auth/*` and `/health` require JWT authentication.

**Header:**
```
Authorization: Bearer <jwt_token>
```

---

## Auth Endpoints

### POST /auth/signup
Create new account with automatic wallet creation.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "johndoe"
}
```

**Response:**
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "username": "johndoe",
    "walletAddress": "...",
    "emailVerified": false
  },
  "token": "jwt_token"
}
```

### POST /auth/signin
Sign in with email and password.

### POST /auth/verify-email
Verify email with 6-digit code.

### POST /auth/resend-code
Resend verification code.

### GET /auth/profile
Get current user profile (protected).

---

## Users Endpoints

### PUT /users/profile
Update user profile.

**Body:**
```json
{
  "name": "John Doe",
  "bio": "Software developer",
  "avatar": "https://..."
}
```

### GET /users/username/:username
Get user by username.

### GET /users/:id
Get user by ID.

### GET /users?q=search&limit=20
Search users by username or name.

---

## Posts Endpoints

### POST /posts
Create a new post.

**Body:**
```json
{
  "content": "Hello world!",
  "images": ["https://..."]
}
```

### GET /posts/feed?page=1&limit=20
Get feed of posts (paginated).

**Response:**
```json
[
  {
    "id": "...",
    "author": {
      "username": "johndoe",
      "name": "John Doe",
      "avatar": "..."
    },
    "content": "Hello world!",
    "images": [],
    "likesCount": 10,
    "commentsCount": 5,
    "isLiked": false,
    "createdAt": "2026-03-07T..."
  }
]
```

### GET /posts/user/:username?page=1&limit=20
Get posts by specific user.

### GET /posts/:id
Get single post by ID.

### DELETE /posts/:id
Delete own post.

### POST /posts/:id/like
Like a post.

### DELETE /posts/:id/like
Unlike a post.

### POST /posts/:id/comments
Create a comment on a post.

**Body:**
```json
{
  "content": "Great post!",
  "parentCommentId": "..." // optional, for replies
}
```

### GET /posts/:id/comments?page=1&limit=20
Get comments on a post.

### GET /posts/comments/:id/replies?page=1&limit=10
Get replies to a comment.

---

## Follows Endpoints

### POST /follows/:userId
Follow a user.

### DELETE /follows/:userId
Unfollow a user.

### GET /follows/followers?page=1&limit=20
Get current user's followers.

### GET /follows/followers/:userId?page=1&limit=20
Get specific user's followers.

### GET /follows/following?page=1&limit=20
Get current user's following list.

### GET /follows/following/:userId?page=1&limit=20
Get specific user's following list.

### GET /follows/check/:userId
Check if following a user.

**Response:**
```json
{
  "isFollowing": true
}
```

### GET /follows/stats/:userId
Get follow statistics.

**Response:**
```json
{
  "followersCount": 100,
  "followingCount": 50
}
```

---

## Wallet Endpoints

### GET /wallet/balance
Get wallet balance from Solana blockchain.

**Response:**
```json
{
  "walletAddress": "...",
  "balance": 2.5,
  "balanceLamports": 2500000000
}
```

### GET /wallet/transactions?page=1&limit=20
Get transaction history from Solana.

**Response:**
```json
[
  {
    "signature": "...",
    "type": "send",
    "amount": 0.5,
    "fromAddress": "...",
    "toAddress": "...",
    "status": "confirmed",
    "blockTime": "2026-03-07T...",
    "fee": 0.000005
  }
]
```

### POST /wallet/send
Send SOL to an address.

**Body:**
```json
{
  "toAddress": "wallet_address",
  "amount": 0.5,
  "memo": "Payment for services"
}
```

### GET /wallet/transactions/:signature
Get specific transaction details.

---

## Chats Endpoints

### POST /chats
Create or get existing chat with a user.

**Body:**
```json
{
  "participantId": "user_id"
}
```

### GET /chats
Get all user's chats.

**Response:**
```json
[
  {
    "id": "...",
    "otherParticipant": {
      "username": "johndoe",
      "name": "John Doe",
      "avatar": "..."
    },
    "lastMessage": "Hello!",
    "lastMessageAt": "2026-03-07T...",
    "lastMessageBy": {...}
  }
]
```

### GET /chats/:id/messages?page=1&limit=50
Get messages in a chat.

**Response:**
```json
[
  {
    "id": "...",
    "sender": {
      "username": "johndoe",
      "name": "John Doe",
      "avatar": "..."
    },
    "content": "Hello!",
    "type": "text",
    "isMine": false,
    "createdAt": "2026-03-07T..."
  }
]
```

### POST /chats/:id/messages
Send a message in a chat.

**Body:**
```json
{
  "content": "Hello!",
  "type": "text"
}
```

### POST /chats/:id/tip
Send a tip in a chat.

**Body:**
```json
{
  "amount": 0.1
}
```

**Response:**
```json
{
  "id": "...",
  "content": "Sent 0.1 SOL",
  "type": "payment",
  "paymentAmount": 0.1,
  "signature": "...",
  "isMine": true
}
```

### PUT /chats/:id/read
Mark all messages in a chat as read.

---

## Payments Endpoints

### POST /payments/send
Send payment by username or wallet address.

**Body:**
```json
{
  "recipient": "johndoe", // or wallet address
  "amount": 0.5,
  "memo": "Payment for services"
}
```

### GET /payments/history?page=1&limit=20
Get payment history.

### GET /payments/qr?amount=0.5
Generate payment QR code data.

**Response:**
```json
{
  "address": "wallet_address",
  "amount": 0.5,
  "label": "@johndoe",
  "message": "Payment to @johndoe"
}
```

### POST /payments/request
Request payment from a user.

**Body:**
```json
{
  "fromUsername": "johndoe",
  "amount": 0.5,
  "memo": "Payment request"
}
```

---

## Health Endpoints

### GET /health
Basic health check.

### GET /health/detailed
Detailed health check with system info.

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

Common status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Currently no rate limiting implemented. Consider adding in production.

## Pagination

Most list endpoints support pagination:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

## Notes

- All timestamps are in ISO 8601 format
- All amounts are in SOL (not lamports)
- Wallet operations use Solana devnet
- Chats are not real-time (polling required)
- Images should be uploaded to external service (URLs only)
