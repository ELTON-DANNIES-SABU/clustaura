import React from 'react';
import { TrendingUp, Shield, Users } from 'lucide-react';

const Sidebar = ({ communities }) => {
    return (
        <div className="flex flex-col gap-6">
            <div className="community-sidebar-card shadow-lg border border-neon-green/20">
                <div className="flex items-center gap-2 mb-4 text-neon-green">
                    <TrendingUp size={20} />
                    <h3 className="font-bold uppercase tracking-widest text-sm">Trending Communities</h3>
                </div>
                <div className="flex flex-col gap-3">
                    {communities.map((comm, index) => (
                        <div key={comm.id} className="flex items-center justify-between group cursor-pointer">
                            <div className="flex items-center gap-3">
                                <span className="text-gray-500 font-mono text-xs">{index + 1}</span>
                                <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center border border-gray-700 group-hover:border-neon-green transition-colors">
                                    <Users size={14} className="text-gray-400 group-hover:text-neon-green" />
                                </div>
                                <span className="text-sm font-bold text-gray-200 group-hover:text-white">r/{comm.slug || comm.id}</span>
                            </div>
                            <button className="text-xs font-bold text-neon-green border border-neon-green/30 px-3 py-1 rounded hover:bg-neon-green hover:text-black transition-all">
                                JOIN
                            </button>
                        </div>
                    ))}
                </div>
                <button className="w-full mt-6 bg-gray-800 text-white font-bold py-2 rounded text-xs hover:bg-gray-700 transition-colors uppercase tracking-widest">
                    View All
                </button>
            </div>

            <div className="community-sidebar-card shadow-lg border border-neon-green/20">
                <div className="flex items-center gap-2 mb-4 text-neon-green">
                    <Shield size={20} />
                    <h3 className="font-bold uppercase tracking-widest text-sm">Community Rules</h3>
                </div>
                <ul className="flex flex-col gap-3 text-xs text-gray-400">
                    <li className="flex gap-2">
                        <span>1.</span>
                        <span>Remember the human. Be respectful to others in the nebula.</span>
                    </li>
                    <li className="flex gap-2">
                        <span>2.</span>
                        <span>No spam or self-promotion. Keep the frequency clean.</span>
                    </li>
                    <li className="flex gap-2">
                        <span>3.</span>
                        <span>Post high-quality content only. Clustaura is for elite minds.</span>
                    </li>
                </ul>
            </div>

            <div className="p-4 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                <div className="flex flex-wrap gap-2 mb-2">
                    <span className="hover:text-gray-400 cursor-pointer">User Agreement</span>
                    <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
                    <span className="hover:text-gray-400 cursor-pointer">Content Policy</span>
                </div>
                <p>© 2025 ClustAura Nebula. All rights reserved.</p>
            </div>
        </div>
    );
};

export default Sidebar;
