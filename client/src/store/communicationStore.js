import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = '/api/comm';
const FRIENDS_API_URL = '/api/friends';
const SOCKET_URL = '/';

const getAuthHeader = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const userData = JSON.parse(userStr);
        return { Authorization: `Bearer ${userData.token}` };
    }
    return {};
};

const useCommunicationStore = create((set, get) => ({
    teams: [],
    channels: [],
    directMessages: [],
    messages: {},
    activeId: null,
    activeType: 'channel',
    currentUserStatus: 'online',
    socket: null,
    isLoading: false,
    typingUsers: {}, // { [roomId]: [user1, user2] }

    // Initialization
    init: async () => {
        set({ isLoading: true });
        try {
            const config = { headers: getAuthHeader() };

            // Fetch Teams
            const teamsRes = await axios.get(`${API_URL}/teams`, config);
            const teams = teamsRes.data;

            // Fetch Channels for each team
            let allChannels = [];
            for (const team of teams) {
                const channelsRes = await axios.get(`${API_URL}/teams/${team._id}/channels`, config);
                allChannels = [...allChannels, ...channelsRes.data.map(c => ({ ...c, teamId: team._id }))];
            }

            // Fetch Friends for DMs
            const friendsRes = await axios.get(FRIENDS_API_URL, config);
            const friends = friendsRes.data.map(f => ({
                id: f._id,
                name: `${f.firstName} ${f.lastName}`,
                status: 'online', // Mock status for now
                unread: 0
            }));

            set({
                teams,
                channels: allChannels,
                directMessages: friends,
                activeId: allChannels.length > 0 ? allChannels[0]._id : (friends.length > 0 ? friends[0].id : null),
                activeType: allChannels.length > 0 ? 'channel' : 'dm',
                isLoading: false
            });

            // Initialize Socket (Singleton)
            let { socket } = get();
            if (!socket) {
                get().initSocket();
                socket = get().socket;
            }

            // Join rooms for all channels
            allChannels.forEach(channel => {
                socket.emit('join_room', channel._id);
            });
            // Listener is already attached in initSocket

            // Fetch initial messages for activeId
            const { activeId, activeType } = get();
            if (activeId) {
                get().fetchMessages(activeId, activeType);
            }

        } catch (error) {
            console.error('Error initializing communication:', error);
            set({ isLoading: false });
        }
    },

    fetchMessages: async (id, type) => {
        try {
            const config = { headers: getAuthHeader() };
            let url = '';
            if (type === 'channel') {
                url = `${API_URL}/channels/${id}/messages`;
            } else {
                url = `${API_URL}/dms/${id}`;
            }

            const res = await axios.get(url, config);
            set((state) => ({
                messages: {
                    ...state.messages,
                    [id]: res.data
                }
            }));
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    },

    setActive: (id, type) => {
        set((state) => {
            // clear unread for this id
            const newChannels = state.channels.map(c => c._id === id ? { ...c, unread: 0 } : c);
            const newDMs = state.directMessages.map(d => d.id === id ? { ...d, unread: 0 } : d);
            return { activeId: id, activeType: type, channels: newChannels, directMessages: newDMs };
        });

        if (!get().messages[id]) {
            get().fetchMessages(id, type);
        }

        // Notify server
        const { socket } = get();
        if (socket && type === 'channel') {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                socket.emit('mark_channel_read', { channelId: id, userId: JSON.parse(userStr)._id });
            }
        }
    },

    setStatus: (status) => set({ currentUserStatus: status }),

    sendMessage: async (content) => {
        const { activeId, activeType } = get();
        if (!activeId || !content.trim()) return;

        try {
            const config = { headers: getAuthHeader() };
            const payload = {
                content,
                [activeType === 'channel' ? 'channelId' : 'recipientId']: activeId
            };

            await axios.post(`${API_URL}/messages`, payload, config);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    },

    sendTyping: (isTyping) => {
        const { socket, activeId } = get();
        if (!socket || !activeId) return;
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        const user = JSON.parse(userStr);

        if (isTyping) {
            socket.emit('typing', { roomId: activeId, user });
        } else {
            socket.emit('stop_typing', { roomId: activeId, user });
        }
    },

    addMessageToState: (targetId, message) => set((state) => {
        // Redefine targetId based on message content and current user
        let actualTargetId = targetId;
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            const currentUserId = user._id || user.id;

            if (message.channelId) {
                actualTargetId = message.channelId;
            } else {
                // For DMs:
                // If I am the sender, the conversation is with the recipient
                // If I am the receiver, the conversation is with the sender
                if (message.sender._id === currentUserId) {
                    actualTargetId = message.recipient;
                } else {
                    actualTargetId = message.sender._id;
                }
            }
        }

        const currentMsgs = state.messages[actualTargetId] || [];
        if (currentMsgs.find(m => m._id === message._id)) return state;

        // Increment unread if not active
        let newChannels = state.channels;
        let newDMs = state.directMessages;

        if (state.activeId !== actualTargetId) {
            if (message.channelId) {
                newChannels = state.channels.map(c => c._id === actualTargetId ? { ...c, unread: (c.unread || 0) + 1 } : c);
            } else {
                newDMs = state.directMessages.map(d => d.id === actualTargetId ? { ...d, unread: (d.unread || 0) + 1 } : d);
            }
        }

        return {
            messages: {
                ...state.messages,
                [actualTargetId]: [...currentMsgs, message]
            },
            channels: newChannels,
            directMessages: newDMs
        };
    }),

    createTeam: async (name, description) => {
        try {
            const config = { headers: getAuthHeader() };
            const res = await axios.post(`${API_URL}/teams`, { name, description }, config);
            const team = res.data;
            set((state) => ({ teams: [...state.teams, team] }));
            return team;
        } catch (error) {
            console.error('Error creating team:', error);
        }
    },

    createChannel: async (teamId, name, description) => {
        try {
            const config = { headers: getAuthHeader() };
            const res = await axios.post(`${API_URL}/teams/${teamId}/channels`, { name, description }, config);
            const channel = { ...res.data, teamId };
            set((state) => ({ channels: [...state.channels, channel] }));

            // Join socket room
            const { socket } = get();
            if (socket) socket.emit('join_room', channel._id);

            return channel;
        } catch (error) {
            console.error('Error creating channel:', error);
        }
    },

    // --- Global Call State & Actions ---
    callState: {
        inCall: false,
        callStatus: 'idle', // idle, calling, incoming, connected, preview
        roomId: null,
        callType: 'video', // 'audio' or 'video'
        initiator: null, // { id, name }
        participants: [] // list of users involved if needed
    },

    setCallState: (newState) => set((state) => ({
        callState: { ...state.callState, ...newState }
    })),

    initSocket: () => {
        const { socket } = get();
        if (socket) return;

        // Initialize Socket Global
        const newSocket = io(SOCKET_URL);
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            newSocket.emit('join_room', user._id || user.id);
        }

        newSocket.on('incoming_call', (data) => {
            console.log("Global Incoming Call:", data);
            set((state) => ({
                callState: {
                    ...state.callState,
                    inCall: true,
                    callStatus: 'incoming',
                    roomId: data.roomId,
                    callType: data.type,
                    initiator: data.initiatorName || data.initiatorId, // Prefer name
                    initiatorId: data.initiatorId // Keep ID for logic
                }
            }));
        });

        // Listen for standard comm messages too
        newSocket.on('receive_comm_message', (message) => {
            const targetId = message.channelId || message.sender._id;
            get().addMessageToState(targetId, message);
        });

        newSocket.on('display_typing', ({ user, roomId }) => {
            set(state => {
                const currentTypers = state.typingUsers[roomId] || [];
                if (currentTypers.find(u => u._id === user._id)) return state;
                return {
                    typingUsers: {
                        ...state.typingUsers,
                        [roomId]: [...currentTypers, user]
                    }
                };
            });
        });

        newSocket.on('hide_typing', ({ user, roomId }) => {
            set(state => {
                const currentTypers = state.typingUsers[roomId] || [];
                return {
                    typingUsers: {
                        ...state.typingUsers,
                        [roomId]: currentTypers.filter(u => u._id !== user._id)
                    }
                };
            });
        });

        set({ socket: newSocket });
    },

    startCallGlobal: (roomId, type) => {
        const { socket } = get();
        if (!socket) return;

        const userStr = localStorage.getItem('user');
        let userId = null;
        if (userStr) {
            userId = JSON.parse(userStr)._id;
        }

        socket.emit('start_call', { roomId, type, userId });
        set((state) => ({
            callState: {
                ...state.callState,
                inCall: true,
                callStatus: 'calling', // Waiting for others to join
                roomId,
                callType: type
            }
        }));
    },

    joinCall: (roomId, type) => {
        set((state) => ({
            callState: {
                ...state.callState,
                inCall: true,
                callStatus: 'preview', // Show preview screen first
                roomId,
                callType: type
            }
        }));
    },

    enterCall: () => {
        set((state) => ({
            callState: {
                ...state.callState,
                callStatus: 'connected'
            }
        }));
    },

    endCallGlobal: () => {
        const { socket, callState } = get();
        if (socket && callState.roomId) {
            socket.emit('leave_call_room', { roomId: callState.roomId });
        }
        set({
            callState: {
                inCall: false,
                callStatus: 'idle',
                roomId: null,
                callType: 'video',
                initiator: null,
                participants: []
            }
        });
    },

    addMemberToTeam: async (teamId, email) => {
        try {
            const config = { headers: getAuthHeader() };
            await axios.put(`${API_URL}/teams/${teamId}/members`, { email }, config);
            alert(`User with email ${email} added to the team successfully!`);
            return true;
        } catch (error) {
            console.error('Error adding member:', error);
            alert(error.response?.data?.message || 'Failed to add member');
            return false;
        }
    }
}));

export default useCommunicationStore;
