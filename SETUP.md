# Quick Setup Guide

## Environment Variables

Since `.env` files are protected, please create a `.env` file manually in the root directory with the following content:

```env
# Allaccess SSO Configuration
ENV=Development
SSO_NAME=sso-magnum-lawless
SSO_SECRET_KEY=5665111e3807dc422f222ab868e1e851b95290ef171978af336830a0c9
SSO_CLIENT_ID=7f39bc01a45539c843a2c991f6b5b66a-eg8MCw3UqMSmonM7qXyfcdJJmIOx1fpL.client.allaccess.id
SSO_CLIENT_KEY=c0570ba0eeeac25b903d4bccf4cd4f8d-76ePIWSXiLzIXjj0YNbV4kqZjmZSBPC7
SSO_CLIENT_NAME=magnum_lawless_18022026
SSO_REDIRECT_URL=http://localhost:3000
SSO_PLATFORM=magnum x lawless
SSO_DETAIL_PAGE=https://lawlessjakarta.com/

# Allaccess API Base URL
ALLACCESS_BASE_URL=https://allaccess.id

# JWT Secret for cross-domain token
JWT_SECRET=magnum-lawless-super-secret-jwt-key-2024-change-in-production

# Server Configuration
PORT=3001
NODE_ENV=development
```

## Important Security Note

⚠️ **The credentials above were exposed in the initial request. You should immediately:**
1. Contact Allaccess to rotate/regenerate `SSO_SECRET_KEY` and `SSO_CLIENT_KEY`
2. Update the `.env` file with new credentials
3. Never commit `.env` to version control

## Running the Application

```bash
npm run dev
```

This starts:
- Frontend (Vue3): http://localhost:3000
- Backend (Express): http://localhost:3001

## Testing the Flow

1. Open http://localhost:3000
2. Age verification popup appears
3. Select month and year (must be 21+)
4. Click "Konfirmasi"
5. You'll be redirected to Allaccess SSO login
6. After login, you'll be redirected back
7. Then redirected to lawlessjakarta.com with secure token

