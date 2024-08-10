/**
 * Popup
 */

const API_LIST = [
  {
    osuMirrorKey: 'mino',
    osuMirrorName: 'Mino',
    osuMirrorEndpoint: 'https://catboy.best'
  },
  {
    osuMirrorKey: 'osu_direct',
    osuMirrorName: 'Osu direct',
    osuMirrorEndpoint: 'https://osu.direct'
  },
  {
    osuMirrorKey: 'nerinyan',
    osuMirrorName: 'Nerinyan',
    osuMirrorEndpoint: 'https://api.nerinyan.moe'
  }
]

document.addEventListener('DOMContentLoaded', () => {

  // add api select dropdown
  const apiSelect = document.getElementById('current-api');
  for (let api of API_LIST) {
    const option = document.createElement('option');
    option.value = api.osuMirrorName;
    option.innerHTML = api.osuMirrorName;
    apiSelect.appendChild(option);
  }

  // get current api from storage
  chrome.runtime.sendMessage({ action: 'get-current-api' }, (response) => {
    if (response.success && response.currentApi) {
      apiSelect.value = response.currentApi;
    } else {
      alert('failed to get current api');
    }
  });

  // get current extension version
  chrome.runtime.sendMessage({ action: 'get-current-version' }, (response) => {
    if (response.success && response.version) {
      const currentVersion = document.getElementById('current-version');
      currentVersion.innerHTML = response.version;
    } else {
      alert('failed to get current extension');
    }
  });

  // add event listener to button
  const button = document.getElementById('change-api-button')
  button.addEventListener('click', () => {
    const index = API_LIST.findIndex((element) => element.osuMirrorName === apiSelect.value);
    if (index !== -1) {
      chrome.runtime.sendMessage({ action: 'set-current-api', osuMirrorName: API_LIST[index] }, (response) => {
        if (response.success) {
          window.close();
        } else {
          console.warn('unknown error', response.message);
        }
      });
    }
  })
});
