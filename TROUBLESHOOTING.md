# Troubleshooting Guide

## Issue: 404 Error on Allaccess Login Page

If you're getting a 404 error when redirected to Allaccess, the endpoint URL might be incorrect.

### Solution Steps:

1. **Check Allaccess API Documentation**
   - Verify the correct login endpoint path
   - Common patterns:
     - `/auth/login`
     - `/sso/login`
     - `/api/auth/login`
     - `/login`

2. **Check Postman Collection**
   - Review the `@PRD Allaccess Collection (Brand).postman_collection.json` file
   - Find the correct endpoint for login/authentication
   - Update `server.js` with the correct endpoint

3. **Test Different Endpoints**
   - Visit: `http://localhost:3001/api/auth/test-endpoints`
   - This will show different URL patterns you can test manually

4. **Check Server Logs**
   - Look at the terminal where `npm run dev` is running
   - Check for error messages about which endpoints failed
   - The server will try multiple endpoint patterns automatically

5. **Verify Parameters**
   - The token format might need adjustment
   - Check if Allaccess expects parameters in:
     - Query string (current implementation)
     - Request body
     - Headers only

### Common Fixes:

**If the endpoint is `/sso/login` instead of `/auth/login`:**
```javascript
// In server.js, line ~150, change:
`${SSO_CONFIG.baseUrl}/auth/login?` 
// to:
`${SSO_CONFIG.baseUrl}/sso/login?`
```

**If parameters should be in the body:**
```javascript
// Instead of query string, use POST with body:
const response = await axios.post(
  `${SSO_CONFIG.baseUrl}/sso/login`,
  {
    client_id: SSO_CONFIG.clientId,
    redirect_url: SSO_CONFIG.redirectUrl,
    platform: SSO_CONFIG.platform,
    token: allaccessToken
  }
)
```

**If the token format is wrong:**
- Check Allaccess documentation for the correct token/signature format
- The current implementation uses HMAC-SHA256 with base64 encoding
- Verify the signature algorithm and payload structure

### Next Steps:

1. Contact Allaccess support with:
   - Your `client_id`
   - The error you're seeing
   - Request the correct endpoint URL and parameter format

2. Update `server.js` with the correct endpoint once confirmed

3. Test the flow again

