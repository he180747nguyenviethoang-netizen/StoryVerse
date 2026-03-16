import { axiosInstance } from '../../services/api/axios';
import { endpoints } from '../../services/api/endpoints';

export async function getChaptersByComic(comicId) {
  const response = await axiosInstance.get(`/api/chapters/comic/${comicId}`);
  return response.data;
}

export async function getChapterById(chapterId) {
  const response = await axiosInstance.get(`/api/chapters/${chapterId}`);
  return response.data;
}

export async function askReaderChatbot(comicId, message, currentChapterNumber) {
  const { data } = await axiosInstance.post(
    endpoints.readerChatbot(comicId),
    { message, currentChapterNumber },
    { requiresAuth: true }
  );
  return data;
}
