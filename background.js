/**
 * background script
 */

const DEFAULT_MIRROR_KEY = 'kitsu';
const DEFAULT_MIRROR_NAME = 'Kitsu';
const DEFAULT_MIRROR_ENDPOINT = 'https://kitsu.moe/api';

// fetch with 3s timeout
const fetchWithTimeout = async (api, options = {}) => {
  const { timeout = 3000 } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(api, {
    ...options,
    signal: controller.signal
  });
  clearTimeout(id);
  return response;
};

// set default api
const setDefaultApi = async (sendResponse) => {
  try {
    const result = await chrome.storage.sync.get(['osuMirrorEndpoint', 'osuMirrorName', 'osuMirrorKey']);
    if (!result.osuMirrorEndpoint || !result.osuMirrorName || !result.osuMirrorKey) {
      console.log('default mirror api not found, now setting Kitsu as default ...');
      await chrome.storage.sync.set(
        {
          osuMirrorKey: DEFAULT_MIRROR_KEY,
          osuMirrorName: DEFAULT_MIRROR_NAME,
          osuMirrorEndpoint: DEFAULT_MIRROR_ENDPOINT
        }
      );
    }
    sendResponse({ success: true });
  } catch (err) {
    console.error('failed to set default api', err);
    sendResponse({ success: false, message: 'failed to set default api' });
  }
}

// get default api endpoint
const getEndpoint = async () => {
  const result = await chrome.storage.sync.get(['osuMirrorEndpoint', 'osuMirrorKey']);
  return result;
}

// get Kitsu download link
const getKitsuDownloadLink = async (sendResponse, osuMirrorEndpoint, mapSetId) => {
  const res = await fetchWithTimeout(`${osuMirrorEndpoint}/s/${mapSetId}`);
  switch (res.status) {
    case 200: {
      const resBody = await res.json();
      if (resBody.DownloadUnavailable === false) {
        sendResponse({ success: true, downloadLink: `${osuMirrorEndpoint}/d/${mapSetId}` });
      } else {
        sendResponse({ success: false, message: 'beatmap is unavailable from this api' });
      }
      break;
    }
    case 404: {
      sendResponse({ success: false, message: 'map not found ??\\_(???)_/??' });
      break;
    }
    case 429: {
      sendResponse({ success: false, message: 'too many downloads' });
      break;
    }
    default: {
      sendResponse({ success: false, message: 'error getting mirror download link' });
    }
  }
}

// get Chimu download link
const getChimuDownloadLink = async (sendResponse, osuMirrorEndpoint, mapSetId) => {
  const res = await fetchWithTimeout(`${osuMirrorEndpoint}/set/${mapSetId}`);
  switch (res.status) {
    case 200: {
      const resBody = await res.json();
      if (resBody.Disabled === false) {
        sendResponse({ success: true, downloadLink: `${osuMirrorEndpoint}/download/${mapSetId}` });
      } else {
        sendResponse({ success: false, message: 'beatmap is unavailable from this api' });
      }
      break;
    }
    case 404: {
      sendResponse({ success: false, message: 'map not found ??\\_(???)_/??' });
      break;
    }
    default: {
      sendResponse({ success: false, message: 'error getting mirror download link' });
    }
  }
}

// get Nerinyan download link
const getNerinyanDownloadLink = async (sendResponse, osuMirrorEndpoint, mapSetId) => {
  const res = await fetchWithTimeout(`${osuMirrorEndpoint}/bg/${mapSetId}`);
  switch (res.status) {
    case 200: {
      sendResponse({ success: true, downloadLink: `${osuMirrorEndpoint}/d/${mapSetId}` });
      break;
    }
    case 404: {
      sendResponse({ success: false, message: 'map not found ??\\_(???)_/??' });
      break;
    }
    default: {
      sendResponse({ success: false, message: 'error getting mirror download link' });
    }
  }
}

// get mirror download link
const getMirrorDownloadLink = async (sendResponse, mapSetId) => {
  try {
    // get default api endpoint
    const { osuMirrorEndpoint, osuMirrorKey } = await getEndpoint();
    console.log('downloading map set from', osuMirrorKey, '...');
    switch (osuMirrorKey) {
      case 'kitsu': {
        await getKitsuDownloadLink(sendResponse, osuMirrorEndpoint, mapSetId);
        break;
      }
      case 'chimu': {
        await getChimuDownloadLink(sendResponse, osuMirrorEndpoint, mapSetId);
        break;
      }
      case 'nerinyan': {
        await getNerinyanDownloadLink(sendResponse, osuMirrorEndpoint, mapSetId);
        break;
      }
      default: {
        sendResponse({ success: false, message: 'unknown osu mirror api' });
      }
    };
  } catch (err) {
    console.error('error getting mirror download link', err);
    sendResponse({ success: false, message: 'error getting mirror download link' });
  }
}

// get current api from storage
const getCurrentApi = async (sendResponse) => {
  const result = await chrome.storage.sync.get('osuMirrorName')
  if (result.osuMirrorName) {
    sendResponse({ success: true, currentApi: result.osuMirrorName });
  } else {
    sendResponse({ success: false, message: 'failed to get current api' });
  }
}

// set current api to storage
const setCurrentApi = async (sendResponse, osuMirrorName) => {
  try {
    await chrome.storage.sync.set(osuMirrorName);
    sendResponse({ success: true });
  } catch (err) {
    console.error('failed to set current api', err);
    sendResponse({ success: false, message: 'failed to set current api' });
  }
}

// message listener
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  switch (request.action) {
    case 'set-default-api': {
      setDefaultApi(sendResponse);
      return true;
    }
    case 'download-map-set': {
      if (request.mapSetId) {
        getMirrorDownloadLink(sendResponse, request.mapSetId);
      } else {
        sendResponse({ success: false, message: 'missing mapSetId' });
      }
      return true;
    }
    case 'get-current-api': {
      getCurrentApi(sendResponse);
      return true;
    }
    case 'set-current-api': {
      if (request.osuMirrorName) {
        setCurrentApi(sendResponse, request.osuMirrorName);
      } else {
        sendResponse({ success: false, message: 'missing osuMirrorName' });
      }
      return true;
    }
    default: {
      console.error('unknown action');
      sendResponse({ success: false, message: 'unknown action' });
    }
  };
});