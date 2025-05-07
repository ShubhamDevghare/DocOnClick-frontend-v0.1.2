document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const doctorId = localStorage.getItem('doctorId');
    const userType = localStorage.getItem('userType');
    
    if (!doctorId || userType !== 'DOCTOR') {
        window.location.href = 'login.html';
        return;
    }
    
    // Load doctor profile
    loadDoctorProfile();
    
    // Initialize tabs
    initializeTabs();
    
    // Load appointments
    loadUpcomingAppointments();
    loadTodayAppointments();
    loadPastAppointments();
    loadAllAppointments();
    
    // Initialize filters
    initializeFilters();
    
    // Initialize modals
    initializeModals();
    
    // Initialize logout
    document.getElementById('logout-button').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'login.html';
    });
});

// Load doctor profile
function loadDoctorProfile() {
    const doctorId = localStorage.getItem('doctorId');
    const doctorName = localStorage.getItem('userName');
    
    // Update sidebar info
    document.getElementById('doctor-name').textContent = doctorName || 'Doctor';
    
    // Call API to get doctor details
    fetch(`http://localhost:8080/api/v1/doctors/${doctorId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load doctor profile');
            }
            return response.json();
        })
        .then(data => {
            // Update doctor info
            document.getElementById('doctor-specialization').textContent = data.specialization || 'Specialist';
            
            if (data.profileImage) {
                document.getElementById('doctor-avatar').src = data.profileImage;
            }
        })
        .catch(error => {
            console.error('Error loading doctor profile:', error);
        });
}

// Initialize tabs
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// Initialize filters
function initializeFilters() {
    const filterButton = document.getElementById('filter-appointments');
    const resetButton = document.getElementById('reset-filters');
    
    filterButton.addEventListener('click', function() {
        const date = document.getElementById('appointment-date').value;
        const status = document.getElementById('appointment-status').value;
        
        // Apply filters to the active tab
        const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
        
        switch (activeTab) {
            case 'upcoming':
                loadUpcomingAppointments(date, status);
                break;
            case 'today':
                loadTodayAppointments(status);
                break;
            case 'past':
                loadPastAppointments(date, status);
                break;
            case 'all':
                loadAllAppointments(date, status);
                break;
        }
    });
    
    resetButton.addEventListener('click', function() {
        document.getElementById('appointment-date').value = '';
        document.getElementById('appointment-status').value = '';
        
        // Reset filters and reload appointments
        const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
        
        switch (activeTab) {
            case 'upcoming':
                loadUpcomingAppointments();
                break;
            case 'today':
                loadTodayAppointments();
                break;
            case 'past':
                loadPastAppointments();
                break;
            case 'all':
                loadAllAppointments();
                break;
        }
    });
}

// Initialize modals
function initializeModals() {
    const appointmentModal = document.getElementById('appointment-modal');
    const prescriptionModal = document.getElementById('prescription-modal');
    const closeButtons = document.querySelectorAll('.close');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            appointmentModal.style.display = 'none';
            prescriptionModal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === appointmentModal) {
            appointmentModal.style.display = 'none';
        }
        if (event.target === prescriptionModal) {
            prescriptionModal.style.display = 'none';
        }
    });
    
    // Initialize prescription form
    const prescriptionForm = document.getElementById('prescription-form');
    const addMedicineButton = document.getElementById('add-medicine');
    const cancelPrescriptionButton = document.getElementById('cancel-prescription');
    
    let medicineCount = 1;
    
    addMedicineButton.addEventListener('click', function() {
        const medicinesContainer = document.getElementById('medicines-container');
        const medicineItem = document.createElement('div');
        medicineItem.className = 'medicine-item';
        medicineItem.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label for="medicine-name-${medicineCount}">Medicine Name</label>
                    <input type="text" id="medicine-name-${medicineCount}" name="medicineName" required>
                </div>
                <div class="form-group">
                    <label for="dosage-${medicineCount}">Dosage</label>
                    <input type="text" id="dosage-${medicineCount}" name="dosage" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="frequency-${medicineCount}">Frequency</label>
                    <input type="text" id="frequency-${medicineCount}" name="frequency" required>
                </div>
                <div class="form-group">
                    <label for="duration-${medicineCount}">Duration (days)</label>
                    <input type="number" id="duration-${medicineCount}" name="durationDays" min="1" required>
                </div>
            </div>
            <div class="form-group">
                <label for="instructions-${medicineCount}">Instructions</label>
                <input type="text" id="instructions-${medicineCount}" name="instructions">
            </div>
            <button type="button" class="remove-medicine danger-button">
                <i class="fa-solid fa-trash"></i> Remove
            </button>
        `;
        
        medicinesContainer.appendChild(medicineItem);
        
        // Add event listener to remove button
        medicineItem.querySelector('.remove-medicine').addEventListener('click', function() {
            medicinesContainer.removeChild(medicineItem);
        });
        
        medicineCount++;
    });
    
    cancelPrescriptionButton.addEventListener('click', function() {
        prescriptionModal.style.display = 'none';
    });
    
    prescriptionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const appointmentId = document.getElementById('appointment-id').value;
        const diagnosis = document.getElementById('diagnosis').value;
        const notes = document.getElementById('notes').value;
        
        // Collect medicines
        const medicines = [];
        const medicineItems = document.querySelectorAll('.medicine-item');
        
        medicineItems.forEach((item, index) => {
            const medicineName = item.querySelector(`[name="medicineName"]`).value;
            const dosage = item.querySelector(`[name="dosage"]`).value;
            const frequency = item.querySelector(`[name="frequency"]`).value;
            const durationDays = item.querySelector(`[name="durationDays"]`).value;
            const instructions = item.querySelector(`[name="instructions"]`).value;
            
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
        
        // Call API to save prescription
        fetch('http://localhost:8080/api/v1/prescriptions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(prescription)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save prescription');
            }
            return response.json();
        })
        .then(data => {
            alert('Prescription saved successfully');
            prescriptionModal.style.display = 'none';
            
            // Reload appointments
            const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
            
            switch (activeTab) {
                case 'upcoming':
                    loadUpcomingAppointments();
                    break;
                case 'today':
                    loadTodayAppointments();
                    break;
                case 'past':
                    loadPastAppointments();
                    break;
                case 'all':
                    loadAllAppointments();
                    break;
            }
        })
        .catch(error => {
            console.error('Error saving prescription:', error);
            alert('Failed to save prescription. Please try again.');
        });
    });
}

