# Magnum x Lawless SSO Integration

Secure SSO integration with Allaccess API, including age verification and cross-domain authentication.

## Features

- ✅ Age verification popup (21+ requirement)
- ✅ Allaccess SSO integration
- ✅ Secure backend API (no secrets in frontend)
- ✅ JWT token generation for cross-domain redirect
- ✅ Vue3 frontend
- ✅ Express backend

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Allaccess SSO Configuration
ENV=Development
SSO_NAME=sso-magnum-lawless
SSO_SECRET_KEY=your_secret_key_here
SSO_CLIENT_ID=your_client_id_here
SSO_CLIENT_KEY=your_client_key_here
SSO_CLIENT_NAME=magnum_lawless_18022026
SSO_REDIRECT_URL=https://dev.magnum.id/
SSO_PLATFORM=magnum x lawless
SSO_DETAIL_PAGE=https://lawlessjakarta.com/

# Allaccess API Base URL
ALLACCESS_BASE_URL=https://allaccess.id

# JWT Secret for cross-domain token (use a strong random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 3. Run Development Server

```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Architecture

### Flow

1. User visits website → Age verification popup appears
2. User passes age verification (21+)
3. Frontend requests login URL from backend
4. Backend generates Allaccess token and returns login URL
5. User redirected to Allaccess SSO login
6. After login, Allaccess redirects back with `auth_data` or `code`
7. Backend validates `auth_data` using `/api/auth/check-data`
8. Backend creates secure JWT token
9. User redirected to `lawlessjakarta.com/?token=xxxxx`
10. External domain validates token via `/api/auth/verify-token`

### Security Features

- ✅ All secrets stored in backend environment variables
- ✅ JWT tokens with expiration (15 minutes)
- ✅ HMAC signature for Allaccess API calls
- ✅ CORS protection
- ✅ No sensitive data in frontend

## API Endpoints

### `GET /api/auth/login-url`
Generates Allaccess SSO login URL.

**Response:**
```json
{
  "success": true,
  "loginUrl": "https://allaccess.id/auth/login?..."
}
```

### `POST /api/auth/callback`
Handles SSO callback and validates auth_data.

**Request:**
```json
{
  "auth_data": "encrypted_auth_data",
  "code": "authorization_code"
}
```

**Response:**
```json
{
  "success": true,
  "redirectToken": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### `GET /api/auth/verify-token?token=xxxxx`
Verifies redirect token (for external domain).

**Response:**
```json
{
  "valid": true,
  "user": {
    "userId": "user_id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

## Production Deployment

1. **Rotate all credentials** - The credentials exposed in the initial request should be regenerated
2. **Use strong JWT_SECRET** - Generate a cryptographically secure random string
3. **Enable HTTPS** - All SSO redirects must use HTTPS
4. **Set up session storage** - Use Redis or database for session management
5. **Configure CORS** - Update CORS settings for production domains
6. **Environment variables** - Never commit `.env` file to version control

## Notes

- The Allaccess API endpoints may vary. Adjust the API calls in `server.js` based on actual Allaccess API documentation.
- Token validation endpoint should be accessible by `lawlessjakarta.com` backend for cross-domain verification.

