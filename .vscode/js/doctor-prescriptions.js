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
    
    // Initialize date range filter
    initializeDateRangeFilter();
    
    // Load prescriptions
    loadPrescriptions();
    
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

// Initialize date range filter
function initializeDateRangeFilter() {
    const dateRangeSelect = document.getElementById('date-range');
    const customDateRange = document.querySelectorAll('.custom-date-range');
    const filterButton = document.getElementById('filter-prescriptions');
    const resetButton = document.getElementById('reset-filters');
    
    // Set default dates
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('start-date').valueAsDate = startOfMonth;
    document.getElementById('end-date').valueAsDate = today;
    
    // Show/hide custom date range based on selection
    dateRangeSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customDateRange.forEach(el => el.style.display = 'block');
        } else {
            customDateRange.forEach(el => el.style.display = 'none');
        }
    });
    
    // Filter button click
    filterButton.addEventListener('click', function() {
        loadPrescriptions();
    });
    
    // Reset button click
    resetButton.addEventListener('click', function() {
        dateRangeSelect.value = 'all';
        document.getElementById('patient-filter').value = '';
        customDateRange.forEach(el => el.style.display = 'none');
        document.getElementById('start-date').valueAsDate = startOfMonth;
        document.getElementById('end-date').valueAsDate = today;
        loadPrescriptions();
    });
}

// Load prescriptions
function loadPrescriptions() {
    const doctorId = localStorage.getItem('doctorId');
    const dateRange = document.getElementById('date-range').value;
    const patientFilter = document.getElementById('patient-filter').value.trim();
    
    let url = `http://localhost:8080/api/v1/prescriptions/doctor/${doctorId}?`;
    
    // Add date range filter
    if (dateRange !== 'all') {
        let startDate, endDate;
        
        if (dateRange === 'custom') {
            startDate = document.getElementById('start-date').value;
            endDate = document.getElementById('end-date').value;
        } else {
            const today = new Date();
            endDate = today.toISOString().split('T')[0];
            
            if (dateRange === 'today') {
                startDate = endDate;
            } else if (dateRange === 'week') {
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                startDate = weekAgo.toISOString().split('T')[0];
            } else if (dateRange === 'month') {
                const monthAgo = new Date(today);
                monthAgo.setMonth(today.getMonth() - 1);
                startDate = monthAgo.toISOString().split('T')[0];
            }
        }
        
        url += `startDate=${startDate}&endDate=${endDate}`;
    }
    
    // Add patient filter
    if (patientFilter) {
        url += `&patientName=${encodeURIComponent(patientFilter)}`;
    }
    
    // Call API to get prescriptions
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load prescriptions');
            }
            return response.json();
        })
        .then(data => {
            updatePrescriptionsTable(data);
        })
        .catch(error => {
            console.error('Error loading prescriptions:', error);
            document.querySelector('#prescriptions-table tbody').innerHTML = 
                `<tr><td colspan="6" class="text-center">Error loading prescriptions. Please try again.</td></tr>`;
        });
}

// Update prescriptions table
function updatePrescriptionsTable(prescriptions) {
    const tableBody = document.querySelector('#prescriptions-table tbody');
    
    // Clear loading row
    tableBody.innerHTML = '';
    
    if (!prescriptions || prescriptions.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No prescriptions found</td></tr>`;
        return;
    }
    
    // Sort prescriptions by date (most recent first)
    prescriptions.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
    });
    
    prescriptions.forEach(prescription => {
        const row = document.createElement('tr');
        
        // Format date
        const date = prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString() : 'N/A';
        
        // Get medication count
        const medicationCount = prescription.medicines ? prescription.medicines.length : 0;
        
        row.innerHTML = `
            <td>${date}</td>
            <td>${prescription.patientName || 'N/A'}</td>
            <td>${prescription.appointmentDate ? new Date(prescription.appointmentDate).toLocaleDateString() : 'N/A'}</td>
            <td>${prescription.diagnosis || 'N/A'}</td>
            <td>${medicationCount} medication(s)</td>
            <td>
                <button class="action-button view-prescription" data-id="${prescription.prescriptionId}">View</button>
                <button class="action-button secondary edit-prescription" data-id="${prescription.prescriptionId}">Edit</button>
                <button class="action-button danger delete-prescription" data-id="${prescription.prescriptionId}">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.view-prescription').forEach(button => {
        button.addEventListener('click', function() {
            const prescriptionId = this.getAttribute('data-id');
            viewPrescriptionDetails(prescriptionId);
        });
    });
    
    document.querySelectorAll('.edit-prescription').forEach(button => {
        button.addEventListener('click', function() {
            const prescriptionId = this.getAttribute('data-id');
            editPrescription(prescriptionId);
        });
    });
    
    document.querySelectorAll('.delete-prescription').forEach(button => {
        button.addEventListener('click', function() {
            const prescriptionId = this.getAttribute('data-id');
            deletePrescription(prescriptionId);
        });
    });
}

