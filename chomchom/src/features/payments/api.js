import { axiosInstance } from '../../services/api/axios';

export async function getCoinPacks() {
  const res = await axiosInstance.get('/api/payments/coin-packs');
  return res.data;
}

export async function createCoinPackCheckout(packId) {
  const res = await axiosInstance.post(
    '/api/payments/checkout',
    { packId },
    { requiresAuth: true }
  );
  return res.data;
}

export async function getMyWallet() {
  const res = await axiosInstance.get('/api/wallet/me', { requiresAuth: true });
  return res.data;
}

export async function unlockChapterById(chapterId) {
  const res = await axiosInstance.post(`/api/chapters/${chapterId}/unlock`, null, {
    requiresAuth: true,
  });
  return res.data;
}

