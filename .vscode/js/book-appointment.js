// book-appointment.js
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize user menu dropdown
    initUserMenu();
    
    // Check if there's a doctor ID in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const doctorId = urlParams.get('doctorId');
    
    if (doctorId) {
        // If doctor ID is provided, load that doctor and move to step 2
        loadSelectedDoctor(doctorId);
    } else {
        // Otherwise, load all doctors for selection
        loadSpecialties();
        loadDoctors();
    }
    
    // Initialize booking steps
    initBookingSteps();
    
    // Setup logout functionality
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
});

function initUserMenu() {
    const userProfileToggle = document.getElementById('user-profile-toggle');
    const userDropdown = document.getElementById('user-dropdown');
    
    userProfileToggle.addEventListener('click', function() {
        userDropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!userProfileToggle.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('active');
        }
    });
    
    // Set user name and profile image
    const userName = localStorage.getItem('userName') || 'User';
    const userProfileImage = localStorage.getItem('userProfileImage') || '/placeholder.svg?height=40&width=40';
    
    document.getElementById('user-name').textContent = userName;
    
    const headerProfileImage = document.getElementById('header-profile-image');
    headerProfileImage.src = userProfileImage;
    headerProfileImage.onerror = function() {
        this.src = '/placeholder.svg?height=40&width=40';
    };
}

function loadSpecialties() {
    const specialtyFilter = document.getElementById('specialty-filter');
    
    // Add a default empty option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'All Specialties';
    specialtyFilter.appendChild(defaultOption);

    // Fetch doctors and extract specialties
    fetch('http://localhost:8080/api/v1/doctors/search?size=100') // Increase page size to get more doctors
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load doctors');
            }
            return response.json();
        })
        .then(data => {
            // Extract unique specialties from doctor data
            const specialties = new Set();
            data.content.forEach(doctor => {
                if (doctor.speciality) {
                    specialties.add(doctor.speciality);
                }
            });
            
            // Add specialties to dropdown
            Array.from(specialties).sort().forEach(specialty => {
                const option = document.createElement('option');
                option.value = specialty;
                option.textContent = specialty;
                specialtyFilter.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading specialties:', error);
        });
}
// function loadSpecialties() {
//     const specialtyFilter = document.getElementById('specialty-filter');
    
//     fetch('http://localhost:8080/api/v1/doctors/search')
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Failed to load specialties');
//             }
//             return response.json();
//         })
//         .then(specialties => {
//             specialties.forEach(specialty => {
//                 const option = document.createElement('option');
//                 option.value = specialty.id;
//                 option.textContent = specialty.name;
//                 specialtyFilter.appendChild(option);
//             });
//         })
//         .catch(error => {
//             console.error('Error loading specialties:', error);
//         });
// }

function loadDoctors(page = 0, specialty = '') {
    const doctorsContainer = document.getElementById('doctors-container');
    const paginationContainer = document.getElementById('pagination-container');
    
    // Show loading spinner
    doctorsContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading doctors...</p>
        </div>
    `;
    
    // Build query parameters
    let queryParams = `page=${page}&size=6`;
    
    if (specialty) {
        queryParams += `&specialtyId=${specialty}`;
    }
    
    fetch(`http://localhost:8080/api/v1/doctors?${queryParams}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load doctors');
            }
            return response.json();
        })
        .then(data => {
            doctorsContainer.innerHTML = '';
            
            if (data.content && data.content.length > 0) {
                data.content.forEach(doctor => {
                    const doctorItem = createDoctorItem(doctor);
                    doctorsContainer.appendChild(doctorItem);
                });
                
                // Create pagination
                createPagination(data, page, specialty);
            } else {
                doctorsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-user-md"></i>
                        <p>No doctors found</p>
                    </div>
                `;
                paginationContainer.innerHTML = '';
            }
        })
        .catch(error => {
            console.error('Error loading doctors:', error);
            doctorsContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load doctors</p>
                    <button class="btn btn-primary" onclick="loadDoctors()">Try Again</button>
                </div>
            `;
            paginationContainer.innerHTML = '';
        });
}

