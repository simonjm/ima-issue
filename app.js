let adsLoaded = false;
let adDisplayContainer;
let adsLoader;
let adsManager;
let isAdStarted = false;
let isAdPlaying = false;

const videoEl = document.querySelector('.video-player > video');
const playBtn = document.getElementById('playPauseBtn');
videoEl.addEventListener('play', () => playBtn.textContent = 'Pause');
videoEl.addEventListener('pause', () => playBtn.textContent = 'Play');
playBtn.addEventListener('click', (evt) => {
    if (isAdStarted) {
        if (isAdPlaying) {
            adsManager.pause();
        }
        else {
            adsManager.resume();
        }
    }
    else {
        if (videoEl.paused) {
            handleVideoPlay(evt);
        }
        else {
            videoEl.pause();
        }
    }
});

function handleVideoPlay(evt) {
    if (adsLoaded) {
        videoEl.play();
        return;
    }
    adsLoaded = true;
    evt.preventDefault();

    videoEl.load();        
    adDisplayContainer.initialize();
      
    const videoContainer = document.querySelector('.video-player');
    const width = videoContainer.clientWidth;
    const height = videoContainer.clientHeight;
    try {
        adsManager.init(width, height, google.ima.ViewMode.NORMAL);
        adsManager.start();
    } catch (adError) {
        // Play the video without ads, if an error occurs
        console.log("AdsManager could not be started");
        videoEl.play();
    }
}

function initIMA() {
    adDisplayContainer = new google.ima.AdDisplayContainer(document.getElementById('adContainer'), videoEl);
    adsLoader = new google.ima.AdsLoader(adDisplayContainer);
    adsLoader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, handleAdsManagerLoaded, false)
    adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, handleAdError, false);

    videoEl.addEventListener('ended', () => adsLoader.contentComplete());

    const adsRequest = new google.ima.AdsRequest();
    adsRequest.adTagUrl = 'https://pubads.g.doubleclick.net/gampad/ads?' +
    'sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&' +
    'impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&' +
    'cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator=';

    const videoContainer = document.querySelector('.video-player');
    adsRequest.linearAdSlotWidth = videoContainer.clientWidth;
    adsRequest.linearAdSlotHeight = videoContainer.clientHeight;
    adsRequest.nonLinearAdSlotWidth = videoContainer.clientWidth;
    adsRequest.nonLinearAdSlotHeight = videoContainer.clientHeight / 3;

    adsLoader.requestAds(adsRequest);
}

function handleAdsManagerLoaded(evt) {
    const adsRenderingSettings = new google.ima.AdsRenderingSettings();
    adsRenderingSettings.loadVideoTimeout = 5000;
    adsRenderingSettings.mimeTypes = ['video/mp4'];
    adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
    adsRenderingSettings.uiElements = [google.ima.UiElements.AD_ATTRIBUTION];

    adsManager = evt.getAdsManager(videoEl, adsRenderingSettings);
    adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, handleAdError);
    adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, () => videoEl.pause());
    adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, () => videoEl.play());
    adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, () => { 
        isAdPlaying = true;
        isAdStarted = true;
        playBtn.textContent = 'Pause';
    });
    adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, () => {
        isAdPlaying = false;
        isAdStarted = false;
        playBtn.textContent = 'Play';
    });
    adsManager.addEventListener(google.ima.AdEvent.Type.PAUSED, () => {
        isAdPlaying = false;
        playBtn.textContent = 'Play';
    });
    adsManager.addEventListener(google.ima.AdEvent.Type.RESUMED, () => {
        isAdPlaying = true;
        playBtn.textContent = 'Pause';
    });

    for (const eventType of Object.keys(google.ima.AdEvent.Type)) {
        adsManager.addEventListener(google.ima.AdEvent.Type[eventType], e => console.log(`IMA AdEvent ${eventType}: `, e));
    }
}

function handleAdError(evt) {
    console.log(evt.getError());
    if (adsManager) {
        adsManager.destroy();
    }
}

initIMA();