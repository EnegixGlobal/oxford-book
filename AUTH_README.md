# Backend Authentication System

This project implements a complete authentication system with JWT tokens, role-based access control, and MongoDB integration.

## Features

- ✅ **Customer Signup** - Only customer registration allowed
- ✅ **Login** - Support for both Customer and Admin login
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Role-based Access Control** - Customer and Admin roles
- ✅ **MongoDB Integration** - User data stored in MongoDB
- ✅ **Input Validation** - Zod schema validation
- ✅ **Password Hashing** - bcrypt for secure password storage
- ✅ **Middleware** - Reusable authentication middleware

## Project Structure

```
├── models/
│   └── User.ts              # User model with Mongoose
├── middleware/
│   └── auth.ts              # JWT verification and role-based middleware
├── lib/
│   ├── mongodb.ts           # MongoDB connection utility
│   ├── validations.ts       # Zod validation schemas
│   └── seedAdmin.ts         # Admin user creation utility
└── app/api/
    ├── auth/
    │   ├── signup/          # Customer signup endpoint
    │   ├── login/           # Login endpoint (Customer & Admin)
    │   └── profile/         # Get user profile (authenticated)
    ├── admin/
    │   └── dashboard/       # Admin-only dashboard data
    └── seed/                # Create initial admin user
```

## Environment Variables

Make sure your `.env` file contains:

```env
MONGO_URI=mongodb+srv://your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

## API Endpoints

### 1. Customer Signup
**POST** `/api/auth/signup`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "phone": "+91 9876543210",
  "address": "123 Main St, Mumbai"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer account created successfully",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "phone": "+91 9876543210",
    "address": "123 Main St, Mumbai",
    "joinDate": "2025-09-08T...",
    "isActive": true
  }
}
```

### 2. Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

### 3. Get Profile
**GET** `/api/auth/profile`

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

### 4. Admin Dashboard
**GET** `/api/admin/dashboard`

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "message": "Admin dashboard data retrieved successfully",
  "data": {
    "totalUsers": 150,
    "activeUsers": 145,
    "inactiveUsers": 5,
    "recentUsers": [...]
  }
}
```

### 5. Seed Admin User
**POST** `/api/seed`

Creates an initial admin user (development only).

**Response:**
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "admin": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@bookhaven.com",
    "role": "admin"
  }
}
```

## Usage Examples

### Frontend Integration

#### 1. Signup
```javascript
const signup = async (userData) => {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  return data;
};
```

#### 2. Login
```javascript
const login = async (credentials) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (data.success) {
    // Store token in localStorage or secure cookie
    localStorage.setItem('token', data.token);
  }

  return data;
};
```

#### 3. Authenticated Requests
```javascript
const getProfile = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch('/api/auth/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return data;
};
```

## Middleware Usage

### Protect Routes with Authentication

```typescript
import { requireAuth, requireAdmin, requireCustomer } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  // Require any authenticated user
  const authResult = await requireAuth(request);
  if (authResult) return authResult;

  // Your protected route logic here
}

// Admin-only route
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult) return authResult;

  // Admin-only logic here
}

// Customer-only route
export async function GET(request: NextRequest) {
  const authResult = await requireCustomer(request);
  if (authResult) return authResult;

  // Customer-only logic here
}
```

## Validation Rules

### Customer Signup
- **Name**: 2-50 characters, required
- **Email**: Valid email format, required, unique
- **Password**: 6+ characters, must contain uppercase, lowercase, and number
- **Phone**: Optional, valid phone format
- **Address**: Optional, max 500 characters

### Login
- **Email**: Valid email format, required
- **Password**: Required

## Security Features

- **Password Hashing**: bcrypt with salt rounds of 12
- **JWT Tokens**: 7-day expiration
- **Input Validation**: Zod schema validation
- **Role-based Access**: Customer and Admin roles
- **Token Verification**: Middleware for route protection
- **Error Handling**: Comprehensive error responses

## Development Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Create Admin User:**
   ```bash
   # In development, call the seed endpoint
   POST /api/seed
   ```

3. **Test Authentication:**
   - Signup a customer
   - Login with customer credentials
   - Access protected routes with JWT token
   - Try admin routes with customer token (should fail)
   - Login with admin credentials
   - Access admin routes

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [...] // Validation errors (if applicable)
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `409` - Conflict (duplicate email)
- `500` - Internal Server Error
