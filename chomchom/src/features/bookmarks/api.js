import { axiosInstance } from '../../services/api/axios';
export const likeComic = async (comicId) => {
  const res = await axiosInstance.post(
    `/api/comics/${comicId}/like`,
    {},
    {
      requiresAuth: true,
    }
  );

  return res.data;
};

export const getLikedComics = async () => {
  const res = await axiosInstance.get(`/api/comics/like`, {
    requiresAuth: true,
  });
  return res.data;
};

export const updateReadingHistory = async (comicId, chapterId) => {
  const res = await axiosInstance.post(
    `/api/reading-history`,
    { comicId, chapterId },
    {
      requiresAuth: true,
    }
  );

  return res.data;
};

export const getReadingHistory = async () => {
  const res = await axiosInstance.get('/api/reading-history', {
    requiresAuth: true,
  });

  return res.data;
};

export const removeReadingHistory = async (comicId) => {
  const res = await axiosInstance.delete(`/api/reading-history/${comicId}`, {
    requiresAuth: true,
  });

  return res.data;
};
