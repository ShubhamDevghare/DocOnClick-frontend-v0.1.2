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
    
    // Load patient statistics
    loadPatientStats();
    
    // Load patient list
    loadPatients();
    
    // Initialize search
    initializeSearch();
    
    // Initialize patient modal
    initializePatientModal();
    
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

// Load patient statistics
function loadPatientStats() {
    const doctorId = localStorage.getItem('doctorId');
    
    // Call API to get patient statistics
    fetch(`http://localhost:8080/api/v1/doctor/${doctorId}/patients/stats`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load patient statistics');
            }
            return response.json();
        })
        .then(data => {
            // Update statistics
            document.getElementById('total-patients').textContent = data.totalPatients || 0;
            document.getElementById('new-patients').textContent = data.newPatientsThisMonth || 0;
            document.getElementById('total-appointments').textContent = data.totalAppointments || 0;
        })
        .catch(error => {
            console.error('Error loading patient statistics:', error);
            // Set default values
            document.getElementById('total-patients').textContent = '0';
            document.getElementById('new-patients').textContent = '0';
            document.getElementById('total-appointments').textContent = '0';
        });
}

// Load patient list
function loadPatients(searchTerm = '') {
    const doctorId = localStorage.getItem('doctorId');
    let url = `http://localhost:8080/api/v1/doctor/${doctorId}/patients`;
    
    // Add search term if provided
    if (searchTerm) {
        url += `?search=${encodeURIComponent(searchTerm)}`;
    }
    
    // Call API to get patient list
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load patients');
            }
            return response.json();
        })
        .then(data => {
            updatePatientsTable(data);
        })
        .catch(error => {
            console.error('Error loading patients:', error);
            document.querySelector('#patients-table tbody').innerHTML = 
                `<tr><td colspan="7" class="text-center">Error loading patients. Please try again.</td></tr>`;
        });
}

// Update patients table
function updatePatientsTable(patients) {
    const tableBody = document.querySelector('#patients-table tbody');
    
    // Clear loading row
    tableBody.innerHTML = '';
    
    if (!patients || patients.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center">No patients found</td></tr>`;
        return;
    }
    
    // Sort patients by last visit date (most recent first)
    patients.sort((a, b) => {
        const dateA = new Date(a.lastVisitDate || 0);
        const dateB = new Date(b.lastVisitDate || 0);
        return dateB - dateA;
    });
    
    patients.forEach(patient => {
        const row = document.createElement('tr');
        
        // Calculate age from date of birth
        let age = '';
        if (patient.dateOfBirth) {
            const dob = new Date(patient.dateOfBirth);
            const today = new Date();
            age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--;
            }
        }
        
        // Format last visit date
        const lastVisit = patient.lastVisitDate ? new Date(patient.lastVisitDate).toLocaleDateString() : 'Never';
        
        row.innerHTML = `
            <td>${patient.fullName}</td>
            <td>${patient.gender || 'N/A'}</td>
            <td>${age || 'N/A'}</td>
            <td>${patient.phone || 'N/A'}</td>
            <td>${patient.email || 'N/A'}</td>
            <td>${lastVisit}</td>
            <td>
                <button class="action-button view-patient" data-id="${patient.patientId}">View</button>
                <button class="action-button secondary book-appointment" data-id="${patient.patientId}">Book</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.view-patient').forEach(button => {
        button.addEventListener('click', function() {
            const patientId = this.getAttribute('data-id');
            viewPatientDetails(patientId);
        });
    });
    
    document.querySelectorAll('.book-appointment').forEach(button => {
        button.addEventListener('click', function() {
            const patientId = this.getAttribute('data-id');
            bookAppointment(patientId);
        });
    });
}

// Initialize search
function initializeSearch() {
    const searchInput = document.getElementById('patient-search');
    const searchButton = document.getElementById('search-button');
    
    searchButton.addEventListener('click', function() {
        const searchTerm = searchInput.value.trim();
        loadPatients(searchTerm);
    });
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = searchInput.value.trim();
            loadPatients(searchTerm);
        }
    });
}

// Initialize patient modal
function initializePatientModal() {
    const modal = document.getElementById('patient-modal');
    const closeButton = modal.querySelector('.close');
    
    closeButton.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Initialize tabs
    const tabButtons = modal.querySelectorAll('.tab-button');
    const tabContents = modal.querySelectorAll('.tab-content');
    
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

// View patient details
function viewPatientDetails(patientId) {
    const modal = document.getElementById('patient-modal');
    const patientDetails = document.getElementById('patient-details');
    
    // Show loading state
    patientDetails.innerHTML = '<p class="text-center">Loading patient details...</p>';
    modal.style.display = 'block';
    
    // Call API to get patient details
    fetch(`http://localhost:8080/api/v1/patients/${patientId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load patient details');
            }
            return response.json();
        })
        .then(patient => {
            // Calculate age from date of birth
            let age = '';
            if (patient.dateOfBirth) {
                const dob = new Date(patient.dateOfBirth);
                const today = new Date();
                age = today.getFullYear() - dob.getFullYear();
                const monthDiff = today.getMonth() - dob.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                    age--;
                }
            }
            
            // Format date of birth
            const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A';
            
            // Update patient details
            patientDetails.innerHTML = `
                <div class="patient-header">
                    <h2>${patient.fullName}</h2>
                    <button class="action-button secondary" id="edit-patient" data-id="${patient.patientId}">
                        <i class="fa-solid fa-edit"></i> Edit
                    </button>
                </div>
                
                <div class="patient-info">
                    <div class="info-group">
                        <h3>Personal Information</h3>
                        <p><strong>Gender:</strong> ${patient.gender || 'N/A'}</p>
                        <p><strong>Age:</strong> ${age || 'N/A'}</p>
                        <p><strong>Date of Birth:</strong> ${dob}</p>
                        <p><strong>Blood Group:</strong> ${patient.bloodGroup || 'N/A'}</p>
                    </div>
                    
                    <div class="info-group">
                        <h3>Contact Information</h3>
                        <p><strong>Phone:</strong> ${patient.phone || 'N/A'}</p>
                        <p><strong>Email:</strong> ${patient.email || 'N/A'}</p>
                        <p><strong>Address:</strong> ${patient.address || 'N/A'}</p>
                    </div>
                </div>
                
                <div class="patient-medical">
                    <h3>Medical Information</h3>
                    <p><strong>Allergies:</strong> ${patient.allergies || 'None'}</p>
                    <p><strong>Chronic Conditions:</strong> ${patient.chronicConditions || 'None'}</p>
                    <p><strong>Current Medications:</strong> ${patient.currentMedications || 'None'}</p>
                </div>
            `;
            
            // Add event listener to edit button
            document.getElementById('edit-patient').addEventListener('click', function() {
                editPatient(patient);
            });
            
            // Load patient appointments
            loadPatientAppointments(patientId);
            
            // Load patient prescriptions
            loadPatientPrescriptions(patientId);
            
            // Load patient medical history
            loadPatientMedicalHistory(patientId);
        })
        .catch(error => {
            console.error('Error loading patient details:', error);
            patientDetails.innerHTML = '<p class="text-center text-danger">Error loading patient details. Please try again.</p>';
        });
}

