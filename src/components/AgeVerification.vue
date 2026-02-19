<template>
  <div class="popup-container text-center mx-auto max-w-[354px] bg-bg-3 rounded-[15px] mb-[20px] p-[25px] lg:max-w-[460px] lg:w-full !bg-bg-3">
    <div data-testid="softgate-title" class="text-text-2 text-[20px] lg:text-[24px] lg:leading-[32px] font-bold font-font-family-7 mb-[10px]">
      Selamat Datang!
    </div>
    <div data-testid="softgate-description" class="text-text-2 text-[14px] leading-[20px] lg:leading-[24px] mb-[20px]">
      Website ini ditujukan hanya untuk perokok berusia 21 tahun ke atas, dan tinggal di wilayah Indonesia.
    </div>
    <div data-testid="softgate-form-label" class="text-text-2 text-[14px] leading-[20px] mb-[20px] font-bold font-font-family-7">
      Masukkan Bulan & Tahun Lahir Anda
    </div>
    <div class="lg:max-w-[304px] mx-auto">
      <div class="flex gap-[5px] items-center mb-[0]">
        <select 
          v-model="selectedMonth"
          @change="checkAgeValidation"
          class="cursor-pointer text-text-3 w-[100%] text-[14px] leading-[20px] lg:leading-[22px] p-[10px] lg:p-[11px] border-[1px] rounded-[10px] mb-[10px] border-cta-4 disabled:bg-cta-4 focus:outline-cta-1 hover:border-cta-4 focus:border-cta-1 active:border-cta-1 disabled:text-text-3 placeholder:text-text-3 focus:text-text-2 hover:text-text-2 active:text-text-2 bg-bg-3 min-w-[113px]"
        >
          <option value="">Pilih Bulan</option>
          <option v-for="month in months" :key="month.value" :value="month.value">
            {{ month.label }}
          </option>
        </select>
        <select 
          v-model="selectedYear"
          @change="checkAgeValidation"
          class="cursor-pointer text-text-3 w-[100%] text-[14px] leading-[20px] lg:leading-[22px] p-[10px] lg:p-[11px] border-[1px] rounded-[10px] mb-[10px] border-cta-4 disabled:bg-cta-4 focus:outline-cta-1 hover:border-cta-4 focus:border-cta-1 active:border-cta-1 disabled:text-text-3 placeholder:text-text-3 focus:text-text-2 hover:text-text-2 active:text-text-2 bg-bg-3"
        >
          <option value="">Pilih Tahun</option>
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>
      <div 
        v-show="showError" 
        class="p-[10px] text-text-1 flex gap-[5px] items-center rounded-[5px] relative"
      >
        <div class="absolute inset-0 z-[-1] bg-text-1 opacity-50"></div>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="5" y="5" width="10" height="10" fill="white"></rect>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M7.61717 2.18836C7.28565 2.18778 6.96748 2.31891 6.73264 2.55292L2.88501 6.38709C2.65017 6.6211 2.51792 6.93881 2.51734 7.27033L2.50781 12.7022C2.50723 13.0337 2.63837 13.3519 2.87238 13.5867L6.70655 17.4343C6.94056 17.6692 7.25827 17.8014 7.58979 17.802L13.0216 17.8115C13.3532 17.8121 13.6713 17.681 13.9062 17.447L17.7538 13.6128C17.9886 13.3788 18.1209 13.0611 18.1215 12.7296L18.131 7.29771C18.1316 6.96619 18.0004 6.64802 17.7664 6.41319L13.9323 2.56555C13.6983 2.33072 13.3805 2.19846 13.049 2.19788L7.61717 2.18836ZM7.49823 6.0937L6.41316 7.17877L9.23434 9.99995L6.41316 12.8211L7.49823 13.9062L10.3194 11.085L13.1406 13.9062L14.2257 12.8211L11.4045 9.99995L14.2257 7.17877L13.1406 6.0937L10.3194 8.91488L7.49823 6.0937Z" class="fill-text-1"></path>
        </svg>
        <div>Pilih Bulan dan Tahun Lahir Anda</div>
      </div>
      <button 
        class="button bg-cta-4 fill-text-3 text-text-3 border-transparent text-[16px] font-bold font-font-family-7 ease-out duration-300 capitalize block w-[100%] p-[12px] rounded-[10px] box-border relative overflow-hidden mt-[20px]" 
        data-testid="softgate-cta" 
        type="button" 
        :disabled="!isFormValid"
        :class="{ 'button-validated': isValidated }"
        @click="handleConfirm"
        :style="isValidated ? 'background: var(--text_2);' : 'background: var(--text_3);'"
      >
        <div 
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%_-_1.9px)] h-[calc(100%_-_1.9px)] z-[0] rounded-[9px]" 
          :style="isValidated ? 'background: var(--cta_1); transition: background 0.3s ease-out;' : 'background: var(--cta_4); transition: background 0.3s ease-out;'"
        ></div>
        <div class="flex justify-center items-center">
          <span 
            class="!bg-clip-text block relative z-[1]" 
            :style="isValidated ? 'background: var(--text_2); -webkit-text-fill-color: transparent;' : 'background: var(--text_3); -webkit-text-fill-color: transparent;'"
          >Konfirmasi</span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['age-verified'])

