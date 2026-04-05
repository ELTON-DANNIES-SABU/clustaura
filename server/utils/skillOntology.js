/**
 * Clustaura Skill Ontology
 * Defines hierarchical relationships between skills for semantic matching.
 */

const skillOntology = {
    "backend": [
        "node.js", "express", "django", "spring", "flask", "fastapi", "golang", 
        "java", "python", "php", "ruby on rails", "postgresql", "mongodb", 
        "sql", "nosql", "redis", "graphql", "rest api", "microservices"
    ],
    "frontend": [
        "react", "angular", "vue", "javascript", "typescript", "html", "css", 
        "tailwind", "bootstrap", "next.js", "nuxt.js", "redux", "webpack", 
        "ui/ux", "figma", "sass", "less", "three.js"
    ],
    "devops": [
        "docker", "kubernetes", "ci/cd", "aws", "azure", "gcp", "terraform", 
        "ansible", "jenkins", "github actions", "linux", "nginx", "prometheus", 
        "grafana"
    ],
    "ai": [
        "machine learning", "deep learning", "nlp", "computer vision", 
        "pytorch", "tensorflow", "scikit-learn", "data science", "pandas", 
        "numpy", "llm", "openai", "langchain", "vector database"
    ],
    "mobile": [
        "react native", "flutter", "swift", "kotlin", "android", "ios", 
        "dart", "objective-c"
    ],
    "cybersecurity": [
        "penetration testing", "ethical hacking", "cryptography", 
        "network security", "firewall", "owasp", "siem"
    ],
    "blockchain": [
        "solidity", "ethereum", "web3", "smart contracts", "rust", "hyperledger"
    ]
};

/**
 * Finds the category/domain for a given skill.
 * @param {String} skill 
 * @returns {String|null}
 */
const findCategory = (skill) => {
    const s = skill.toLowerCase();
    for (const [category, skills] of Object.entries(skillOntology)) {
        if (skills.some(os => os.toLowerCase() === s)) {
            return category;
        }
    }
    return null;
};

module.exports = {
    skillOntology,
    findCategory
};
