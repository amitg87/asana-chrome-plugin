

function getString(){
    "use strict";
    // Be polite to Asana API and tell them who we are.
    var manifest = chrome.runtime.getManifest();
    var client_name = [
        "chrome-extension",
        chrome.i18n.getMessage("@@extension_id"),
        manifest.version,
        manifest.name
    ].join(":");

}