const selectedMonth = ref('')
const selectedYear = ref('')
const showError = ref(false)
const isAgeValid = ref(false)

const months = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' }
]

const years = Array.from({ length: 82 }, (_, i) => 2021 - i)

const isFormValid = computed(() => {
  return selectedMonth.value !== '' && selectedYear.value !== ''
})

const isValidated = computed(() => {
  if (!isFormValid.value) return false
  const month = parseInt(selectedMonth.value)
  const year = parseInt(selectedYear.value)
  if (!month || !year) return false
  const age = calculateAge(month, year)
  return age >= 21
})

const calculateAge = (month, year) => {
  const today = new Date()
  const birthDate = new Date(year, month - 1, 1)
  const age = today.getFullYear() - year
  const monthDiff = today.getMonth() - (month - 1)
  
  let actualAge = age
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < 1)) {
    actualAge--
  }
  
  return actualAge
}

const checkAgeValidation = () => {
  if (isFormValid.value) {
    const month = parseInt(selectedMonth.value)
    const year = parseInt(selectedYear.value)
    if (month && year) {
      const age = calculateAge(month, year)
      isAgeValid.value = age >= 21
      showError.value = false
    }
  } else {
    isAgeValid.value = false
  }
}

const handleConfirm = () => {
  if (!isFormValid.value) {
    showError.value = true
    return
  }

  showError.value = false

  const month = parseInt(selectedMonth.value)
  const year = parseInt(selectedYear.value)
  const age = calculateAge(month, year)

  if (age < 21) {
    alert('Anda harus berusia 21 tahun ke atas untuk mengakses website ini.')
    isAgeValid.value = false
    return
  }

  // Age verified, emit event
  emit('age-verified')
}
</script>

<style scoped>
.focus\:outline-cta-1:focus {
  outline-color: var(--cta_1);
}

.focus\:border-cta-1:focus {
  border-color: var(--cta_1);
}

.hover\:border-cta-4:hover {
  border-color: var(--cta_4);
}

.active\:border-cta-1:active {
  border-color: var(--cta_1);
}

.disabled\:bg-cta-4:disabled {
  background-color: var(--cta_4);
}

.disabled\:text-text-3:disabled {
  color: var(--text_3);
}

.focus\:text-text-2:focus {
  color: var(--text_2);
}

.hover\:text-text-2:hover {
  color: var(--text_2);
}

.active\:text-text-2:active {
  color: var(--text_2);
}

.popup-container {
  position: relative;
  width: 100%;
}

.button-validated {
  cursor: pointer !important;
}

.button-validated:hover {
  opacity: 0.9;
}

/* Ensure absolute positioning uses Tailwind classes, not pixel values */
.button > div.absolute.left-1\/2.top-1\/2 {
  left: 50% !important;
  top: 50% !important;
}
</style>

