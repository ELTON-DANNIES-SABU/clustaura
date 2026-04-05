const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class CodeExecutionService {
    async execute(language, code, testCases) {
        const results = [];
        for (const testCase of testCases) {
            const result = await this.runSingleTest(language, code, testCase.input);
            
            // Clean outputs for comparison
            const actual = result.output.trim();
            const expected = testCase.expectedOutput.trim();
            
            results.push({
                input: testCase.input,
                expected: expected,
                actual: actual,
                status: actual === expected ? 'PASS' : 'FAIL',
                error: result.error
            });
        }
        return results;
    }

    runSingleTest(language, code, input) {
        return new Promise(async (resolve) => {
            let cmd, args, fileName, wrapper;
            const tempDir = path.join(__dirname, '../tmp_exec');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

            try {
                if (language === 'javascript') {
                    fileName = `test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.js`;
                    // Basic wrapper to inject input and capture output
                    wrapper = `
${code}
try {
    const input = ${input};
    const result = solution(input);
    console.log(typeof result === 'object' ? JSON.stringify(result) : result);
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
`;
                    cmd = 'node';
                    args = [path.join(tempDir, fileName)];
                } else if (language === 'python') {
                    fileName = `test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.py`;
                    wrapper = `
import json
import sys
${code}
try:
    input_str = """${input.replace(/"/g, '\\"')}"""
    input_val = json.loads(input_str)
    result = solution(input_val)
    print(json.dumps(result) if isinstance(result, (list, dict)) else result)
except Exception as e:
    print(str(e), file=sys.stderr)
    sys.exit(1)
`;
                    cmd = 'python';
                    args = [path.join(tempDir, fileName)];
                } else if (language === 'cpp') {
                    fileName = `test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.cpp`;
                    const exeName = fileName.replace('.cpp', '.exe');
                    wrapper = `
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

${code}

int main() {
    try {
        // Simple input handling for C++ (assuming basic types for now)
        // In a more robust system, we would use a JSON library like nlohmann/json
        auto result = solution(${input});
        std::cout << result << std::endl;
    } catch (...) {
        return 1;
    }
    return 0;
}
`;
                    const filePath = path.join(tempDir, fileName);
                    const exePath = path.join(tempDir, exeName);
                    fs.writeFileSync(filePath, wrapper);

                    // Compile
                    try {
                        const compile = spawn('g++', ['-o', exePath, filePath]);
                        await new Promise((res) => compile.on('close', res));
                        
                        if (!fs.existsSync(exePath)) {
                            return resolve({ output: '', error: 'Compilation Error: Build failed or compiler not found.' });
                        }
                    } catch (e) {
                        return resolve({ output: '', error: 'Compilation Error: g++ is not installed on the server.' });
                    }
                    cmd = exePath;
                    args = [];
                } else if (language === 'java') {
                    const className = `Solution_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                    fileName = `${className}.java`;
                    wrapper = `
import java.util.*;

public class ${className} {
    ${code}

    public static void main(String[] args) {
        try {
            ${className} sol = new ${className}();
            Object result = sol.solution(${input});
            System.out.println(result);
        } catch (Exception e) {
            System.err.println(e.getMessage());
            System.exit(1);
        }
    }
}
`;
                    const filePath = path.join(tempDir, fileName);
                    fs.writeFileSync(filePath, wrapper);

                    // Compile
                    try {
                        const compile = spawn('javac', [filePath]);
                        await new Promise((res) => compile.on('close', res));

                        if (!fs.existsSync(filePath.replace('.java', '.class'))) {
                            return resolve({ output: '', error: 'Compilation Error: Build failed or compiler not found.' });
                        }
                    } catch (e) {
                        return resolve({ output: '', error: 'Compilation Error: javac is not installed on the server.' });
                    }
                    cmd = 'java';
                    args = ['-cp', tempDir, className];
                } else {
                    return resolve({ output: '', error: 'Unsupported language: ' + language });
                }

                const filePath = path.join(tempDir, fileName);
                fs.writeFileSync(filePath, wrapper);

                try {
                    const runner = spawn(cmd, args);
                    let output = '';
                    let errorOutput = '';

                    runner.stdout.on('data', (data) => output += data.toString());
                    runner.stderr.on('data', (data) => errorOutput += data.toString());

                    const timeout = setTimeout(() => {
                        runner.kill();
                        resolve({ output: '', error: 'Time Limit Exceeded (2s)' });
                    }, 2000);

                    runner.on('close', (exitCode) => {
                        clearTimeout(timeout);
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        resolve({
                            output: output.trim(),
                            error: exitCode !== 0 ? (errorOutput.trim() || `Execution failed with code ${exitCode}`) : null
                        });
                    });
                } catch (e) {
                   resolve({ output: '', error: 'Execution environment error: ' + e.message });
                }
            } catch (err) {
                resolve({ output: '', error: err.message });
            }
        });
    }
}

module.exports = new CodeExecutionService();
