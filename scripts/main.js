// OneDrive connection and authentication
document.getElementById('connectOneDrive').addEventListener('click', async () => {
    try {
        // Show loading state
        const button = document.getElementById('connectOneDrive');
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Connecting...';

        // Initialize OneDrive connection
        await initializeOneDrive();

        // Show storage stats
        document.getElementById('storageStats').style.display = 'block';
        updateStorageStats();

        // Update button state
        button.innerHTML = 'Connected';
        button.classList.remove('btn-primary');
        button.classList.add('btn-success');
    } catch (error) {
        console.error('OneDrive connection error:', error);
        alert('Failed to connect to OneDrive. Please try again.');
        
        // Reset button state
        button.disabled = false;
        button.innerHTML = 'Connect to OneDrive';
    }
});

// Initialize OneDrive connection
async function initializeOneDrive() {
    // TODO: Implement OneDrive authentication
    return new Promise(resolve => setTimeout(resolve, 1500)); // Simulated delay
}

// Update storage statistics
async function updateStorageStats() {
    // TODO: Implement actual OneDrive stats
    const stats = {
        used: 75, // GB
        total: 100, // GB
        largeFiles: 15,
        oldFiles: 25
    };

    // Update progress bar
    const progressBar = document.querySelector('.progress-bar');
    const usagePercentage = (stats.used / stats.total) * 100;
    progressBar.style.width = `${usagePercentage}%`;
    progressBar.innerHTML = `${usagePercentage.toFixed(1)}%`;

    // Update stats details
    const statsDetails = document.getElementById('statsDetails');
    statsDetails.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>Storage Used:</strong> ${stats.used}GB / ${stats.total}GB</p>
                <p><strong>Large Files:</strong> ${stats.largeFiles}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Storage Available:</strong> ${stats.total - stats.used}GB</p>
                <p><strong>Old Files:</strong> ${stats.oldFiles}</p>
            </div>
        </div>
    `;
}
