import * as msal from '@azure/msal-node';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const config = {
  auth: {
    clientId: process.env.ONEDRIVE_CLIENT_ID || '',
    authority: 'https://login.microsoftonline.com/common',
    clientSecret: process.env.ONEDRIVE_CLIENT_SECRET || '',
  }
};

const scopes = ['Files.ReadWrite.All'];

async function getToken(): Promise<string> {
  const cca = new msal.ConfidentialClientApplication(config);
  
  try {
    // Check for cached token
    const tokenPath = path.join(__dirname, '.token-cache.json');
    if (fs.existsSync(tokenPath)) {
      const cached = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
      if (cached.expiresOn > Date.now()) {
        return cached.accessToken;
      }
    }

    // Get new token
    const response = await cca.acquireTokenByClientCredential({
      scopes: scopes
    });

    if (response) {
      // Cache the token
      fs.writeFileSync(tokenPath, JSON.stringify({
        accessToken: response.accessToken,
        expiresOn: response.expiresOn
      }));
      
      return response.accessToken;
    } else {
      throw new Error('No token received');
    }
  } catch (error) {
    console.error('Error getting token:', error);
    throw error;
  }
}

async function main() {
  try {
    const token = await getToken();
    console.log('Token acquired successfully');
    
    // Update .env file with the token
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or add the token
    if (envContent.includes('ONEDRIVE_ACCESS_TOKEN=')) {
      envContent = envContent.replace(
        /ONEDRIVE_ACCESS_TOKEN=.*/,
        `ONEDRIVE_ACCESS_TOKEN=${token}`
      );
    } else {
      envContent += `\nONEDRIVE_ACCESS_TOKEN=${token}`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('Token saved to .env file');
  } catch (error) {
    console.error('Authentication failed:', error);
    process.exit(1);
  }
}

main();
