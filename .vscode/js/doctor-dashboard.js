document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in as a doctor
    const userType = localStorage.getItem('userType');
    const doctorId = localStorage.getItem('doctorId');
    
    if (userType !== 'DOCTOR' || !doctorId) {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('active');
    });
    
    // Initialize logout button
    const logoutBtn = document.getElementById('logout-btn');
    
    logoutBtn.addEventListener('click', function() {
        // Clear localStorage
        localStorage.clear();
        
        // Redirect to login page
        window.location.href = 'login.html';
    });
    
    // Load doctor profile
    loadDoctorProfile();
    
    // Load dashboard data
    loadDashboardStats();
    loadTodayAppointments();
    loadRecentPatients();
    loadRecentActivity();
    
    // Initialize calendar
    initializeCalendar();
    
    // Initialize modals
    initializeModals();
});

// Load doctor profile
async function loadDoctorProfile() {
    const doctorId = localStorage.getItem('doctorId');
    const doctorName = localStorage.getItem('userName');
    const doctorSpecialization = localStorage.getItem('userSpecialization');
    const doctorProfileImage = localStorage.getItem('userProfileImage');
    
    // Update profile in sidebar
    document.getElementById('doctor-name').textContent = doctorName || 'Doctor';
    document.getElementById('doctor-specialization').textContent = doctorSpecialization || 'Specialist';
    
    if (doctorProfileImage) {
        document.getElementById('doctor-avatar').src = doctorProfileImage;
    }
    
    // Update welcome message
    document.getElementById('welcome-message').textContent = `Welcome back, ${doctorName || 'Doctor'}`;
    
    // If we don't have complete profile data in localStorage, fetch it from API
    if (!doctorSpecialization) {
        try {
            const response = await fetch(`http://localhost:8080/api/v1/doctors/${doctorId}`);
            
            if (response.ok) {
                const doctorData = await response.json();
                
                // Update localStorage with complete data
                localStorage.setItem('userName', doctorData.fullName);
                localStorage.setItem('userSpecialization', doctorData.specialization);
                
                if (doctorData.profileImage) {
                    localStorage.setItem('userProfileImage', doctorData.profileImage);
                    document.getElementById('doctor-avatar').src = doctorData.profileImage;
                }
                
                // Update UI
                document.getElementById('doctor-name').textContent = doctorData.fullName;
                document.getElementById('doctor-specialization').textContent = doctorData.specialization;
                document.getElementById('welcome-message').textContent = `Welcome back, ${doctorData.fullName}`;
            }
        } catch (error) {
            console.error('Error loading doctor profile:', error);
        }
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    const doctorId = localStorage.getItem('doctorId');
    
    try {
        // Fetch today's appointments count
        const appointmentsResponse = await fetch(`http://localhost:8080/api/v1/appointments/doctor/${doctorId}/today`);
        
        if (appointmentsResponse.ok) {
            const appointmentsData = await appointmentsResponse.json();
            document.getElementById('today-appointments').textContent = appointmentsData.content?.length || 0;
            
            // Update next appointment info
            if (appointmentsData.content?.length > 0) {
                const nextAppointment = appointmentsData.content[0];
                const appointmentTime = formatTime(nextAppointment.appointmentTime);
                document.getElementById('next-appointment').textContent = `${nextAppointment.patientName} at ${appointmentTime}`;
            }
        }
        
        // Fetch total patients count
        const patientsResponse = await fetch(`http://localhost:8080/api/v1/appointments/${doctorId}/patients/count`);
        
        if (patientsResponse.ok) {
            const patientsData = await patientsResponse.json();
            document.getElementById('total-patients').textContent = patientsData.totalPatients || 0;
            document.getElementById('new-patients').textContent = `${patientsData.newPatientsThisMonth || 0} new`;
        }
        
        // Fetch revenue data
        const revenueResponse = await fetch(`http://localhost:8080/api/v1/doctor/${doctorId}/revenue`);
        
        if (revenueResponse.ok) {
            const revenueData = await revenueResponse.json();
            document.getElementById('total-revenue').textContent = `₹${revenueData.totalRevenue || 0}`;
            document.getElementById('month-revenue').textContent = `₹${revenueData.monthlyRevenue || 0}`;
        }
        
        // Fetch ratings
        const ratingsResponse = await fetch(`http://localhost:8080/api/v1/reviews/doctor/${doctorId}/rating`);
        
        if (ratingsResponse.ok) {
            const rating = await ratingsResponse.json();
            document.getElementById('average-rating').textContent = rating.toFixed(1) || '0.0';
            
            // Fetch review count
            const reviewsResponse = await fetch(`http://localhost:8080/api/v1/reviews/doctor/${doctorId}`);
            
            if (reviewsResponse.ok) {
                const reviewsData = await reviewsResponse.json();
                document.getElementById('review-count').textContent = reviewsData.totalElements || 0;
            }
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load today's appointments
async function loadTodayAppointments() {
    const doctorId = localStorage.getItem('doctorId');
    const tableBody = document.querySelector('#appointments-table tbody');
    
    try {
        const response = await fetch(`http://localhost:8080/api/v1/appointments/doctor/${doctorId}/today`);
        
        if (response.ok) {
            const data = await response.json();
            
            // Clear loading row
            tableBody.innerHTML = '';
            
            if (data.content?.length > 0) {
                data.content.forEach(appointment => {
                    const row = document.createElement('tr');
                    
                    // Format time
                    const appointmentTime = formatTime(appointment.appointmentTime);
                    
                    // Determine status class
                    let statusClass = '';
                    switch (appointment.appointmentStatus) {
                        case 'PENDING':
                            statusClass = 'pending';
                            break;
                        case 'CONFIRMED':
                            statusClass = 'confirmed';
                            break;
                        case 'COMPLETED':
                            statusClass = 'completed';
                            break;
                        case 'CANCELLED':
                            statusClass = 'cancelled';
                            break;
                        default:
                            statusClass = 'pending';
                    }
                    
                    row.innerHTML = `
                        <td>${appointment.patientName}</td>
                        <td>${appointmentTime}</td>
                        <td><span class="status-badge ${statusClass}">${appointment.appointmentStatus}</span></td>
                        <td>
                            <button class="action-btn view-appointment" data-id="${appointment.appointmentId}">View</button>
                        </td>
                    `;
                    
                    tableBody.appendChild(row);
                });
                
                // Add event listeners to view buttons
                document.querySelectorAll('.view-appointment').forEach(button => {
                    button.addEventListener('click', function() {
                        const appointmentId = this.getAttribute('data-id');
                        openAppointmentModal(appointmentId);
                    });
                });
            } else {
                tableBody.innerHTML = `<tr><td colspan="4" class="text-center">No appointments scheduled for today</td></tr>`;
            }
        } else {
            throw new Error('Failed to load appointments');
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center">Error loading appointments</td></tr>`;
    }
}

// Load recent patients
async function loadRecentPatients() {
    const doctorId = localStorage.getItem('doctorId');
    const tableBody = document.querySelector('#patients-table tbody');
    
    try {
        const response = await fetch(`http://localhost:8080/api/v1/appointments/doctor/${doctorId}/recent`);
        
        if (response.ok) {
            const data = await response.json();
            
            // Clear loading row
            tableBody.innerHTML = '';
            
            if (data.length > 0) {
                data.forEach(patient => {
                    const row = document.createElement('tr');
                    
                    // Format date
                    const lastVisit = new Date(patient.lastVisitDate).toLocaleDateString();
                    
                    row.innerHTML = `
                        <td>${patient.fullName}</td>
                        <td>${lastVisit}</td>
                        <td><span class="status-badge ${patient.status.toLowerCase()}">${patient.status}</span></td>
                        <td>
                            <button class="action-btn" onclick="window.location.href='doctor-patient-details.html?id=${patient.patientId}'">View</button>
                        </td>
                    `;
                    
                    tableBody.appendChild(row);
                });
            } else {
                tableBody.innerHTML = `<tr><td colspan="4" class="text-center">No recent patients</td></tr>`;
            }
        } else {
            throw new Error('Failed to load patients');
        }
    } catch (error) {
        console.error('Error loading patients:', error);
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center">Error loading patients</td></tr>`;
    }
}

// Load recent activity
async function loadRecentActivity() {
    const doctorId = localStorage.getItem('doctorId');
    const activityList = document.getElementById('activity-list');
    
    try {
        const response = await fetch(`http://localhost:8080/api/v1/doctor/${doctorId}/activity`);
        
        if (response.ok) {
            const data = await response.json();
            
            // Clear loading item
            activityList.innerHTML = '';
            
            if (data.length > 0) {
                data.forEach(activity => {
                    const listItem = document.createElement('li');
                    listItem.className = 'activity-item';
                    
                    // Determine icon based on activity type
                    let iconClass = 'fas fa-info-circle';
                    switch (activity.type) {
                        case 'APPOINTMENT':
                            iconClass = 'fas fa-calendar-check';
                            break;
                        case 'PRESCRIPTION':
                            iconClass = 'fas fa-prescription';
                            break;
                        case 'PATIENT':
                            iconClass = 'fas fa-user';
                            break;
                        case 'PAYMENT':
                            iconClass = 'fas fa-rupee-sign';
                            break;
                    }
                    
                    // Format time
                    const activityTime = formatRelativeTime(new Date(activity.timestamp));
                    
                    listItem.innerHTML = `
                        <div class="activity-icon">
                            <i class="${iconClass}"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-title">${activity.description}</div>
                            <div class="activity-time">${activityTime}</div>
                        </div>
                    `;
                    
                    activityList.appendChild(listItem);
                });
            } else {
                activityList.innerHTML = `<li class="text-center">No recent activity</li>`;
            }
        } else {
            throw new Error('Failed to load activity');
        }
    } catch (error) {
        console.error('Error loading activity:', error);
        activityList.innerHTML = `<li class="text-center">Error loading activity</li>`;
    }
}

// Initialize calendar
function initializeCalendar() {
    const calendarContainer = document.getElementById('doctor-calendar');
    const currentMonthElement = document.getElementById('current-month');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    
    // Get current date
    const currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    
    // Render calendar
    renderCalendar(currentMonth, currentYear);
    
    // Add event listeners to month navigation buttons
    prevMonthButton.addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentMonth, currentYear);
    });
    
    nextMonthButton.addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
    });
    
    // Function to render calendar
    function renderCalendar(month, year) {
        // Update current month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        currentMonthElement.textContent = `${monthNames[month]} ${year}`;
        
        // Clear calendar
        calendarContainer.innerHTML = '';
        
        // Add day names
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day-name';
            dayElement.textContent = day;
            calendarContainer.appendChild(dayElement);
        });
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Get previous month's days to display
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        // Add days from previous month
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day other-month';
            dayElement.textContent = daysInPrevMonth - i;
            calendarContainer.appendChild(dayElement);
        }
        
        // Add days of current month
        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = i;
            
            // Highlight today
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayElement.classList.add('today');
            }
            
            // Add click event to view appointments for this day
            dayElement.addEventListener('click', function() {
                const selectedDate = new Date(year, month, i);
                const formattedDate = selectedDate.toISOString().split('T')[0];
                window.location.href = `doctor-appointments.html?date=${formattedDate}`;
            });
            
            calendarContainer.appendChild(dayElement);
        }
        
        // Add days from next month to fill remaining grid
        const totalDays = firstDay + daysInMonth;
        const remainingDays = 7 - (totalDays % 7);
        if (remainingDays < 7) {
            for (let i = 1; i <= remainingDays; i++) {
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day other-month';
                dayElement.textContent = i;
                calendarContainer.appendChild(dayElement);
            }
        }
        
        // Load appointments for this month to mark days with appointments
        loadMonthAppointments(month, year);
    }
    
    // Function to load appointments for a month
    async function loadMonthAppointments(month, year) {
        const doctorId = localStorage.getItem('doctorId');
        
        try {
            // Format dates for API request
            const startDate = new Date(year, month, 1).toISOString().split('T')[0];
            const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
            
            const response = await fetch(`http://localhost:8080/api/v1/appointments/doctor/${doctorId}/range?startDate=${startDate}&endDate=${endDate}`);
            
            if (response.ok) {
                const appointments = await response.json();
                
                // Mark days with appointments
                if (appointments.length > 0) {
                    appointments.forEach(appointment => {
                        const appointmentDate = new Date(appointment.appointmentDate);
                        const day = appointmentDate.getDate();
                        
                        // Find the day element
                        const dayElements = document.querySelectorAll('.calendar-day:not(.other-month)');
                        dayElements.forEach(element => {
                            if (parseInt(element.textContent) === day) {
                                element.classList.add('has-events');
                            }
                        });
                    });
                }
            }
        } catch (error) {
            console.error('Error loading month appointments:', error);
        }
    }
}

