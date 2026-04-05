const codeExecutionService = require('./server/services/CodeExecutionService');

const testCases = [
    { input: '5', expectedOutput: '25', isVisible: true },
    { input: '10', expectedOutput: '100', isVisible: true }
];

const jsCode = 'function solution(n) { return n * n; }';
const pyCode = 'def solution(n):\n    return n * n';

async function runTest() {
    console.log('--- Testing JavaScript ---');
    const jsResults = await codeExecutionService.execute('javascript', jsCode, testCases);
    console.log(JSON.stringify(jsResults, null, 2));

    console.log('\n--- Testing Python ---');
    const pyResults = await codeExecutionService.execute('python', pyCode, testCases);
    console.log(JSON.stringify(pyResults, null, 2));
}

runTest().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
