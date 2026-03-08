import React, { useState } from 'react';
import { Calendar, Clock, Users, X, Check, Globe, Link as LinkIcon } from 'lucide-react';
import useCommunicationStore from '../store/communicationStore';

const MeetingScheduler = ({ onClose }) => {
    const { scheduleMeeting, teams, channels } = useCommunicationStore();
    const [title, setTitle] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [duration, setDuration] = useState(30);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [selectedChannel, setSelectedChannel] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !scheduledAt) return;

        setIsSubmitting(true);
        try {
            await scheduleMeeting({
                title,
                scheduledAt: new Date(scheduledAt),
                duration,
                teamId: selectedTeam || undefined,
                channelId: selectedChannel || undefined
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 6000,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px'
        }}>
            <div style={{
                width: '100%', maxWidth: '500px',
                backgroundColor: '#111827',
                borderRadius: '16px', border: '1px solid #1F2937',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #1F2937',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 }}>Schedule Meeting</h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#9CA3AF', marginBottom: '8px' }}>Meeting Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Project Synchronisation"
                            style={{
                                width: '100%', padding: '12px 14px',
                                backgroundColor: '#1F2937', border: '1px solid #374151',
                                borderRadius: '8px', color: 'white', outline: 'none'
                            }}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#9CA3AF', marginBottom: '8px' }}>Date & Time</label>
                            <input
                                type="datetime-local"
                                value={scheduledAt}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 14px',
                                    backgroundColor: '#1F2937', border: '1px solid #374151',
                                    borderRadius: '8px', color: 'white', outline: 'none'
                                }}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#9CA3AF', marginBottom: '8px' }}>Duration (mins)</label>
                            <select
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                style={{
                                    width: '100%', padding: '12px 14px',
                                    backgroundColor: '#1F2937', border: '1px solid #374151',
                                    borderRadius: '8px', color: 'white', outline: 'none'
                                }}
                            >
                                <option value={15}>15 mins</option>
                                <option value={30}>30 mins</option>
                                <option value={45}>45 mins</option>
                                <option value={60}>1 hour</option>
                                <option value={120}>2 hours</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#9CA3AF', marginBottom: '8px' }}>Associated Team (Optional)</label>
                        <select
                            value={selectedTeam}
                            onChange={(e) => {
                                setSelectedTeam(e.target.value);
                                setSelectedChannel('');
                            }}
                            style={{
                                width: '100%', padding: '12px 14px',
                                backgroundColor: '#1F2937', border: '1px solid #374151',
                                borderRadius: '8px', color: 'white', outline: 'none'
                            }}
                        >
                            <option value="">None</option>
                            {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                        </select>
                    </div>

                    {selectedTeam && (
                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#9CA3AF', marginBottom: '8px' }}>Channel</label>
                            <select
                                value={selectedChannel}
                                onChange={(e) => setSelectedChannel(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 14px',
                                    backgroundColor: '#1F2937', border: '1px solid #374151',
                                    borderRadius: '8px', color: 'white', outline: 'none'
                                }}
                            >
                                <option value="">None</option>
                                {channels.filter(c => c.teamId === selectedTeam).map(c => <option key={c._id} value={c._id}>#{c.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div style={{
                        marginTop: '12px', padding: '12px',
                        backgroundColor: 'rgba(0, 255, 156, 0.05)',
                        border: '1px dashed rgba(0, 255, 156, 0.2)',
                        borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center'
                    }}>
                        <LinkIcon size={20} color="#00FF9C" />
                        <div style={{ fontSize: '12px', color: '#D1D5DB' }}>
                            A secure meeting link will be generated automatically and shared with participants.
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            width: '100%', padding: '14px', marginTop: '12px',
                            backgroundColor: '#00FF9C', color: 'black',
                            border: 'none', borderRadius: '8px', fontWeight: 'bold',
                            fontSize: '16px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'all 0.2s', opacity: isSubmitting ? 0.7 : 1
                        }}
                    >
                        {isSubmitting ? 'Scheduling...' : <><Calendar size={20} /> Schedule Meeting</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MeetingScheduler;
