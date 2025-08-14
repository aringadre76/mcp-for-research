import * as vscode from 'vscode';
import { LocalLookExtension } from './extension';

export class CommandImplementations {
    constructor(private extension: LocalLookExtension) {}

    async getContext() {
        try {
            this.extension.log('Starting frontend context capture...');

            // Check Context Bridge
            const bridgeHealthy = await this.extension.checkContextBridge();
            if (!bridgeHealthy) {
                return;
            }

            // Get frontend URL
            const frontendUrl = await this.extension.getFrontendUrl();
            if (!frontendUrl) {
                this.extension.log('No frontend URL provided', 'error');
                return;
            }

            // Show progress
            const progressOptions = {
                location: vscode.ProgressLocation.Notification,
                title: 'Capturing Frontend Context...',
                cancellable: false
            };

            await vscode.window.withProgress(progressOptions, async (progress) => {
                progress.report({ message: 'Connecting to frontend...' });
                
                // Capture context
                const context = await this.extension.captureContext(frontendUrl);
                if (!context) {
                    return;
                }

                progress.report({ message: 'Formatting for AI...' });

                // Format for AI
                const formattedContext = this.extension.formatContextForAI(context);

                // Show in new document for Cursor AI to see
                const doc = await vscode.workspace.openTextDocument({
                    content: formattedContext,
                    language: 'markdown'
                });

                await vscode.window.showTextDocument(doc);

                // Also log summary
                this.extension.log(`Context captured successfully: ${context.elements.length} elements, ${context.buttons.length} buttons, ${context.forms.length} forms`);
                
                vscode.window.showInformationMessage(
                    `✅ Frontend context captured! Found ${context.elements.length} elements, ${context.buttons.length} buttons, ${context.forms.length} forms`
                );
            });

        } catch (error: any) {
            this.extension.log(`Context capture failed: ${error.message}`, 'error');
            vscode.window.showErrorMessage(`Failed to capture context: ${error.message}`);
        }
    }

