# Solcial Complete Implementation Plan

## Architecture Overview
- **Backend**: NestJS + MongoDB + Solana Web3.js
- **Frontend**: React Native + Expo + React Query
- **Blockchain**: Solana Devnet (custodial wallets)

## Phase 1: User Profile Module ✓
- [x] User schema with name, bio, avatar
- [x] Update profile endpoint
- [x] Get user by username/id
- [x] Upload avatar (base64 or URL)

## Phase 2: Social Features - Posts
- [ ] Post CRUD operations
- [ ] Like/Unlike posts
- [ ] Comment on posts
- [ ] Reply to comments
- [ ] Get feed (paginated)
- [ ] Get user posts
- [ ] Tokenize post (create SPL token)

## Phase 3: Social Features - Follows
- [ ] Follow/Unfollow users
- [ ] Get followers list
- [ ] Get following list
- [ ] Check if following

## Phase 4: Wallet & Transactions
- [ ] Get wallet balance (from Solana)
- [ ] Get transaction history (from Solana)
- [ ] Send SOL
- [ ] Request payment
- [ ] Transaction status tracking

## Phase 5: Payments & Tips
- [ ] Pay user by username
- [ ] Pay user by wallet address
- [ ] Tip in chat
- [ ] Payment requests
- [ ] QR code generation

## Phase 6: Chat System
- [ ] Create/Get chat
- [ ] Send message
- [ ] Get messages (paginated)
- [ ] Send payment in chat
- [ ] Tip button in chat
- [ ] Mark messages as read

## Phase 7: Mini Apps (Placeholder)
- [ ] Mini apps listing
- [ ] Launch mini app
- [ ] Mini app transactions

## Phase 8: Frontend Integration
- [ ] Profile screens
- [ ] Feed with posts
- [ ] Post creation
- [ ] Comments & replies
- [ ] Wallet screens
- [ ] Transaction history
- [ ] Chat screens
- [ ] Payment flows

## API Endpoints Structure

### Users
- GET /users/profile - Get current user
- PUT /users/profile - Update profile
- GET /users/:username - Get user by username
- POST /users/avatar - Upload avatar

### Posts
- POST /posts - Create post
- GET /posts/feed - Get feed
- GET /posts/:id - Get single post
- DELETE /posts/:id - Delete post
- POST /posts/:id/like - Like post
- DELETE /posts/:id/like - Unlike post
- POST /posts/:id/comments - Comment on post
- GET /posts/:id/comments - Get comments
- POST /posts/:id/tokenize - Tokenize post

### Comments
- POST /comments/:id/reply - Reply to comment
- GET /comments/:id/replies - Get replies
- POST /comments/:id/like - Like comment

### Follows
- POST /follows/:userId - Follow user
- DELETE /follows/:userId - Unfollow user
- GET /follows/followers - Get followers
- GET /follows/following - Get following

### Wallet
- GET /wallet/balance - Get balance
- GET /wallet/transactions - Get transaction history
- POST /wallet/send - Send SOL
- POST /wallet/request - Request payment

### Chats
- GET /chats - Get all chats
- POST /chats - Create chat
- GET /chats/:id/messages - Get messages
- POST /chats/:id/messages - Send message
- POST /chats/:id/tip - Send tip in chat

### Payments
- POST /payments/send - Send payment
- POST /payments/request - Request payment
- GET /payments/history - Payment history
