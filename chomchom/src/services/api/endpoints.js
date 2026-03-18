export const endpoints = {
  comics: '/api/comics',
  comicsRecommend: '/api/comics/recommend',
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    google: '/api/auth/google',
    verify: '/api/auth/verify',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
  },
  readingHistory: '/api/reading-history',
  genres: '/api/genres',
  readerChatbot: (comicId) => `/api/comics/${comicId}/reader-chatbot`,
};
