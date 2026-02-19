import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import axios from 'axios'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.SSO_REDIRECT_URL || 'https://magnum.id',
  credentials: true
}))
app.use(express.json())

// Allaccess SSO Configuration
// IMPORTANT: redirect_url and platform must EXACTLY match what's registered in Allaccess CMS
const SSO_CONFIG = {
  name: process.env.SSO_NAME || 'sso-magnum-lawless-prd',
  secretKey: process.env.SSO_SECRET_KEY,
  clientId: process.env.SSO_CLIENT_ID,
  clientKey: process.env.SSO_CLIENT_KEY,
  clientName: process.env.SSO_CLIENT_NAME || 'magnum_lawless_18022026',
  // Production redirect_url: https://magnum.id/ (MUST include trailing slash and https)
  // Development redirect_url: https://dev.magnum.id/
  redirectUrl: process.env.SSO_REDIRECT_URL || 'https://magnum.id/',
  // Registered platform: magnum x lawless (must match exactly)
  platform: process.env.SSO_PLATFORM || 'magnum x lawless',
  detailPage: process.env.SSO_DETAIL_PAGE || 'https://lawlessjakarta.com/',
  baseUrl: process.env.ALLACCESS_BASE_URL || 'https://allaccess.id'
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'

/**
 * Get Allaccess token_code from /api/token/get
 * This is the correct first step according to Allaccess API
 */
async function getAllaccessTokenCode() {
  try {
    const response = await axios.post(
      `${SSO_CONFIG.baseUrl}/api/token/get`,
      {
        device_id: `server-${SSO_CONFIG.clientName}-dev`,
        device_type: 'web'
      },
      {
        headers: {
          'name': SSO_CONFIG.name,
          'secret_key': SSO_CONFIG.secretKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )
    
    // Response structure: { data: { token: { token_code: "..." } } }
    // Debug: log the response structure
    console.log('🔍 Debug - Response structure check:')
    console.log('   response.data exists:', !!response.data)
    console.log('   response.data.data exists:', !!(response.data && response.data.data))
    console.log('   response.data.data.token exists:', !!(response.data && response.data.data && response.data.data.token))
    console.log('   response.data.data.token.token_code exists:', !!(response.data && response.data.data && response.data.data.token && response.data.data.token.token_code))
    
    if (response.data && response.data.data && response.data.data.token && response.data.data.token.token_code) {
      const tokenCode = response.data.data.token.token_code
      console.log('✅ Successfully obtained token_code from /api/token/get')
      console.log(`   Token code: ${tokenCode.substring(0, 10)}...`)
      return tokenCode
    } else {
      console.error('❌ Invalid response from /api/token/get')
      console.error('   Full response:', JSON.stringify(response.data, null, 2))
      return null
    }
  } catch (error) {
    console.error('❌ Error getting token_code from /api/token/get:', error.response?.data || error.message)
    return null
  }
}

/**
 * Generate secure JWT token for cross-domain redirect
 */
function generateRedirectToken(userData) {
  return jwt.sign(
    {
      userId: userData.userId || userData.id,
      email: userData.email,
      name: userData.name,
      verified: true,
      timestamp: Date.now()
    },
    JWT_SECRET,
    { expiresIn: '15m' } // Token expires in 15 minutes
  )
}

/**
 * GET /api/auth/login-url
 * Generate Allaccess SSO login URL using correct API flow
 * 
 * Correct flow:
 * 1. POST /api/token/get → get token_code
 * 2. POST /api/auth/request-url → get login URL
 */
app.get('/api/auth/login-url', async (req, res) => {
  // IMPORTANT: Use the registered redirect_url from Allaccess CMS
  // For Production: https://magnum.id/ (MUST match exactly)
  // For Development: https://dev.magnum.id/ (MUST match exactly)
  // Do NOT use localhost or any other value - it must be the registered value
  const registeredRedirectUrl = SSO_CONFIG.redirectUrl || 'https://magnum.id/'
  
  try {
    // STEP 1: Get token_code from /api/token/get
    console.log('📝 Step 1: Getting token_code from /api/token/get...')
    const tokenCode = await getAllaccessTokenCode()
    
    if (!tokenCode) {
      return res.status(500).json({
        success: false,
        error: 'Failed to obtain token_code from Allaccess API',
        message: 'Could not authenticate with Allaccess. Please check your credentials.'
      })
    }
    
    // STEP 2: Request login URL from /api/auth/request-url
    console.log('📝 Step 2: Requesting login URL from /api/auth/request-url...')
    console.log(`🔍 Using redirect_url from config: "${registeredRedirectUrl}"`)
    console.log(`🔍 Environment: ${process.env.ENV || 'Not set'}`)
    console.log(`🔍 SSO_CONFIG.redirectUrl: "${SSO_CONFIG.redirectUrl}"`)
    
    const requestHeaders = {
      'allaccess-token': tokenCode,
      'client_id': SSO_CONFIG.clientId,
      'client_name': SSO_CONFIG.clientName,
      'client_key': SSO_CONFIG.clientKey,
      'Content-Type': 'application/json'
    }
    
    // Use the registered values from config (Production or Development)
    // Try different variations of redirect_url and platform
    // CMS might have slightly different values registered
    const baseRedirectUrl = registeredRedirectUrl
    const basePlatform = SSO_CONFIG.platform
    
    const variations = [
      {
        name: 'Primary (with trailing slash)',
        redirect_url: baseRedirectUrl.endsWith('/') ? baseRedirectUrl : baseRedirectUrl + '/',
        platform: basePlatform
      },
      {
        name: 'Without trailing slash',
        redirect_url: baseRedirectUrl.endsWith('/') ? baseRedirectUrl.slice(0, -1) : baseRedirectUrl,
        platform: basePlatform
      },
      {
        name: 'Platform: Capitalized',
        redirect_url: baseRedirectUrl.endsWith('/') ? baseRedirectUrl : baseRedirectUrl + '/',
        platform: basePlatform.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      },
      {
        name: 'Platform: All caps X',
        redirect_url: baseRedirectUrl.endsWith('/') ? baseRedirectUrl : baseRedirectUrl + '/',
        platform: basePlatform.replace(' x ', ' X ')
      },
      {
        name: 'Platform: Underscore',
        redirect_url: baseRedirectUrl.endsWith('/') ? baseRedirectUrl : baseRedirectUrl + '/',
        platform: basePlatform.replace(' x ', '_')
      }
    ]
    
    let lastError = null
    
    // Try each variation
    for (const variation of variations) {
      try {
        const requestBody = {
          redirect_url: variation.redirect_url,
          platform: variation.platform,
          first_page: 'login'
        }
        
        console.log(`🔍 Trying variation: ${variation.name}`)
        console.log(`   redirect_url: "${variation.redirect_url}"`)
        console.log(`   platform: "${variation.platform}"`)
        
        const response = await axios.post(
          `${SSO_CONFIG.baseUrl}/api/auth/request-url`,
          requestBody,
          {
            headers: requestHeaders,
            timeout: 10000
          }
        )
        
        // Check for response structure
        if (response.data && response.data.data && response.data.data.url) {
          const loginUrl = response.data.data.url
          console.log(`✅ Success! Variation "${variation.name}" worked!`)
          console.log(`   Login URL: ${loginUrl.substring(0, 50)}...`)
          
          return res.json({
            success: true,
            loginUrl
          })
        } else if (response.data && response.data.url) {
          // Alternative response structure
          const loginUrl = response.data.url
          console.log(`✅ Success! Variation "${variation.name}" worked!`)
          
          return res.json({
            success: true,
            loginUrl
          })
        }
      } catch (variationError) {
        const errorCode = variationError.response?.data?.error?.code
        if (errorCode !== 407) {
          // Different error, log and continue
          console.log(`   ❌ Variation failed with error ${errorCode}`)
        } else {
          console.log(`   ❌ Variation failed with 407 (value mismatch)`)
        }
        lastError = variationError
        continue
      }
    }
    
    // If all variations failed, throw the last error
    throw lastError || new Error('All variations failed')
    
    // This code should not be reached if variations work
    // But keeping it as fallback
    console.error('❌ All variations failed - no valid response received')
  } catch (error) {
    const errorData = error.response?.data
    const errorCode = errorData?.error?.code
    const errorMessage = errorData?.error?.message
    
    console.error('❌ Error generating login URL:')
    console.error(`   Status: ${error.response?.status}`)
    console.error(`   Error Code: ${errorCode}`)
    console.error(`   Error Message: ${errorMessage}`)
    
    if (errorCode === 407) {
      console.error('   🔴 ERROR 407: "Please provide correct body value!"')
      console.error('   💡 This means redirect_url or platform does NOT match CMS registration')
      console.error('   💡 Check:')
      console.error(`      - redirect_url sent: "${registeredRedirectUrl}"`)
      console.error(`      - platform sent: "${SSO_CONFIG.platform}"`)
      console.error('      - Must match EXACTLY (including http/https, trailing slash, exact string)')
      console.error('      - Contact Allaccess to verify registered values')
      console.error('   💡 Also check:')
      console.error('      - Platform string case sensitivity (magnum x lawless vs Magnum x Lawless)')
      console.error(`      - Try without trailing slash: ${registeredRedirectUrl.replace(/\/$/, '')}`)
      console.error('      - detail_page was removed - add back if needed')
      console.error(`   💡 Current environment: ${process.env.ENV || 'Not set'}`)
      console.error(`   💡 Using redirect_url from config: "${SSO_CONFIG.redirectUrl}"`)
    }
    
    console.error('   Full error response:', JSON.stringify(errorData, null, 2))
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate login URL',
      message: errorMessage || error.message,
      code: errorCode,
      details: errorData,
      troubleshooting: errorCode === 407 ? {
        issue: 'redirect_url or platform does not match CMS registration',
        sent: {
          redirect_url: SSO_CONFIG.redirectUrl,
          platform: SSO_CONFIG.platform
        },
        action: 'Contact Allaccess to verify the exact registered values'
      } : null
    })
  }
})

/**
 * POST /api/auth/callback
 * Handle SSO callback and validate auth_data
 */
app.post('/api/auth/callback', async (req, res) => {
  try {
    const { auth_data, code } = req.body
    
    if (!auth_data && !code) {
      return res.status(400).json({
        success: false,
        error: 'Missing auth_data or code'
      })
    }
    
    // Validate auth_data using Allaccess API
    // First get a fresh token_code
    console.log('📝 Getting token_code for validation...')
    const tokenCode = await getAllaccessTokenCode()
    
    if (!tokenCode) {
      return res.status(500).json({
        success: false,
        error: 'Failed to obtain token_code for validation'
      })
    }
    
    let userData = null
    
    if (auth_data) {
      // Validate auth_data using /api/auth/check-data
      console.log('📝 Validating auth_data...')
      const validationResponse = await axios.post(
        `${SSO_CONFIG.baseUrl}/api/auth/check-data`,
        {
          auth_data,
          client_id: SSO_CONFIG.clientId
        },
        {
          headers: {
            'allaccess-token': tokenCode,  // Use token_code as allaccess-token header
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )
      
      if (validationResponse.data && validationResponse.data.code === 200 && validationResponse.data.data) {
        userData = validationResponse.data.data.user || validationResponse.data.data
        console.log('✅ Successfully validated auth_data')
      }
    } else if (code) {
      // Exchange code for user data
      console.log('📝 Exchanging code for user data...')
      const tokenResponse = await axios.post(
        `${SSO_CONFIG.baseUrl}/api/auth/exchange-code`,
        {
          code,
          client_id: SSO_CONFIG.clientId,
          redirect_url: SSO_CONFIG.redirectUrl
        },
        {
          headers: {
            'allaccess-token': tokenCode,  // Use token_code as allaccess-token header
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )
      
      if (tokenResponse.data && tokenResponse.data.code === 200 && tokenResponse.data.data) {
        userData = tokenResponse.data.data.user || tokenResponse.data.data
        console.log('✅ Successfully exchanged code for user data')
      }
    }
    
    if (!userData) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication data'
      })
    }
    
    // Create local session (in production, use Redis or database)
    // For now, we'll just generate a secure token
    
    // Generate secure JWT token for cross-domain redirect
    const redirectToken = generateRedirectToken(userData)
    
    // Store session (in production, use Redis/database)
    // For demo purposes, we'll just return the token
    
    res.json({
      success: true,
      redirectToken,
      user: {
        id: userData.id || userData.userId,
        email: userData.email,
        name: userData.name
      }
    })
  } catch (error) {
    console.error('Callback error:', error.response?.data || error.message)
    
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: error.response?.data?.message || error.message
    })
  }
})