// Load patient appointments
function loadPatientAppointments(patientId) {
    const tableBody = document.querySelector('#patient-appointments-table tbody');
    
    // Show loading state
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading appointments...</td></tr>';
    
    // Call API to get patient appointments
    fetch(`http://localhost:8080/api/v1/appointments/patient/${patientId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load patient appointments');
            }
            return response.json();
        })
        .then(data => {
            // Clear loading row
            tableBody.innerHTML = '';
            
            if (!data || data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No appointments found</td></tr>';
                return;
            }
            
            // Sort appointments by date (most recent first)
            data.sort((a, b) => {
                const dateA = new Date(a.appointmentDate + 'T' + a.appointmentTime);
                const dateB = new Date(b.appointmentDate + 'T' + b.appointmentTime);
                return dateB - dateA;
            });
            
            data.forEach(appointment => {
                const row = document.createElement('tr');
                
                // Format date
                const date = new Date(appointment.appointmentDate);
                const formattedDate = date.toLocaleDateString();
                
                // Format time
                const formattedTime = formatTime(appointment.appointmentTime);
                
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${formattedTime}</td>
                    <td><span class="status-badge ${appointment.appointmentStatus.toLowerCase()}">${appointment.appointmentStatus}</span></td>
                    <td>
                        <button class="action-button view-appointment" data-id="${appointment.appointmentId}">View</button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Add event listeners to view buttons
            document.querySelectorAll('.view-appointment').forEach(button => {
                button.addEventListener('click', function() {
                    const appointmentId = this.getAttribute('data-id');
                    viewAppointmentDetails(appointmentId);
                });
            });
        })
        .catch(error => {
            console.error('Error loading patient appointments:', error);
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Error loading appointments. Please try again.</td></tr>';
        });
}

// Load patient prescriptions
function loadPatientPrescriptions(patientId) {
    const tableBody = document.querySelector('#patient-prescriptions-table tbody');
    
    // Show loading state
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading prescriptions...</td></tr>';
    
    // Call API to get patient prescriptions
    fetch(`http://localhost:8080/api/v1/prescriptions/patient/${patientId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load patient prescriptions');
            }
            return response.json();
        })
        .then(data => {
            // Clear loading row
            tableBody.innerHTML = '';
            
            if (!data || data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No prescriptions found</td></tr>';
                return;
            }
            
            // Sort prescriptions by date (most recent first)
            data.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA;
            });
            
            data.forEach(prescription => {
                const row = document.createElement('tr');
                
                // Format date
                const date = prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString() : 'N/A';
                
                // Get medication count
                const medicationCount = prescription.medicines ? prescription.medicines.length : 0;
                
                row.innerHTML = `
                    <td>${date}</td>
                    <td>${prescription.diagnosis || 'N/A'}</td>
                    <td>${medicationCount} medication(s)</td>
                    <td>
                        <button class="action-button view-prescription" data-id="${prescription.prescriptionId}">View</button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Add event listeners to view buttons
            document.querySelectorAll('.view-prescription').forEach(button => {
                button.addEventListener('click', function() {
                    const prescriptionId = this.getAttribute('data-id');
                    viewPrescriptionDetails(prescriptionId);
                });
            });
        })
        .catch(error => {
            console.error('Error loading patient prescriptions:', error);
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Error loading prescriptions. Please try again.</td></tr>';
        });
}

// Load patient medical history
function loadPatientMedicalHistory(patientId) {
    const container = document.getElementById('medical-history-container');
    
    // Show loading state
    container.innerHTML = '<p class="text-center">Loading medical history...</p>';
    
    // Call API to get patient medical history
    fetch(`http://localhost:8080/api/v1/patients/${patientId}/medical-history`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load medical history');
            }
            return response.json();
        })
        .then(data => {
            // Clear loading message
            container.innerHTML = '';
            
            if (!data || Object.keys(data).length === 0) {
                container.innerHTML = '<p class="text-center">No medical history found</p>';
                return;
            }
            
            // Create medical history content
            const historyContent = document.createElement('div');
            historyContent.className = 'medical-history';
            
            // Add allergies
            if (data.allergies) {
                const allergiesSection = document.createElement('div');
                allergiesSection.className = 'history-section';
                allergiesSection.innerHTML = `
                    <h4>Allergies</h4>
                    <p>${data.allergies}</p>
                `;
                historyContent.appendChild(allergiesSection);
            }
            
            // Add chronic conditions
            if (data.chronicConditions) {
                const conditionsSection = document.createElement('div');
                conditionsSection.className = 'history-section';
                conditionsSection.innerHTML = `
                    <h4>Chronic Conditions</h4>
                    <p>${data.chronicConditions}</p>
                `;
                historyContent.appendChild(conditionsSection);
            }
            
            // Add past surgeries
            if (data.pastSurgeries && data.pastSurgeries.length > 0) {
                const surgeriesSection = document.createElement('div');
                surgeriesSection.className = 'history-section';
                surgeriesSection.innerHTML = `
                    <h4>Past Surgeries</h4>
                    <ul>
                        ${data.pastSurgeries.map(surgery => `
                            <li>
                                <strong>${surgery.surgeryName}</strong> - ${new Date(surgery.surgeryDate).toLocaleDateString()}
                                ${surgery.notes ? `<p>${surgery.notes}</p>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                `;
                historyContent.appendChild(surgeriesSection);
            }
            
            // Add family history
            if (data.familyHistory) {
                const familySection = document.createElement('div');
                familySection.className = 'history-section';
                familySection.innerHTML = `
                    <h4>Family History</h4>
                    <p>${data.familyHistory}</p>
                `;
                historyContent.appendChild(familySection);
            }
            
            // Add lifestyle information
            if (data.lifestyle) {
                const lifestyleSection = document.createElement('div');
                lifestyleSection.className = 'history-section';
                lifestyleSection.innerHTML = `
                    <h4>Lifestyle Information</h4>
                    <p><strong>Smoking:</strong> ${data.lifestyle.smoking || 'N/A'}</p>
                    <p><strong>Alcohol:</strong> ${data.lifestyle.alcohol || 'N/A'}</p>
                    <p><strong>Exercise:</strong> ${data.lifestyle.exercise || 'N/A'}</p>
                    <p><strong>Diet:</strong> ${data.lifestyle.diet || 'N/A'}</p>
                `;
                historyContent.appendChild(lifestyleSection);
            }
            
            container.appendChild(historyContent);
        })
        .catch(error => {
            console.error('Error loading medical history:', error);
            container.innerHTML = '<p class="text-center text-danger">Error loading medical history. Please try again.</p>';
        });
}

// Edit patient
function editPatient(patient) {
    // In a real application, you would open a modal with a form to edit the patient
    alert('Edit patient functionality would be implemented here.');
}

// Book appointment
function bookAppointment(patientId) {
    // In a real application, you would redirect to the appointment booking page
    window.location.href = `doctor-book-appointment.html?patientId=${patientId}`;
}

// View appointment details
function viewAppointmentDetails(appointmentId) {
    // In a real application, you would open a modal with appointment details
    window.location.href = `doctor-appointments.html?appointmentId=${appointmentId}`;
}

// View prescription details
function viewPrescriptionDetails(prescriptionId) {
    // In a real application, you would open a modal with prescription details
    window.location.href = `doctor-prescriptions.html?prescriptionId=${prescriptionId}`;
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