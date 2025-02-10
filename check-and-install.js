const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// List of required dependencies
const requiredDependencies = ['express', 'http-proxy-middleware', 'cors', 'helmet'];

const installDependencies = () => {
    return new Promise((resolve, reject) => {
        exec('npm install', (err, stdout, stderr) => {
            if (err) {
                reject(`Error installing dependencies: ${stderr}`);
            } else {
                resolve(stdout);
            }
        });
    });
};

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
    console.log('No node_modules directory found. Installing dependencies...');
    installDependencies()
        .then(output => {
            console.log('Dependencies installed successfully.');
            require('./server'); // Import the server.js after installing dependencies
        })
        .catch(error => {
            console.error(error);
        });
} else {
    require('./server'); // Run the server if dependencies already exist
}