/**
 * GET /api/auth/verify-token
 * Verify redirect token (for lawlessjakarta.com backend)
 */
app.get('/api/auth/verify-token', (req, res) => {
  try {
    const token = req.query.token
    
    if (!token) {
      return res.status(400).json({
        valid: false,
        error: 'Missing token'
      })
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET)
    
    res.json({
      valid: true,
      user: {
        userId: decoded.userId,
        email: decoded.email,
        name: decoded.name
      }
    })
  } catch (error) {
    res.status(401).json({
      valid: false,
      error: 'Invalid or expired token'
    })
  }
})

/**
 * GET /api/auth/test-endpoints
 * Test different Allaccess endpoint patterns (for debugging)
 */
app.get('/api/auth/test-endpoints', async (req, res) => {
  const baseUrl = SSO_CONFIG.baseUrl
  
  // Generate tokens in different formats
  const tokens = {
    default: generateAllaccessToken('default'),
    without_key: generateAllaccessToken('without_key'),
    simple: generateAllaccessToken('simple')
  }
  
  const testUrls = []
  
  // Test URLs with different token formats
  for (const [format, token] of Object.entries(tokens)) {
    testUrls.push({
      format: `${format} token format`,
      name: `Pattern 1: /auth/login (${format})`,
      url: `${baseUrl}/auth/login?client_id=${encodeURIComponent(SSO_CONFIG.clientId)}&client_name=${encodeURIComponent(SSO_CONFIG.clientName)}&redirect_url=${encodeURIComponent(SSO_CONFIG.redirectUrl)}&platform=${encodeURIComponent(SSO_CONFIG.platform)}&token=${encodeURIComponent(token)}`
    })
    
    testUrls.push({
      format: `${format} token format`,
      name: `Pattern 2: /sso/login (${format})`,
      url: `${baseUrl}/sso/login?client_id=${encodeURIComponent(SSO_CONFIG.clientId)}&redirect_url=${encodeURIComponent(SSO_CONFIG.redirectUrl)}&platform=${encodeURIComponent(SSO_CONFIG.platform)}&token=${encodeURIComponent(token)}`
    })
    
    // URLs without token (maybe token should only be in header)
    testUrls.push({
      format: `no token (${format} in header)`,
      name: `Pattern 3: /auth/login (no token param)`,
      url: `${baseUrl}/auth/login?client_id=${encodeURIComponent(SSO_CONFIG.clientId)}&client_name=${encodeURIComponent(SSO_CONFIG.clientName)}&redirect_url=${encodeURIComponent(SSO_CONFIG.redirectUrl)}&platform=${encodeURIComponent(SSO_CONFIG.platform)}`
    })
  }
  
  res.json({
    message: 'Test URLs generated. The error 402 suggests token format is incorrect.',
    note: 'Check Allaccess API documentation or Postman collection for correct token format.',
    tokens: {
      default: tokens.default.substring(0, 50) + '...',
      without_key: tokens.without_key.substring(0, 50) + '...',
      simple: tokens.simple.substring(0, 50) + '...'
    },
    testUrls,
    config: {
      baseUrl: SSO_CONFIG.baseUrl,
      clientId: SSO_CONFIG.clientId.substring(0, 30) + '...',
      redirectUrl: SSO_CONFIG.redirectUrl
    },
    troubleshooting: {
      error_402: 'Token format is incorrect. Check:',
      checks: [
        '1. Token signature algorithm (HMAC-SHA256?)',
        '2. Signature string format (order of parameters?)',
        '3. Token should be in query string or Authorization header?',
        '4. Token payload structure (what fields are required?)',
        '5. Check Postman collection for working example'
      ]
    }
  })
})

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📝 Environment: ${process.env.ENV || 'Development'}`)
  console.log(`🔐 SSO Client: ${SSO_CONFIG.clientName}`)
})