// Initialize modals
function initializeModals() {
    const detailsModal = document.getElementById('prescription-details-modal');
    const editModal = document.getElementById('edit-prescription-modal');
    const closeButtons = document.querySelectorAll('.close');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            detailsModal.style.display = 'none';
            editModal.style.display = 'none';
        });
    });
}
 
    window.addEventListener('click', function(event) {
        if (event.target === detailsModal) {
            detailsModal.style.display = 'none';
        }
        if (event.target === editModal) {
            editModal.style.display = 'none';
        }
    });
    
    // Initialize print button
    document.getElementById('print-prescription').addEventListener('click', function() {
        printPrescription();
    });
    
    // Initialize edit form
    const editForm = document.getElementById('edit-prescription-form');
    const addMedicineButton = document.getElementById('edit-add-medicine');
    const cancelEditButton = document.getElementById('cancel-edit');
    
    addMedicineButton.addEventListener('click', function() {
        addMedicineField('edit');
    });
    
    cancelEditButton.addEventListener('click', function() {
        editModal.style.display = 'none';
    });
    
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        updatePrescription();
    });
}

// View prescription details
function viewPrescriptionDetails(prescriptionId) {
    const modal = document.getElementById('prescription-details-modal');
    const detailsContainer = document.getElementById('prescription-details');
    
    // Show loading state
    detailsContainer.innerHTML = '<p class="text-center">Loading prescription details...</p>';
    modal.style.display = 'block';
    
    // Call API to get prescription details
    fetch(`http://localhost:8080/api/v1/prescriptions/${prescriptionId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load prescription details');
            }
            return response.json();
        })
        .then(prescription => {
            // Format date
            const date = prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString() : 'N/A';
            const appointmentDate = prescription.appointmentDate ? new Date(prescription.appointmentDate).toLocaleDateString() : 'N/A';
            
            // Update prescription details
            detailsContainer.innerHTML = `
                <div class="prescription-header">
                    <h2>Prescription Details</h2>
                    <p class="prescription-date">Date: ${date}</p>
                </div>
                
                <div class="prescription-info">
                    <div class="info-group">
                        <h3>Patient Information</h3>
                        <p><strong>Name:</strong> ${prescription.patientName || 'N/A'}</p>
                        <p><strong>Appointment Date:</strong> ${appointmentDate}</p>
                    </div>
                    
                    <div class="info-group">
                        <h3>Diagnosis</h3>
                        <p>${prescription.diagnosis || 'N/A'}</p>
                    </div>
                </div>
                
                <div class="prescription-notes">
                    <h3>Notes & Recommendations</h3>
                    <p>${prescription.notes || 'None'}</p>
                </div>
                
                <div class="prescription-medicines">
                    <h3>Medications</h3>
                    ${prescription.medicines && prescription.medicines.length > 0 ? `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Medicine</th>
                                    <th>Dosage</th>
                                    <th>Frequency</th>
                                    <th>Duration</th>
                                    <th>Instructions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${prescription.medicines.map(medicine => `
                                    <tr>
                                        <td>${medicine.medicineName}</td>
                                        <td>${medicine.dosage}</td>
                                        <td>${medicine.frequency}</td>
                                        <td>${medicine.durationDays} days</td>
                                        <td>${medicine.instructions || 'N/A'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p>No medications prescribed</p>'}
                </div>
            `;
            
            // Store prescription ID for edit and delete buttons
            document.getElementById('edit-prescription').setAttribute('data-id', prescriptionId);
            document.getElementById('delete-prescription').setAttribute('data-id', prescriptionId);
            
            // Add event listeners to buttons
            document.getElementById('edit-prescription').addEventListener('click', function() {
                const prescriptionId = this.getAttribute('data-id');
                editPrescription(prescriptionId);
                modal.style.display = 'none';
            });
            
            document.getElementById('delete-prescription').addEventListener('click', function() {
                const prescriptionId = this.getAttribute('data-id');
                deletePrescription(prescriptionId);
                modal.style.display = 'none';
            });
        })
        .catch(error => {
            console.error('Error loading prescription details:', error);
            detailsContainer.innerHTML = '<p class="text-center text-danger">Error loading prescription details. Please try again.</p>';
        });
}

// Edit prescription
function editPrescription(prescriptionId) {
    const modal = document.getElementById('edit-prescription-modal');
    const medicinesContainer = document.getElementById('edit-medicines-container');
    
    // Clear previous medicines
    medicinesContainer.innerHTML = '';
    
    // Show loading state
    document.getElementById('prescription-id').value = prescriptionId;
    modal.style.display = 'block';
    
    // Call API to get prescription details
    fetch(`http://localhost:8080/api/v1/prescriptions/${prescriptionId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load prescription details');
            }
            return response.json();
        })
        .then(prescription => {
            // Fill form with prescription details
            document.getElementById('edit-diagnosis').value = prescription.diagnosis || '';
            document.getElementById('edit-notes').value = prescription.notes || '';
            
            // Add medicine fields
            if (prescription.medicines && prescription.medicines.length > 0) {
                prescription.medicines.forEach((medicine, index) => {
                    const medicineItem = document.createElement('div');
                    medicineItem.className = 'medicine-item';
                    medicineItem.innerHTML = `
                        <button type="button" class="remove-medicine" onclick="removeMedicineField(this)">
                            <i class="fa-solid fa-times"></i>
                        </button>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="edit-medicine-name-${index}">Medicine Name</label>
                                <input type="text" id="edit-medicine-name-${index}" name="medicines[${index}].medicineName" value="${medicine.medicineName}" required>
                            </div>
                            <div class="form-group">
                                <label for="edit-medicine-dosage-${index}">Dosage</label>
                                <input type="text" id="edit-medicine-dosage-${index}" name="medicines[${index}].dosage" value="${medicine.dosage}" placeholder="e.g., 500mg" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="edit-medicine-frequency-${index}">Frequency</label>
                                <input type="text" id="edit-medicine-frequency-${index}" name="medicines[${index}].frequency" value="${medicine.frequency}" placeholder="e.g., Twice daily" required>
                            </div>
                            <div class="form-group">
                                <label for="edit-medicine-duration-${index}">Duration (days)</label>
                                <input type="number" id="edit-medicine-duration-${index}" name="medicines[${index}].durationDays" value="${medicine.durationDays}" min="1" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="edit-medicine-instructions-${index}">Instructions</label>
                            <textarea id="edit-medicine-instructions-${index}" name="medicines[${index}].instructions" placeholder="e.g., Take after meals">${medicine.instructions || ''}</textarea>
                        </div>
                    `;
                    
                    medicinesContainer.appendChild(medicineItem);
                });
            } else {
                // Add at least one empty medicine field
                addMedicineField('edit');
            }
        })
        .catch(error => {
            console.error('Error loading prescription for edit:', error);
            alert('Failed to load prescription details. Please try again.');
            modal.style.display = 'none';
        });
}

