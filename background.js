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
    case 429: {
      sendResponse({ success: false, message: 'too many downloads' });
      break;
    }
    default: {
      sendResponse({ success: false, message: 'map not found ¯\\_(ツ)_/¯' });
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
    default: {
      sendResponse({ success: false, message: 'map not found ¯\\_(ツ)_/¯' });
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
    default: {
      sendResponse({ success: false, message: 'map not found ¯\\_(ツ)_/¯' });
    }
  }
}

// get mirror download link
const getMirrorDownloadLink = async (sendResponse, mapSetId) => {
  try {
    // get default api endpoint
    const { osuMirrorEndpoint, osuMirrorKey } = await getEndpoint();
    switch (osuMirrorKey) {
      case 'kitsu': {
        console.log('downloading map set from kitsu ...');
        await getKitsuDownloadLink(sendResponse, osuMirrorEndpoint, mapSetId);
        break;
      }
      case 'chimu': {
        console.log('downloading map set from chimu ...');
        await getChimuDownloadLink(sendResponse, osuMirrorEndpoint, mapSetId);
        break;
      }
      case 'nerinyan': {
        console.log('downloading map set from nerinyan ...');
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
    default: {
      console.error('unknown action');
      sendResponse({ success: false, message: 'unknown action' });
    }
  };
});