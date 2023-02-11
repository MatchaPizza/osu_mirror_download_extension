/**
 * Joak's osu beatmap download extension LULE
 */

var loading = false;

console.log('Joak\'s osu mirror beatmap download extension');
console.log('--- joak_extension.js loaded ---');

// get current url pattern
const url = document.URL;
const mapSetId = url.split("#")[0].split('/').pop();
const mapId = url.split('/').pop();

// get local storage - default api
let endpoint = localStorage.getItem('default-osu-api');
if (!endpoint) {
  endpoint = 'https://kitsu.moe/api';
}
console.log('api endpoint:', endpoint);

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

// main
(async () => {
  try {
    // check endpoint status
    let res = await fetchWithTimeout(`${endpoint}/status`);

    // construct element if api is running
    const rootElement = document.documentElement;
    if (res.status === 200) {
      const downloadButton = document.createElement('div');
      downloadButton.className = "joak-download-button";
      downloadButton.innerHTML = 'Mirror Download';
      // TODO support others i guess
      downloadButton.addEventListener('click', downloadMapSetKitsu);
      rootElement.appendChild(downloadButton);
    } else {
      console.error(`endpoint [${endpoint}] is not running at the moment`);
    }
  } catch (err) {
    console.error('unable to get status from endpoint:', endpoint);
  }
})();

// TODO download map from api
const downloadMapSetKitsu = async () => {
  if (!loading) {
    loading = true;

    // update button icon
    const button = document.getElementsByClassName('joak-download-button')[0];
    if (button) {
      button.className = 'joak-download-button clicked';
    }

    // check beatmap status
    try {
      let res = await fetch(`${endpoint}/s/${mapSetId}`);
      switch (res.status) {
        case 200: {
          const resBody = await res.json();
          if (resBody.DownloadUnavailable === false) {
            window.open(`${endpoint}/d/${mapSetId}`);
          } else {
            alert('beatmap is unavailable from this api');
          }
          break;
        }
        case 429: {
          alert('too many downloads');
          break;
        }
        default: {
          alert('map not found ¯\\_(ツ)_/¯');
        }
      }
    } catch (err) {
      alert('unable to get beatmap status from endpoint');
    } finally {
      if (button) {
        button.className = 'joak-download-button';
      }
      loading = false;
    }
  }
};
