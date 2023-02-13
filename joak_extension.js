/**
 * Joak's osu beatmap download extension LULE
 */

var loading = false;

console.log('Osu mirror download extension');
console.log('--- joak_extension.js loaded ---');

// get current url pattern
const url = document.URL;
const mapSetId = url.split("#")[0].split('/').pop();
const mapId = url.split('/').pop();

// get and set default api from storage
chrome.runtime.sendMessage({ action: 'set-default-api' }, (response) => {
  if (!response.success) console.error('failed to set default api');
});

const downloadMapSet = async () => {
  if (!loading) {
    loading = true;

    // update button icon
    const button = document.getElementsByClassName('joak-download-button')[0];
    if (button) button.className = 'joak-download-button clicked';

    chrome.runtime.sendMessage({ action: 'download-map-set', mapSetId }, (response) => {
      if (response.success && response.downloadLink) {
        window.open(response.downloadLink);
      } else {
        alert(response.message ? response.message + '\nmaybe switch to other API to download this map 🙂' : 'unknown error');
      }
      if (button) button.className = 'joak-download-button';
      loading = false;
    })
  }
}

// main
(() => {
  // construct element if api is running
  const rootElement = document.documentElement;

  // download button
  const downloadButton = document.createElement('div');
  downloadButton.className = "joak-download-button";
  downloadButton.innerHTML = 'Mirror Download';
  downloadButton.addEventListener('click', downloadMapSet);
  rootElement.appendChild(downloadButton);
})();