// Add medicine field
function addMedicineField(prefix = '') {
    const medicinesContainer = document.getElementById(`${prefix ? prefix + '-' : ''}medicines-container`);
    const medicineIndex = medicinesContainer.children.length;
    
    const medicineItem = document.createElement('div');
    medicineItem.className = 'medicine-item';
    medicineItem.innerHTML = `
        <button type="button" class="remove-medicine" onclick="removeMedicineField(this)">
            <i class="fa-solid fa-times"></i>
        </button>
        <div class="form-row">
            <div class="form-group">
                <label for="${prefix ? prefix + '-' : ''}medicine-name-${medicineIndex}">Medicine Name</label>
                <input type="text" id="${prefix ? prefix + '-' : ''}medicine-name-${medicineIndex}" name="medicines[${medicineIndex}].medicineName" required>
            </div>
            <div class="form-group">
                <label for="${prefix ? prefix + '-' : ''}medicine-dosage-${medicineIndex}">Dosage</label>
                <input type="text" id="${prefix ? prefix + '-' : ''}medicine-dosage-${medicineIndex}" name="medicines[${medicineIndex}].dosage" placeholder="e.g., 500mg" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="${prefix ? prefix + '-' : ''}medicine-frequency-${medicineIndex}">Frequency</label>
                <input type="text" id="${prefix ? prefix + '-' : ''}medicine-frequency-${medicineIndex}" name="medicines[${medicineIndex}].frequency" placeholder="e.g., Twice daily" required>
            </div>
            <div class="form-group">
                <label for="${prefix ? prefix + '-' : ''}medicine-duration-${medicineIndex}">Duration (days)</label>
                <input type="number" id="${prefix ? prefix + '-' : ''}medicine-duration-${medicineIndex}" name="medicines[${medicineIndex}].durationDays" min="1" required>
            </div>
        </div>
        <div class="form-group">
            <label for="${prefix ? prefix + '-' : ''}medicine-instructions-${medicineIndex}">Instructions</label>
            <textarea id="${prefix ? prefix + '-' : ''}medicine-instructions-${medicineIndex}" name="medicines[${medicineIndex}].instructions" placeholder="e.g., Take after meals"></textarea>
        </div>
    `;
    
    medicinesContainer.appendChild(medicineItem);
}