function createDoctorItem(doctor) {
    const doctorItem = document.createElement('div');
    doctorItem.className = 'doctor-item';
    doctorItem.setAttribute('data-doctor-id', doctor.id);
    
    // Generate rating stars
    let ratingStars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(doctor.rating)) {
            ratingStars += '<i class="fas fa-star"></i>';
        } else if (i === Math.ceil(doctor.rating) && doctor.rating % 1 !== 0) {
            ratingStars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            ratingStars += '<i class="far fa-star"></i>';
        }
    }
    
    doctorItem.innerHTML = `
        <div class="doctor-item-header">
            <img src="${doctor.profileImage || '/placeholder.svg?height=80&width=80'}" alt="Dr. ${doctor.fullName}" class="doctor-avatar" onerror="this.src='/placeholder.svg?height=80&width=80'">
            <div class="doctor-info">
                <div class="doctor-name">Dr. ${doctor.fullName}</div>
                <div class="doctor-specialty">${doctor.specialization}</div>
                <div class="doctor-meta">
                    <div class="meta-item">
                        <i class="fas fa-map-marker-alt"></i> ${doctor.address || 'Not specified'}
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-briefcase"></i> ${doctor.experienceYears || '0'} years
                    </div>
                </div>
            </div>
        </div>
        <div class="doctor-item-footer">
            <div class="doctor-fee">Fee: &#8377;${doctor.fees || '50'}</div>
            <div class="doctor-rating">
                <div class="rating-stars">${ratingStars}</div>
                <span>(${doctor.reviewCount || '0'})</span>
            </div>
        </div>
    `;
    
    // Add click event to select doctor
    doctorItem.addEventListener('click', function() {
        selectDoctor(doctor.id);
    });
    
    return doctorItem;
}

function createPagination(data, currentPage, specialty) {
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = '';
    
    if (data.totalPages <= 1) {
        return;
    }
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.className = `page-item ${data.first ? 'disabled' : ''}`;
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    if (!data.first) {
        prevButton.addEventListener('click', () => loadDoctors(currentPage - 1, specialty));
    }
    paginationContainer.appendChild(prevButton);
    
    // Page numbers
    for (let i = 0; i < data.totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageButton.textContent = i + 1;
        pageButton.addEventListener('click', () => loadDoctors(i, specialty));
        paginationContainer.appendChild(pageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = `page-item ${data.last ? 'disabled' : ''}`;
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    if (!data.last) {
        nextButton.addEventListener('click', () => loadDoctors(currentPage + 1, specialty));
    }
    paginationContainer.appendChild(nextButton);
}

function selectDoctor(doctorId) {
    // Remove selected class from all doctor items
    const doctorItems = document.querySelectorAll('.doctor-item');
    doctorItems.forEach(item => item.classList.remove('selected'));
    
    // Add selected class to clicked doctor item
    const selectedItem = document.querySelector(`.doctor-item[data-doctor-id="${doctorId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
    
    // Enable next button
    const nextButton = document.getElementById('next-to-step-2');
    nextButton.disabled = false;
    nextButton.setAttribute('data-doctor-id', doctorId);
}

function loadSelectedDoctor(doctorId) {
    fetch(`http://localhost:8080/api/v1/doctors/${doctorId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load doctor details');
            }
            return response.json();
        })
        .then(doctor => {
            // Store doctor data in session storage for use in later steps
            sessionStorage.setItem('selectedDoctor', JSON.stringify(doctor));
            
            // If we're on step 1, select the doctor and enable next button
            if (document.getElementById('step-1').classList.contains('active')) {
                const nextButton = document.getElementById('next-to-step-2');
                nextButton.disabled = false;
                nextButton.setAttribute('data-doctor-id', doctorId);
                
                // Move to step 2
                nextButton.click();
            } else {
                // If we're already past step 1, update the selected doctor info
                updateSelectedDoctorInfo(doctor);
                
                // Generate calendar
                generateCalendar();
            }
        })
        .catch(error => {
            console.error('Error loading doctor details:', error);
            alert('Failed to load doctor details. Please try again.');
        });
}

