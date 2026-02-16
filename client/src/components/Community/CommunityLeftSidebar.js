import React from 'react';
import {
    Code, PenTool, Database, Cpu, Zap
} from 'lucide-react';
import useCommunityStore from '../../store/communityStore';

const CommunityLeftSidebar = () => {
    const { fetchPosts, setSelectedProfessionTags } = useCommunityStore();
    const professions = [
        { id: 'dev', name: 'Software Developers', icon: Code, tags: ['Programming', 'Development', 'Coding', 'Software', 'Engineering', 'DevOps'] },
        { id: 'design', name: 'Designers', icon: PenTool, tags: ['Design', 'UI', 'UX', 'Creative', 'Product Design', 'Visuals'] },
        { id: 'data', name: 'Data Scientists', icon: Database, tags: ['Data', 'Analytics', 'Database', 'Big Data', 'Statistics', 'SQL'] },
        { id: 'ai', name: 'AI / ML Engineers', icon: Cpu, tags: ['AI', 'ML', 'Intelligence', 'Gemini', 'Neural Networks', 'Automation'] },
        { id: 'frontend', name: 'Frontend', icon: Zap, tags: ['Frontend', 'React', 'HTML', 'CSS', 'JavaScript', 'Web'] },
        { id: 'backend', name: 'Backend', icon: Zap, tags: ['Backend', 'Node', 'Express', 'API', 'Server', 'Infrastructure'] },
    ];

    const [activeId, setActiveId] = React.useState(null);

    // Initialize store with cleared tags on mount
    React.useEffect(() => {
        setSelectedProfessionTags([]);
    }, []);

    const handleProfessionClick = (prof) => {
        setActiveId(prof.id);
        setSelectedProfessionTags(prof.tags);
        fetchPosts(prof.tags);
    };

    return (
        <div className="community-sidebar-left flex flex-col gap-3">
            <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-widest px-4 mb-6 flex justify-between items-center">
                <span>Professions</span>
                <button
                    onClick={() => { setActiveId(null); setSelectedProfessionTags([]); fetchPosts(); }}
                    className="text-[10px] text-node-green hover:text-white transition-colors uppercase tracking-[0.2em]"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    CLEAR
                </button>
            </h3>
            {professions.map((prof) => {
                const Icon = prof.icon;
                const isActive = activeId === prof.id;

                return (
                    <div
                        key={prof.id}
                        className={`flex items-center justify-between px-5 py-4 rounded-lg cursor-pointer transition-all ${isActive
                            ? 'bg-surface-hover text-white'
                            : 'text-gray-400 hover:bg-surface-hover hover:text-gray-200'
                            }`}
                        style={isActive ? { backgroundColor: 'var(--surface-hover)', borderLeft: '3px solid var(--node-green)' } : {}}
                        onClick={() => handleProfessionClick(prof)}
                    >
                        <div className="flex items-center gap-4">
                            <Icon size={20} className={isActive ? 'text-node-green' : ''} style={isActive ? { color: 'var(--node-green)' } : {}} />
                            <span className="text-sm font-semibold">{prof.name}</span>
                        </div>
                        {isActive && <div className="w-2 h-2 rounded-full bg-node-green shadow-[0_0_10px_var(--node-green)]" style={{ backgroundColor: 'var(--node-green)' }}></div>}
                    </div>
                );
            })}
        </div>
    );
};

export default CommunityLeftSidebar;
