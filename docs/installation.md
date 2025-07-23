# Installing Node.js and npm

Before you can run the bridge server and Cursor extension, you need to have Node.js and npm installed. Here are instructions for different operating systems:

## Windows

1. Download the Node.js installer from the [official website](https://nodejs.org/)
2. Run the installer and follow the installation wizard
3. Verify the installation by opening Command Prompt and running:
   ```
   node --version
   npm --version
   ```

## macOS

### Using Homebrew (recommended)
1. Install Homebrew if you don't have it:
   ```
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. Install Node.js (which includes npm):
   ```
   brew install node
   ```
3. Verify the installation:
   ```
   node --version
   npm --version
   ```

### Using the Installer
1. Download the macOS installer from the [official website](https://nodejs.org/)
2. Run the installer and follow the installation wizard
3. Verify the installation by opening Terminal and running:
   ```
   node --version
   npm --version
   ```

## Linux (Ubuntu/Debian)

1. Update your package list:
   ```
   sudo apt update
   ```
2. Install Node.js and npm:
   ```
   sudo apt install nodejs npm
   ```
3. Verify the installation:
   ```
   node --version
   npm --version
   ```

## Linux (Fedora/RHEL/CentOS)

1. Update your package list:
   ```
   sudo dnf update
   ```
2. Install Node.js and npm:
   ```
   sudo dnf install nodejs
   ```
3. Verify the installation:
   ```
   node --version
   npm --version
   ```

## Using NVM (Node Version Manager)

NVM is recommended for developers who need to work with multiple Node.js versions:

1. Install NVM:
   ```
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
   ```
   or
   ```
   wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
   ```

2. Restart your terminal or source your profile:
   ```
   source ~/.bashrc  # or ~/.zshrc, ~/.profile, etc.
   ```

3. Install the latest LTS version of Node.js:
   ```
   nvm install --lts
   ```

4. Verify the installation:
   ```
   node --version
   npm --version
   ```

## Troubleshooting

- If you get "command not found" errors after installation, try restarting your terminal or computer
- If you're using WSL on Windows, make sure you're installing Node.js within the WSL environment
- For permission errors, you may need to use `sudo` or fix npm permissions

Once Node.js and npm are installed, you can proceed with the [setup instructions](setup.md). 