function updateSelectedDoctorInfo(doctor) {
    const selectedDoctorInfo = document.getElementById('selected-doctor-info');
    
    // Generate rating stars
    let ratingStars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(doctor.rating)) {
            ratingStars += '<i class="fas fa-star"></i>';
        } else if (i === Math.ceil(doctor.rating) && doctor.rating % 1 !== 0) {
            ratingStars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            ratingStars += '<i class="far fa-star"></i>';
        }
    }
    
    selectedDoctorInfo.innerHTML = `
        <img src="${doctor.profileImage || '/placeholder.svg?height=60&width=60'}" alt="Dr. ${doctor.fullName}" class="selected-doctor-avatar" onerror="this.src='/placeholder.svg?height=60&width=60'">
        <div class="selected-doctor-details">
            <div class="selected-doctor-name">Dr. ${doctor.fullName}</div>
            <div class="selected-doctor-specialty">${doctor.specialization}</div>
            <div class="selected-doctor-meta">
                <div class="meta-item">
                    <i class="fas fa-map-marker-alt"></i> ${doctor.location || 'Not specified'}
                </div>
                <div class="meta-item">
                    <i class="fas fa-briefcase"></i> ${doctor.experience || '0'} years
                </div>
                <div class="meta-item">
                    <i class="fas fa-star"></i> ${doctor.rating || '0'} (${doctor.reviewCount || '0'} reviews)
                </div>
                <div class="meta-item">
                    <i class="fas fa-dollar-sign"></i> $${doctor.consultationFee || '50'} per consultation
                </div>
            </div>
        </div>
    `;
}

function generateCalendar() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    renderCalendar(currentMonth, currentYear);
    
    // Set up month navigation
    document.getElementById('prev-month').addEventListener('click', function() {
        const currentMonthText = document.getElementById('current-month').textContent;
        const [monthName, year] = currentMonthText.split(' ');
        
        const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
        const yearValue = parseInt(year);
        
        let newMonth = monthIndex - 1;
        let newYear = yearValue;
        
        if (newMonth < 0) {
            newMonth = 11;
            newYear--;
        }
        
        renderCalendar(newMonth, newYear);
    });
    
    document.getElementById('next-month').addEventListener('click', function() {
        const currentMonthText = document.getElementById('current-month').textContent;
        const [monthName, year] = currentMonthText.split(' ');
        
        const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
        const yearValue = parseInt(year);
        
        let newMonth = monthIndex + 1;
        let newYear = yearValue;
        
        if (newMonth > 11) {
            newMonth = 0;
            newYear++;
        }
        
        renderCalendar(newMonth, newYear);
    });
}

function renderCalendar(month, year) {
    const calendarDays = document.getElementById('calendar-days');
    const currentMonthText = document.getElementById('current-month');
    
    // Set current month text
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    currentMonthText.textContent = `${monthNames[month]} ${year}`;
    
    // Clear previous calendar days
    calendarDays.innerHTML = '';
    
    // Get first day of month and total days in month
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get days from previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    // Current date for highlighting today
    const today = new Date();
    
    // Create calendar grid
    let dayCount = 1;
    let nextMonthDay = 1;
    
    // Create 6 rows (max possible for a month)
    for (let i = 0; i < 42; i++) {
        const dayElement = document.createElement('div');
        
        // Previous month days
        if (i < firstDay) {
            const prevMonthDate = daysInPrevMonth - (firstDay - i - 1);
            dayElement.textContent = prevMonthDate;
            dayElement.className = 'calendar-day other-month';
        }
        // Current month days
        else if (dayCount <= daysInMonth) {
            dayElement.textContent = dayCount;
            dayElement.className = 'calendar-day';
            
            // Check if it's today
            if (dayCount === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayElement.classList.add('today');
            }
            
            // Check if it's a past date
            const currentDate = new Date(year, month, dayCount);
            if (currentDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
                dayElement.classList.add('disabled');
            } else {
                // Add click event for valid dates
                dayElement.addEventListener('click', function() {
                    selectDate(this, year, month, dayCount);
                });
            }
            
            dayCount++;
        }
        // Next month days
        else {
            dayElement.textContent = nextMonthDay;
            dayElement.className = 'calendar-day other-month';
            nextMonthDay++;
        }
        
        calendarDays.appendChild(dayElement);
    }
}

function selectDate(dayElement, year, month, day) {
    // Remove selected class from all days
    const calendarDays = document.querySelectorAll('.calendar-day');
    calendarDays.forEach(day => day.classList.remove('selected'));
    
    // Add selected class to clicked day
    dayElement.classList.add('selected');
    
    // Store selected date
    const selectedDate = new Date(year, month, day);
    sessionStorage.setItem('selectedDate', selectedDate.toISOString());
    
    // Load time slots for selected date
    loadTimeSlots(selectedDate);
}

