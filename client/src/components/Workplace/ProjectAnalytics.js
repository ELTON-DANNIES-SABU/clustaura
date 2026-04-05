import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Lock, Users, CheckCircle, Code, Download, ChevronDown, Activity } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './ProjectAnalytics.css';

const STATUS_COLORS = {
    'To Do': '#444444',
    'In Progress': '#00ffa3', // Use the theme accent color
    'Testing': '#3498db',
    'Completed': '#2ecc71'
};

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

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Cyberpunk styling for the PDF
        doc.setFillColor(5, 5, 5); // Dark background
        doc.rect(0, 0, 210, 297, 'F');

        // Header
        doc.setFontSize(22);
        doc.setTextColor(0, 255, 163); // Neon Green
        const title = `ANALYTICS: ${data.overview.projectName?.toUpperCase() || 'PROJECT REPORT'}`;
        const splitTitle = doc.splitTextToSize(title, 180);
        doc.text(splitTitle, 14, 25);
        
        // Calculate dynamic spacing based on title length
        const titleSpacing = splitTitle.length * 10;
        const metaY = 20 + titleSpacing;

        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Project ID: ${projectId}`, 14, metaY);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, metaY + 7);

        // Line separator
        doc.setDrawColor(0, 255, 163);
        doc.line(14, metaY + 12, 196, metaY + 12);

        // Section 1: Overview
        const overviewTitleY = metaY + 25;
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text('PROJECT OVERVIEW', 14, overviewTitleY);

        const overviewBody = [
            ['Key Metric', 'Status / Value'],
            ['Total Engineering Team', `${data.overview.totalMembers} Members`],
            ['Completion Rate', `${data.overview.avgTaskCompletion.value}%`],
            ['Current Progress Phase', data.overview.avgTaskCompletion.trend]
        ];

        autoTable(doc, {
            startY: overviewTitleY + 5,
head: [overviewBody[0]],
            body: overviewBody.slice(1),
            styles: { fillColor: [15, 15, 15], textColor: [230, 230, 230], lineColor: [40, 40, 40], lineWidth: 0.1 },
            headStyles: { fillColor: [0, 255, 163], textColor: [0, 0, 0], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [20, 20, 20] }
        });

        // Section 2: Detailed Member Metrics
        const tableStartY = (doc).lastAutoTable.finalY + 20;
        doc.setTextColor(255, 255, 255);
        doc.text('INDIVIDUAL PERFORMANCE METRICS', 14, tableStartY);

        const memberHeaders = ['Member Name', 'Role', 'Pending', 'Completed', 'Testing'];
        const memberRows = data.members.map(m => [
            `${m.firstName} ${m.lastName}`,
            m.role,
            m.metrics.activeTasks.count,
            m.metrics.tasksCompleted.count,
            m.metrics.ticketsPushed.count
        ]);

        autoTable(doc, {
            startY: tableStartY + 5,
            head: [memberHeaders],
            body: memberRows,
            styles: { fillColor: [15, 15, 15], textColor: [200, 200, 200], fontSize: 9 },
            headStyles: { fillColor: [0, 255, 163], textColor: [0, 0, 0] },
            alternateRowStyles: { fillColor: [10, 10, 10] }
        });

        // Footer
        const finalY = (doc).lastAutoTable.finalY + 20;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('© 2026 Clustaura - AI Powered Workspace Intelligence', 14, 285);

        doc.save(`Project_Report_${data.overview.projectName?.replace(/\s+/g, '_')}.pdf`);
    };

    if (loading) return <div className="loading-spinner" style={{ color: '#00ffa3', display: 'flex', justifyContent: 'center', marginTop: '50px' }}>Loading Analytics...</div>;
    if (!data) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>Access Denied or No Data Available.</div>;

    const filteredMembers = data.members.filter(member => {
        if (!member) return false;
        const fullName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
        const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
            (member.email || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'All Roles' || (member.role || '').toLowerCase() === roleFilter.toLowerCase();
        return matchesSearch && matchesRole;
    });

    const rolesAvailable = ['All Roles', ...new Set(data.members.filter(m => m && m.role).map(m => m.role))];

    const DotMatrix = ({ data }) => {
        const dots = [];
        data.forEach(item => {
            for (let i = 0; i < item.value; i++) {
                dots.push(item.name);
            }
        });

        if (dots.length === 0) return <div className="no-data-text">No Tasks Assigned</div>;

        return (
            <div className="dot-matrix">
                {dots.map((status, index) => (
                    <div
                        key={index}
                        className="matrix-dot"
                        style={{
                            backgroundColor: STATUS_COLORS[status] || '#333',
                            color: STATUS_COLORS[status] || '#333' // For boxShadow currentColor
                        }}
                        title={status}
                    />
                ))}
            </div>
        );
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
                            <span className="trend-badge" style={{ fontSize: '10px', color: '#888' }}>{data.overview.avgTaskCompletion.trend}</span>
                        </div>
                        <p className="card-subtitle">overall progress</p>
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

                <button className="export-btn" onClick={handleExportPDF}>
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
                                        <span>{(member.firstName || '').charAt(0)}{(member.lastName || '').charAt(0)}</span>
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
                                {(member.skills || []).map((skill, index) => (
                                    <span key={index} className="skill-tag">{skill}</span>
                                ))}
                            </div>
                        </div>

                        <div className="metrics-col">
                            <div className="metric-block">
                                <span className="metric-title">Active Tasks</span>
                                <div className="metric-value-row">
                                    <span className="m-value">{member.metrics?.activeTasks?.count || 0}</span>
                                    <span className="m-trend" style={{ fontSize: '10px', color: '#00ffa3' }}>{member.metrics?.activeTasks?.trend || ''}</span>
                                </div>
                                <span className="m-subtitle">tickets pending</span>
                            </div>

                            <div className="metric-block">
                                <span className="metric-title">Tasks Completed</span>
                                <div className="metric-value-row">
                                    <span className="m-value">{member.metrics?.tasksCompleted?.count || 0}</span>
                                    <span className="m-trend" style={{ fontSize: '10px', color: '#2ecc71' }}>{member.metrics?.tasksCompleted?.trend || ''}</span>
                                </div>
                                <span className="m-subtitle">tickets completed</span>
                            </div>

                            <div className="metric-block">
                                <span className="metric-title">Tickets Pushed</span>
                                <div className="metric-value-row">
                                    <span className="m-value">{member.metrics?.ticketsPushed?.count || 0}</span>
                                    <span className="m-trend" style={{ fontSize: '10px', color: '#3498db' }}>{member.metrics?.ticketsPushed?.trend || ''}</span>
                                </div>
                                <span className="m-subtitle">under testing</span>
                            </div>
                        </div>

                        <div className="chart-col">
                            <div className="chart-header">
                                <span className="chart-title">Status Distribution</span>
                                <span className="chart-subtitle">Direct Board Metrics</span>
                            </div>
                            <DotMatrix data={member.metrics?.statusDistribution || []} />

                            <div className="dot-matrix-legend">
                                {Object.keys(STATUS_COLORS).map(status => (
                                    <div key={status} className="legend-item">
                                        <div
                                            className="legend-dot"
                                            style={{ backgroundColor: STATUS_COLORS[status] }}
                                        ></div>
                                        <span>{status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProjectAnalytics;
