# Setting Up the Project in WSL2

This guide provides instructions for setting up the AI Visual Feedback Bridge project in Windows Subsystem for Linux 2 (WSL2).

## Prerequisites

- WSL2 installed on Windows 10/11
- Ubuntu or another Linux distribution installed in WSL2
- Visual Studio Code with the Remote - WSL extension (optional but recommended)

## Installation Steps

### 1. Install Node.js and npm in WSL2

Open your WSL2 terminal and run:

```bash
# Update package lists
sudo apt update

# Install Node.js and npm
sudo apt install -y nodejs npm

# Verify installation
node --version
npm --version
```

If you need a newer version of Node.js than what's in the default repositories:

```bash
# Install curl if not already installed
sudo apt install -y curl

# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# Reload your profile
source ~/.bashrc  # or ~/.zshrc if using zsh

# Install the latest LTS version of Node.js
nvm install --lts

# Verify installation
node --version
npm --version
```

### 2. Set Up the Project

Clone the repository or copy the project files to your WSL2 filesystem:

```bash
# Navigate to your desired location
cd ~/projects  # or wherever you want to store the project

# Clone the repository (if using git)
git clone <repository-url>

# Or copy files from Windows to WSL2
# (The project should already be in your WSL2 filesystem)
```

### 3. Set Up the Bridge Server

```bash
# Navigate to the bridge server directory
cd ~/projects/ai-visual-feedback-bridge/bridge-server

# Install dependencies
npm install

# Start the server
npm start
```

### 4. Set Up the Cursor Extension

```bash
# Navigate to the cursor extension directory
cd ~/projects/ai-visual-feedback-bridge/cursor-extension

# Install dependencies
npm install

# Start the extension
npm start
```

### 5. Set Up the Browser Extension

The browser extension needs to be loaded in your Windows browser, not in WSL2:

1. Open your browser (Chrome/Edge) in Windows
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Navigate to the `browser-extension` directory in your project
   - If your project is in the WSL2 filesystem, you can access it in Windows at `\\wsl$\Ubuntu\home\<username>\projects\ai-visual-feedback-bridge\browser-extension`
   - Or you can copy the browser-extension directory to a Windows location

## Troubleshooting WSL2-Specific Issues

### Port Forwarding

By default, WSL2 services running on localhost should be accessible from Windows. If you're having trouble connecting:

1. Check that the bridge server is running and listening on the correct port (8080 by default)
2. Verify that Windows Firewall is not blocking the connection
3. You can explicitly forward the port with PowerShell (as Administrator):
   ```powershell
   netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=<WSL2-IP-Address>
   ```
   (Replace `<WSL2-IP-Address>` with the output of `wsl hostname -I` in a PowerShell window)

### File System Performance

WSL2 file system performance can be slow when accessing Windows files from WSL2. For best performance:

1. Keep the project files in the WSL2 filesystem (e.g., `/home/<username>/projects/`)
2. Avoid working across the filesystem boundary (e.g., don't run Node.js in WSL2 on files stored in Windows)

### Browser Extension Connection

If the browser extension can't connect to the bridge server:

1. Make sure the WebSocket URL in `browser-extension/background.js` is correct:
   - If you're using port forwarding or have a specific WSL2 setup, you might need to change `ws://localhost:8080` to the appropriate address
   - You can try using the WSL2 IP address directly: `ws://<WSL2-IP-Address>:8080`

2. Check that the bridge server is running and accessible:
   - In your Windows browser, navigate to `http://localhost:8080` - you should see the bridge server status page
   - If not, check your WSL2 setup and port forwarding

### Using Visual Studio Code

Using VS Code with the Remote - WSL extension is recommended:

1. Install the "Remote - WSL" extension in VS Code
2. Open VS Code and click on the green "><" icon in the bottom-left corner
3. Select "Remote-WSL: New Window"
4. In the new window, open your project folder in the WSL2 filesystem
5. You can now work with the project files directly in WSL2, with full terminal access

This approach gives you the best of both worlds: Windows UI with Linux development environment. 