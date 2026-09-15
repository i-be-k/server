import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';
import { fileURLToPath } from 'url';

const execPromise = util.promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runLocalSandboxTest() {
    const testId = "local-test-" + Date.now();
    // Target a folder right inside your working directory
    const tmpDir = path.resolve(__dirname, `tmp-${testId}`);

    console.log(`⏳ Setting up sandbox workspace folder at: ${tmpDir}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    // 1. Define a standard Python function (Simulating developer code entry)
    const userCodeStr = [
        'def multiply_numbers(a, b):',
        '    return a * b'
    ].join('\n');

    // 2. Define the hidden unit test block (Simulating your automated grader logic)
    const hiddenTestStr = [
        'import unittest',
        'from app import multiply_numbers',
        '',
        'class TestMathSuite(unittest.TestCase):',
        '    def test_multiplication(self):',
        '        self.assertEqual(multiply_numbers(5, 5), 25)',
        '        self.assertEqual(multiply_numbers(-1, 4), -4)',
        '',
        "if __name__ == '__main__':",
        '    unittest.main()'
    ].join('\n');

    // Write files to disk
    fs.writeFileSync(path.join(tmpDir, 'app.py'), userCodeStr);
    fs.writeFileSync(path.join(tmpDir, 'hidden_tests.py'), hiddenTestStr);

    // Convert Windows drive paths to Linux format for Docker
    const dockerMountPath = tmpDir.replace(/\\/g, '/');

    const dockerCmd = `docker run --rm --network none --memory 256m -v "${dockerMountPath}:/workspace" sandbox-engine:latest`;

    console.log(`🚀 Spawning ephemeral sandbox container instance...`);

    try {
        // Injecting MSYS_NO_PATHCONV directly into the process environment dictionary options parameter
        await execPromise(dockerCmd, {
            env: { ...process.env, MSYS_NO_PATHCONV: '1' }
        });

        // Read the results file written back to your host by the container
        const resultPath = path.join(tmpDir, 'results.json');
        if (fs.existsSync(resultPath)) {
            const outputPayload = fs.readFileSync(resultPath, 'utf-8');
            console.log(`\n🎉 [SANDBOX SUCCESS] Response payload from container:`);
            console.log(JSON.stringify(JSON.parse(outputPayload), null, 2));
        } else {
            console.log(`❌ Error: Container exited without writing results.json layer.`);
        }
    } catch (error) {
        console.error(`❌ Container Runtime Fault Exception:\n`, error.message);
    } finally {
        // Clean up local temp test directories
        console.log(`\n🧹 Cleaning temporary directory footprints...`);
        fs.rmSync(tmpDir, { recursive: true, force: true });
        console.log(`✨ Cleanup finished.`);
    }
}

runLocalSandboxTest();
