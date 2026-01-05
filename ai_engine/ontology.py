from rdflib import Graph, Namespace, Literal, URIRef, RDF, RDFS
from rdflib.namespace import FOAF, XSD
from typing import List, Dict, Set

# Define our Custom Namespace
CLUST = Namespace("http://clustaura.org/ontology/")

class OntologyManager:
    def __init__(self):
        self.g = Graph()
        self.bind_namespaces()
        self.define_schema()
        # Seed some basic skill hierarchy for demo purposes
        self.seed_taxonomy()

    def bind_namespaces(self):
        self.g.bind("clust", CLUST)
        self.g.bind("foaf", FOAF)

    def define_schema(self):
        # Classes
        self.g.add((CLUST.User, RDF.type, RDFS.Class))
        self.g.add((CLUST.Problem, RDF.type, RDFS.Class))
        self.g.add((CLUST.Skill, RDF.type, RDFS.Class))
        self.g.add((CLUST.Project, RDF.type, RDFS.Class))

        # Properties
        # User -> hasSkill -> Skill
        self.g.add((CLUST.hasSkill, RDF.type, RDF.Property))
        self.g.add((CLUST.hasSkill, RDFS.domain, CLUST.User))
        self.g.add((CLUST.hasSkill, RDFS.range, CLUST.Skill))
        
        # Problem -> requiresSkill -> Skill
        self.g.add((CLUST.requiresSkill, RDF.type, RDF.Property))
        self.g.add((CLUST.requiresSkill, RDFS.domain, CLUST.Problem))
        self.g.add((CLUST.requiresSkill, RDFS.range, CLUST.Skill))

        # Skill -> isSubSkillOf -> Skill (Inheritance)
        self.g.add((CLUST.isSubSkillOf, RDF.type, RDF.Property))
        self.g.add((CLUST.isSubSkillOf, RDFS.domain, CLUST.Skill))
        self.g.add((CLUST.isSubSkillOf, RDFS.range, CLUST.Skill))

    def seed_taxonomy(self):
        """Seed a basic hierarchy of technical skills."""
        taxonomy = {
            "Programming": [],
            "Python": ["Programming"],
            "JavaScript": ["Programming"],
            "Machine Learning": ["Python", "Programming"],
            "Deep Learning": ["Machine Learning"],
            "Anomaly Detection": ["Deep Learning", "Machine Learning"],
            "React": ["JavaScript", "Web Development"],
            "Node.js": ["JavaScript", "Backend Development"],
            "Web Development": ["Programming"]
        }
        
        for skill, parents in taxonomy.items():
            s_uri = self._skill_uri(skill)
            self.g.add((s_uri, RDF.type, CLUST.Skill))
            for parent in parents:
                p_uri = self._skill_uri(parent)
                self.g.add((p_uri, RDF.type, CLUST.Skill))
                self.g.add((s_uri, CLUST.isSubSkillOf, p_uri))

    def _user_uri(self, user_id: str) -> URIRef:
        return CLUST[f"user_{user_id}"]

    def _skill_uri(self, skill_name: str) -> URIRef:
        # Simple normalization: lowercase and replace spaces with underscores
        clean_name = skill_name.lower().replace(" ", "_")
        return CLUST[f"skill_{clean_name}"]

    def add_user(self, user_data: Dict):
        """
        Add a user and their explicitly declared skills to the graph.
        """
        user_uri = self._user_uri(user_data['user_id'])
        self.g.add((user_uri, RDF.type, CLUST.User))
        
        # Add declared skills
        for skill_name in user_data.get('skills', []):
            skill_uri = self._skill_uri(skill_name)
            self.g.add((user_uri, CLUST.hasSkill, skill_uri))
        
        # Add project skills (implied)
        for project in user_data.get('projects', []):
            for skill_name in project.get('skills_demonstrated', []):
                skill_uri = self._skill_uri(skill_name)
                # We treat demonstrated skills as direct hasSkill for now for simplicity,
                # or we could add a specific relation like 'demonstratedIn'
                self.g.add((user_uri, CLUST.hasSkill, skill_uri))

    def find_capable_users(self, required_skills: List[str]) -> List[str]:
        """
        Find users who satisfy ALL required skills, considering inheritance.
        Returns a list of User IDs.
        """
        capable_users = set()
        
        # Get all users first
        all_users = list(self.g.subjects(RDF.type, CLUST.User))
        
        for user_uri in all_users:
            if self._check_user_capability(user_uri, required_skills):
                # Extract ID from URI (user_XYZ -> XYZ)
                uid = str(user_uri).split("user_")[-1]
                capable_users.add(uid)
                
        return list(capable_users)

    def _check_user_capability(self, user_uri: URIRef, required_skills: List[str]) -> bool:
        """
        Check if a specific user satisfies all requirements.
        """
        for req_skill in required_skills:
            req_uri = self._skill_uri(req_skill)
            if not self._user_has_skill(user_uri, req_uri):
                return False
        return True

    def _user_has_skill(self, user_uri: URIRef, req_skill_uri: URIRef) -> bool:
        """
        Check if user has a skill OR a sub-skill of the required skill.
        Rule: User has S' AND S' isSubSkillOf S => User has S.
        """
        # 1. Direct Match
        if (user_uri, CLUST.hasSkill, req_skill_uri) in self.g:
            return True
            
        # 2. Inheritance Match (User has a skill X, where X is a child of ReqSkill)
        # Query: Find all skills X that the user has. Check if any X isSubSkillOf ReqSkill.
        
        # SPARQL is powerful here, but python loop is fine for in-memory graph
        query = """
            SELECT ?owned_skill
            WHERE {
                ?user clust:hasSkill ?owned_skill .
                ?owned_skill clust:isSubSkillOf* ?req_skill .
            }
        """
        # Note: * is zero-or-more path, meaning it handles direct match too theoretically, 
        # but rdflib's SPARQL support for property paths can be tricky depending on version.
        # Let's do it physically to be robust.

        # Get all skills owned by user
        user_skills = list(self.g.objects(user_uri, CLUST.hasSkill))
        
        for owned_skill in user_skills:
            if self._is_subskill_of(owned_skill, req_skill_uri):
                return True
                
        return False

    def _is_subskill_of(self, child_uri: URIRef, parent_uri: URIRef) -> bool:
        """
        Recursive check if child is a subskill of parent.
        """
        if child_uri == parent_uri:
            return True
            
        # Get immediate parents of child
        parents = list(self.g.objects(child_uri, CLUST.isSubSkillOf))
        for p in parents:
            if self._is_subskill_of(p, parent_uri):
                return True
        return False