// Initialize modals
function initializeModals() {
    const appointmentModal = document.getElementById('appointment-modal');
    const prescriptionModal = document.getElementById('prescription-modal');
    const closeButtons = document.querySelectorAll('.close-modal');
    
    // Close modals when clicking close button
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            appointmentModal.classList.remove('active');
            prescriptionModal.classList.remove('active');
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === appointmentModal) {
            appointmentModal.classList.remove('active');
        }
        if (event.target === prescriptionModal) {
            prescriptionModal.classList.remove('active');
        }
    });
    
    // Complete appointment button
    const completeAppointmentButton = document.getElementById('complete-appointment');
    completeAppointmentButton.addEventListener('click', function() {
        const appointmentId = this.getAttribute('data-appointment-id');
        completeAppointment(appointmentId);
    });
    
    // Add medicine button
    const addMedicineButton = document.getElementById('add-medicine');
    addMedicineButton.addEventListener('click', addMedicineField);
    
    // Save prescription button
    const savePrescriptionButton = document.getElementById('save-prescription');
    savePrescriptionButton.addEventListener('click', savePrescription);
}

// Open appointment modal
async function openAppointmentModal(appointmentId) {
    const modal = document.getElementById('appointment-modal');
    const modalBody = document.getElementById('appointment-details');
    const completeButton = document.getElementById('complete-appointment');
    
    // Show loading state
    modalBody.innerHTML = '<p class="text-center">Loading appointment details...</p>';
    modal.classList.add('active');
    
    try {
        const response = await fetch(`http://localhost:8080/api/v1/appointments/${appointmentId}`);
        
        if (response.ok) {
            const appointment = await response.json();
            
            // Format date and time
            const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString();
            const appointmentTime = formatTime(appointment.appointmentTime);
            
            // Update modal content
            modalBody.innerHTML = `
                <div class="patient-info">
                    <h3>Patient Information</h3>
                    <div class="info-row">
                        <div class="info-label">Name:</div>
                        <div class="info-value">${appointment.patientName}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Date:</div>
                        <div class="info-value">${appointmentDate}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Time:</div>
                        <div class="info-value">${appointmentTime}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Status:</div>
                        <div class="info-value">
                            <span class="status-badge ${appointment.appointmentStatus.toLowerCase()}">${appointment.appointmentStatus}</span>
                        </div>
                    </div>
                </div>
            `;
            
            // Set appointment ID for complete button
            completeButton.setAttribute('data-appointment-id', appointmentId);
            
            // Show/hide complete button based on appointment status
            if (appointment.appointmentStatus === 'COMPLETED' || appointment.appointmentStatus === 'CANCELLED') {
                completeButton.style.display = 'none';
            } else {
                completeButton.style.display = 'block';
            }
            
            // Check if prescription exists
            const prescriptionResponse = await fetch(`http://localhost:8080/api/v1/prescriptions/appointment/${appointmentId}`);
            
            if (prescriptionResponse.ok) {
                const prescription = await prescriptionResponse.json();
                
                // Add prescription details to modal
                const prescriptionSection = document.createElement('div');
                prescriptionSection.className = 'prescription-info';
                prescriptionSection.innerHTML = `
                    <h3>Prescription</h3>
                    <div class="info-row">
                        <div class="info-label">Diagnosis:</div>
                        <div class="info-value">${prescription.diagnosis}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Notes:</div>
                        <div class="info-value">${prescription.notes || 'None'}</div>
                    </div>
                `;
                
                // Add medications
                if (prescription.medicines && prescription.medicines.length > 0) {
                    const medicationsSection = document.createElement('div');
                    medicationsSection.className = 'medications';
                    medicationsSection.innerHTML = '<h4>Medications</h4>';
                    
                    const medicationsList = document.createElement('ul');
                    medicationsList.className = 'medications-list';
                    
                    prescription.medicines.forEach(medicine => {
                        const medicineItem = document.createElement('li');
                        medicineItem.innerHTML = `
                            <div class="medicine-name">${medicine.medicineName}</div>
                            <div class="medicine-details">
                                <span>Dosage: ${medicine.dosage}</span>
                                <span>Frequency: ${medicine.frequency}</span>
                                <span>Duration: ${medicine.durationDays} days</span>
                            </div>
                            ${medicine.instructions ? `<div class="medicine-instructions">Instructions: ${medicine.instructions}</div>` : ''}
                        `;
                        
                        medicationsList.appendChild(medicineItem);
                    });
                    
                    medicationsSection.appendChild(medicationsList);
                    prescriptionSection.appendChild(medicationsSection);
                }
                
                modalBody.appendChild(prescriptionSection);
                
                // Hide complete button if prescription exists
                completeButton.style.display = 'none';
            }
        } else {
            throw new Error('Failed to load appointment details');
        }
    } catch (error) {
        console.error('Error loading appointment details:', error);
        modalBody.innerHTML = '<p class="text-center text-danger">Error loading appointment details</p>';
    }
}

