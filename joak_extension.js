/**
 * Joak's osu beatmap download extension LULE
 */

var loading = false;
var snackbarActive = false;
var snackbarTimeoutId;

console.log('Osu mirror download extension');
console.log('--- joak_extension.js loaded ---');

// get current url pattern
const url = document.URL;
const mapSetId = url.split("#")[0].split('/').pop();
const mapId = url.split('/').pop();

// get and set default api from storage
chrome.runtime.sendMessage({ action: 'set-default-api' }, (response) => {
  if (!response.success) console.warn('failed to set default api');
});

// open snackbar
const openSnackbar = (message = '') => {
  if (snackbarActive) return;
  snackbarActive = true;

  const snackbarText = document.getElementById('snackbar-message');
  if (snackbarText) snackbarText.innerHTML = message;

  const snackbar = document.getElementsByClassName('joak-download-snackbar')[0];
  if (snackbar) snackbar.style.display = 'block';

  snackbarTimeoutId = setTimeout(() => closeSnackbar(), 3000);
}

// close snackbar
const closeSnackbar = () => {
  if (!snackbarActive) return;
  snackbarActive = false;
  clearTimeout(snackbarTimeoutId);

  const snackbar = document.getElementsByClassName('joak-download-snackbar')[0];
  if (snackbar) {
    snackbar.style.display = 'none';
  }

  const button = document.getElementsByClassName('joak-download-button')[0];
  if (button) button.className = 'joak-download-button';
  loading = false;
}

// download map set
const downloadMapSet = async () => {
  if (!loading) {
    loading = true;

    // update button icon
    const button = document.getElementsByClassName('joak-download-button')[0];
    if (button) button.className = 'joak-download-button clicked';

    chrome.runtime.sendMessage({ action: 'download-map-set', mapSetId }, (response) => {
      if (response.success && response.downloadLink) {
        window.open(response.downloadLink);
        if (button) button.className = 'joak-download-button';
        loading = false;
      } else {
        // alert(response.message ? response.message + '\nmaybe switch to other API to download this map 🙂' : 'unknown error');
        openSnackbar(response.message ?? 'unknown error');
      }
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

  // snackbar
  const snackbar = document.createElement('div');
  snackbar.className = 'joak-download-snackbar';
  snackbar.addEventListener('click', closeSnackbar);
  const snackbarText = document.createElement('p');
  snackbarText.id = 'snackbar-message';
  snackbar.appendChild(snackbarText);
  const secondarySnackbarText = document.createElement('p');
  secondarySnackbarText.innerHTML = 'maybe switch to other API to download this map 🙂';
  snackbar.appendChild(secondarySnackbarText);
  rootElement.appendChild(snackbar);
})();
