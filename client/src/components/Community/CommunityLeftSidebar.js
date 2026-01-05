import React from 'react';
import {
    Code, PenTool, Database, Cpu, Wrench, Briefcase, Zap, GraduationCap
} from 'lucide-react';

const CommunityLeftSidebar = () => {
    const professions = [
        { id: 'dev', name: 'Software Developers', icon: Code, count: '12.5k' },
        { id: 'design', name: 'Designers', icon: PenTool, count: '8.2k' },
        { id: 'data', name: 'Data Scientists', icon: Database, count: '5.1k' },
        { id: 'ai', name: 'AI / ML Engineers', icon: Cpu, count: '6.4k' },
        { id: 'eng', name: 'Civil / Mechanical', icon: Wrench, count: '4.3k' },
        { id: 'founder', name: 'Startup Founders', icon: Zap, count: '3.1k' },
        { id: 'student', name: 'Students', icon: GraduationCap, count: '15k+' },
    ];

    const [activeId, setActiveId] = React.useState('dev');

    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest px-4 mb-2">
                Professional Communities
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
                        onClick={() => setActiveId(prof.id)}
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