// Load upcoming appointments
function loadUpcomingAppointments(date = null, status = null) {
    const doctorId = localStorage.getItem('doctorId');
    let url = `http://localhost:8080/api/v1/appointments/doctor/${doctorId}/upcoming`;
    
    // Add filters if provided
    if (date || status) {
        url += '?';
        if (date) {
            url += `date=${date}`;
        }
        if (date && status) {
            url += '&';
        }
        if (status) {
            url += `status=${status}`;
        }
    }
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load upcoming appointments');
            }
            return response.json();
        })
        .then(data => {
            updateAppointmentsTable('upcoming-appointments-table', data.content || []);
        })
        .catch(error => {
            console.error('Error loading upcoming appointments:', error);
            document.querySelector('#upcoming-appointments-table tbody').innerHTML = 
                `<tr><td colspan="6" class="text-center">Error loading appointments. Please try again.</td></tr>`;
        });
}

// Load today's appointments
function loadTodayAppointments(status = null) {
    const doctorId = localStorage.getItem('doctorId');
    let url = `http://localhost:8080/api/v1/appointments/doctor/${doctorId}/today`;
    
    // Add status filter if provided
    if (status) {
        url += `?status=${status}`;
    }
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load today\'s appointments');
            }
            return response.json();
        })
        .then(data => {
            updateAppointmentsTable('today-appointments-table', data.content || [], true);
        })
        .catch(error => {
            console.error('Error loading today\'s appointments:', error);
            document.querySelector('#today-appointments-table tbody').innerHTML = 
                `<tr><td colspan="5" class="text-center">Error loading appointments. Please try again.</td></tr>`;
        });
}

// Load past appointments
function loadPastAppointments(date = null, status = null) {
    const doctorId = localStorage.getItem('doctorId');
    let url = `http://localhost:8080/api/v1/appointments/doctor/${doctorId}/past`;
    
    // Add filters if provided
    if (date || status) {
        url += '?';
        if (date) {
            url += `date=${date}`;
        }
        if (date && status) {
            url += '&';
        }
        if (status) {
            url += `status=${status}`;
        }
    }
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load past appointments');
            }
            return response.json();
        })
        .then(data => {
            updateAppointmentsTable('past-appointments-table', data.content || [], false, true);
        })
        .catch(error => {
            console.error('Error loading past appointments:', error);
            document.querySelector('#past-appointments-table tbody').innerHTML = 
                `<tr><td colspan="5" class="text-center">Error loading appointments. Please try again.</td></tr>`;
        });
}