// Remove medicine field
function removeMedicineField(button) {
    const medicineItem = button.parentElement;
    medicineItem.remove();
}

// Update prescription
function updatePrescription() {
    const prescriptionId = document.getElementById('prescription-id').value;
    const diagnosis = document.getElementById('edit-diagnosis').value;
    const notes = document.getElementById('edit-notes').value;
    
    // Collect medicines
    const medicines = [];
    const medicineItems = document.querySelectorAll('#edit-medicines-container .medicine-item');
    
    medicineItems.forEach((item, index) => {
        const medicineName = item.querySelector(`[name="medicines[${index}].medicineName"]`).value;
        const dosage = item.querySelector(`[name="medicines[${index}].dosage"]`).value;
        const frequency = item.querySelector(`[name="medicines[${index}].frequency"]`).value;
        const durationDays = item.querySelector(`[name="medicines[${index}].durationDays"]`).value;
        const instructions = item.querySelector(`[name="medicines[${index}].instructions"]`).value;
        
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
        prescriptionId,
        diagnosis,
        notes,
        medicines
    };
    
    // Call API to update prescription
    fetch(`http://localhost:8080/api/v1/prescriptions/${prescriptionId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(prescription)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update prescription');
        }
        return response.json();
    })
    .then(data => {
        alert('Prescription updated successfully');
        document.getElementById('edit-prescription-modal').style.display = 'none';
        loadPrescriptions();
    })
    .catch(error => {
        console.error('Error updating prescription:', error);
        alert('Failed to update prescription. Please try again.');
    });
}

// Delete prescription
function deletePrescription(prescriptionId) {
    if (!confirm('Are you sure you want to delete this prescription? This action cannot be undone.')) {
        return;
    }
    
    // Call API to delete prescription
    fetch(`http://localhost:8080/api/v1/prescriptions/${prescriptionId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete prescription');
        }
        return response.json();
    })
    .then(data => {
        alert('Prescription deleted successfully');
        document.getElementById('prescription-details-modal').style.display = 'none';
        loadPrescriptions();
    })
    .catch(error => {
        console.error('Error deleting prescription:', error);
        alert('Failed to delete prescription. Please try again.');
    });
}

// Print prescription
function printPrescription() {
    const content = document.getElementById('prescription-details').innerHTML;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Prescription</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    padding: 20px;
                }
                h2, h3 {
                    color: #1F2B6C;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                table, th, td {
                    border: 1px solid #ddd;
                }
                th, td {
                    padding: 10px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
                .prescription-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #1F2B6C;
                    padding-bottom: 10px;
                }
                .prescription-date {
                    font-style: italic;
                }
                .prescription-footer {
                    margin-top: 50px;
                    border-top: 1px solid #ddd;
                    padding-top: 20px;
                    text-align: right;
                }
                .doctor-signature {
                    margin-top: 30px;
                }
            </style>
        </head>
        <body>
            <div class="prescription-header">
                <h1>DocOnClick</h1>
                <div>
                    <p><strong>Doctor:</strong> ${localStorage.getItem('userName') || 'Doctor'}</p>
                    <p><strong>Specialization:</strong> ${localStorage.getItem('userSpecialization') || 'Specialist'}</p>
                </div>
            </div>
            ${content}
            <div class="prescription-footer">
                <div class="doctor-signature">
                    <p>Doctor's Signature</p>
                    <p>_______________________</p>
                    <p>${localStorage.getItem('userName') || 'Doctor'}</p>
                </div>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Print after a short delay to ensure content is loaded
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

// Toggle sidebar on mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.dashboard-sidebar');
    sidebar.classList.toggle('active');
}
