// ==UserScript==
// @id             iitc-plugin-recharge-high@Perringaiden
// @name           IITC plugin: High Level Portals needing recharge.
// @category       Misc
// @version        0.0.2
// @updateURL      https://github.com/perringaiden/iitc-plugins-public/raw/refs/heads/main/iitc-plugin-recharge-high.user.js
// @downloadURL    https://github.com/perringaiden/iitc-plugins-public/raw/refs/heads/main/iitc-plugin-recharge-high.user.js
// @description    Filters for identifying high level portals that are below a specific level of charge.
// @include        *://*.ingress.com/*
// @match          *://*.ingress.com/*
// @grant          none
// @author         Perringaiden
// @icon           https://iitc.app/extras/plugin-icons/highlight-needs-recharge.svg
// ==/UserScript==

function wrapper(plugin_info) {
    // ensure plugin framework is there, even if iitc is not yet loaded
    if (typeof window.plugin !== 'function') window.plugin = function () { };

    //PLUGIN START ////////////////////////////////////////////////////////

    //use own namespace for plugin
    window.plugin.wolfRecharge = function () { };

    var self = window.plugin.wolfRecharge;

    var changelog = [
        {
            version: '0.0.1',
            changes: ['Initial Version'],
        },
    ];

    window.plugin.wolfRecharge.highlighterHighLevelLowCharge = function (data) {
        var portalData = data.portal.options.data;
        var health = portalData.health;
        var playerTeam = window.teamStringToId(window.PLAYER.team);
        var portalTeam = data.portal.options.team;
        var portalLevel = data.portal.options.data.level;
        var scale = window.portalMarkerScale;

        var style = {};

        style.opacity = 1.0;
        style.fillOpacity = 1.0;

        if ((health !== undefined) && (portalTeam == playerTeam) && (health < 70) && (portalLevel > 6)) {
            // Set the High Level Portal colour.
            if (portalLevel == 8) {
                style.fillColor = 'magenta';
            } else {
                style.fillColor = 'red';
            }
            // Set the size to emphasize lower portals.
            if (health > 40) {
                style.radius = scale * 0.5;
            } else if (health > 20) {
                style.radius = scale * L.PortalMarker.LEVEL_TO_RADIUS[portalLevel] * 1;

            } else {
                style.radius = scale * L.PortalMarker.LEVEL_TO_RADIUS[portalLevel] * 1.5;
            }

        } else {
            // Hide the portal.
            style.radius = 0.1;
        }

        data.portal.setStyle(style);

    };

    var setup = function () {
        window.addPortalHighlighter('High Level Low Charge', window.plugin.wolfRecharge.highlighterHighLevelLowCharge);
    };

    setup.info = plugin_info; //add the script info data to the function as a property

    if (!window.bootPlugins) window.bootPlugins = [];
    window.bootPlugins.push(setup);

    // if IITC has already booted, immediately run the 'setup' function
    if (window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end

//PLUGIN END ////////////////////////////////////////////////////////

var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('(' + wrapper + ')(' + JSON.stringify(info) + ');'));
(document.body || document.head || document.documentElement).appendChild(script);