    async quickAnalyze() {
        try {
            this.extension.log('Starting quick analysis...');

            // Check Context Bridge
            const bridgeHealthy = await this.extension.checkContextBridge();
            if (!bridgeHealthy) {
                return;
            }

            // Get frontend URL
            const frontendUrl = await this.extension.getFrontendUrl();
            if (!frontendUrl) {
                return;
            }

            // Show progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Quick Analysis...',
                cancellable: false
            }, async (progress) => {
                try {
                    progress.report({ message: 'Analyzing frontend...' });

                    const bridgeUrl = await this.extension.getContextBridgeUrl();
                    const response = await this.extension.makeRequest('POST', `${bridgeUrl}/quick-analyze`, null, {
                        params: { url: frontendUrl, focus: 'general' },
                        timeout: 20000
                    });

                    const analysis = response.data;
                    const summary = analysis.summary;

                    // Format quick results
                    const quickResults = `# Quick Frontend Analysis

## Summary
- **URL**: ${summary.url}
- **Title**: ${summary.title}
- **Elements Found**: ${summary.elements_found}
- **Interactive Elements**: ${summary.interactive_elements}
- **Forms**: ${summary.forms}
- **Buttons**: ${summary.buttons}
- **Links**: ${summary.links}
- **Console Errors**: ${summary.console_errors}
- **Has Screenshot**: ${summary.has_screenshot ? 'Yes' : 'No'}
- **Analysis Focus**: ${summary.analysis_focus}

## Quick Assessment
${summary.console_errors > 0 ? `⚠️ **${summary.console_errors} console errors found** - Check browser console` : '✅ No console errors detected'}
${summary.interactive_elements === 0 ? '⚠️ **No interactive elements found** - Page may not be fully loaded' : `✅ ${summary.interactive_elements} interactive elements detected`}
${summary.forms === 0 ? 'ℹ️ No forms detected' : `📝 ${summary.forms} form(s) available for interaction`}

This is a quick analysis. For detailed context, use "Get Frontend Context" command.`;

                    // Show results
                    const doc = await vscode.workspace.openTextDocument({
                        content: quickResults,
                        language: 'markdown'
                    });

                    await vscode.window.showTextDocument(doc);

                    this.extension.log(`Quick analysis complete: ${summary.elements_found} elements found`);
                    vscode.window.showInformationMessage(`✅ Quick analysis complete! Found ${summary.elements_found} elements`);

                } catch (error: any) {
                    this.extension.log(`Quick analysis failed: ${error.message}`, 'error');
                    vscode.window.showErrorMessage(`Quick analysis failed: ${error.message}`);
                }
            });

        } catch (error: any) {
            this.extension.log(`Quick analysis failed: ${error.message}`, 'error');
            vscode.window.showErrorMessage(`Quick analysis failed: ${error.message}`);
        }
    }

    async testCurrent() {
        try {
            this.extension.log('Starting frontend testing...');

            // Check Context Bridge
            const bridgeHealthy = await this.extension.checkContextBridge();
            if (!bridgeHealthy) {
                return;
            }

            // Get frontend URL
            const frontendUrl = await this.extension.getFrontendUrl();
            if (!frontendUrl) {
                return;
            }

            // Show progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Testing Frontend...',
                cancellable: false
            }, async (progress) => {
                try {
                    progress.report({ message: 'Running interaction tests...' });

                    const bridgeUrl = await this.extension.getContextBridgeUrl();
                    
                    // Perform basic interaction testing
                    const response = await this.extension.makeRequest('POST', `${bridgeUrl}/interact`, {
                        url: frontendUrl,
                        actions: [
                            { type: 'wait', duration: 2000 },
                            // Add more test actions as needed
                        ],
                        capture_after: true
                    }, { timeout: 30000 });

                    const results = response.data;

                    // Format test results
                    const testResults = `# Frontend Test Results

## Test Summary
- **URL**: ${frontendUrl}
- **Success**: ${results.success ? 'Yes' : 'No'}
- **Interactions Performed**: ${results.interactions_performed}

## Test Actions
${results.results.map((result: any, i: number) => `
### Action ${i + 1}: ${result.action}
- **Success**: ${result.success ? 'Yes' : 'No'}
- **Timestamp**: ${result.timestamp}
${result.error ? `- **Error**: ${result.error}` : ''}
`).join('')}

${results.updated_context ? `
## Updated Context Available
The frontend state was captured after interactions and is available for analysis.
` : ''}

This testing validates that the frontend is interactive and responsive to automated actions.`;

                    // Show results
                    const doc = await vscode.workspace.openTextDocument({
                        content: testResults,
                        language: 'markdown'
                    });

                    await vscode.window.showTextDocument(doc);

                    this.extension.log(`Testing complete: ${results.interactions_performed} interactions performed`);
                    vscode.window.showInformationMessage(`✅ Testing complete! Performed ${results.interactions_performed} interactions`);

                } catch (error: any) {
                    this.extension.log(`Testing failed: ${error.message}`, 'error');
                    vscode.window.showErrorMessage(`Testing failed: ${error.message}`);
                }
            });

        } catch (error: any) {
            this.extension.log(`Testing failed: ${error.message}`, 'error');
            vscode.window.showErrorMessage(`Testing failed: ${error.message}`);
        }
    }

    async startAutonomous() {
        try {
            this.extension.log('Starting autonomous development mode...');

            // Check Context Bridge
            const bridgeHealthy = await this.extension.checkContextBridge();
            if (!bridgeHealthy) {
                return;
            }

            // Get frontend URL
            const frontendUrl = await this.extension.getFrontendUrl();
            if (!frontendUrl) {
                return;
            }

            // Get development goal from user
            const goal = await vscode.window.showInputBox({
                prompt: 'What would you like me to build or improve?',
                placeHolder: 'e.g., "Make this landing page responsive" or "Add a contact form with validation"',
                ignoreFocusOut: true
            });

            if (!goal) {
                this.extension.log('No development goal provided');
                return;
            }

            this.extension.log(`Starting autonomous development with goal: ${goal}`);

            // Show progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Autonomous Development',
                cancellable: false
            }, async (progress) => {
                try {
                    progress.report({ message: 'Analyzing current state...' });

                    // Get current context
                    const context = await this.extension.captureContext(frontendUrl);
                    if (!context) {
                        throw new Error('Failed to capture initial context');
                    }

                    // Format autonomous development prompt
                    const autonomousPrompt = `# Autonomous Development Session

## Goal
${goal}

## Current Frontend State
${this.extension.formatContextForAI(context)}

## Instructions
Based on the current frontend state and the goal, please analyze what needs to be changed and begin implementing the necessary modifications. 

You have full access to the project files and can:
1. Modify existing components and styles
2. Create new files as needed
3. Update configuration files
4. Install new dependencies if required

After making changes, the system will automatically:
- Capture the new frontend state
- Test the changes
- Evaluate progress toward the goal
- Continue iterating until the goal is achieved

Please start by analyzing the current state and outlining your approach to achieve: "${goal}"

## Next Steps
1. Review the current frontend context above
2. Identify what needs to be changed to achieve the goal
3. Start implementing the necessary modifications
4. Use the "Test Current Frontend" command to validate changes
5. Use "Get Frontend Context" to see the updated state
6. Continue iterating until the goal is fully achieved`;

                    // Show the prompt to Cursor AI
                    const doc = await vscode.workspace.openTextDocument({
                        content: autonomousPrompt,
                        language: 'markdown'
                    });

                    await vscode.window.showTextDocument(doc);

                    this.extension.log(`Autonomous development session started with goal: ${goal}`);
                    vscode.window.showInformationMessage(`🤖 Autonomous development started! Goal: ${goal}`);

                    // TODO: In the future, we could implement actual autonomous cycling here
                    // For now, we provide the context and goal to Cursor AI for manual iteration

                } catch (error: any) {
                    this.extension.log(`Autonomous development failed: ${error.message}`, 'error');
                    vscode.window.showErrorMessage(`Autonomous development failed: ${error.message}`);
                }
            });

        } catch (error: any) {
            this.extension.log(`Autonomous development failed: ${error.message}`, 'error');
            vscode.window.showErrorMessage(`Autonomous development failed: ${error.message}`);
        }
    }
}
