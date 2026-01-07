import React from 'react';
import {
    Code, PenTool, Database, Cpu, Wrench, Briefcase, Zap, GraduationCap
} from 'lucide-react';
import useCommunityStore from '../../store/communityStore';

const CommunityLeftSidebar = () => {
    const { fetchPosts } = useCommunityStore();
    const professions = [
        { id: 'dev', name: 'Software Developers', icon: Code, tags: ['Programming', 'Development', 'Coding', 'Software', 'Engineering', 'DevOps'] },
        { id: 'design', name: 'Designers', icon: PenTool, tags: ['Design', 'UI', 'UX', 'Creative', 'Product Design', 'Visuals'] },
        { id: 'data', name: 'Data Scientists', icon: Database, tags: ['Data', 'Analytics', 'Database', 'Big Data', 'Statistics', 'SQL'] },
        { id: 'ai', name: 'AI / ML Engineers', icon: Cpu, tags: ['AI', 'ML', 'Intelligence', 'Gemini', 'Neural Networks', 'Automation'] },
        { id: 'frontend', name: 'Frontend', icon: Zap, tags: ['Frontend', 'React', 'HTML', 'CSS', 'JavaScript', 'Web'] },
        { id: 'backend', name: 'Backend', icon: Zap, tags: ['Backend', 'Node', 'Express', 'API', 'Server', 'Infrastructure'] },
    ];

    const [activeId, setActiveId] = React.useState('dev');

    const handleProfessionClick = (prof) => {
        setActiveId(prof.id);
        fetchPosts(prof.tags);
    };

    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest px-4 mb-2 flex justify-between items-center">
                <span>Professions</span>
                <button
                    onClick={() => { setActiveId(null); fetchPosts(); }}
                    style={{ background: 'transparent', border: '1px solid rgba(0, 255, 156, 0.3)', color: '#00FF9C', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                    onMouseOver={(e) => { e.target.style.background = '#00FF9C'; e.target.style.color = 'black'; }}
                    onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#00FF9C'; }}
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
                        className={`flex items-center justify-between px-4 py-2 rounded cursor-pointer transition-all ${isActive
                            ? 'bg-white/10 text-white border-l-2 border-neon-green'
                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                            }`}
                        onClick={() => handleProfessionClick(prof)}
                    >
                        <div className="flex items-center gap-3">
                            <Icon size={18} className={isActive ? 'text-neon-green' : ''} />
                            <span className="text-sm font-medium">{prof.name}</span>
                        </div>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-neon-green shadow-[0_0_8px_var(--neon-green)]"></div>}
                    </div>
                );
            })}
        </div>
    );
};

export default CommunityLeftSidebar;
