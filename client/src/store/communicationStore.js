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

            // Initialize Socket
            const socket = io(SOCKET_URL);
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                socket.emit('join_room', user._id || user.id);
            }

            // Join rooms for all channels
            allChannels.forEach(channel => {
                socket.emit('join_room', channel._id);
            });

            socket.on('receive_comm_message', (message) => {
                // Determine targetId (channelId or senderId for DM)
                const targetId = message.channelId || message.sender._id;
                get().addMessageToState(targetId, message);
            });

            set({ socket });

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
        set({ activeId: id, activeType: type });
        if (!get().messages[id]) {
            get().fetchMessages(id, type);
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

        return {
            messages: {
                ...state.messages,
                [actualTargetId]: [...currentMsgs, message]
            }
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
