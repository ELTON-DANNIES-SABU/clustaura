import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
    baseURL: '/api/community',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Helper to get token and user from localStorage
const getAuthData = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return {
        token: user?.token || '',
        id: user?._id || user?.id || '',
        name: user ? `${user.firstName} ${user.lastName}` : 'Anonymous'
    };
};

const getAuthHeader = () => {
    const { token } = getAuthData();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const useCommunityStore = create((set, get) => ({
    communities: [],
    posts: [],
    selectedProfessionTags: [],
    loading: false,
    error: null,

    setSelectedProfessionTags: (tags) => set({ selectedProfessionTags: tags }),

    fetchCommunities: async () => {
        set({ loading: true });
        try {
            const { data } = await api.get('/communities', { headers: getAuthHeader() });
            set({ communities: data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    fetchPosts: async (tag = null, search = '') => {
        set({ loading: true });
        try {
            let url = '/posts';
            const params = new URLSearchParams();
            if (tag) {
                if (Array.isArray(tag)) {
                    tag.forEach(t => params.append('tags', t));
                } else {
                    params.append('tags', tag);
                }
            }
            if (search) params.append('search', search);
            if (params.toString()) url += `?${params.toString()}`;

            const { data } = await api.get(url, { headers: getAuthHeader() });
            // Format posts for the UI
            const formattedPosts = data.map(post => ({
                id: post._id,
                communityId: post.community?.slug || 'general',
                communityName: post.community?.name || 'General',
                title: post.title,
                content: post.content,
                author: post.author ? `${post.author.firstName} ${post.author.lastName}` : 'Unknown',
                authorId: post.author?._id || post.author || '',
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
        const { id: userId } = getAuthData();
        if (!userId) return 0;
        if (post.votes?.includes(userId)) return 1;
        if (post.downvotes?.includes(userId)) return -1;
        return 0;
    },

    getLoggedInUser: () => getAuthData(),

    addPost: async (postData) => {
        try {
            const { data } = await api.post('/posts', postData, { headers: getAuthHeader() });
            get().fetchPosts(); // Refresh feed
            return data;
        } catch (error) {
            set({ error: error.message });
        }
    },

    editPost: async (postId, postData) => {
        try {
            const { data } = await api.put(`/posts/${postId}`, postData, { headers: getAuthHeader() });
            get().fetchPosts();
            return data;
        } catch (error) {
            set({ error: error.message });
        }
    },

    deletePost: async (postId) => {
        try {
            await api.delete(`/posts/${postId}`, { headers: getAuthHeader() });
            get().fetchPosts();
            return true;
        } catch (error) {
            set({ error: error.message });
            return false;
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
            const { data } = await api.get(`/posts/${postId}/comments`, { headers: getAuthHeader() });
            set((state) => ({
                comments: {
                    ...state.comments,
                    [postId]: data.map(c => ({
                        id: c._id,
                        author: `${c.author?.firstName} ${c.author?.lastName}`,
                        authorId: c.author?._id || c.author || '',
                        content: c.content,
                        timestamp: c.createdAt,
                        votes: (c.votes?.length || 0) - (c.downvotes?.length || 0),
                        userVote: get().getUserVoteStatus(c),
                        replies: []
                    }))
                }
            }));
        } catch (error) {
            console.error('Fetch comments failed', error);
        }
    },

    voteComment: async (postId, commentId, direction) => {
        try {
            await api.put(`/comments/${commentId}/vote`, { direction }, { headers: getAuthHeader() });
            get().fetchComments(postId);
        } catch (error) {
            console.error('Comment vote failed', error);
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