// Load all appointments
function loadAllAppointments(date = null, status = null) {
    const doctorId = localStorage.getItem('doctorId');
    let url = `http://localhost:8080/api/v1/appointments/doctor/${doctorId}`;
    
    // Add filters if provided
    if (date || status) {
        url += '?';
        if (date) {
            url += `date=${date}`;
        }
        if (date && status) {
            url += '&';
        }
        if (status) {
            url += `status=${status}`;
        }
    }
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load all appointments');
            }
            return response.json();
        })
        .then(data => {
            updateAppointmentsTable('all-appointments-table', data.content || []);
        })
        .catch(error => {
            console.error('Error loading all appointments:', error);
            document.querySelector('#all-appointments-table tbody').innerHTML = 
                `<tr><td colspan="6" class="text-center">Error loading appointments. Please try again.</td></tr>`;
        });
}

// Update appointments table
function updateAppointmentsTable(tableId, appointments, isToday = false, isPast = false) {
    const tableBody = document.querySelector(`#${tableId} tbody`);
    
    // Clear loading row
    tableBody.innerHTML = '';
    
    if (!appointments || appointments.length === 0) {
        const colSpan = isToday ? 5 : 6;
        tableBody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center">No appointments found</td></tr>`;
        return;
    }
    
    // Sort appointments by date and time
    appointments.sort((a, b) => {
        const dateA = new Date(a.appointmentDate + 'T' + a.appointmentTime);
        const dateB = new Date(b.appointmentDate + 'T' + b.appointmentTime);
        return dateA - dateB;
    });
    
    appointments.forEach(appointment => {
        const row = document.createElement('tr');
        
        // Format date
        const date = new Date(appointment.appointmentDate);
        const formattedDate = date.toLocaleDateString();
        
        // Format time
        const formattedTime = formatTime(appointment.appointmentTime);
        
        // Create row content
        let rowContent = '';
        
        // Patient column
        rowContent += `<td>${appointment.patientName}</td>`;
        
        // Date column (not needed for today's appointments)
        if (!isToday) {
            rowContent += `<td>${formattedDate}</td>`;
        }
        
        // Time column
        rowContent += `<td>${formattedTime}</td>`;
        
        // Status column
        rowContent += `<td><span class="status-badge ${appointment.appointmentStatus.toLowerCase()}">${appointment.appointmentStatus}</span></td>`;
        
        // Payment column (not needed for past appointments)
        if (!isPast) {
            rowContent += `<td><span class="status-badge ${appointment.paymentStatus.toLowerCase()}">${appointment.paymentStatus}</span></td>`;
        }
        
        // Actions column
        rowContent += `<td>
            <button class="action-button view-appointment" data-id="${appointment.appointmentId}">View</button>
            ${!isPast ? `<button class="action-button ${appointment.appointmentStatus === 'COMPLETED' ? 'disabled' : ''}" data-id="${appointment.appointmentId}" ${appointment.appointmentStatus === 'COMPLETED' ? 'disabled' : ''}>
                ${appointment.appointmentStatus === 'PENDING' ? 'Confirm' : appointment.appointmentStatus === 'CONFIRMED' ? 'Complete' : 'View'}
            </button>` : ''}
            ${appointment.appointmentStatus === 'COMPLETED' && !appointment.hasPrescription ? `<button class="action-button create-prescription" data-id="${appointment.appointmentId}">Prescribe</button>` : ''}
        </td>`;
        
        row.innerHTML = rowContent;
        tableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.view-appointment').forEach(button => {
        button.addEventListener('click', function() {
            const appointmentId = this.getAttribute('data-id');
            viewAppointmentDetails(appointmentId);
        });
    });
    
    document.querySelectorAll('.create-prescription').forEach(button => {
        button.addEventListener('click', function() {
            const appointmentId = this.getAttribute('data-id');
            createPrescription(appointmentId);
        });
    });
    
    // Add event listeners to status buttons
    tableBody.querySelectorAll('button:not(.view-appointment):not(.create-prescription):not(.disabled)').forEach(button => {
        button.addEventListener('click', function() {
            const appointmentId = this.getAttribute('data-id');
            const text = this.textContent.trim();
            
            if (text === 'Confirm') {
                confirmAppointment(appointmentId);
            } else if (text === 'Complete') {
                completeAppointment(appointmentId);
            }
        });
    });
}