function loadTimeSlots(date) {
    const timeSlotsContainer = document.getElementById('time-slots');
    const doctorId = JSON.parse(sessionStorage.getItem('selectedDoctor')).id;
    
    // Format date as YYYY-MM-DD
    const formattedDate = date.toISOString().split('T')[0];
    
    // Show loading state
    timeSlotsContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading available slots...</p>
        </div>
    `;
    
    fetch(`http://localhost:8080/api/v1/doctors/${doctorId}/slots?date=${formattedDate}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load time slots');
            }
            return response.json();
        })
        .then(slots => {
            timeSlotsContainer.innerHTML = '';
            
            if (slots && slots.length > 0) {
                slots.forEach(slot => {
                    const timeSlot = document.createElement('div');
                    timeSlot.className = 'time-slot';
                    timeSlot.textContent = slot.time;
                    
                    if (slot.available) {
                        timeSlot.addEventListener('click', function() {
                            selectTimeSlot(this, slot.time);
                        });
                    } else {
                        timeSlot.classList.add('disabled');
                    }
                    
                    timeSlotsContainer.appendChild(timeSlot);
                });
            } else {
                // If no slots returned from API, generate some sample slots
                const sampleSlots = generateSampleTimeSlots();
                
                sampleSlots.forEach(slot => {
                    const timeSlot = document.createElement('div');
                    timeSlot.className = 'time-slot';
                    timeSlot.textContent = slot.time;
                    
                    if (slot.available) {
                        timeSlot.addEventListener('click', function() {
                            selectTimeSlot(this, slot.time);
                        });
                    } else {
                        timeSlot.classList.add('disabled');
                    }
                    
                    timeSlotsContainer.appendChild(timeSlot);
                });
            }
        })
        .catch(error => {
            console.error('Error loading time slots:', error);
            
            // Generate sample time slots in case of error
            timeSlotsContainer.innerHTML = '';
            const sampleSlots = generateSampleTimeSlots();
            
            sampleSlots.forEach(slot => {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                timeSlot.textContent = slot.time;
                
                if (slot.available) {
                    timeSlot.addEventListener('click', function() {
                        selectTimeSlot(this, slot.time);
                    });
                } else {
                    timeSlot.classList.add('disabled');
                }
                
                timeSlotsContainer.appendChild(timeSlot);
            });
        });
}

function generateSampleTimeSlots() {
    // Generate sample time slots (9 AM to 5 PM, 30-minute intervals)
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            
            // Randomly mark some slots as unavailable
            const available = Math.random() > 0.3;
            
            slots.push({
                time: formatTime(time),
                available: available
            });
        }
    }
    
    return slots;
}

function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    
    return `${formattedHour}:${minutes} ${ampm}`;
}

function selectTimeSlot(slotElement, time) {
    // Remove selected class from all time slots
    const timeSlots = document.querySelectorAll('.time-slot');
    timeSlots.forEach(slot => slot.classList.remove('selected'));
    
    // Add selected class to clicked time slot
    slotElement.classList.add('selected');
    
    // Store selected time
    sessionStorage.setItem('selectedTime', time);
    
    // Enable next button
    document.getElementById('next-to-step-3').disabled = false;
}

function initBookingSteps() {
    // Step 1 to Step 2
    document.getElementById('next-to-step-2').addEventListener('click', function() {
        const doctorId = this.getAttribute('data-doctor-id');
        
        // Load selected doctor details
        loadSelectedDoctor(doctorId);
        
        // Show step 2
        showStep(2);
    });
    
    // Step 2 to Step 1
    document.getElementById('back-to-step-1').addEventListener('click', function() {
        showStep(1);
    });
    
    // Step 2 to Step 3
    document.getElementById('next-to-step-3').addEventListener('click', function() {
        // Update appointment summary
        updateAppointmentSummary();
        
        // Load user details for self appointment
        loadUserDetails();
        
        // Show step 3
        showStep(3);
    });
    
    // Step 3 to Step 2
    document.getElementById('back-to-step-2').addEventListener('click', function() {
        showStep(2);
    });
    
    // Step 3 to Step 4
    document.getElementById('next-to-step-4').addEventListener('click', function() {
        // Validate patient details
        if (!validatePatientDetails()) {
            return;
        }
        
        // Update payment summary
        updatePaymentSummary();
        
        // Show step 4
        showStep(4);
    });
    
    // Step 4 to Step 3
    document.getElementById('back-to-step-3').addEventListener('click', function() {
        showStep(3);
    });
    
    // Step 4 to Step 5 (Make Payment)
    document.getElementById('make-payment').addEventListener('click', function() {
        // Validate payment details
        if (!validatePaymentDetails()) {
            return;
        }
        
        // Process payment and book appointment
        processPaymentAndBookAppointment();
    });
    
    // Toggle between self and other patient details
    const appointmentForRadios = document.querySelectorAll('input[name="appointmentFor"]');
    appointmentForRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const selfDetails = document.getElementById('self-details');
            const otherDetails = document.getElementById('other-details');
            
            if (this.value === 'self') {
                selfDetails.classList.add('active');
                otherDetails.classList.remove('active');
            } else {
                selfDetails.classList.remove('active');
                otherDetails.classList.add('active');
            }
        });
    });
    
    // Toggle payment method forms
    const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
    paymentMethodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const paymentForms = document.querySelectorAll('.payment-form');
            paymentForms.forEach(form => form.classList.remove('active'));
            
            document.getElementById(`${this.value}-payment-form`).classList.add('active');
        });
    });
    
    // Download receipt button
    document.getElementById('download-receipt').addEventListener('click', function() {
        generateReceipt();
    });
}

