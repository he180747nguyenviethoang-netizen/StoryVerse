import axios from 'axios';
import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

function extractHost(value) {
  if (!value) return undefined;

  const normalized = value.includes('://') ? value : `http://${value}`;
  const match = normalized.match(/https?:\/\/([^/:]+)/);
  return match?.[1];
}

function getDevMachineHost() {
  const expoConfigHost = extractHost(Constants.expoConfig?.hostUri);
  if (expoConfigHost) return expoConfigHost;

  const manifest2Host = extractHost(Constants?.manifest2?.extra?.expoClient?.hostUri);
  if (manifest2Host) return manifest2Host;

  const manifestHost = extractHost(
    Constants?.manifest?.debuggerHost ?? Constants?.manifest?.hostUri
  );
  if (manifestHost) return manifestHost;

  const linkingHost = extractHost(Constants?.linkingUri);
  if (linkingHost) return linkingHost;

  const scriptHost = extractHost(NativeModules.SourceCode?.scriptURL);
  return scriptHost;
}

const devHost = getDevMachineHost();
const defaultBaseUrl = devHost
  ? `http://${devHost}:3000`
  : Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://localhost:3000';

export const axiosInstance = axios.create({
  baseURL: defaultBaseUrl,
  timeout: 15000,
});

export const apiBaseURL = defaultBaseUrl;
