import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';

const execPromise = util.promisify(exec);

interface SandboxResult {
    status: 'passed' | 'failed';
    score: number;
    logs: string;
}

export async function executeUserCodeInSandbox(
    submissionId: string, 
    userCodeStr: string, 
    hiddenTestStr: string,
    language: 'python' | 'javascript'
): Promise<SandboxResult> {
    // 1. Create a secure temporary directory folder structure on the host machine
    const tmpDir = path.resolve(__dirname, `../../tmp/sandbox-${submissionId}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    // 2. Write out user submission and hidden test cases into the temp directory
    if (language === 'python') {
    fs.writeFileSync(path.join(tmpDir, 'app.py'), userCodeStr);
    fs.writeFileSync(path.join(tmpDir, 'hidden_tests.py'), hiddenTestStr);
    } else {
        fs.writeFileSync(path.join(tmpDir, 'index.js'), userCodeStr);
        fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ scripts: { test: "node index.js" } }));
    }

    // 3. Build the secure Docker run execution command string parameters
    // Ensure the local host path converts standard backslashes (\) to forward slashes (/) for Docker mapping
    const sanitizedTmpDir = tmpDir.replace(/\\/g, '/');
    // Enforces boundaries: --network none (no web access), --memory limits, --cpus allocation
    const dockerCmd = `MSYS_NO_PATHCONV=1 docker run --rm \
        --network none \
        --memory 256m \
        --cpus 0.5 \
        -v ${sanitizedTmpDir}:/workspace \
        sandbox-engine:latest`;

    try {
        // 4. Fire up the isolated sandbox container environment execution thread
        await execPromise(dockerCmd);

        // 5. Read the parsed output result generated safely inside the mounted host folder directory
        const resultPath = path.join(tmpDir, 'results.json');
        if (fs.existsSync(resultPath)) {
            const resultsData = fs.readFileSync(resultPath, 'utf-8');
            return JSON.parse(resultsData) as SandboxResult;
        }
    
        return { status: 'failed', score: 0, logs: 'Sandbox failed to write out processing result payloads.' };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { status: 'failed', score: 0, logs: `Execution Container Crash Boundary Exception: ${errorMessage}` };
    } finally {
        // 6. Cleanup phase: completely remove all residual files from the host machine to save space
        setTimeout(() => {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }, 1000);
    }
}
