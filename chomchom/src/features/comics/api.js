import { axiosInstance } from '../../services/api/axios';
import { endpoints } from '../../services/api/endpoints';

export async function getComics(params = {}, config = {}) {
  const response = await axiosInstance.get(endpoints.comics, {
    params: {
      ...params,
    },
    ...config,
  });

  return response.data;
}

export async function getRecommendedComicsByHistory(comicIds = []) {
  const response = await axiosInstance.post(
    endpoints.comicsRecommend,
    { comicIds },
    {
      requiresAuth: true,
    }
  );

  return response.data;
}


export async function getReadingHistory(page = 1) {
  const response = await axiosInstance.get(endpoints.readingHistory, {
    requiresAuth: true,
    params: { page },
  });

  return response.data;
}

export async function getComicDetails(comicId) {
  const response = await axiosInstance.get(`${endpoints.comics}/${comicId}`);
  return response.data;
}

export async function getGenres() {
  const response = await axiosInstance.get(endpoints.genres);
  return response.data;
}