// Complete appointment and open prescription form
async function completeAppointment(appointmentId) {
    try {
        // Update appointment status to completed
        const response = await fetch(`http://localhost:8080/api/v1/appointments/${appointmentId}/complete`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            // Close appointment modal
            document.getElementById('appointment-modal').classList.remove('active');
            
            // Open prescription modal
            const prescriptionModal = document.getElementById('prescription-modal');
            const medicinesContainer = document.getElementById('medicines-container');
            
            // Clear previous form data
            document.getElementById('prescription-form').reset();
            medicinesContainer.innerHTML = '';
            
            // Set appointment ID
            document.getElementById('appointment-id').value = appointmentId;
            
            // Add initial medicine field
            addMedicineField();
            
            // Show prescription modal
            prescriptionModal.classList.add('active');
        } else {
            throw new Error('Failed to complete appointment');
        }
    } catch (error) {
        console.error('Error completing appointment:', error);
        alert('Error completing appointment. Please try again.');
    }
}

// Add medicine field to prescription form
function addMedicineField() {
    const medicinesContainer = document.getElementById('medicines-container');
    const medicineIndex = medicinesContainer.children.length;
    
    const medicineItem = document.createElement('div');
    medicineItem.className = 'medicine-item';
    medicineItem.innerHTML = `
        <button type="button" class="remove-medicine" onclick="removeMedicineField(this)">
            <i class="fas fa-times"></i>
        </button>
        <div class="form-row">
            <div class="form-group">
                <label for="medicine-name-${medicineIndex}">Medicine Name</label>
                <input type="text" id="medicine-name-${medicineIndex}" name="medicines[${medicineIndex}].medicineName" required>
            </div>
            <div class="form-group">
                <label for="medicine-dosage-${medicineIndex}">Dosage</label>
                <input type="text" id="medicine-dosage-${medicineIndex}" name="medicines[${medicineIndex}].dosage" placeholder="e.g., 500mg" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="medicine-frequency-${medicineIndex}">Frequency</label>
                <input type="text" id="medicine-frequency-${medicineIndex}" name="medicines[${medicineIndex}].frequency" placeholder="e.g., Twice daily" required>
            </div>
            <div class="form-group">
                <label for="medicine-duration-${medicineIndex}">Duration (days)</label>
                <input type="number" id="medicine-duration-${medicineIndex}" name="medicines[${medicineIndex}].durationDays" min="1" required>
            </div>
        </div>
        <div class="form-group">
            <label for="medicine-instructions-${medicineIndex}">Instructions</label>
            <textarea id="medicine-instructions-${medicineIndex}" name="medicines[${medicineIndex}].instructions" placeholder="e.g., Take after meals"></textarea>
        </div>
    `;
    
    medicinesContainer.appendChild(medicineItem);
}