function showStep(stepNumber) {
    // Update steps
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        if (index + 1 < stepNumber) {
            step.classList.remove('active');
            step.classList.add('completed');
        } else if (index + 1 === stepNumber) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
    
    // Update step content
    const stepContents = document.querySelectorAll('.booking-step-content');
    stepContents.forEach((content, index) => {
        if (index + 1 === stepNumber) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

function updateAppointmentSummary() {
    const summaryContainer = document.getElementById('appointment-summary');
    const doctor = JSON.parse(sessionStorage.getItem('selectedDoctor'));
    const selectedDate = new Date(sessionStorage.getItem('selectedDate'));
    const selectedTime = sessionStorage.getItem('selectedTime');
    
    const formattedDate = selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    summaryContainer.innerHTML = `
        <div class="summary-item">
            <div class="summary-label">Doctor</div>
            <div class="summary-value">Dr. ${doctor.fullName}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Specialty</div>
            <div class="summary-value">${doctor.specialization}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Date</div>
            <div class="summary-value">${formattedDate}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Time</div>
            <div class="summary-value">${selectedTime}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Consultation Fee</div>
            <div class="summary-value">$${doctor.consultationFee || '50'}</div>
        </div>
    `;
}

function loadUserDetails() {
    const userId = localStorage.getItem('userId');
    
    fetch(`http://localhost:8080/api/users/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load user data');
            }
            return response.json();
        })
        .then(user => {
            // Calculate age from date of birth
            let age = '';
            if (user.dateOfBirth) {
                const dob = new Date(user.dateOfBirth);
                const today = new Date();
                age = today.getFullYear() - dob.getFullYear();
                
                // Adjust age if birthday hasn't occurred yet this year
                const monthDiff = today.getMonth() - dob.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                    age--;
                }
            }
            
            // Fill self details form
            document.getElementById('self-name').value = user.fullName;
            document.getElementById('self-email').value = user.email;
            document.getElementById('self-phone').value = user.phone;
            document.getElementById('self-gender').value = user.gender;
            document.getElementById('self-age').value = age;
            
            // Store user data for appointment booking
            sessionStorage.setItem('userData', JSON.stringify(user));
        })
        .catch(error => {
            console.error('Error loading user data:', error);
            alert('Failed to load user data. Please try again.');
        });
}

function validatePatientDetails() {
    const appointmentFor = document.querySelector('input[name="appointmentFor"]:checked').value;
    
    if (appointmentFor === 'other') {
        // Validate other patient details
        const name = document.getElementById('other-name').value.trim();
        const email = document.getElementById('other-email').value.trim();
        const phone = document.getElementById('other-phone').value.trim();
        const gender = document.getElementById('other-gender').value;
        const age = document.getElementById('other-age').value;
        const relationship = document.getElementById('relationship').value;
        
        if (!name || !email || !phone || !gender || !age || !relationship) {
            alert('Please fill in all required fields for the patient.');
            return false;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address.');
            return false;
        }
        
        // Validate phone format
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
            alert('Please enter a valid 10-digit phone number.');
            return false;
        }
        
        // Validate age
        if (age < 1 || age > 120) {
            alert('Please enter a valid age between 1 and 120.');
            return false;
        }
    }
    
    // Validate reason for visit
    const reason = document.getElementById('reason').value.trim();
    if (!reason) {
        alert('Please provide a reason for the visit.');
        return false;
    }
    
    return true;
}

function updatePaymentSummary() {
    const summaryContainer = document.getElementById('payment-summary');
    const doctor = JSON.parse(sessionStorage.getItem('selectedDoctor'));
    const selectedDate = new Date(sessionStorage.getItem('selectedDate'));
    const selectedTime = sessionStorage.getItem('selectedTime');
    
    const formattedDate = selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    // Calculate taxes and total
    const consultationFee = parseFloat(doctor.consultationFee || 50);
    const platformFee = 5;
    const taxRate = 0.18; // 18% tax
    const taxAmount = (consultationFee + platformFee) * taxRate;
    const totalAmount = consultationFee + platformFee + taxAmount;
    
    summaryContainer.innerHTML = `
        <div class="summary-item">
            <div class="summary-label">Doctor</div>
            <div class="summary-value">Dr. ${doctor.fullName}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Appointment</div>
            <div class="summary-value">${formattedDate} at ${selectedTime}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Patient</div>
            <div class="summary-value">
                ${document.querySelector('input[name="appointmentFor"]:checked').value === 'self' 
                    ? document.getElementById('self-name').value 
                    : document.getElementById('other-name').value}
            </div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Consultation Fee</div>
            <div class="summary-value">$${consultationFee.toFixed(2)}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Platform Fee</div>
            <div class="summary-value">$${platformFee.toFixed(2)}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Tax (18%)</div>
            <div class="summary-value">$${taxAmount.toFixed(2)}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Total Amount</div>
            <div class="summary-value">$${totalAmount.toFixed(2)}</div>
        </div>
    `;
    
    // Store payment details for booking
    sessionStorage.setItem('paymentDetails', JSON.stringify({
        consultationFee,
        platformFee,
        taxAmount,
        totalAmount
    }));
}

function validatePaymentDetails() {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    if (paymentMethod === 'card') {
        const cardNumber = document.getElementById('card-number').value.trim().replace(/\s/g, '');
        const expiryDate = document.getElementById('expiry-date').value.trim();
        const cvv = document.getElementById('cvv').value.trim();
        const cardName = document.getElementById('card-name').value.trim();
        
        if (!cardNumber || !expiryDate || !cvv || !cardName) {
            alert('Please fill in all card details.');
            return false;
        }
        
        // Validate card number (simple check for 16 digits)
        if (!/^\d{16}$/.test(cardNumber)) {
            alert('Please enter a valid 16-digit card number.');
            return false;
        }
        
        // Validate expiry date (MM/YY format)
        if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
            alert('Please enter a valid expiry date in MM/YY format.');
            return false;
        }
        
        // Validate CVV (3 digits)
        if (!/^\d{3}$/.test(cvv)) {
            alert('Please enter a valid 3-digit CVV.');
            return false;
        }
    } else if (paymentMethod === 'upi') {
        const upiId = document.getElementById('upi-id').value.trim();
        
        if (!upiId) {
            alert('Please enter your UPI ID.');
            return false;
        }
        
        // Validate UPI ID format
        if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(upiId)) {
            alert('Please enter a valid UPI ID (e.g., username@upi).');
            return false;
        }
    } else if (paymentMethod === 'netbanking') {
        const bank = document.getElementById('bank-select').value;
        
        if (!bank) {
            alert('Please select a bank.');
            return false;
        }
    } else if (paymentMethod === 'wallet') {
        const wallet = document.getElementById('wallet-select').value;
        
        if (!wallet) {
            alert('Please select a wallet.');
            return false;
        }
    }
    
    // Check terms and conditions
    if (!document.getElementById('terms-checkbox').checked) {
        alert('Please accept the terms and conditions.');
        return false;
    }
    
    return true;
}

function processPaymentAndBookAppointment() {
    // Show loading state
    const paymentButton = document.getElementById('make-payment');
    paymentButton.disabled = true;
    paymentButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    // Get appointment details
    const doctor = JSON.parse(sessionStorage.getItem('selectedDoctor'));
    const selectedDate = new Date(sessionStorage.getItem('selectedDate'));
    const selectedTime = sessionStorage.getItem('selectedTime');
    const paymentDetails = JSON.parse(sessionStorage.getItem('paymentDetails'));
    const userId = localStorage.getItem('userId');
    
    // Format date as YYYY-MM-DD
    const formattedDate = selectedDate.toISOString().split('T')[0];
    
    // Get patient details
    const appointmentFor = document.querySelector('input[name="appointmentFor"]:checked').value;
    let patientDetails;
    
    if (appointmentFor === 'self') {
        patientDetails = {
            name: document.getElementById('self-name').value,
            email: document.getElementById('self-email').value,
            phone: document.getElementById('self-phone').value,
            gender: document.getElementById('self-gender').value,
            age: document.getElementById('self-age').value,
            relationship: 'SELF'
        };
    } else {
        patientDetails = {
            name: document.getElementById('other-name').value,
            email: document.getElementById('other-email').value,
            phone: document.getElementById('other-phone').value,
            gender: document.getElementById('other-gender').value,
            age: document.getElementById('other-age').value,
            relationship: document.getElementById('relationship').value
        };
    }
    
    // Get reason for visit and medical history
    const reason = document.getElementById('reason').value;
    const medicalHistory = document.getElementById('medical-history').value;
    
    // Create appointment data
    const appointmentData = {
        doctorId: doctor.id,
        patientId: userId,
        appointmentDate: formattedDate,
        appointmentTime: convertTo24HourFormat(selectedTime),
        patientName: patientDetails.name,
        patientEmail: patientDetails.email,
        patientPhone: patientDetails.phone,
        patientGender: patientDetails.gender,
        patientAge: patientDetails.age,
        relationship: patientDetails.relationship,
        reason: reason,
        medicalHistory: medicalHistory,
        amount: paymentDetails.totalAmount,
        paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value.toUpperCase()
    };
    
    // Send appointment data to server
    fetch('http://localhost:8080/api/v1/appointments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to book appointment');
        }
        return response.json();
    })
    .then(appointment => {
        // Store appointment data for confirmation
        sessionStorage.setItem('bookedAppointment', JSON.stringify(appointment));
        
        // Update confirmation details
        updateConfirmationDetails(appointment);
        
        // Show step 5 (confirmation)
        showStep(5);
    })
    .catch(error => {
        console.error('Error booking appointment:', error);
        alert('Failed to book appointment. Please try again.');
    })
    .finally(() => {
        // Reset payment button
        paymentButton.disabled = false;
        paymentButton.textContent = 'Make Payment';
    });
}

function convertTo24HourFormat(time12h) {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
        hours = '00';
    }
    
    if (modifier === 'PM') {
        hours = parseInt(hours, 10) + 12;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

function updateConfirmationDetails(appointment) {
    const confirmationDetails = document.getElementById('confirmation-details');
    const doctor = JSON.parse(sessionStorage.getItem('selectedDoctor'));
    const appointmentDate = new Date(appointment.appointmentDate + 'T' + appointment.appointmentTime);
    
    const formattedDate = appointmentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    confirmationDetails.innerHTML = `
        <div class="summary-item">
            <div class="summary-label">Appointment ID</div>
            <div class="summary-value">${appointment.appointmentId}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Doctor</div>
            <div class="summary-value">Dr. ${doctor.fullName}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Specialty</div>
            <div class="summary-value">${doctor.specialization}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Date & Time</div>
            <div class="summary-value">${formattedDate} at ${formattedTime}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Patient</div>
            <div class="summary-value">${appointment.patientName}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Status</div>
            <div class="summary-value">${appointment.appointmentStatus}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Payment Status</div>
            <div class="summary-value">${appointment.paymentStatus}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Amount Paid</div>
            <div class="summary-value">$${appointment.amount.toFixed(2)}</div>
        </div>
    `;
}

function generateReceipt() {
    const appointment = JSON.parse(sessionStorage.getItem('bookedAppointment'));
    const doctor = JSON.parse(sessionStorage.getItem('selectedDoctor'));
    const paymentDetails = JSON.parse(sessionStorage.getItem('paymentDetails'));
    
    // Create a receipt window
    const receiptWindow = window.open('', '_blank');
    
    // Generate receipt HTML
    const receiptHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Appointment Receipt - DocOnClick</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .receipt {
                    border: 1px solid #ddd;
                    padding: 20px;
                    border-radius: 5px;
                }
                .receipt-header {
                    text-align: center;
                    margin-bottom: 20px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #ddd;
                }
                .logo {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 10px;
                }
                .logo-icon {
                    width: 40px;
                    height: 40px;
                    background-color: #007bff;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 20px;
                    margin-right: 10px;
                }
                .logo-text {
                    font-size: 24px;
                    font-weight: bold;
                }
                .receipt-title {
                    font-size: 20px;
                    margin-bottom: 5px;
                }
                .receipt-date {
                    color: #666;
                }
                .receipt-details {
                    margin-bottom: 20px;
                }
                .detail-row {
                    display: flex;
                    margin-bottom: 10px;
                }
                .detail-label {
                    width: 200px;
                    font-weight: bold;
                }
                .detail-value {
                    flex: 1;
                }
                .payment-details {
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                }
                .payment-row {
                    display: flex;
                    margin-bottom: 10px;
                }
                .payment-label {
                    width: 200px;
                }
                .payment-value {
                    flex: 1;
                    text-align: right;
                }
                .payment-total {
                    font-weight: bold;
                    font-size: 18px;
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid #ddd;
                }
                .receipt-footer {
                    margin-top: 30px;
                    text-align: center;
                    color: #666;
                    font-size: 14px;
                }
                @media print {
                    body {
                        padding: 0;
                    }
                    .print-button {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="receipt-header">
                    <div class="logo">
                        <div class="logo-icon">D</div>
                        <div class="logo-text">DocOnClick</div>
                    </div>
                    <div class="receipt-title">Appointment Receipt</div>
                    <div class="receipt-date">Date: ${new Date().toLocaleDateString()}</div>
                </div>
                
                <div class="receipt-details">
                    <h3>Appointment Details</h3>
                    <div class="detail-row">
                        <div class="detail-label">Appointment ID:</div>
                        <div class="detail-value">${appointment.appointmentId}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Doctor:</div>
                        <div class="detail-value">Dr. ${doctor.fullName}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Specialty:</div>
                        <div class="detail-value">${doctor.specialization}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Date:</div>
                        <div class="detail-value">${new Date(appointment.appointmentDate).toLocaleDateString()}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Time:</div>
                        <div class="detail-value">${appointment.appointmentTime}</div>
                    </div>
                </div>
                
                <div class="receipt-details">
                    <h3>Patient Details</h3>
                    <div class="detail-row">
                        <div class="detail-label">Name:</div>
                        <div class="detail-value">${appointment.patientName}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Email:</div>
                        <div class="detail-value">${appointment.patientEmail}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Phone:</div>
                        <div class="detail-value">${appointment.patientPhone}</div>
                    </div>
                </div>
                
                <div class="payment-details">
                    <h3>Payment Details</h3>
                    <div class="payment-row">
                        <div class="payment-label">Consultation Fee:</div>
                        <div class="payment-value">$${paymentDetails.consultationFee.toFixed(2)}</div>
                    </div>
                    <div class="payment-row">
                        <div class="payment-label">Platform Fee:</div>
                        <div class="payment-value">$${paymentDetails.platformFee.toFixed(2)}</div>
                    </div>
                    <div class="payment-row">
                        <div class="payment-label">Tax (18%):</div>
                        <div class="payment-value">$${paymentDetails.taxAmount.toFixed(2)}</div>
                    </div>
                    <div class="payment-row payment-total">
                        <div class="payment-label">Total Amount:</div>
                        <div class="payment-value">$${paymentDetails.totalAmount.toFixed(2)}</div>
                    </div>
                    <div class="payment-row">
                        <div class="payment-label">Payment Method:</div>
                        <div class="payment-value">${appointment.paymentMethod}</div>
                    </div>
                    <div class="payment-row">
                        <div class="payment-label">Payment Status:</div>
                        <div class="payment-value">${appointment.paymentStatus}</div>
                    </div>
                </div>
                
                <div class="receipt-footer">
                    <p>Thank you for choosing DocOnClick for your healthcare needs.</p>
                    <p>For any queries, please contact us at info@doconclick.com or +123 456 7890.</p>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button class="print-button" onclick="window.print()">Print Receipt</button>
            </div>
        </body>
        </html>
    `;
    
    // Write receipt HTML to the new window
    receiptWindow.document.write(receiptHtml);
    receiptWindow.document.close();
}

function logout() {
    // Clear local storage
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    localStorage.removeItem('userName');
    localStorage.removeItem('userProfileImage');
    
    // Clear session storage
    sessionStorage.clear();
    
    // Redirect to login page
    window.location.href = 'login.html';
}