// View appointment details
function viewAppointmentDetails(appointmentId) {
    // Call API to get appointment details
    fetch(`http://localhost:8080/api/v1/appointments/${appointmentId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load appointment details');
            }
            return response.json();
        })
        .then(appointment => {
            // Show appointment details modal
            const modal = document.getElementById('appointment-modal');
            const modalContent = document.getElementById('appointment-details');
            const modalActions = document.getElementById('modal-actions');
            
            // Format date
            const date = new Date(appointment.appointmentDate);
            const formattedDate = date.toLocaleDateString();
            
            // Format time
            const formattedTime = formatTime(appointment.appointmentTime);
            
            // Create modal content
            modalContent.innerHTML = `
                <div class="appointment-header">
                    <h2>Appointment Details</h2>
                    <span class="status-badge ${appointment.appointmentStatus.toLowerCase()}">${appointment.appointmentStatus}</span>
                </div>
                
                <div class="appointment-info">
                    <div class="info-group">
                        <h3>Patient Information</h3>
                        <p><strong>Name:</strong> ${appointment.patientName}</p>
                        <p><strong>Phone:</strong> ${appointment.patient?.phone || 'N/A'}</p>
                        <p><strong>Email:</strong> ${appointment.patient?.emailAddress || 'N/A'}</p>
                    </div>
                    
                    <div class="info-group">
                        <h3>Appointment Details</h3>
                        <p><strong>Date:</strong> ${formattedDate}</p>
                        <p><strong>Time:</strong> ${formattedTime}</p>
                        <p><strong>Payment Status:</strong> <span class="status-badge ${appointment.paymentStatus.toLowerCase()}">${appointment.paymentStatus}</span></p>
                    </div>
                </div>
                
                ${appointment.prescription ? `
                <div class="prescription-section">
                    <h3>Prescription</h3>
                    <p><strong>Diagnosis:</strong> ${appointment.prescription.diagnosis || 'N/A'}</p>
                    <p><strong>Notes:</strong> ${appointment.prescription.notes || 'N/A'}</p>
                    
                    ${appointment.prescription.medicines && appointment.prescription.medicines.length > 0 ? `
                    <div class="medicines-list">
                        <h4>Medications</h4>
                        <ul>
                            ${appointment.prescription.medicines.map(medicine => `
                                <li>
                                    <strong>${medicine.medicineName}</strong> - ${medicine.dosage}, ${medicine.frequency}, ${medicine.durationDays} days
                                    ${medicine.instructions ? `<br><em  ${medicine.durationDays} days
                                    ${medicine.instructions ? `<br><em>Instructions: ${medicine.instructions}</em>` : ''}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
            `;
            
            // Create modal actions
            modalActions.innerHTML = '';
            
            // Add action buttons based on appointment status
            if (appointment.appointmentStatus === 'PENDING') {
                modalActions.innerHTML += `
                    <button class="primary-button" id="confirm-appointment" data-id="${appointment.appointmentId}">
                        <i class="fa-solid fa-check"></i> Confirm Appointment
                    </button>
                `;
            } else if (appointment.appointmentStatus === 'CONFIRMED') {
                modalActions.innerHTML += `
                    <button class="primary-button" id="complete-appointment" data-id="${appointment.appointmentId}">
                        <i class="fa-solid fa-check-double"></i> Mark as Completed
                    </button>
                `;
            }
            
            // Add cancel button if appointment is not completed or cancelled
            if (appointment.appointmentStatus !== 'COMPLETED' && appointment.appointmentStatus !== 'CANCELLED') {
                modalActions.innerHTML += `
                    <button class="danger-button" id="cancel-appointment" data-id="${appointment.appointmentId}">
                        <i class="fa-solid fa-times"></i> Cancel Appointment
                    </button>
                `;
            }
            
            // Add prescription button if appointment is completed and no prescription exists
            if (appointment.appointmentStatus === 'COMPLETED' && !appointment.prescription) {
                modalActions.innerHTML += `
                    <button class="secondary-button" id="create-prescription-btn" data-id="${appointment.appointmentId}">
                        <i class="fa-solid fa-prescription"></i> Create Prescription
                    </button>
                `;
            }
            
            // Show modal
            modal.style.display = 'block';
            
            // Add event listeners to action buttons
            if (appointment.appointmentStatus === 'PENDING') {
                document.getElementById('confirm-appointment').addEventListener('click', function() {
                    const appointmentId = this.getAttribute('data-id');
                    confirmAppointment(appointmentId);
                    modal.style.display = 'none';
                });
            } else if (appointment.appointmentStatus === 'CONFIRMED') {
                document.getElementById('complete-appointment').addEventListener('click', function() {
                    const appointmentId = this.getAttribute('data-id');
                    completeAppointment(appointmentId);
                    modal.style.display = 'none';
                });
            }
            
            if (appointment.appointmentStatus !== 'COMPLETED' && appointment.appointmentStatus !== 'CANCELLED') {
                document.getElementById('cancel-appointment').addEventListener('click', function() {
                    const appointmentId = this.getAttribute('data-id');
                    cancelAppointment(appointmentId);
                    modal.style.display = 'none';
                });
            }
            
            if (appointment.appointmentStatus === 'COMPLETED' && !appointment.prescription) {
                document.getElementById('create-prescription-btn').addEventListener('click', function() {
                    const appointmentId = this.getAttribute('data-id');
                    createPrescription(appointmentId);
                    modal.style.display = 'none';
                });
            }
        })
        .catch(error => {
            console.error('Error loading appointment details:', error);
            alert('Failed to load appointment details. Please try again.');
        });
}

// Confirm appointment
function confirmAppointment(appointmentId) {
    fetch(`http://localhost:8080/api/v1/appointments/${appointmentId}/confirm`, {
        method: 'PUT'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to confirm appointment');
        }
        return response.json();
    })
    .then(data => {
        alert('Appointment confirmed successfully');
        
        // Reload appointments
        const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
        
        switch (activeTab) {
            case 'upcoming':
                loadUpcomingAppointments();
                break;
            case 'today':
                loadTodayAppointments();
                break;
            case 'past':
                loadPastAppointments();
                break;
            case 'all':
                loadAllAppointments();
                break;
        }
    })
    .catch(error => {
        console.error('Error confirming appointment:', error);
        alert('Failed to confirm appointment. Please try again.');
    });
}

// Complete appointment
function completeAppointment(appointmentId) {
    fetch(`http://localhost:8080/api/v1/appointments/${appointmentId}/complete`, {
        method: 'PUT'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to complete appointment');
        }
        return response.json();
    })
    .then(data => {
        alert('Appointment marked as completed');
        
        // Reload appointments
        const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
        
        switch (activeTab) {
            case 'upcoming':
                loadUpcomingAppointments();
                break;
            case 'today':
                loadTodayAppointments();
                break;
            case 'past':
                loadPastAppointments();
                break;
            case 'all':
                loadAllAppointments();
                break;
        }
    })
    .catch(error => {
        console.error('Error completing appointment:', error);
        alert('Failed to complete appointment. Please try again.');
    });
}

