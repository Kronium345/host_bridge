// Verification Document Upload Handler

// Toast notification function (uses existing toast system from base.html)
function showToast(message, type = 'success') {
    if (window.toast) {
        window.toast(message, type);
    } else {
        // Fallback if toast not available
        alert(message);
    }
}

// Handle file selection preview
function setupFilePreview() {
    const fileInputs = document.querySelectorAll('.file-upload-area input[type="file"]');

    fileInputs.forEach(input => {
        input.addEventListener('change', function () {
            const uploadArea = this.closest('.file-upload-area');
            const label = uploadArea.querySelector('.file-upload-label');

            if (this.files && this.files.length > 0) {
                const file = this.files[0];
                const fileName = file.name;
                const fileSize = (file.size / 1024 / 1024).toFixed(2); // MB

                // Update label to show file name
                label.innerHTML = `
                    <i class="fas fa-file-check" style="color: #2E8B57;"></i>
                    <p><strong>${fileName}</strong></p>
                    <span>${fileSize} MB</span>
                `;
                uploadArea.style.borderColor = '#2E8B57';
                uploadArea.style.backgroundColor = '#f0fdf4';
            }
        });
    });
}

// Handle form submission for identity verification
function setupIdentityForm() {
    const form = document.getElementById('identity-form');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = new FormData(this);
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

        try {
            const response = await fetch('/api/verify/upload/identity', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                showToast(data.message, 'success');
                markStepComplete('identity');

                // If all complete, update overall status
                if (data.completion_status && data.completion_status.all_complete) {
                    updateVerificationStatus('completed');
                }

                // Reset form
                form.reset();
                resetFileUploadAreas();
            } else {
                showToast(data.message || 'Upload failed', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showToast('An error occurred during upload. Please try again.', 'error');
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

// Handle form submission for address verification
function setupAddressForm() {
    const form = document.getElementById('address-form');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = new FormData(this);
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

        try {
            const response = await fetch('/api/verify/upload/address', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                showToast(data.message, 'success');
                markStepComplete('address');

                if (data.completion_status && data.completion_status.all_complete) {
                    updateVerificationStatus('completed');
                }

                form.reset();
                resetFileUploadAreas();
            } else {
                showToast(data.message || 'Upload failed', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showToast('An error occurred during upload. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

// Handle form submission for role verification
function setupRoleForm() {
    const form = document.getElementById('role-form');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = new FormData(this);
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

        try {
            const response = await fetch('/api/verify/upload/role', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                showToast(data.message, 'success');
                markStepComplete('role');

                if (data.completion_status && data.completion_status.all_complete) {
                    updateVerificationStatus('completed');
                }

                form.reset();
                resetFileUploadAreas();
            } else {
                showToast(data.message || 'Upload failed', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showToast('An error occurred during upload. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

// Mark step as complete
function markStepComplete(stepType) {
    const step = document.getElementById(`step-${stepType}`);
    if (!step) return;

    const statusIcon = step.querySelector('.step-status i');
    if (statusIcon) {
        statusIcon.className = 'fas fa-check-circle';
        statusIcon.style.color = '#2E8B57';
    }

    step.classList.add('step-complete');
}

// Reset file upload areas
function resetFileUploadAreas() {
    const uploadAreas = document.querySelectorAll('.file-upload-area');
    uploadAreas.forEach(area => {
        const label = area.querySelector('.file-upload-label');
        const input = area.querySelector('input[type="file"]');

        if (label) {
            label.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Click to upload or drag and drop</p>
                <span>JPG, PNG or PDF (Max 5MB)</span>
            `;
        }

        area.style.borderColor = '';
        area.style.backgroundColor = '';
    });
}

// Update overall verification status
function updateVerificationStatus(status) {
    const statusCard = document.querySelector('.status-card');
    if (!statusCard) return;

    const statusIcon = statusCard.querySelector('.status-icon i');
    const statusText = statusCard.querySelector('h3');
    const statusDesc = statusCard.querySelector('p');

    if (status === 'completed') {
        statusIcon.className = 'fas fa-check-circle';
        statusIcon.style.color = '#2E8B57';
        statusText.innerHTML = 'Verification Status: <span class="status-completed" style="color: #2E8B57;">Completed</span>';
        statusDesc.textContent = 'Your documents have been submitted and are pending admin review';
        statusCard.style.background = 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
    }
}

// Load verification status on page load
async function loadVerificationStatus() {
    try {
        const response = await fetch('/api/verify/status');
        const data = await response.json();

        if (data.success && data.completion) {
            if (data.completion.identity_verified) {
                markStepComplete('identity');
            }
            if (data.completion.address_verified) {
                markStepComplete('address');
            }
            if (data.completion.role_verified) {
                markStepComplete('role');
            }
            if (data.completion.all_complete) {
                updateVerificationStatus('completed');
            }
        }
    } catch (error) {
        console.error('Error loading verification status:', error);
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    setupFilePreview();
    setupIdentityForm();
    setupAddressForm();
    setupRoleForm();
    loadVerificationStatus();
});

