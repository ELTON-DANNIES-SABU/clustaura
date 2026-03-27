import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Lock, Users, CheckCircle, Code, Download, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './ProjectAnalytics.css';

const ProjectAnalytics = ({ projectId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All Roles');

    useEffect(() => {
        fetchAnalytics();
    }, [projectId]);

    const fetchAnalytics = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const { token } = JSON.parse(userStr);
            
            const res = await axios.get(`/api/analytics/project/${projectId}/members`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load analytics', error);
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-spinner" style={{ color: '#00ffa3', display: 'flex', justifyContent: 'center', marginTop: '50px' }}>Loading Analytics...</div>;
    if (!data) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>Access Denied or No Data Available.</div>;

    const filteredMembers = data.members.filter(m => {
        const matchesSearch = (m.firstName + ' ' + m.lastName).toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'All Roles' || m.role.toLowerCase() === roleFilter.toLowerCase();
        return matchesSearch && matchesRole;
    });

    const rolesAvailable = ['All Roles', ...new Set(data.members.map(m => m.role))];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p style={{ margin: 0, color: '#888' }}>{label}</p>
                    <p style={{ margin: '4px 0 0 0', color: '#00ffa3', fontWeight: 'bold' }}>
                        {`${payload[0].value} Commits`}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="analytics-container">
            <header className="analytics-header">
                <div className="analytics-title">
                    <h1>Member Analytics</h1>
                    <span className="restricted-badge">
                        <Lock size={12} /> Restricted
                    </span>
                </div>
                <p className="analytics-subtitle">Individual performance metrics and activity overview for project members.</p>
            </header>

            <div className="overview-cards">
                <div className="overview-card">
                    <div className="card-icon"><Users size={24} /></div>
                    <div className="card-content">
                        <h3>Total Members</h3>
                        <div className="card-value-row">
                            <h2 className="card-value">{data.overview.totalMembers}</h2>
                        </div>
                        <p className="card-subtitle">in this project</p>
                    </div>
                </div>
                <div className="overview-card">
                    <div className="card-icon"><CheckCircle size={24} /></div>
                    <div className="card-content">
                        <h3>Avg. Task Completion</h3>
                        <div className="card-value-row">
                            <h2 className="card-value">{data.overview.avgTaskCompletion.value}%</h2>
                            <span className="trend-badge">{data.overview.avgTaskCompletion.trend}</span>
                        </div>
                        <p className="card-subtitle">vs last month</p>
                    </div>
                </div>
                <div className="overview-card">
                    <div className="card-icon"><Code size={24} /></div>
                    <div className="card-content">
                        <h3>Avg. Code Commits</h3>
                        <div className="card-value-row">
                            <h2 className="card-value">{data.overview.avgCodeCommits.value}</h2>
                        </div>
                        <p className="card-subtitle">{data.overview.avgCodeCommits.subtitle}</p>
                    </div>
                </div>
            </div>

            <div className="analytics-filters">
                <div className="search-input-wrapper">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search members..." 
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <select 
                    className="filter-select"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    {rolesAvailable.map((r, i) => (
                        <option key={i} value={r}>{r}</option>
                    ))}
                </select>

                <select className="filter-select">
                    <option>Last 30 Days</option>
                    <option>Last 7 Days</option>
                    <option>This Quarter</option>
                </select>

                <button className="export-btn">
                    <Download size={16} /> Export Report
                </button>
            </div>

            <div className="member-list">
                {filteredMembers.map(member => (
                    <div className="member-row" key={member.id}>
                        <div className="member-info-col">
                            <div className="member-profile">
                                <div className="member-avatar-large">
                                    {member.avatar ? (
                                        <img src={member.avatar} alt="avatar" />
                                    ) : (
                                        <span>{member.firstName.charAt(0)}{member.lastName.charAt(0)}</span>
                                    )}
                                    <div className="online-dot"></div>
                                </div>
                                <div className="member-details">
                                    <h3>
                                        {member.firstName} {member.lastName}
                                        <span className="role-badge">{member.role}</span>
                                    </h3>
                                    <p className="member-email">{member.email}</p>
                                </div>
                            </div>
                            <div className="member-skills">
                                {member.skills.map((skill, index) => (
                                    <span key={index} className="skill-tag">{skill}</span>
                                ))}
                            </div>
                        </div>

                        <div className="metrics-col">
                            <div className="metric-block">
                                <span className="metric-title">Active Tasks</span>
                                <div className="metric-value-row">
                                    <span className="m-value">{member.metrics.activeTasks.count}</span>
                                    <span className="m-trend">{member.metrics.activeTasks.trend}</span>
                                </div>
                                <span className="m-subtitle">of {member.metrics.activeTasks.total} total</span>
                            </div>

                            <div className="metric-block">
                                <span className="metric-title">Tasks Completed</span>
                                <div className="metric-value-row">
                                    <span className="m-value">{member.metrics.tasksCompleted.count}</span>
                                    <span className="m-trend">{member.metrics.tasksCompleted.trend}</span>
                                </div>
                                <span className="m-subtitle">{member.metrics.tasksCompleted.subtitle}</span>
                            </div>

                            <div className="metric-block">
                                <span className="metric-title">Tickets Closed</span>
                                <div className="metric-value-row">
                                    <span className="m-value">{member.metrics.ticketsClosed.count}</span>
                                    <span className="m-trend">{member.metrics.ticketsClosed.trend}</span>
                                </div>
                                <span className="m-subtitle">{member.metrics.ticketsClosed.subtitle}</span>
                            </div>

                            <div className="metric-block">
                                <span className="metric-title">Code Commits</span>
                                <div className="metric-value-row">
                                    <span className="m-value">{member.metrics.codeCommits.count}</span>
                                    <span className="m-trend">{member.metrics.codeCommits.trend}</span>
                                </div>
                                <span className="m-subtitle">{member.metrics.codeCommits.subtitle}</span>
                            </div>
                        </div>

                        <div className="chart-col">
                            <div className="chart-header">
                                <span className="chart-title">Activity Trend</span>
                                <span className="chart-subtitle">30 days</span>
                            </div>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={member.metrics.activityTrend}>
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                                        <XAxis 
                                            dataKey="date" 
                                            hide={true} // Hidden to match design exactly which only shows endpoints or is very minimal 
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="activity" 
                                            stroke="#00ffa3" 
                                            strokeWidth={2} 
                                            dot={false} 
                                            activeDot={{ r: 4, fill: '#00ffa3', stroke: '#000', strokeWidth: 2 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: '#444', fontSize: '9px' }}>
                                    <span>Apr 1</span>
                                    <span>Apr 8</span>
                                    <span>Apr 15</span>
                                    <span>Apr 22</span>
                                    <span>Apr 30</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProjectAnalytics;
