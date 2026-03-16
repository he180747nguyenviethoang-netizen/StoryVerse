import { axiosInstance } from './axios';

export async function getRecommendedComics(page = 1) {
  const response = await axiosInstance.get('/api/comics', {
    params: { sort: 'viewsDesc', page },
  });

  return response.data;
}

export async function getReadingHistory(page = 1) {
  const response = await axiosInstance.get('/api/reading-history', {
    params: { page },
  });

  return response.data;
}

export async function getComicDetails(comicId) {
  const response = await axiosInstance.get(`/api/comics/${comicId}`);
  return response.data;
}

export async function getComicReviews(comicId) {
  const response = await axiosInstance.get(`/api/comments/comic/${comicId}`);
  return response.data;
}

export async function createReview(comicId, content, rating) {
  const response = await axiosInstance.post('/api/comments', {
    comic: comicId,
    content,
    rating,
  }, {
    requiresAuth: true,
  });
  return response.data;
}

export async function updateReview(reviewId, content, rating) {
  const response = await axiosInstance.put(`/api/comments/${reviewId}`, {
    content,
    rating,
  }, {
    requiresAuth: true,
  });
  return response.data;
}

export async function deleteReview(reviewId) {
  const response = await axiosInstance.delete(`/api/comments/${reviewId}`, {
    requiresAuth: true,
  });
  return response.data;
}
