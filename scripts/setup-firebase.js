const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupFirebase() {
  console.log('🔥 Starting Firebase setup...\n');

  try {
    // Check if Firebase CLI is installed
    try {
      await execCommand('firebase --version');
      console.log('✅ Firebase CLI is already installed');
    } catch {
      console.log('📦 Installing Firebase CLI...');
      await execCommand('npm install -g firebase-tools');
    }

    // Login to Firebase
    console.log('\n🔑 Please login to Firebase...');
    await execCommand('firebase login');

    // Initialize Firebase project
    const projectId = await question('\n📝 Enter your Firebase project ID: ');
    
    console.log('\n🚀 Initializing Firebase project...');
    await execCommand(`firebase init storage --project ${projectId}`);

    // Get Firebase configuration
    console.log('\n⚙️ Please enter your Firebase configuration:');
    const config = {
      apiKey: await question('API Key: '),
      authDomain: await question('Auth Domain: '),
      projectId: projectId,
      storageBucket: await question('Storage Bucket: '),
      messagingSenderId: await question('Messaging Sender ID: '),
      appId: await question('App ID: '),
    };

    // Create .env file
    console.log('\n📝 Creating .env file...');
    const envContent = `
REACT_APP_FIREBASE_API_KEY=${config.apiKey}
REACT_APP_FIREBASE_AUTH_DOMAIN=${config.authDomain}
REACT_APP_FIREBASE_PROJECT_ID=${config.projectId}
REACT_APP_FIREBASE_STORAGE_BUCKET=${config.storageBucket}
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId}
REACT_APP_FIREBASE_APP_ID=${config.appId}

# Storage Configuration
STORAGE_THRESHOLD=85
BACKUP_RETENTION_DAYS=30
BACKUP_SCHEDULE="0 0 * * *"
SYNC_ENABLED=true
SYNC_INTERVAL=300
`.trim();

    await fs.writeFile('.env', envContent);
    console.log('✅ Created .env file');

    // Create storage rules
    console.log('\n📝 Creating storage rules...');
    const rulesContent = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024 // 5MB
                   && request.resource.contentType.matches('image/.*|application/pdf|text/.*');
    }
  }
}`;

    await fs.writeFile('storage.rules', rulesContent);
    console.log('✅ Created storage rules');

    // Deploy storage rules
    console.log('\n🚀 Deploying storage rules...');
    await execCommand('firebase deploy --only storage');

    console.log('\n✨ Firebase setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Review and customize storage.rules if needed');
    console.log('2. Add more file type restrictions in storage rules');
    console.log('3. Set up Firebase Authentication if not already configured');
    console.log('4. Configure backup schedule in .env');

  } catch (error) {
    console.error('\n❌ Error during setup:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Command stderr: ${stderr}`);
      }
      if (stdout) {
        console.log(stdout);
      }
      resolve();
    });
  });
}

setupFirebase().catch(console.error);
