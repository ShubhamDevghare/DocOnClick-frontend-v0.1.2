// Global variables
let selectedDoctor = null
let selectedTimeSlot = null
let selectedDate = null
let currentPatient = null
let currentUser = null
let currentMonth = new Date().getMonth()
let currentYear = new Date().getFullYear()

// API Base URL
const API_BASE = "http://localhost:8080"

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  loadUserInfo()
  loadSpecialities()
  loadDoctors()
  initEventListeners()
})

// Load user information from localStorage
function loadUserInfo() {
  const userId = localStorage.getItem("userId")
  const userName = localStorage.getItem("userName")
  const userProfileImage = localStorage.getItem("userProfileImage")
  const userType = localStorage.getItem("userType")

  if (!userId) {
    window.location.href = "login.html"
    return
  }

  currentUser = {
    userId: userId,
    userName: userName,
    userProfileImage: userProfileImage,
    userType: userType,
  }

  document.getElementById("userName").textContent = userName || "User"
  document.getElementById("userType").textContent = userType || "USER"

  const avatar = document.getElementById("userAvatar")
  if (userProfileImage) {
    avatar.src = userProfileImage
  }
}

// Initialize event listeners
function initEventListeners() {
  document.getElementById("nextToStep2").addEventListener("click", () => goToStep(2))
  document.getElementById("backToStep1").addEventListener("click", () => goToStep(1))
  document.getElementById("nextToStep3").addEventListener("click", () => goToStep(3))
  document.getElementById("backToStep2").addEventListener("click", () => goToStep(2))
  document.getElementById("nextToStep4").addEventListener("click", () => goToStep(4))
  document.getElementById("backToStep3").addEventListener("click", () => goToStep(3))
  document.getElementById("makePayment").addEventListener("click", processPayment)

  document.getElementById("prevMonth").addEventListener("click", () => changeMonth(-1))
  document.getElementById("nextMonth").addEventListener("click", () => changeMonth(1))
}

// Load specialities
async function loadSpecialities() {
  try {
    const response = await fetch(`${API_BASE}/api/v1/doctors/specialities`)
    const specialities = await response.json()

    const select = document.getElementById("speciality")
    specialities.forEach((speciality) => {
      const option = document.createElement("option")
      option.value = speciality
      option.textContent = speciality
      select.appendChild(option)
    })
  } catch (error) {
    console.error("Error loading specialities:", error)
  }
}

// Load doctors
async function loadDoctors() {
  showLoading(true)
  try {
    const response = await fetch(`${API_BASE}/api/v1/doctors?size=20`)
    const data = await response.json()
    displayDoctors(data.content || [])
  } catch (error) {
    showError("Error loading doctors. Please try again.")
    console.error("Error loading doctors:", error)
  } finally {
    showLoading(false)
  }
}

// Search doctors
async function searchDoctors() {
  showLoading(true)
  const speciality = document.getElementById("speciality").value
  const minRating = document.getElementById("minRating").value

  try {
    let url = `${API_BASE}/api/v1/doctors/filter?size=20`
    if (speciality) url += `&speciality=${encodeURIComponent(speciality)}`
    if (minRating) url += `&minRating=${minRating}`

    const response = await fetch(url)
    const data = await response.json()
    displayDoctors(data.content || [])
  } catch (error) {
    showError("Error searching doctors. Please try again.")
    console.error("Error searching doctors:", error)
  } finally {
    showLoading(false)
  }
}

// Display doctors
function displayDoctors(doctors) {
  const container = document.getElementById("doctorsContainer")

  if (doctors.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666;">No doctors found matching your criteria.</p>'
    return
  }

  const grid = document.createElement("div")
  grid.className = "doctors-grid"

  doctors.forEach((doctor) => {
    const doctorCard = createDoctorCard(doctor)
    grid.appendChild(doctorCard)
  })

  container.innerHTML = ""
  container.appendChild(grid)
}

