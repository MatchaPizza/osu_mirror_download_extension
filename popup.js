/**
 * Popup
 */

const API_LIST = [
  {
    osuMirrorKey: 'kitsu',
    osuMirrorName: 'Kitsu',
    osuMirrorEndpoint: 'https://kitsu.moe/api'
  },
  {
    osuMirrorKey: 'chimu',
    osuMirrorName: 'Chimu',
    osuMirrorEndpoint: 'https://api.chimu.moe/v1'
  },
  {
    osuMirrorKey: 'nerinyan',
    osuMirrorName: 'Nerinyan [unstable]',
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
    apiSelect.appendChild(option)
  }

  // get current api from storage
  chrome.storage.sync.get('osuMirrorName').then((result) => {
    if (result.osuMirrorName) {
      apiSelect.value = result.osuMirrorName;
    }
  });

  // add event listener to button
  const button = document.getElementById('change-api-button')
  button.addEventListener('click', () => {
    const index = API_LIST.findIndex((element) => element.osuMirrorName === apiSelect.value);
    if (index !== -1) {
      chrome.storage.sync
        .set(API_LIST[index])
        .then(() => {
          window.close();
        })
        .catch((err) => {
          console.error('unknown error', err);
        })
    }
  })
});