// Remove medicine field from prescription form
function removeMedicineField(button) {
    const medicineItem = button.parentElement;
    medicineItem.remove();
}

// Save prescription
async function savePrescription() {
    const form = document.getElementById('prescription-form');
    const appointmentId = document.getElementById('appointment-id').value;
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    try {
        // Collect form data
        const diagnosis = document.getElementById('diagnosis').value;
        const notes = document.getElementById('notes').value;
        
        // Collect medicines data
        const medicines = [];
        const medicineItems = document.querySelectorAll('.medicine-item');
        
        medicineItems.forEach((item, index) => {
            const medicineName = document.getElementById(`medicine-name-${index}`).value;
            const dosage = document.getElementById(`medicine-dosage-${index}`).value;
            const frequency = document.getElementById(`medicine-frequency-${index}`).value;
            const durationDays = document.getElementById(`medicine-duration-${index}`).value;
            const instructions = document.getElementById(`medicine-instructions-${index}`).value;
            
            medicines.push({
                medicineName,
                dosage,
                frequency,
                durationDays,
                instructions
            });
        });
        
        // Create prescription object
        const prescription = {
            appointmentId,
            diagnosis,
            notes,
            medicines
        };
        
        // Send prescription to API
        const response = await fetch('http://localhost:8080/api/v1/prescriptions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(prescription)
        });
        
        if (response.ok) {
            // Close prescription modal
            document.getElementById('prescription-modal').classList.remove('active');
            
            // Reload appointments to reflect changes
            loadTodayAppointments();
            
            // Show success message
            alert('Prescription saved successfully');
        } else {
            throw new Error('Failed to save prescription');
        }
    } catch (error) {
        console.error('Error saving prescription:', error);
        alert('Error saving prescription. Please try again.');
    }
}

// Helper function to format time (HH:MM:SS to 12-hour format)
function formatTime(timeString) {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minutes} ${ampm}`;
}

// Helper function to format relative time
function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) {
        return 'just now';
    } else if (diffMin < 60) {
        return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffDay < 7) {
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
}