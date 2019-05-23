chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        timer: {
            hours: 0,
            minutes: 0,
            totalSeconds: 0,
            date: new Date().toDateString()
        }
    }, () => console.log("Timer set to 0:0."));
});

// Declares
let global = {
    block: false,
    blocker: () => ({cancel: true}),
    blocked: false
};
function createNoti() {
    chrome.notifications.create({
        type: "basic",
        iconUrl: "icons8-clock-512-01.png",
        title: chrome.i18n.getMessage("extName"),
        message: chrome.i18n.getMessage("blockMessage")
    });
}

// Get data from local storage
chrome.storage.local.get("timer", ({timer: a}) => {
    for (let b in a) {
        global[b] = a[b];
    }
});

// Reset timer every day
if (global.date !== new Date().toDateString()) {
    global.totalSeconds = (global.hours * 60 * 60) + (global.minutes * 60);
}

// Listen when timer change => change global object
chrome.runtime.onMessage.addListener(() => {
    chrome.storage.local.get("timer", ({timer: a}) => {
        for (let b in a) {
            global[b] = a[b];
        }
    });
});

// Do stuff in every seconds
setInterval(() => {
    console.log(global);
    chrome.storage.local.set({
        timer: {
            hours: global.hours,
            minutes: global.minutes,
            totalSeconds: global.totalSeconds,
            date: global.date
        }
    });
    chrome.browserAction.setBadgeText({
        text: String(Math.floor(global.totalSeconds / 60)) + "m"
    });
    if (global.hours == 0 && global.minutes == 0 && global.block && global.blocked) { // Timer to 0:0 + still blocking -> unblock
        global.block = false;
        global.blocked = false;
        chrome.webRequest.onBeforeRequest.removeListener(global.blocker);
    } else if (global.hours !== 0 || global.minutes !== 0) {
        chrome.tabs.query({}, (a) => {
            let c = a.filter((b) => (b.url.includes("facebook.com") || b.url.includes("messenger.com")));
            if (c.length > 0) {
                if (!global.block && global.totalSeconds > 0) {
                    --global.totalSeconds;
                } else if (global.block && global.totalSeconds > 0) {
                    --global.totalSeconds;
                    global.block = false;
                } else if (global.totalSeconds == 0) {
                    global.block = true;
                }

                if (global.block && global.blocked == false) {
                    global.blocked = true;
                    createNoti();
                    chrome.webRequest.onBeforeRequest.addListener(global.blocker, {urls: ["*://*.facebook.com/*", "*://*.messenger.com/*"], types: ["main_frame"]}, ["blocking"]);
                } else if (!global.block) {
                    global.blocked = false;
                    chrome.webRequest.onBeforeRequest.removeListener(global.blocker);
                }
            }
        });
    }
}, 1000);