// Create doctor card
function createDoctorCard(doctor) {
  const card = document.createElement("div")
  card.className = "doctor-card"
  card.onclick = () => selectDoctor(doctor)

  const rating = doctor.averageRating || 0
  const stars = "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating))
  const fees = doctor.fees || 500 // Default fee

  card.innerHTML = `
        <div class="doctor-header">
            <img src="${doctor.profileImage || "/placeholder.svg?height=60&width=60"}" 
                 alt="Dr. ${doctor.fullName}" class="doctor-avatar">
            <div class="doctor-info">
                <h4>Dr. ${doctor.fullName}</h4>
                <p>${doctor.specialization}</p>
            </div>
        </div>
        <div class="doctor-details">
            <div class="detail-item">
                <i class="fas fa-graduation-cap"></i>
                <span>${doctor.experienceYears || 0} years exp.</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-rupee-sign"></i>
                <span>₹${fees}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-clock"></i>
                <span>${doctor.slotDurationMinutes || 30} min slots</span>
            </div>
            <div class="detail-item">
                <span class="stars" style="color: #ffc107;">${stars}</span>
                <span>(${rating.toFixed(1)})</span>
            </div>
        </div>
    `

  return card
}

// Load doctor details
async function loadDoctorDetails(doctorId) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/doctors/${doctorId}`)
    if (response.ok) {
      const doctor = await response.json()
      if (!doctor.fees || doctor.fees === 0) {
        doctor.fees = 500 // Default fee if not set
      }
      return doctor
    }
    throw new Error("Failed to load doctor details")
  } catch (error) {
    console.error("Error loading doctor details:", error)
    throw error
  }
}

// Select doctor
async function selectDoctor(doctor) {
  try {
    // Remove previous selection
    document.querySelectorAll(".doctor-card").forEach((card) => {
      card.classList.remove("selected")
    })

    // Add selection to clicked card
    event.currentTarget.classList.add("selected")

    // Load complete doctor details including fees
    const fullDoctorDetails = await loadDoctorDetails(doctor.doctorId)
    selectedDoctor = fullDoctorDetails

    document.getElementById("nextToStep2").disabled = false
  } catch (error) {
    showError("Error loading doctor details: " + error.message)
  }
}

// Go to step
function goToStep(stepNumber) {
  if (stepNumber === 2 && !selectedDoctor) {
    showError("Please select a doctor first.")
    return
  }

  if (stepNumber === 3 && (!selectedDate || !selectedTimeSlot)) {
    showError("Please select a date and time slot.")
    return
  }

  if (stepNumber === 4 && !validatePatientDetails()) {
    return
  }

  // Update steps
  document.querySelectorAll(".step").forEach((step, index) => {
    step.classList.remove("active", "completed")
    if (index + 1 < stepNumber) {
      step.classList.add("completed")
    } else if (index + 1 === stepNumber) {
      step.classList.add("active")
    }
  })

  // Update step content
  document.querySelectorAll(".booking-step-content").forEach((content, index) => {
    content.classList.remove("active")
    if (index + 1 === stepNumber) {
      content.classList.add("active")
    }
  })

  // Load step-specific content
  if (stepNumber === 2) {
    updateSelectedDoctorInfo()
    generateCalendar()
    // Initialize month/year selectors after calendar is generated
    setTimeout(() => {
      addMonthYearSelectors()
    }, 100)
  } else if (stepNumber === 3) {
    updateAppointmentSummary()
    loadUserDetailsForForm()
  } else if (stepNumber === 4) {
    updatePaymentSummary()
  }
}

// Update selected doctor info
function updateSelectedDoctorInfo() {
  const container = document.getElementById("selectedDoctorInfo")
  container.innerHTML = `
        <h3>Selected Doctor</h3>
        <div class="summary-item">
            <span>Doctor:</span>
            <span>Dr. ${selectedDoctor.fullName}</span>
        </div>
        <div class="summary-item">
            <span>Specialization:</span>
            <span>${selectedDoctor.specialization}</span>
        </div>
        <div class="summary-item">
            <span>Experience:</span>
            <span>${selectedDoctor.experienceYears} years</span>
        </div>
        <div class="summary-item">
            <span>Consultation Fee:</span>
            <span>₹${selectedDoctor.fees}</span>
        </div>
    `
}

// Generate calendar with improved structure and availability indicators
function generateCalendar() {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  // Update month/year display
  document.getElementById("currentMonth").textContent = `${monthNames[currentMonth]} ${currentYear}`

  // Update navigation buttons
  const today = new Date()
  const prevButton = document.getElementById("prevMonth")
  const nextButton = document.getElementById("nextMonth")

  // Disable previous button if we're at current month
  const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear()
  prevButton.disabled = isCurrentMonth

  // Don't allow going more than 6 months in the future
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 6, 1)
  const currentDate = new Date(currentYear, currentMonth, 1)
  nextButton.disabled = currentDate >= maxDate

  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const grid = document.getElementById("calendarGrid")
  grid.innerHTML = ""

  // Add day headers
  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  dayHeaders.forEach((day) => {
    const header = document.createElement("div")
    header.className = "calendar-day-header"
    header.textContent = day
    grid.appendChild(header)
  })

  // Add days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    const dayElement = document.createElement("div")
    dayElement.className = "calendar-day other-month"
    dayElement.textContent = daysInPrevMonth - i
    grid.appendChild(dayElement)
  }

  // Add days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement("div")
    dayElement.className = "calendar-day"
    dayElement.textContent = day

    const currentDate = new Date(currentYear, currentMonth, day)

    // Check if date is in the past
    if (currentDate < todayDate) {
      dayElement.classList.add("disabled")
    } else {
      dayElement.addEventListener("click", () => selectDate(currentDate))

      // Mark today
      if (currentDate.getTime() === todayDate.getTime()) {
        dayElement.classList.add("today")
      }

      // Add availability indicator (will be updated when slots are loaded)
      dayElement.classList.add("has-slots")
    }

    grid.appendChild(dayElement)
  }

  // Add days from next month to fill the grid
  const totalCells = grid.children.length - 7 // Subtract header row
  const remainingCells = 42 - totalCells // 6 rows × 7 days = 42 cells

  for (let day = 1; day <= remainingCells; day++) {
    const dayElement = document.createElement("div")
    dayElement.className = "calendar-day other-month"
    dayElement.textContent = day
    grid.appendChild(dayElement)
  }

  // Load availability for the month
  loadMonthAvailability()

  // Add calendar legend
  addCalendarLegend()
}

// Add calendar legend
function addCalendarLegend() {
  const container = document.querySelector(".calendar-container")

  // Remove existing legend
  const existingLegend = container.querySelector(".calendar-legend")
  if (existingLegend) {
    existingLegend.remove()
  }

  const legend = document.createElement("div")
  legend.className = "calendar-legend"
  legend.innerHTML = `
    <div class="legend-item">
      <div class="legend-dot available"></div>
      <span>Available</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot few"></div>
      <span>Few slots</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot unavailable"></div>
      <span>Unavailable</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot today"></div>
      <span>Today</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot selected"></div>
      <span>Selected</span>
    </div>
  `

  container.appendChild(legend)
}

// Load availability for the entire month
async function loadMonthAvailability() {
  if (!selectedDoctor) return

  try {
    const startDate = new Date(currentYear, currentMonth, 1)
    const endDate = new Date(currentYear, currentMonth + 1, 0)

    // Format dates for API
    const startDateStr = startDate.toISOString().split("T")[0]
    const endDateStr = endDate.toISOString().split("T")[0]

    const response = await fetch(
      `${API_BASE}/api/v1/appointment-slots/doctor/${selectedDoctor.doctorId}/availability?startDate=${startDateStr}&endDate=${endDateStr}`,
    )

    if (response.ok) {
      const availability = await response.json()
      updateCalendarAvailability(availability)
    }
  } catch (error) {
    console.error("Error loading month availability:", error)
    // Continue without availability indicators
  }
}

// Update calendar with availability indicators
function updateCalendarAvailability(availability) {
  const calendarDays = document.querySelectorAll(".calendar-day:not(.other-month):not(.disabled)")

  calendarDays.forEach((dayElement) => {
    const day = Number.parseInt(dayElement.textContent)
    const dateStr = new Date(currentYear, currentMonth, day).toISOString().split("T")[0]

    // Remove existing availability classes
    dayElement.classList.remove("has-slots", "few-slots", "no-slots")

    // Find availability for this date
    const dayAvailability = availability.find((item) => item.date === dateStr)

    if (dayAvailability) {
      const availableSlots = dayAvailability.availableSlots || 0

      if (availableSlots === 0) {
        dayElement.classList.add("no-slots")
      } else if (availableSlots <= 3) {
        dayElement.classList.add("few-slots")
      } else {
        dayElement.classList.add("has-slots")
      }
    } else {
      dayElement.classList.add("no-slots")
    }
  })
}

// Enhanced change month function
function changeMonth(direction) {
  const today = new Date()
  const newMonth = currentMonth + direction
  const newYear = currentYear

  if (newMonth < 0) {
    currentMonth = 11
    currentYear--
  } else if (newMonth > 11) {
    currentMonth = 0
    currentYear++
  } else {
    currentMonth = newMonth
  }

  // Don't allow going to past months
  const currentDate = new Date(currentYear, currentMonth, 1)
  const todayDate = new Date(today.getFullYear(), today.getMonth(), 1)

  if (currentDate < todayDate) {
    currentMonth = today.getMonth()
    currentYear = today.getFullYear()
    return
  }

  // Don't allow going more than 6 months in the future
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 6, 1)
  if (currentDate > maxDate) {
    const maxDateObj = new Date(maxDate)
    currentMonth = maxDateObj.getMonth()
    currentYear = maxDateObj.getFullYear()
    return
  }

  generateCalendar()
}

// Enhanced select date function
function selectDate(date) {
  // Remove previous selection
  document.querySelectorAll(".calendar-day").forEach((day) => {
    day.classList.remove("selected")
  })

  // Add selection to clicked day
  event.currentTarget.classList.add("selected")

  selectedDate = date

  // Show loading state for time slots
  const container = document.getElementById("timeSlotsGrid")
  container.innerHTML = `
    <div class="calendar-loading" style="grid-column: 1/-1;">
      <div class="spinner"></div>
      <p>Loading available time slots...</p>
    </div>
  `

  loadTimeSlots()
}

// Add month/year selector functionality
function addMonthYearSelectors() {
  const header = document.querySelector(".calendar-header")
  const monthYearDiv = document.getElementById("currentMonth").parentElement

  // Create selectors
  const selectorsDiv = document.createElement("div")
  selectorsDiv.className = "month-year-selector"
  selectorsDiv.style.display = "none"

  const monthSelect = document.createElement("select")
  monthSelect.className = "month-select"
  const yearSelect = document.createElement("select")
  yearSelect.className = "year-select"

  // Populate month select
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  monthNames.forEach((month, index) => {
    const option = document.createElement("option")
    option.value = index
    option.textContent = month
    monthSelect.appendChild(option)
  })

  // Populate year select (current year + 2 years)
  const currentYear = new Date().getFullYear()
  for (let year = currentYear; year <= currentYear + 2; year++) {
    const option = document.createElement("option")
    option.value = year
    option.textContent = year
    yearSelect.appendChild(option)
  }

  selectorsDiv.appendChild(monthSelect)
  selectorsDiv.appendChild(yearSelect)
  monthYearDiv.appendChild(selectorsDiv)

  // Add click handler to month/year display
  document.getElementById("currentMonth").addEventListener("click", () => {
    const isVisible = selectorsDiv.style.display !== "none"
    selectorsDiv.style.display = isVisible ? "none" : "flex"

    if (!isVisible) {
      monthSelect.value = currentMonth
      yearSelect.value = currentYear
    }
  })

  // Add change handlers
  monthSelect.addEventListener("change", () => {
    currentMonth = Number.parseInt(monthSelect.value)
    generateCalendar()
    selectorsDiv.style.display = "none"
  })

  yearSelect.addEventListener("change", () => {
    const newYear = Number.parseInt(yearSelect.value)
    currentYear = newYear
    generateCalendar()
    selectorsDiv.style.display = "none"
  })
}

// Load time slots
async function loadTimeSlots() {
  if (!selectedDoctor || !selectedDate) return

  const formattedDate = selectedDate.toISOString().split("T")[0]
  const container = document.getElementById("timeSlotsGrid")

  container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading time slots...</p></div>'

  try {
    const response = await fetch(
      `${API_BASE}/api/v1/appointment-slots/doctor/${selectedDoctor.doctorId}/date/${formattedDate}`,
    )
    const timeSlots = await response.json()

    container.innerHTML = ""

    if (timeSlots.length === 0) {
      container.innerHTML =
        '<p style="text-align: center; color: #666; grid-column: 1/-1;">No available time slots for this date.</p>'
      return
    }

    timeSlots.forEach((slot) => {
      const slotElement = document.createElement("div")
      slotElement.className = `time-slot ${slot.isBooked ? "disabled" : ""}`
      slotElement.textContent = `${slot.startTime} - ${slot.endTime}`

      if (!slot.isBooked) {
        slotElement.addEventListener("click", () => selectTimeSlot(slot))
      }

      container.appendChild(slotElement)
    })
  } catch (error) {
    console.error("Error loading time slots:", error)
    container.innerHTML =
      '<p style="text-align: center; color: #666; grid-column: 1/-1;">Error loading time slots. Please try again.</p>'
  }
}

// Select time slot
function selectTimeSlot(slot) {
  // Remove previous selection
  document.querySelectorAll(".time-slot").forEach((element) => {
    element.classList.remove("selected")
  })

  // Add selection to clicked slot
  event.currentTarget.classList.add("selected")

  selectedTimeSlot = slot
  document.getElementById("nextToStep3").disabled = false
}

// Update appointment summary
function updateAppointmentSummary() {
  const container = document.getElementById("appointmentSummary")
  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  container.innerHTML = `
        <h3>Appointment Summary</h3>
        <div class="summary-item">
            <span>Doctor:</span>
            <span>Dr. ${selectedDoctor.fullName}</span>
        </div>
        <div class="summary-item">
            <span>Date:</span>
            <span>${formattedDate}</span>
        </div>
        <div class="summary-item">
            <span>Time:</span>
            <span>${selectedTimeSlot.startTime} - ${selectedTimeSlot.endTime}</span>
        </div>
        <div class="summary-item">
            <span>Consultation Fee:</span>
            <span>₹${selectedDoctor.fees}</span>
        </div>
    `
}

// Load user details for form
function loadUserDetailsForForm() {
  document.getElementById("patientName").value = currentUser.userName || ""
  document.getElementById("patientEmail").value = ""
  document.getElementById("patientPhone").value = ""
}

// Validate patient details
function validatePatientDetails() {
  const name = document.getElementById("patientName").value.trim()
  const email = document.getElementById("patientEmail").value.trim()
  const phone = document.getElementById("patientPhone").value.trim()
  const gender = document.getElementById("patientGender").value
  const dob = document.getElementById("patientDOB").value
  const address = document.getElementById("patientAddress").value.trim()

  if (!name || !email || !phone || !gender || !dob || !address) {
    showError("Please fill in all required fields.")
    return false
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    showError("Please enter a valid email address.")
    return false
  }

  // Validate phone format
  const phoneRegex = /^\d{10}$/
  if (!phoneRegex.test(phone.replace(/\D/g, ""))) {
    showError("Please enter a valid 10-digit phone number.")
    return false
  }

  return true
}

// Update payment summary
function updatePaymentSummary() {
  const container = document.getElementById("paymentSummary")
  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  container.innerHTML = `
        <h3>Payment Summary</h3>
        <div class="summary-item">
            <span>Doctor:</span>
            <span>Dr. ${selectedDoctor.fullName}</span>
        </div>
        <div class="summary-item">
            <span>Date & Time:</span>
            <span>${formattedDate} at ${selectedTimeSlot.startTime}</span>
        </div>
        <div class="summary-item">
            <span>Patient:</span>
            <span>${document.getElementById("patientName").value}</span>
        </div>
        <div class="summary-item">
            <span>Consultation Fee:</span>
            <span>₹${selectedDoctor.fees}</span>
        </div>
    `
}

// Process payment
async function processPayment() {
  const paymentButton = document.getElementById("makePayment")
  paymentButton.disabled = true
  paymentButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...'

  try {
    // Step 1: Register the patient first
    const patientData = {
      fullName: document.getElementById("patientName").value,
      gender: document.getElementById("patientGender").value,
      dateOfBirth: document.getElementById("patientDOB").value,
      phone: document.getElementById("patientPhone").value,
      emailAddress: document.getElementById("patientEmail").value,
      address: document.getElementById("patientAddress").value,
      role: "PATIENT",
    }

    console.log("Registering patient:", patientData)
    const patientResponse = await fetch(`${API_BASE}/patients/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(patientData),
    })

    if (!patientResponse.ok) {
      const errorText = await patientResponse.text()
      throw new Error(`Failed to register patient: ${errorText}`)
    }

    const patient = await patientResponse.json()
    currentPatient = patient
    console.log("Patient registered:", patient)

    // Step 2: Book the appointment
    const appointmentData = {
      userId: Number.parseInt(currentUser.userId),
      doctorId: selectedDoctor.doctorId,
      patientId: patient.patientId,
      timeSlotId: selectedTimeSlot.id,
      appointmentDate: selectedDate.toISOString().split("T")[0],
      appointmentTime: selectedTimeSlot.startTime,
      paymentStatus: "UNPAID",
    }

    console.log("Booking appointment:", appointmentData)
    const appointmentResponse = await fetch(`${API_BASE}/api/v1/appointments/book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(appointmentData),
    })

    if (!appointmentResponse.ok) {
      const errorText = await appointmentResponse.text()
      throw new Error(`Failed to book appointment: ${errorText}`)
    }

    const appointment = await appointmentResponse.json()
    console.log("Appointment booked:", appointment)

    // Step 3: Create payment order
    console.log("Creating payment order for appointment:", appointment.appointmentId)
    const orderResponse = await fetch(`${API_BASE}/api/v1/payments/create-order/${appointment.appointmentId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text()
      throw new Error(`Failed to create payment order: ${errorText}`)
    }

    const orderData = await orderResponse.json()
    console.log("Payment order created:", orderData)

    // Step 4: Initialize Razorpay payment
    const options = {
      key: "rzp_test_THhTRc6X4f92p4", // Replace with your actual Razorpay key
      amount: orderData.amount,
      currency: orderData.currency || "INR",
      name: "DocOnClick",
      description: `Appointment with Dr. ${selectedDoctor.fullName}`,
      order_id: orderData.orderId,
      handler: async (response) => {
        console.log("Razorpay payment response:", response)
        await verifyPayment(appointment.appointmentId, response)
      },
      prefill: {
        name: patient.fullName,
        email: patient.emailAddress,
        contact: patient.phone,
      },
      theme: {
        color: "#667eea",
      },
      modal: {
        ondismiss: () => {
          console.log("Payment modal dismissed")
          paymentButton.disabled = false
          paymentButton.textContent = "Make Payment"
        },
      },
    }

    console.log("Opening Razorpay with options:", options)
    const rzp = new Razorpay(options)
    rzp.open()
  } catch (error) {
    console.error("Error in payment process:", error)
    showError("Error processing payment: " + error.message)
    paymentButton.disabled = false
    paymentButton.textContent = "Make Payment"
  }
}

