<template>
  <div class="app-container">
    <AgeVerification 
      v-if="!ageVerified" 
      @age-verified="handleAgeVerified"
    />
    <div v-else-if="!isAuthenticated" class="loading-container">
      <p class="text-text-2">Mengalihkan ke halaman login...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AgeVerification from './components/AgeVerification.vue'

const ageVerified = ref(false)
const isAuthenticated = ref(false)

const handleAgeVerified = async () => {
  ageVerified.value = true
  
  // Check if we're returning from SSO callback
  const urlParams = new URLSearchParams(window.location.search)
  const authData = urlParams.get('auth_data')
  const code = urlParams.get('code')
  
  if (authData || code) {
    // Handle SSO callback
    try {
      const response = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ auth_data: authData, code }),
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success && data.redirectToken) {
        // Redirect to external domain with secure token
        window.location.href = `https://lawlessjakarta.com/?token=${data.redirectToken}`
      } else {
        alert('Autentikasi gagal. Silakan coba lagi.')
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Callback error:', error)
      alert('Terjadi kesalahan saat memproses autentikasi.')
    }
  } else {
    // Redirect to SSO login
    try {
      const response = await fetch('/api/auth/login-url', {
        method: 'GET',
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.loginUrl) {
        window.location.href = data.loginUrl
      } else {
        alert('Gagal mendapatkan URL login. Silakan coba lagi.')
      }
    } catch (error) {
      console.error('Login URL error:', error)
      alert('Terjadi kesalahan saat memproses login.')
    }
  }
}

onMounted(() => {
  // Check if already authenticated
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('auth_data') || urlParams.get('code')) {
    ageVerified.value = true
  }
})
</script>

<style scoped>
.app-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-container {
  text-align: center;
  padding: 20px;
}
</style>

