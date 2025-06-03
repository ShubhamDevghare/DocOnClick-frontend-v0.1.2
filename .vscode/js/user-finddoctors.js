// user-finddoctor.js :
document.addEventListener("DOMContentLoaded", () => {
    // Initialize user menu dropdown
    initUserMenu()
  
    // Load specialties for filter
    loadSpecialties()
  
    // Load locations for filter
    loadLocations()
  
    // Load doctors (initial load)
    loadDoctors()
  
    // Initialize search functionality
    initSearch()
  
    // Initialize filter functionality
    initFilters()
  
    // Initialize sort functionality
    initSort()
  
    // Initialize modals
    initModals()
  
    // Setup logout functionality
    document.getElementById("logout-btn").addEventListener("click", (e) => {
      e.preventDefault()
      logout()
    })
  })
  
  function initUserMenu() {
    const userProfileToggle = document.getElementById("user-profile-toggle")
    const userDropdown = document.getElementById("user-dropdown")
  
    userProfileToggle.addEventListener("click", () => {
      userDropdown.classList.toggle("active")
    })
  
    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!userProfileToggle.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove("active")
      }
    })
  
    // Set user name and profile image
    const userName = localStorage.getItem("userName") || "User"
    const userProfileImage = localStorage.getItem("userProfileImage") || "/placeholder.svg?height=40&width=40"
  
    document.getElementById("user-name").textContent = userName
  
    const headerProfileImage = document.getElementById("header-profile-image")
    headerProfileImage.src = userProfileImage
    headerProfileImage.onerror = function () {
      this.src = "/placeholder.svg?height=40&width=40"
    }
  }
  
  // Store the current search and filter parameters
  let currentSearchParams = {
    page: 0,
    searchTerm: "",
    specialty: "",
    location: "",
    gender: "",
    rating: "",
    availability: "",
    sort: "fullName,asc",
  }
  
  function loadSpecialties() {
    const specialtyFilter = document.getElementById("specialty-filter")
  
    fetch("http://localhost:8080/api/v1/doctors/specialties")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load specialties")
        }
        return response.json()
      })
      .then((specialties) => {
        specialtyFilter.innerHTML = '<option value="">All Specialties</option>'
        specialties.forEach((specialty) => {
          const option = document.createElement("option")
          option.value = specialty
          option.textContent = specialty
          specialtyFilter.appendChild(option)
        })
      })
      .catch((error) => {
        console.error("Error loading specialties:", error)
      })
  }
  
  function loadLocations() {
    const locationFilter = document.getElementById("location-filter")
  
    // Show loading state
    locationFilter.innerHTML = '<option value="">Loading locations...</option>'
  
    // Fetch all doctors to extract unique locations
    fetch("http://localhost:8080/api/v1/doctors?size=100")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load doctors for locations")
        }
        return response.json()
      })
      .then((data) => {
        // Extract unique locations from doctor addresses
        const locations = new Set()
  
        if (data.content && data.content.length > 0) {
          data.content.forEach((doctor) => {
            if (doctor.address) {
              // Extract city from address (assuming format like "City, State")
              const addressParts = doctor.address.split(",")
              if (addressParts.length > 0) {
                const city = addressParts[0].trim()
                locations.add(city)
              } else {
                locations.add(doctor.address.trim())
              }
            }
          })
        }
  
        // Sort locations alphabetically
        const sortedLocations = Array.from(locations).sort()
  
        // Populate the dropdown
        locationFilter.innerHTML = '<option value="">All Locations</option>'
        sortedLocations.forEach((location) => {
          const option = document.createElement("option")
          option.value = location
          option.textContent = location
          locationFilter.appendChild(option)
        })
      })
      .catch((error) => {
        console.error("Error loading locations:", error)
        locationFilter.innerHTML = '<option value="">All Locations</option>'
      })
  }
  
  function loadDoctors(page = 0) {
    const doctorsContainer = document.getElementById("doctors-container")
    const paginationContainer = document.getElementById("pagination-container")
  
    // Update current page
    currentSearchParams.page = page
  
    // Show loading spinner
    doctorsContainer.innerHTML = `
          <div class="loading-spinner">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Loading doctors...</p>
          </div>
      `
  
    // Build API URL with query parameters
    const apiUrl = constructApiUrl()
  
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load doctors")
        }
        return response.json()
      })
      .then((data) => {
        doctorsContainer.innerHTML = ""
  
        if (data.content && data.content.length > 0) {
          // Apply client-side filtering for properties not supported by the API
          const filteredDoctors = applyClientSideFilters(data.content)
  
          if (filteredDoctors.length > 0) {
            filteredDoctors.forEach((doctor) => {
              const doctorCard = createDoctorCard(doctor)
              doctorsContainer.appendChild(doctorCard)
            })
  
            // Create pagination
            createPagination(data, page)
          } else {
            showEmptyState(doctorsContainer)
          }
        } else {
          showEmptyState(doctorsContainer)
          paginationContainer.innerHTML = ""
        }
      })
      .catch((error) => {
        console.error("Error loading doctors:", error)
        doctorsContainer.innerHTML = `
                  <div class="error-state">
                      <i class="fas fa-exclamation-circle"></i>
                      <p>Failed to load doctors</p>
                      <button class="btn btn-primary" onclick="loadDoctors()">Try Again</button>
                  </div>
              `
        paginationContainer.innerHTML = ""
      })
  }
  
  function constructApiUrl() {
    // Start with base URL and pagination
    let url = `http://localhost:8080/api/v1/doctors/search?page=${currentSearchParams.page}&size=9`
  
    // Add sorting
    if (currentSearchParams.sort) {
      url += `&sort=${currentSearchParams.sort}`
    }
  
    // Add search term - use keyword parameter
    if (currentSearchParams.searchTerm) {
      url += `&keyword=${encodeURIComponent(currentSearchParams.searchTerm)}`
    }
  
    // Add specialty filter if it exists
    if (currentSearchParams.specialty) {
      url += `&speciality=${encodeURIComponent(currentSearchParams.specialty)}`
    }
  
    // Add location filter if it exists
    if (currentSearchParams.location) {
      url += `&location=${encodeURIComponent(currentSearchParams.location)}`
    }
  
    // Add minimum rating if it exists
    if (currentSearchParams.rating) {
      url += `&minRating=${currentSearchParams.rating}`
    }
  
    return url
  }
  
  function applyClientSideFilters(doctors) {
    if (!doctors || !doctors.length) return []
  
    return doctors.filter((doctor) => {
      // Apply gender filter
      if (currentSearchParams.gender && doctor.gender && doctor.gender !== currentSearchParams.gender) {
        return false
      }
  
      // All filters passed
      return true
    })
  }
  
  function getLocationName(locationId) {
    const locations = {
    }
  
    return locations[locationId] || ""
  }
  
  function showEmptyState(container) {
    container.innerHTML = `
          <div class="empty-state">
              <i class="fas fa-user-md"></i>
              <p>No doctors found matching your criteria</p>
              <button class="btn btn-primary" onclick="resetFilters()">Clear Filters</button>
          </div>
      `
  }
  
  function createDoctorCard(doctor) {
    const doctorCard = document.createElement("div")
    doctorCard.className = "doctor-card"
  
    // Generate rating stars
    let ratingStars = ""
    const rating = doctor.rating || 0
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        ratingStars += '<i class="fas fa-star"></i>'
      } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
        ratingStars += '<i class="fas fa-star-half-alt"></i>'
      } else {
        ratingStars += '<i class="far fa-star"></i>'
      }
    }
  
    doctorCard.innerHTML = `
          <div class="doctor-image">
              <img src="${doctor.profileImage || "/placeholder.svg?height=200&width=200"}" alt="Dr. ${doctor.fullName}" onerror="this.src='/placeholder.svg?height=200&width=200'">
          </div>
          <div class="doctor-info">
              <h3 class="doctor-name">Dr. ${doctor.fullName}</h3>
              <div class="doctor-specialty">${doctor.specialization || "General Practitioner"}</div>
              <div class="doctor-meta">
                  <div class="meta-item">
                      <i class="fas fa-map-marker-alt"></i> ${doctor.address || "Not specified"}
                  </div>
                  <div class="meta-item">
                      <i class="fas fa-briefcase"></i> ${doctor.experienceYears || "0"} years
                  </div>
              </div>
              <div class="doctor-rating">
                  <div class="rating-stars">${ratingStars}</div>
                  <div class="rating-count">(${doctor.reviewCount || "0"} reviews)</div>
              </div>
              <div class="doctor-footer">
                  <div class="consultation-fee">
                      Fee: <span class="fee-amount">&#8377;${doctor.fees || "50"}</span>
                  </div>
                  <div class="doctor-actions">
                      <button class="btn btn-sm btn-outline" onclick="viewDoctorDetails(${doctor.doctorId})">View Profile</button>
                      <button class="btn btn-sm btn-primary" onclick="bookAppointment(${doctor.doctorId})">Book Now</button>
                  </div>
              </div>
          </div>
      `
  
    return doctorCard
  }
  
  function createPagination(data, currentPage) {
    const paginationContainer = document.getElementById("pagination-container")
    paginationContainer.innerHTML = ""
  
    if (data.totalPages <= 1) {
      return
    }
  
    // Previous button
    const prevButton = document.createElement("button")
    prevButton.className = `page-item ${data.first ? "disabled" : ""}`
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>'
    if (!data.first) {
      prevButton.addEventListener("click", () => loadDoctors(currentPage - 1))
    }
    paginationContainer.appendChild(prevButton)
  
    // Page numbers
    for (let i = 0; i < data.totalPages; i++) {
      const pageButton = document.createElement("button")
      pageButton.className = `page-item ${i === currentPage ? "active" : ""}`
      pageButton.textContent = i + 1
      pageButton.addEventListener("click", () => loadDoctors(i))
      paginationContainer.appendChild(pageButton)
    }
  
    // Next button
    const nextButton = document.createElement("button")
    nextButton.className = `page-item ${data.last ? "disabled" : ""}`
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>'
    if (!data.last) {
      nextButton.addEventListener("click", () => loadDoctors(currentPage + 1))
    }
    paginationContainer.appendChild(nextButton)
  }
  
  function initSearch() {
    const searchInput = document.getElementById("doctor-search")
    const searchBtn = document.getElementById("search-btn")
  
    // Search on button click
    searchBtn.addEventListener("click", () => {
      currentSearchParams.searchTerm = searchInput.value.trim()
      currentSearchParams.page = 0 // Reset to first page
      loadDoctors(0)
    })
  
    // Search on Enter key
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        searchBtn.click()
      }
    })
  }
  
  function initFilters() {
    const applyFiltersBtn = document.getElementById("apply-filters")
    const clearFiltersBtn = document.getElementById("clear-filters")
  
    // Setup filter change handlers
    document.getElementById("specialty-filter").addEventListener("change", function () {
      currentSearchParams.specialty = this.value
    })
  
    document.getElementById("location-filter").addEventListener("change", function () {
      currentSearchParams.location = this.value
    })
  
    document.getElementById("availability-filter").addEventListener("change", function () {
      currentSearchParams.availability = this.value
    })
  
    document.getElementById("gender-filter").addEventListener("change", function () {
      currentSearchParams.gender = this.value
    })
  
    document.getElementById("rating-filter").addEventListener("change", function () {
      currentSearchParams.rating = this.value
    })
  
    // Apply filters
    applyFiltersBtn.addEventListener("click", () => {
      currentSearchParams.page = 0 // Reset to first page
      loadDoctors(0)
    })
  
    // Clear filters
    clearFiltersBtn.addEventListener("click", () => {
      resetFilters()
    })
  }
  
  function resetFilters() {
    // Reset filter UI elements
    document.getElementById("specialty-filter").value = ""
    document.getElementById("location-filter").value = ""
    document.getElementById("availability-filter").value = ""
    document.getElementById("gender-filter").value = ""
    document.getElementById("rating-filter").value = ""
    document.getElementById("doctor-search").value = ""
    document.getElementById("sort-by").value = "fullName,asc"
  
    // Reset search parameters
    currentSearchParams = {
      page: 0,
      searchTerm: "",
      specialty: "",
      location: "",
      gender: "",
      rating: "",
      availability: "",
      sort: "fullName,asc",
    }
  
    // Reload doctors with no filters
    loadDoctors(0)
  }
  
  function initSort() {
    const sortSelect = document.getElementById("sort-by")
  
    // Update options to match what backend can handle
    sortSelect.innerHTML = `
          <option value="fullName,asc">Name (A-Z)</option>
          <option value="fullName,desc">Name (Z-A)</option>
          <option value="rating,desc">Highest Rated</option>
          <option value="rating,asc">Lowest Rated</option>
          <option value="experienceYears,desc">Most Experienced</option>
          <option value="experienceYears,asc">Least Experienced</option>
          <option value="fees,asc">Lowest Fee</option>
          <option value="fees,desc">Highest Fee</option>
      `
  
    sortSelect.addEventListener("change", function () {
      currentSearchParams.sort = this.value
      currentSearchParams.page = 0 // Reset to first page
      loadDoctors(0)
    })
  }
  
  function viewDoctorDetails(doctorId) {
    if (!doctorId) {
      console.error("Doctor ID is undefined or null")
      return
    }
  
    const detailsModal = document.getElementById("doctor-details-modal")
    const detailsContent = document.getElementById("doctor-details-content")
    const bookBtn = document.getElementById("book-appointment-btn")
  
    // Show loading state
    detailsContent.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading doctor details...</p>
        </div>
    `
  
    detailsModal.classList.add("active")
  
    fetch(`http://localhost:8080/api/v1/doctors/${doctorId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load doctor details")
        }
        return response.json()
      })
      .then((doctor) => {
        // Generate rating stars
        let ratingStars = ""
        const rating = doctor.rating || 0
        for (let i = 1; i <= 5; i++) {
          if (i <= Math.floor(rating)) {
            ratingStars += '<i class="fas fa-star"></i>'
          } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
            ratingStars += '<i class="fas fa-star-half-alt"></i>'
          } else {
            ratingStars += '<i class="far fa-star"></i>'
          }
        }
  
        // Generate schedule days (client-side only)
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        const today = new Date()
        let scheduleHtml = '<div class="schedule-days">'
  
        days.forEach((day, index) => {
          const date = new Date(today)
          date.setDate(today.getDate() + ((index - today.getDay() + 7) % 7))
          const formattedDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  
          scheduleHtml += `
                    <div class="day-item ${index === 0 ? "active" : ""}" data-day="${day.toLowerCase()}">
                        <div class="day-name">${day.substring(0, 3)}</div>
                        <div class="day-date">${formattedDate}</div>
                    </div>
                `
        })
  
        scheduleHtml += "</div>"
  
        // Generate time slots (client-side only)
        scheduleHtml += '<div class="time-slots">'
        const timeSlots = [
          "09:00 AM",
          "09:30 AM",
          "10:00 AM",
          "10:30 AM",
          "11:00 AM",
          "11:30 AM",
          "01:00 PM",
          "01:30 PM",
          "02:00 PM",
          "02:30 PM",
          "03:00 PM",
          "03:30 PM",
        ]
  
        timeSlots.forEach((slot, index) => {
          const isBooked = index === 2 || index === 5 || index === 8
          scheduleHtml += `
                    <div class="time-slot ${isBooked ? "disabled" : ""}" ${isBooked ? "" : 'data-time="' + slot + '"'}>
                        ${slot}
                    </div>
                `
        })
  
        scheduleHtml += "</div>"
  
        detailsContent.innerHTML = `
                <div class="doctor-profile">
                    <img src="${doctor.profileImage || "/placeholder.svg?height=150&width=150"}" alt="Dr. ${doctor.fullName}" class="doctor-profile-image" onerror="this.src='/placeholder.svg?height=150&width=150'">
                    <div class="doctor-profile-info">
                        <h3 class="doctor-profile-name">Dr. ${doctor.fullName}</h3>
                        <div class="doctor-profile-specialty">${doctor.specialization || "General Practitioner"}</div>
                        <div class="doctor-profile-meta">
                            <div class="meta-item">
                                <i class="fas fa-map-marker-alt"></i> ${doctor.address || "Not specified"}
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-briefcase"></i> ${doctor.experienceYears || "0"} years experience
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-user-md"></i> ${doctor.gender || "Not specified"}
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-language"></i> English, Spanish
                            </div>
                        </div>
                        <div class="doctor-rating">
                            <div class="rating-stars">${ratingStars}</div>
                            <div class="rating-count">(${doctor.reviewCount || "0"} reviews)</div>
                        </div>
                        <div class="consultation-fee">
                            Consultation Fee: <span class="fee-amount">&#8377;${doctor.fees || "50"}</span>
                        </div>
                    </div>
                </div>
                
                <div class="doctor-tabs">
                    <div class="tab-buttons">
                        <button class="tab-button active" data-tab="about">About</button>
                        <button class="tab-button" data-tab="schedule">Schedule</button>
                        <button class="tab-button" data-tab="reviews">Reviews</button>
                    </div>
                    
                    <div id="about-tab" class="tab-content active">
                        <div class="doctor-bio">
                            <h4>About Dr. ${doctor.fullName}</h4>
                            <p>${doctor.bio || "No biography available for this doctor."}</p>
                        </div>
                        
                        <div class="doctor-education">
                            <h4>Education</h4>
                            <div class="education-item">
                                <div class="education-degree">MD in ${doctor.specialization || "Medicine"}</div>
                                <div class="education-institution">Harvard Medical School</div>
                                <div class="education-year">2010 - 2014</div>
                            </div>
                            <div class="education-item">
                                <div class="education-degree">Residency in ${doctor.specialization || "Medicine"}</div>
                                <div class="education-institution">Johns Hopkins Hospital</div>
                                <div class="education-year">2014 - 2018</div>
                            </div>
                        </div>
                        
                        <div class="doctor-experience">
                            <h4>Experience</h4>
                            <div class="experience-item">
                                <div class="experience-position">Senior ${doctor.specialization || "Doctor"}</div>
                                <div class="experience-hospital">Mayo Clinic</div>
                                <div class="experience-period">2018 - Present</div>
                            </div>
                            <div class="experience-item">
                                <div class="experience-position">Consultant ${doctor.specialization || "Doctor"}</div>
                                <div class="experience-hospital">Cleveland Clinic</div>
                                <div class="experience-period">2016 - 2018</div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="schedule-tab" class="tab-content">
                        <div class="doctor-schedule">
                            <h4>Available Time Slots</h4>
                            ${scheduleHtml}
                        </div>
                    </div>
                    
                    <div id="reviews-tab" class="tab-content">
                        <div class="doctor-reviews">
                            <h4>Patient Reviews</h4>
                            <div class="review-item">
                                <div class="review-header">
                                    <div class="reviewer-name">John Doe</div>
                                    <div class="review-date">2 months ago</div>
                                </div>
                                <div class="review-rating">
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                </div>
                                <div class="review-text">
                                    Dr. ${doctor.fullName} was very professional and knowledgeable. The consultation was thorough and I felt well taken care of.
                                </div>
                            </div>
                            <div class="review-item">
                                <div class="review-header">
                                    <div class="reviewer-name">Jane Smith</div>
                                    <div class="review-date">3 months ago</div>
                                </div>
                                <div class="review-rating">
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="far fa-star"></i>
                                </div>
                                <div class="review-text">
                                    Great doctor, but had to wait a bit longer than expected for my appointment. Otherwise, the treatment was excellent.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `
  
        // Initialize tabs
        initTabs()
  
        // Initialize schedule day selection
        initScheduleDays()
  
        // Initialize time slot selection
        initTimeSlots()
  
        // Set doctor ID for book appointment button
        bookBtn.setAttribute("data-doctor-id", doctorId)
      })
      .catch((error) => {
        console.error("Error loading doctor details:", error)
        detailsContent.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load doctor details</p>
                    <button class="btn btn-primary" onclick="viewDoctorDetails(${doctorId})">Try Again</button>
                </div>
            `
      })
  }
  
  function initTabs() {
    const tabButtons = document.querySelectorAll(".tab-button")
    const tabContents = document.querySelectorAll(".tab-content")
  
    tabButtons.forEach((button) => {
      button.addEventListener("click", function () {
        // Remove active class from all buttons and contents
        tabButtons.forEach((btn) => btn.classList.remove("active"))
        tabContents.forEach((content) => content.classList.remove("active"))
  
        // Add active class to clicked button
        this.classList.add("active")
  
        // Show corresponding content
        const tabId = this.getAttribute("data-tab")
        document.getElementById(`${tabId}-tab`).classList.add("active")
      })
    })
  }
  
  function initScheduleDays() {
    const dayItems = document.querySelectorAll(".day-item")
  
    dayItems.forEach((item) => {
      item.addEventListener("click", function () {
        // Remove active class from all days
        dayItems.forEach((day) => day.classList.remove("active"))
  
        // Add active class to clicked day
        this.classList.add("active")
      })
    })
  }
  
  function initTimeSlots() {
    const timeSlots = document.querySelectorAll(".time-slot:not(.disabled)")
  
    timeSlots.forEach((slot) => {
      slot.addEventListener("click", function () {
        // Remove active class from all time slots
        timeSlots.forEach((s) => s.classList.remove("active"))
  
        // Add active class to clicked time slot
        this.classList.add("active")
      })
    })
  }
  
  function bookAppointment(doctorId) {
    if (!doctorId) {
      console.error("Doctor ID is undefined or null")
      return
    }
    window.location.href = `book-appointment.html?doctorId=${doctorId}`
  }
  
  function logout() {
    // Clear local storage
    localStorage.removeItem("userId")
    localStorage.removeItem("userType")
    localStorage.removeItem("userName")
    localStorage.removeItem("userProfileImage")
  
    // Redirect to login page
    window.location.href = "login.html"
  }
  
  function initModals() {
    // Initialization logic for modals can be added here if needed.
    // For example, you might want to attach event listeners to close buttons.
    console.log("Modals initialized")
  }
  