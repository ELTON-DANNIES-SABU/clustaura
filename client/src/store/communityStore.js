import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api/community',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Helper to get token from localStorage
const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

const useCommunityStore = create((set, get) => ({
    communities: [],
    posts: [],
    comments: {},
    loading: false,
    error: null,

    fetchCommunities: async () => {
        set({ loading: true });
        try {
            const { data } = await api.get('/communities');
            set({ communities: data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    fetchPosts: async () => {
        set({ loading: true });
        try {
            const { data } = await api.get('/posts');
            // Format posts for the UI
            const formattedPosts = data.map(post => ({
                id: post._id,
                communityId: post.community?.slug || 'unknown',
                communityName: post.community?.name || 'Unknown',
                title: post.title,
                content: post.content,
                author: `${post.author?.firstName} ${post.author?.lastName}`,
                timestamp: post.createdAt,
                votes: (post.votes?.length || 0) - (post.downvotes?.length || 0),
                userVote: get().getUserVoteStatus(post),
                commentCount: post.commentCount || 0,
                tags: post.tags || []
            }));
            set({ posts: formattedPosts, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    getUserVoteStatus: (post) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return 0;
        const userId = user.id;
        if (post.votes?.includes(userId)) return 1;
        if (post.downvotes?.includes(userId)) return -1;
        return 0;
    },

    addPost: async (postData) => {
        try {
            const { data } = await api.post('/posts', postData, { headers: getAuthHeader() });
            get().fetchPosts(); // Refresh feed
            return data;
        } catch (error) {
            set({ error: error.message });
        }
    },

    vote: async (postId, direction) => {
        // Current post state for optimistic UI
        const post = get().posts.find(p => p.id === postId);
        if (!post) return;

        try {
            await api.put(`/posts/${postId}/vote`, { direction }, { headers: getAuthHeader() });
            get().fetchPosts(); // Refresh data to get synced state
        } catch (error) {
            console.error('Vote failed', error);
            set({ error: 'Failed to vote' });
        }
    },

    fetchComments: async (postId) => {
        try {
            const { data } = await api.get(`/posts/${postId}/comments`);
            set((state) => ({
                comments: {
                    ...state.comments,
                    [postId]: data.map(c => ({
                        id: c._id,
                        author: `${c.author?.firstName} ${c.author?.lastName}`,
                        content: c.content,
                        timestamp: c.createdAt,
                        votes: (c.votes?.length || 0) - (c.downvotes?.length || 0),
                        replies: [] // Backend nesting logic can be added later
                    }))
                }
            }));
        } catch (error) {
            console.error('Fetch comments failed', error);
        }
    },

    addComment: async (postId, content) => {
        try {
            await api.post('/comments', { postId, content }, { headers: getAuthHeader() });
            get().fetchComments(postId);
            // Also update local post comment count
            set((state) => ({
                posts: state.posts.map(p => p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p)
            }));
        } catch (error) {
            console.error('Comment failed', error);
        }
    }
}));

export default useCommunityStore;
