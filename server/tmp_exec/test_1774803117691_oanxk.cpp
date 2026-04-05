
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

int solution(int n) { return n * 2; }

int main() {
    try {
        // Simple input handling for C++ (assuming basic types for now)
        // In a more robust system, we would use a JSON library like nlohmann/json
        auto result = solution(5);
        std::cout << result << std::endl;
    } catch (...) {
        return 1;
    }
    return 0;
}