// Cancel appointment
function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
        return;
    }
    
    fetch(`http://localhost:8080/api/v1/appointments/${appointmentId}/cancel`, {
        method: 'PUT'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to cancel appointment');
        }
        return response.json();
    })
    .then(data => {
        alert('Appointment cancelled successfully');
        
        // Reload appointments
        const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
        
        switch (activeTab) {
            case 'upcoming':
                loadUpcomingAppointments();
                break;
            case 'today':
                loadTodayAppointments();
                break;
            case 'past':
                loadPastAppointments();
                break;
            case 'all':
                loadAllAppointments();
                break;
        }
    })
    .catch(error => {
        console.error('Error cancelling appointment:', error);
        alert('Failed to cancel appointment. Please try again.');
    });
}

// Create prescription
function createPrescription(appointmentId) {
    // Reset form
    document.getElementById('prescription-form').reset();
    document.getElementById('appointment-id').value = appointmentId;
    
    // Clear medicines except the first one
    const medicinesContainer = document.getElementById('medicines-container');
    const medicineItems = medicinesContainer.querySelectorAll('.medicine-item');
    
    for (let i = 1; i < medicineItems.length; i++) {
        medicinesContainer.removeChild(medicineItems[i]);
    }
    
    // Show modal
    document.getElementById('prescription-modal').style.display = 'block';
}

// Format time (HH:MM) to 12-hour format
function formatTime(timeString) {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

// Toggle sidebar on mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.dashboard-sidebar');
    sidebar.classList.toggle('active');
}
