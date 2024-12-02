const { exec } = require('child_process');
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes } = require('firebase/storage');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

// Firebase configuration - Replace with your config
const firebaseConfig = {
  // Add your Firebase config here
  // apiKey: "your-api-key",
  // authDomain: "your-auth-domain",
  // projectId: "your-project-id",
  // storageBucket: "your-storage-bucket",
  // messagingSenderId: "your-messaging-sender-id",
  // appId: "your-app-id"
};

// Initialize Firebase
let firebaseApp;
let storage;

try {
  firebaseApp = initializeApp(firebaseConfig);
  storage = getStorage(firebaseApp);
} catch (error) {
  console.log('Firebase not configured yet. Skipping initialization.');
}

// Configuration
const config = {
  github: {
    enabled: true,
    remote: 'origin',
    branch: 'main'
  },
  gitlab: {
    enabled: true,
    remote: 'gitlab',
    branch: 'main'
  },
  firebase: {
    enabled: false, // Enable after adding config
    backupFolder: 'backups'
  }
};

async function pushToGit(remote, branch) {
  try {
    // Add all changes
    await execPromise('git add .');
    
    // Create commit with timestamp
    const timestamp = new Date().toISOString();
    await execPromise(`git commit -m "Automated backup ${timestamp}"`);
    
    // Push to remote
    await execPromise(`git push ${remote} ${branch}`);
    console.log(`Successfully pushed to ${remote}`);
  } catch (error) {
    console.error(`Error pushing to ${remote}:`, error);
  }
}

async function backupToFirebase() {
  if (!storage) {
    console.log('Firebase not configured. Skipping backup.');
    return;
  }

  try {
    // Create zip file of the project (excluding node_modules, etc.)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFileName = `backup-${timestamp}.zip`;
    
    await execPromise(`powershell Compress-Archive -Path * -DestinationPath ${zipFileName} -Force`);

    // Upload to Firebase Storage
    const fileBuffer = fs.readFileSync(zipFileName);
    const storageRef = ref(storage, `${config.firebase.backupFolder}/${zipFileName}`);
    await uploadBytes(storageRef, fileBuffer);

    // Clean up zip file
    fs.unlinkSync(zipFileName);
    console.log('Successfully backed up to Firebase Storage');
  } catch (error) {
    console.error('Error backing up to Firebase:', error);
  }
}

async function performBackup() {
  console.log('Starting backup process...');

  if (config.github.enabled) {
    console.log('Backing up to GitHub...');
    await pushToGit(config.github.remote, config.github.branch);
  }

  if (config.gitlab.enabled) {
    console.log('Backing up to GitLab...');
    await pushToGit(config.gitlab.remote, config.gitlab.branch);
  }

  if (config.firebase.enabled) {
    console.log('Backing up to Firebase Storage...');
    await backupToFirebase();
  }

  console.log('Backup process completed!');
}

// Run backup if called directly
if (require.main === module) {
  performBackup();
}

module.exports = { performBackup };
