# GitHub Actions Setup Guide

This guide explains how to set up automated publishing to npm using GitHub Actions.

## Prerequisites

1. **GitHub Repository**: Your code must be in a GitHub repository
2. **npm Account**: You must be logged into npm and have publish permissions
3. **GitHub Actions**: Enabled for your repository

## Setup Steps

### 1. Create NPM Token

1. Go to [npmjs.com](https://www.npmjs.com/) and log in
2. Click on your profile picture → "Access Tokens"
3. Click "Generate New Token"
4. Select "Automation" token type
5. Copy the generated token (you won't see it again!)

### 2. Add NPM Token to GitHub Secrets

1. Go to your GitHub repository
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token
6. Click "Add secret"

### 3. Push Your Code

```bash
git add .
git commit -m "Add GitHub Actions workflow"
git push origin main
```

## How It Works

### **On Every Push to Main:**
- ✅ Runs tests
- ✅ Builds the project
- ❌ **Does NOT publish** (only tests)

### **On Git Tags (v*):**
- ✅ Runs tests
- ✅ Builds the project
- ✅ Publishes to npm
- ✅ Creates GitHub release

## Publishing New Versions

### **Option 1: Using Scripts (Recommended)**
```bash
# For patch updates (bug fixes)
npm run release:patch

# For minor updates (new features)
npm run release:minor

# For major updates (breaking changes)
npm run release:major
```

### **Option 2: Manual Process**
```bash
# 1. Bump version
npm run version:patch  # or minor/major

# 2. Commit changes
git add package.json
git commit -m "Bump version to X.Y.Z"

# 3. Create and push tag
git tag vX.Y.Z
git push origin main --tags
```

## Workflow Details

The workflow file (`.github/workflows/publish.yml`) does the following:

1. **Triggers**: On push to main/master or when tags are pushed
2. **Test Job**: Always runs tests on every push
3. **Publish Job**: Only runs when a tag is pushed
4. **Security**: Uses NPM_TOKEN secret for authentication
5. **Releases**: Automatically creates GitHub releases for tags

## Troubleshooting

### **Common Issues:**

1. **NPM_TOKEN not found**: Make sure you added the secret correctly
2. **Build fails**: Check that all tests pass locally first
3. **Publish fails**: Verify you have publish permissions on npm
4. **Version conflicts**: Make sure the version in package.json is unique

### **Check Workflow Status:**
1. Go to your GitHub repository
2. Click "Actions" tab
3. View the latest workflow run

## Security Notes

- **NPM_TOKEN** is encrypted and never visible in logs
- Only publish job has access to npm credentials
- Test job runs without npm access for security
- Workflow only publishes on tags, not on every push

## Next Steps

After setup:
1. Push your code to GitHub
2. Create a tag to trigger your first automated publish
3. Monitor the Actions tab for workflow status
4. Enjoy automated publishing! 🚀
