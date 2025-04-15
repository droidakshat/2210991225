const express = require('express');
const axios = require('axios');
const app = express();
const port = 9877;

const API_BASE_URL = 'http://20.244.56.144/evaluation-service';

const cache = {
  users: null,
  posts: {},
  comments: {},
  topUsers: null,
  popularPosts: null,
  lastUpdated: {
    users: null,
    posts: {},
    comments: {},
    topUsers: null,
    popularPosts: null
  }
};

const CACHE_TTL = 5 * 60 * 1000;

app.use(express.json());

const isCacheValid = (key) => {
  return cache.lastUpdated[key] && (Date.now() - cache.lastUpdated[key] < CACHE_TTL);
};

const fetchUsers = async () => {
  if (isCacheValid('users')) {
    return cache.users;
  }
  
  try {
    const response = await axios.get(${API_BASE_URL}/users);
    cache.users = response.data.users;
    cache.lastUpdated.users = Date.now();
    return cache.users;
  } catch (error) {
    console.error('Error fetching users:', error.message);
    throw new Error('Failed to fetch users');
  }
};

const fetchPosts = async (userId) => {
  if (isCacheValid(posts_${userId})) {
    return cache.posts[userId];
  }
  
  try {
    const response = await axios.get(${API_BASE_URL}/users/${userId}/posts);
    cache.posts[userId] = response.data.posts;
    cache.lastUpdated.posts[userId] = Date.now();
    return cache.posts[userId];
  } catch (error) {
    console.error(Error fetching posts for user ${userId}:, error.message);
    throw new Error(Failed to fetch posts for user ${userId});
  }
};

const fetchComments = async (postId) => {
  if (isCacheValid(comments_${postId})) {
    return cache.comments[postId];
  }
  
  try {
    const response = await axios.get(${API_BASE_URL}/posts/${postId}/comments);
    cache.comments[postId] = response.data.comments;
    cache.lastUpdated.comments[postId] = Date.now();
    return cache.comments[postId];
  } catch (error) {
    console.error(Error fetching comments for post ${postId}:, error.message);
    throw new Error(Failed to fetch comments for post ${postId});
  }
};

app.get('/users', async (req, res) => {
  try {
    const users = await fetchUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/users/:userId/posts', async (req, res) => {
  const userId = req.params.userId;
  
  try {
    const posts = await fetchPosts(userId);
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/posts/:postId/comments', async (req, res) => {
  const postId = req.params.postId;
  
  try {
    const comments = await fetchComments(postId);
    res.json({ comments });
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/top-users', async (req, res) => {
  if (isCacheValid('topUsers')) {
    return res.json({ topUsers: cache.topUsers });
  }
  
  try {
    const users = await fetchUsers();
    const userStats = [];
    
    for (const user of users) {
      try {
        const posts = await fetchPosts(user.id);
        let commentCount = 0;
        
        for (const post of posts) {
          try {
            const comments = await fetchComments(post.id);
            commentCount += comments.length;
          } catch (error) {
            console.error(Error processing comments for post ${post.id}:, error.message);
          }
        }
        
        userStats.push({
          id: user.id,
          name: user.name,
          commentCount,
          postCount: posts.length
        });
      } catch (error) {
        console.error(Error processing posts for user ${user.id}:, error.message);
      }
    }
    
    userStats.sort((a, b) => b.commentCount - a.commentCount);
    const topUsers = userStats.slice(0, 5);
    cache.topUsers = topUsers;
    cache.lastUpdated.topUsers = Date.now();
    
    res.json({ topUsers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/popular-posts', async (req, res) => {
    
  const type = req.query.type || 'latest';
  
  if (type !== 'latest' && type !== 'popular') {
    return res.status(400).json({ error: "Invalid type. Use 'latest' or 'popular'" });
  }
  
  if (type === 'popular' && isCacheValid('popularPosts')) {
    return res.json({ popularPosts: cache.popularPosts });
  }
  
  try {
    const users = await fetchUsers();
    const allPosts = [];
    
    for (const user of users) {
      try {
        const posts = await fetchPosts(user.id);
        
        for (const post of posts) {
          try {
            const comments = await fetchComments(post.id);
            allPosts.push({
              id: post.id,
              userId: user.id,
              userName: user.name,
              title: post.title,
              content: post.content,
              commentCount: comments.length
            });
          } catch (error) {
            console.error(Error processing comments for post ${post.id}:, error.message);
            allPosts.push({
              id: post.id,
              userId: user.id,
              userName: user.name,
              title: post.title,
              content: post.content,
              commentCount: 0
            });
          }
        }
      } catch (error) {
        console.error(Error processing posts for user ${user.id}:, error.message);
      }
    }
    
    let result;
    
    if (type === 'popular') {
      result = allPosts.sort((a, b) => b.commentCount - a.commentCount).slice(0, 10);
      cache.popularPosts = result;
      cache.lastUpdated.popularPosts = Date.now();
    } else {
      result = allPosts.sort((a, b) => b.id - a.id).slice(0, 10);
    }
    
    res.json({ popularPosts: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.listen(port, () => {
  console.log(Social Media Analytics Microservice running at http://localhost:${port});
});

module.exports = app;
