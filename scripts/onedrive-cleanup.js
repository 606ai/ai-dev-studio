const { Client } = require('@microsoft/microsoft-graph-client');
const { PublicClientApplication } = require('@azure/msal-node');
const express = require('express');
require('isomorphic-fetch');
require('dotenv').config();

class OneDriveCleanup {
  constructor(accessToken) {
    this.client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
  }

  async analyzeStorage() {
    try {
      console.log('Analyzing OneDrive storage...');
      const drive = await this.client.api('/me/drive').get();
      console.log(`\nTotal Storage: ${formatBytes(drive.quota.total)}`);
      console.log(`Used: ${formatBytes(drive.quota.used)}`);
      console.log(`Remaining: ${formatBytes(drive.quota.remaining)}`);

      const items = await this.getAllItems();
      this.analyzeItems(items);
    } catch (error) {
      console.error('Error analyzing storage:', error.message);
    }
  }

  async getAllItems(path = '/me/drive/root/children') {
    try {
      const items = [];
      let response = await this.client.api(path).get();
      
      for (const item of response.value) {
        if (item.folder) {
          const subItems = await this.getAllItems(`/me/drive/items/${item.id}/children`);
          items.push(...subItems);
        } else if (item.file) {
          items.push({
            name: item.name,
            size: item.size,
            lastModified: new Date(item.lastModifiedDateTime),
            path: item.parentReference.path,
            id: item.id
          });
        }
      }

      return items;
    } catch (error) {
      console.error('Error getting items:', error.message);
      return [];
    }
  }

  async moveFile(sourceId, destinationPath) {
    try {
      console.log(`Moving file to: ${destinationPath}`);
      
      // Create the move request
      await this.client.api(`/me/drive/items/${sourceId}`).patch({
        parentReference: {
          path: `/drive/root:${destinationPath}`
        }
      });
      
      console.log('File moved successfully');
      return true;
    } catch (error) {
      console.error('Error moving file:', error.message);
      return false;
    }
  }

  async moveFiles(files, destinationFolder) {
    console.log(`Moving ${files.length} files to ${destinationFolder}`);
    let successCount = 0;
    let failureCount = 0;

    for (const file of files) {
      try {
        const success = await this.moveFile(file.id, destinationFolder);
        if (success) {
          successCount++;
          console.log(`Successfully moved: ${file.name}`);
        } else {
          failureCount++;
          console.log(`Failed to move: ${file.name}`);
        }
      } catch (error) {
        failureCount++;
        console.error(`Error moving ${file.name}:`, error.message);
      }
    }

    console.log(`\nMove operation completed:`);
    console.log(`Successfully moved: ${successCount} files`);
    console.log(`Failed to move: ${failureCount} files`);
  }

  async getFilesByFolder(folderPath = '/') {
    try {
      const response = await this.client
        .api(`/me/drive/root:${folderPath}:/children`)
        .get();
      
      return response.value;
    } catch (error) {
      console.error('Error getting files:', error.message);
      return [];
    }
  }

