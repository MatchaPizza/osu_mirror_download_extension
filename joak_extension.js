/**
 * Joak's osu beatmap download extension LULE
 */

var loading = false;
var snackbarActive = false;
var snackbarTimeoutId;

console.debug('Osu mirror download extension');
console.debug('--- joak_extension.js loaded ---');

// get and set default api from storage
chrome.runtime.sendMessage({ action: 'set-default-api' }, (response) => {
  if (!response.success) console.warn('failed to set default api');
});

// click the download button
const clickDownloadButton = (click = true) => {
  const button = document.getElementsByClassName('joak-download-button')[0];
  if (!button) return;
  if (click) {
    button.className = 'joak-download-button clicked';
  } else {
    button.className = 'joak-download-button';
  }
}

// open snackbar
const openSnackbar = (message = '', level = 'normal', delay = 3000) => {
  if (snackbarActive) return;
  snackbarActive = true;

  const snackbarText = document.getElementById('snackbar-message');
  if (snackbarText) snackbarText.innerHTML = message;

  const secondarySnackbarText = document.getElementById('snackbar-secondary-message');
  switch (level) {
    case 'normal': {
      secondarySnackbarText.innerHTML = '🙂';
      break;
    }
    case 'error': {
      secondarySnackbarText.innerHTML = 'maybe switch to other API to download this map 🙂';
      break;
    }
  }

  const snackbar = document.getElementsByClassName('joak-download-snackbar')[0];
  if (snackbar) snackbar.style.display = 'block';

  snackbarTimeoutId = setTimeout(closeSnackbar, delay);
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

  clickDownloadButton(false);
  loading = false;
}

// download map set
const downloadMapSet = async () => {
  const url = document.URL;

  if (!url.match("https://osu.ppy.sh/beatmapsets/.*")) {
    loading = true;
    clickDownloadButton(true);
    openSnackbar('try not press this outside beatmap page', 'normal', 1000);
  } else if (!loading) {
    loading = true;
    const mapSetId = url.split("#")[0].split('/').pop();

    clickDownloadButton(true);
    chrome.runtime.sendMessage({ action: 'download-map-set', mapSetId }, (response) => {
      if (response.success && response.downloadLink) {
        window.open(response.downloadLink);
        clickDownloadButton(false);
        loading = false;
      } else {
        openSnackbar(response.message ?? 'unknown error', 'error');
      }
    })
  }
}

// download via beatconnect
const openBeatconnect = async () => {
  const url = document.URL;

  if (!url.match("https://osu.ppy.sh/beatmapsets/.*")) {
    openSnackbar('try not press this outside beatmap page', 'normal', 1000);
  } else {
    const mapSetId = url.split("#")[0].split('/').pop();
    window.open(`https://beatconnect.io/b/${mapSetId}`);
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

  // beatconnect button
  const beatconnectDownloadButton = document.createElement('div');
  beatconnectDownloadButton.className = "beatconnect-link-button";
  beatconnectDownloadButton.innerHTML = 'Beatconnect Link';
  beatconnectDownloadButton.addEventListener('click', openBeatconnect);
  rootElement.appendChild(beatconnectDownloadButton);

  // snackbar
  const snackbar = document.createElement('div');
  snackbar.className = 'joak-download-snackbar';
  snackbar.addEventListener('click', closeSnackbar);
  const snackbarText = document.createElement('p');
  snackbarText.id = 'snackbar-message';
  snackbar.appendChild(snackbarText);
  const secondarySnackbarText = document.createElement('p');
  secondarySnackbarText.id = 'snackbar-secondary-message';
  snackbar.appendChild(secondarySnackbarText);
  rootElement.appendChild(snackbar);
})();