// Verify payment
async function verifyPayment(appointmentId, paymentResponse) {
  try {
    console.log("Verifying payment for appointment:", appointmentId)
    console.log("Payment response:", paymentResponse)

    const paymentData = {
      appointmentId: appointmentId,
      razorpayPaymentId: paymentResponse.razorpay_payment_id,
      razorpayOrderId: paymentResponse.razorpay_order_id,
      razorpaySignature: paymentResponse.razorpay_signature,
    }

    console.log("Sending payment verification:", paymentData)
    const response = await fetch(`${API_BASE}/api/v1/payments/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(paymentData),
    })

    console.log("Payment verification response status:", response.status)

    if (response.ok) {
      const result = await response.json()
      console.log("Payment verification result:", result)

      showSuccess("Payment successful! Appointment confirmed.")
      updateConfirmationDetails(appointmentId)
      goToStep(5)
    } else {
      const errorText = await response.text()
      console.error("Payment verification failed:", errorText)
      showError("Payment verification failed: " + errorText)
    }
  } catch (error) {
    console.error("Error verifying payment:", error)
    showError("Error verifying payment: " + error.message)
  }
}

// Update confirmation details
function updateConfirmationDetails(appointmentId) {
  const container = document.getElementById("confirmationDetails")
  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  container.innerHTML = `
        <h3>Appointment Details</h3>
        <div class="summary-item">
            <span>Appointment ID:</span>
            <span>#${appointmentId}</span>
        </div>
        <div class="summary-item">
            <span>Doctor:</span>
            <span>Dr. ${selectedDoctor.fullName}</span>
        </div>
        <div class="summary-item">
            <span>Date & Time:</span>
            <span>${formattedDate} at ${selectedTimeSlot.startTime}</span>
        </div>
        <div class="summary-item">
            <span>Patient:</span>
            <span>${document.getElementById("patientName").value}</span>
        </div>
        <div class="summary-item">
            <span>Status:</span>
            <span>Confirmed</span>
        </div>
    `
}

// Utility functions
function showLoading(show) {
  const container = document.getElementById("doctorsContainer")
  if (show) {
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading doctors...</p></div>'
  }
}

function showSuccess(message) {
  const alert = document.getElementById("successAlert")
  alert.textContent = message
  alert.style.display = "block"
  setTimeout(() => (alert.style.display = "none"), 5000)
}

function showError(message) {
  const alert = document.getElementById("errorAlert")
  alert.textContent = message
  alert.style.display = "block"
  setTimeout(() => (alert.style.display = "none"), 5000)
}

function logout() {
  localStorage.clear()
  window.location.href = "login.html"
}

// Testing functions for debugging
async function testEndpoints() {
  console.log("Testing backend endpoints...")

  try {
    const response = await fetch(`${API_BASE}/api/v1/doctors?size=1`)
    console.log("Backend connection:", response.ok ? "SUCCESS" : "FAILED")
  } catch (error) {
    console.error("Backend connection failed:", error)
  }

  if (selectedDoctor) {
    try {
      const response = await fetch(`${API_BASE}/api/v1/doctors/${selectedDoctor.doctorId}`)
      const doctor = await response.json()
      console.log("Doctor details test:", doctor)
    } catch (error) {
      console.error("Doctor details test failed:", error)
    }
  }
}

function addTestButton() {
  const testButton = document.createElement("button")
  testButton.textContent = "Test Endpoints"
  testButton.className = "btn btn-outline"
  testButton.style.position = "fixed"
  testButton.style.top = "10px"
  testButton.style.right = "10px"
  testButton.style.zIndex = "9999"
  testButton.onclick = testEndpoints
  document.body.appendChild(testButton)
}

var Razorpay = window.Razorpay
addMonthYearSelectors()