  analyzeItems(items) {
    // Large files (>100MB)
    const largeFiles = items.filter(item => item.size > 100 * 1024 * 1024)
      .sort((a, b) => b.size - a.size);

    // Old files (>6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const oldFiles = items.filter(item => item.lastModified < sixMonthsAgo)
      .sort((a, b) => a.lastModified - b.lastModified);

    // Potential duplicates
    const duplicates = new Map();
    items.forEach(item => {
      const key = `${item.name}_${item.size}`;
      if (!duplicates.has(key)) {
        duplicates.set(key, []);
      }
      duplicates.get(key).push(item);
    });

    const actualDuplicates = new Map([...duplicates].filter(([_, files]) => files.length > 1));

    // Print results
    console.log('\n=== Large Files (>100MB) ===');
    largeFiles.forEach(file => {
      console.log(`${file.path}/${file.name} (${formatBytes(file.size)})`);
    });

    console.log('\n=== Old Files (>6 months) ===');
    oldFiles.forEach(file => {
      console.log(`${file.path}/${file.name} (Last modified: ${file.lastModified.toLocaleDateString()})`);
    });

    console.log('\n=== Potential Duplicates ===');
    actualDuplicates.forEach((files, key) => {
      console.log(`\nDuplicate set (${formatBytes(files[0].size)}):`);
      files.forEach(file => {
        console.log(`- ${file.path}/${file.name}`);
      });
    });

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: items.length,
        totalSize: items.reduce((acc, item) => acc + item.size, 0),
        largeFiles: largeFiles.length,
        oldFiles: oldFiles.length,
        duplicateSets: actualDuplicates.size
      },
      largeFiles: largeFiles.map(f => ({
        path: `${f.path}/${f.name}`,
        size: formatBytes(f.size)
      })),
      oldFiles: oldFiles.map(f => ({
        path: `${f.path}/${f.name}`,
        lastModified: f.lastModified.toISOString()
      })),
      duplicates: Array.from(actualDuplicates.entries()).map(([key, files]) => ({
        size: formatBytes(files[0].size),
        files: files.map(f => `${f.path}/${f.name}`)
      }))
    };

    require('fs').writeFileSync(
      'onedrive-cleanup-report.json',
      JSON.stringify(report, null, 2)
    );
    console.log('\nReport saved to onedrive-cleanup-report.json');
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const REDIRECT_URI = 'http://localhost:3000/auth/callback';
const PORT = 3000;

async function handleOneDriveOperations(cleanup) {
  try {
    // Example: Move files from root to a new folder
    console.log('\nGetting files from root directory...');
    const files = await cleanup.getFilesByFolder('/');
    
    // Filter for specific files you want to move (e.g., PDFs)
    const filesToMove = files.filter(file => file.name.endsWith('.pdf'));
    
    if (filesToMove.length > 0) {
      console.log(`Found ${filesToMove.length} PDF files to move`);
      
      // Create a destination folder path (e.g., /Documents/PDFs)
      const destinationFolder = '/Documents/PDFs';
      
      // Move the files
      await cleanup.moveFiles(filesToMove, destinationFolder);
    } else {
      console.log('No PDF files found to move');
    }
    
    // Continue with storage analysis
    await cleanup.analyzeStorage();
  } catch (error) {
    console.error('Error in OneDrive operations:', error.message);
  }
}

async function main() {
  try {
    const app = express();
    let server;

    const msalConfig = {
      auth: {
        clientId: '8f251dcd-956d-4e20-8e25-d37b31567028',
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: REDIRECT_URI
      }
    };

    const pca = new PublicClientApplication(msalConfig);

    app.get('/auth/callback', async (req, res) => {
      const tokenRequest = {
        code: req.query.code,
        scopes: ['User.Read', 'Files.ReadWrite.All'],
        redirectUri: REDIRECT_URI
      };

      try {
        const response = await pca.acquireTokenByCode(tokenRequest);
        console.log('Authentication successful!');
        const cleanup = new OneDriveCleanup(response.accessToken);
        
        // Use our new function instead of just analyzeStorage
        await handleOneDriveOperations(cleanup);
        
        res.send('OneDrive operations completed! You can close this window.');
        server.close();
      } catch (error) {
        console.error('Token acquisition error:', error.message);
        res.status(500).send('Error during authentication');
      }
    });

    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      
      const authCodeUrlParameters = {
        scopes: ['User.Read', 'Files.ReadWrite.All'],
        redirectUri: REDIRECT_URI
      };

      pca.getAuthCodeUrl(authCodeUrlParameters)
        .then((url) => {
          console.log('Please open this URL in your browser to authenticate:');
          console.log(url);
        })
        .catch((error) => {
          console.error('Error getting auth URL:', error);
          server.close();
        });
    });

  } catch (error) {
    console.error('Setup error:', error.message);
    if (error.errorCode) {
      console.error('Error code:', error.errorCode);
    }
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
});
