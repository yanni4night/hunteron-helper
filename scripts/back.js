/**
 * Copyright (C) 2014 yanni4night.com
 * back.js
 *
 * changelog
 * 2015-12-21[23:58:19]:revised
 *
 * @author yanni4night@gmail.com
 * @version 0.1.0
 * @since 0.1.0
 */
chrome.browserAction.onClicked.addListener(function () {
    chrome.tabs.create({
        url: 'popup.html'
    });
});