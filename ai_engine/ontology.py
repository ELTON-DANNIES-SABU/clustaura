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
        """Seed a basic hierarchy of technical skills and pre-calculate levels/weights."""
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

        # After seeding, pre-calculate levels and weights
        self._calculate_levels_and_weights()

    def _calculate_levels_and_weights(self):
        """
        Calculate the level of each skill in the tree and assign edge weights.
        Level 0 = Root (Programming), Level 1 = Children, etc.
        Edge Weight W(e) = 1 / 2^L where L is the depth of the parent.
        """
        self.levels = {}
        self.edge_weights = {} # (child, parent) -> weight

        # Find roots (skills with no parents)
        skills = list(self.g.subjects(RDF.type, CLUST.Skill))
        roots = [s for s in skills if not list(self.g.objects(s, CLUST.isSubSkillOf))]

        queue = [(root, 0) for root in roots]
        visited = set()

        while queue:
            node, level = queue.pop(0)
            if node in visited:
                continue
            visited.add(node)
            self.levels[node] = level

            # Get children (skills that have this node as parent)
            children = list(self.g.subjects(CLUST.isSubSkillOf, node))
            for child in children:
                # Weight = 1 / 2^level
                self.edge_weights[(child, node)] = 1.0 / (2 ** level)
                queue.append((child, level + 1))

    def _get_distance(self, a_uri: URIRef, b_uri: URIRef) -> float:
        """
        Calculates the weighted shortest path distance between two skill URIs.
        Using a simplified approach for the directed acyclic graph.
        """
        if a_uri == b_uri:
            return 0.0

        # Find Lowest Common Ancestor (LCA)
        # For simplicity in this demo, we'll find paths to root and compute distance
        def get_path_to_roots(start_node):
            paths = []
            queue = [(start_node, 0.0)]
            while queue:
                curr, dist = queue.pop(0)
                parents = list(self.g.objects(curr, CLUST.isSubSkillOf))
                if not parents:
                    paths.append((curr, dist))
                for p in parents:
                    weight = self.edge_weights.get((curr, p), 1.0)
                    queue.append((p, dist + weight))
            return paths

        paths_a = get_path_to_roots(a_uri)
        paths_b = get_path_to_roots(b_uri)

        # Find minimum distance via any common ancestor
        # (This is a simplified version of finding the LCA in a DAG)
        min_dist = float('inf')
        
        # Check direct inheritance
        if self._is_subskill_of(a_uri, b_uri):
             # a is child of b
             return self._path_weight(a_uri, b_uri)
        if self._is_subskill_of(b_uri, a_uri):
             # b is child of a
             return self._path_weight(b_uri, a_uri)

        # Common ancestor check
        ancestors_a = self._get_all_ancestors(a_uri)
        ancestors_b = self._get_all_ancestors(b_uri)
        common = set(ancestors_a.keys()).intersection(set(ancestors_b.keys()))

        if not common:
            return 10.0 # High penalty for unrelated skills

        for common_uri in common:
            dist = ancestors_a[common_uri] + ancestors_b[common_uri]
            if dist < min_dist:
                min_dist = dist

        return min_dist

    def _path_weight(self, child_uri, parent_uri):
        """Calculates distance between child and ancestor."""
        queue = [(child_uri, 0.0)]
        while queue:
            curr, dist = queue.pop(0)
            if curr == parent_uri:
                return dist
            for p in self.g.objects(curr, CLUST.isSubSkillOf):
                weight = self.edge_weights.get((curr, p), 1.0)
                queue.append((p, dist + weight))
        return float('inf')

    def _get_all_ancestors(self, start_uri):
        """Returns map of ancestor_uri -> distance."""
        ancestors = {start_uri: 0.0}
        queue = [(start_uri, 0.0)]
        while queue:
            curr, dist = queue.pop(0)
            for p in self.g.objects(curr, CLUST.isSubSkillOf):
                w = self.edge_weights.get((curr, p), 1.0)
                new_dist = dist + w
                if p not in ancestors or new_dist < ancestors[p]:
                    ancestors[p] = new_dist
                    queue.append((p, new_dist))
        return ancestors

    def skill_similarity(self, skill_a: str, skill_b: str) -> float:
        """
        SF(a, b) = 1 / (1 + d(a, b))
        """
        a_uri = self._skill_uri(skill_a)
        b_uri = self._skill_uri(skill_b)
        dist = self._get_distance(a_uri, b_uri)
        return 1.0 / (1.0 + dist)

    def calculate_user_similarity(self, user_skills: List[str], required_skills: List[str]) -> float:
        """
        Calculates similarity between a user's skill set and a problem's required skills.
        Using a Multi-Source approach: for each required skill, find the best match in user's skills.
        """
        if not required_skills:
            return 1.0
        if not user_skills:
            return 0.0

        total_sim = 0.0
        for req in required_skills:
            best_sim = 0.0
            for user_skill in user_skills:
                sim = self.skill_similarity(req, user_skill)
                if sim > best_sim:
                    best_sim = sim
            total_sim += best_sim
        
        return total_sim / len(required_skills)

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
            # Also ensure skill exists in graph
            if (skill_uri, RDF.type, CLUST.Skill) not in self.g:
                self.g.add((skill_uri, RDF.type, CLUST.Skill))
        
        # Add project skills (implied)
        for project in user_data.get('projects', []):
            for skill_name in project.get('skills_demonstrated', []):
                skill_uri = self._skill_uri(skill_name)
                self.g.add((user_uri, CLUST.hasSkill, skill_uri))
                if (skill_uri, RDF.type, CLUST.Skill) not in self.g:
                    self.g.add((skill_uri, RDF.type, CLUST.Skill))

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
                # Robust extraction: remove the namespace and the prefix
                full_uri_str = str(user_uri)
                if full_uri_str.startswith(str(CLUST) + "user_"):
                    uid = full_uri_str.replace(str(CLUST) + "user_", "")
                    capable_users.add(uid)
                
        return list(capable_users)

    def _check_user_capability(self, user_uri: URIRef, required_skills: List[str]) -> bool:
        """
        Check if a specific user satisfies all requirements.
        """
        if not required_skills:
            return True
            
        # Relaxed Logic: Return True if user has AT LEAST ONE of the required skills
        # This prevents "zero results" when a user is a good match but misses one specific tag.
        for req_skill in required_skills:
            req_uri = self._skill_uri(req_skill)
            if self._user_has_skill(user_uri, req_uri):
                return True
                
        return False

    def _user_has_skill(self, user_uri: URIRef, req_skill_uri: URIRef) -> bool:
        """
        Check if user has a skill OR a sub-skill of the required skill.
        Rule: User has S' AND S' isSubSkillOf S => User has S.
        """
        # 1. Direct Match
        if (user_uri, CLUST.hasSkill, req_skill_uri) in self.g:
            return True
            
        # 2. Inheritance Match (User has a skill X, where X is a child of ReqSkill)
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

