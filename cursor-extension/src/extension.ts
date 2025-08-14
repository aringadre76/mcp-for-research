import * as vscode from 'vscode';
import axios from 'axios';

interface FrontendContext {
    timestamp: string;
    url: string;
    title: string;
    viewport: { width: number; height: number };
    screenshot?: string;
    elements: any[];
    forms: any[];
    buttons: any[];
    links: any[];
    inputs: any[];
    interactive: any[];
    interactions: any;
    performance?: any;
    accessibility?: any;
    console_logs: string[];
}

export class LocalLookExtension {
    private outputChannel: vscode.OutputChannel;
    private config: vscode.WorkspaceConfiguration;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('LocalLook');
        this.config = vscode.workspace.getConfiguration('localook');
    }

    log(message: string, level: 'info' | 'error' | 'debug' = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        
        this.outputChannel.appendLine(logMessage);
        
        if (level === 'error') {
            console.error(logMessage);
        } else if (this.config.get('debugMode', false)) {
            console.log(logMessage);
        }
    }

    async getContextBridgeUrl(): Promise<string> {
        return this.config.get('contextBridgeUrl', 'http://127.0.0.1:8080');
    }

    async getFrontendUrl(): Promise<string> {
        const configured = this.config.get('frontendUrl', 'http://localhost:3000');
        
        const url = await vscode.window.showInputBox({
            prompt: 'Enter your frontend URL',
            value: configured,
            placeHolder: 'http://localhost:3000'
        });
        
        return url || configured;
    }

    async checkContextBridge(): Promise<boolean> {
        try {
            const bridgeUrl = await this.getContextBridgeUrl();
            const response = await axios.get(`${bridgeUrl}/health`, { timeout: 5000 });
            
            if (response.data.status === 'healthy') {
                this.log('Context Bridge is healthy and ready');
                return true;
            } else {
                this.log(`Context Bridge unhealthy: ${response.data.status}`, 'error');
                return false;
            }
        } catch (error: any) {
            this.log(`Context Bridge not accessible: ${error.message}`, 'error');
            vscode.window.showErrorMessage(
                'LocalLook Context Bridge is not running. Please start it with: cd context-bridge && python3 main.py'
            );
            return false;
        }
    }

    async captureContext(url: string, options?: any): Promise<FrontendContext | null> {
        try {
            const bridgeUrl = await this.getContextBridgeUrl();
            
            this.log(`Capturing context for: ${url}`);
            
            const response = await axios.post(`${bridgeUrl}/capture`, {
                url: url,
                options: options || {
                    screenshot: true,
                    dom_analysis: true,
                    performance: true,
                    accessibility: true,
                    responsive: false,
                    console_logs: true
                },
                viewport: { width: 1280, height: 720 }
            }, { timeout: 30000 });

            this.log(`Successfully captured context: ${(response.data.elements && response.data.elements.length) || 0} elements found`);
            return response.data;

        } catch (error: any) {
            this.log(`Failed to capture context: ${error.message}`, 'error');
            vscode.window.showErrorMessage(`Context capture failed: ${error.message}`);
            return null;
        }
    }

    formatContextForAI(context: FrontendContext): string {
        const summary = {
            url: context.url,
            title: context.title,
            viewport: context.viewport,
            timestamp: context.timestamp,
            
            structure: {
                total_elements: context.elements.length,
                forms: context.forms.length,
                buttons: context.buttons.length,
                links: context.links.length,
                inputs: context.inputs.length,
                interactive_elements: context.interactive.length
            },
            
            interactions: context.interactions,
            
            performance: context.performance ? {
                load_time: context.performance.load_time,
                errors: (context.performance.errors && context.performance.errors.length) || 0,
                warnings: (context.performance.warnings && context.performance.warnings.length) || 0
            } : null,
            
            accessibility: context.accessibility ? {
                score: context.accessibility.score,
                issues: (context.accessibility.issues && context.accessibility.issues.length) || 0
            } : null,
            
            console_logs: {
                total: context.console_logs.length,
                errors: context.console_logs.filter(log => log.includes('error')).length,
                warnings: context.console_logs.filter(log => log.includes('warn')).length
            },
            
            has_screenshot: !!context.screenshot
        };

        // Include key DOM elements for context
        const keyElements = context.elements.slice(0, 10).map(el => ({
            tag: el.tag,
            id: el.id,
            classes: el.classes,
            text: (el.text && el.text.substring(0, 100)) + (el.text && el.text.length > 100 ? '...' : ''),
            selector: el.selector
        }));

        const keyButtons = context.buttons.slice(0, 5).map(btn => ({
            text: btn.text,
            id: btn.id,
            classes: btn.classes
        }));

        const keyForms = context.forms.slice(0, 3).map(form => ({
            action: form.action,
            method: form.method,
            inputs: form.inputs.length,
            submit_buttons: form.submit_buttons.length
        }));

        return `# Frontend Context Analysis

## Page Overview
- **URL**: ${summary.url}
- **Title**: ${summary.title}
- **Viewport**: ${summary.viewport.width}x${summary.viewport.height}
- **Captured**: ${summary.timestamp}

## Structure Summary
- **Total Elements**: ${summary.structure.total_elements}
- **Forms**: ${summary.structure.forms}
- **Buttons**: ${summary.structure.buttons}  
- **Links**: ${summary.structure.links}
- **Inputs**: ${summary.structure.inputs}
- **Interactive Elements**: ${summary.structure.interactive_elements}

## Interactivity
- **Clickable Elements**: ${summary.interactions.clickable_count || 0}
- **Focusable Elements**: ${summary.interactions.focusable_count || 0}
- **Scrollable**: ${summary.interactions.can_scroll ? 'Yes' : 'No'}

## Quality Metrics
${summary.performance ? `
### Performance
- **Load Time**: ${summary.performance.load_time}s
- **Errors**: ${summary.performance.errors}
- **Warnings**: ${summary.performance.warnings}
` : ''}

${summary.accessibility ? `
### Accessibility
- **Score**: ${summary.accessibility.score}/100
- **Issues Found**: ${summary.accessibility.issues}
` : ''}

### Console Status
- **Total Logs**: ${summary.console_logs.total}
- **Errors**: ${summary.console_logs.errors}
- **Warnings**: ${summary.console_logs.warnings}

## Key DOM Elements
${keyElements.map(el => `- **${el.tag}** ${el.id ? `#${el.id}` : ''} ${el.classes.length ? `.${el.classes.join('.')}` : ''}: ${el.text || 'No text'}`).join('\n')}

## Interactive Buttons
${keyButtons.map(btn => `- "${btn.text}" ${btn.id ? `#${btn.id}` : ''} ${btn.classes.length ? `.${btn.classes.join('.')}` : ''}`).join('\n')}

## Forms
${keyForms.map(form => `- **${form.method}** to ${form.action || 'current page'} (${form.inputs} inputs, ${form.submit_buttons} buttons)`).join('\n')}

## Screenshot Available
${summary.has_screenshot ? '✅ Full-page screenshot captured and available' : '❌ No screenshot available'}

---

This frontend context provides complete visibility into the running application state. Use this information to understand the current UI, identify issues, and make informed decisions about code changes.`;
    }

    async makeRequest(method: string, url: string, data?: any, options?: any) {
        return await axios({
            method,
            url,
            data,
            ...options
        });
    }
}

// Import command implementations
import { CommandImplementations } from './commands';

export function activate(context: vscode.ExtensionContext) {
    console.log('LocalLook Autonomous AI extension activated');

    const extension = new LocalLookExtension();
    const commands = new CommandImplementations(extension);

    // Register commands
    const commandRegistrations = [
        vscode.commands.registerCommand('localook.getContext', () => commands.getContext()),
        vscode.commands.registerCommand('localook.quickAnalyze', () => commands.quickAnalyze()),
        vscode.commands.registerCommand('localook.testCurrent', () => commands.testCurrent()),
        vscode.commands.registerCommand('localook.startAutonomous', () => commands.startAutonomous())
    ];

    // Add commands to subscriptions
    commandRegistrations.forEach(command => context.subscriptions.push(command));

    // Show activation message
    vscode.window.showInformationMessage('LocalLook Autonomous AI activated! Use Cmd+Shift+P and search for "LocalLook" commands.');
}

export function deactivate() {
    console.log('LocalLook Autonomous AI extension deactivated');
}
