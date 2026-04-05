const codeExecutionService = require('./server/services/CodeExecutionService');
const fs = require('fs');
const path = require('path');

async function testExecution() {
    console.log("--- Testing JavaScript ---");
    const jsCode = "function solution(n) { return n * 2; }";
    const jsResult = await codeExecutionService.execute('javascript', jsCode, [{ input: "5", expectedOutput: "10" }]);
    console.log(jsResult);

    console.log("\n--- Testing Python ---");
    const pyCode = "def solution(n): return n * 2";
    const pyResult = await codeExecutionService.execute('python', pyCode, [{ input: "5", expectedOutput: "10" }]);
    console.log(pyResult);

    console.log("\n--- Testing C++ ---");
    const cppCode = "int solution(int n) { return n * 2; }";
    const cppResult = await codeExecutionService.execute('cpp', cppCode, [{ input: "5", expectedOutput: "10" }]);
    console.log(cppResult);

    console.log("\n--- Testing Java ---");
    const javaCode = "public int solution(int n) { return n * 2; }";
    const javaResult = await codeExecutionService.execute('java', javaCode, [{ input: "5", expectedOutput: "10" }]);
    console.log(javaResult);
}

testExecution().catch(console.error);
