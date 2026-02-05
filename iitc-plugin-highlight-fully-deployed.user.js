// ==UserScript==
// @author         Perringaiden
// @name           IITC plugin: Highlight fully deployed portals.
// @category       Highlighter
// @version        0.0.3
// @description    Use the portal fill color to denote if the portal is fully deployed.
// @id             highlight-deployed-portals
// @namespace      https://github.com/IITC-CE/ingress-intel-total-conversion
// @downloadURL    https://github.com/perringaiden/iitc-plugins-public/raw/refs/heads/main/iitc-plugin-highlight-fully-deployed.user.js
// @match          *://*.ingress.com/*
// @include        *://*.ingress.com/*
// @icon           https://iitc.app/extras/plugin-icons/highlight-missing-resonators.svg
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
    // ensure plugin framework is there, even if iitc is not yet loaded
    if (typeof window.plugin !== 'function') window.plugin = function () { };

    var changelog = [
        {
            version: '0.0.3',
            changes: ['Corrected the download URL.']
        },
        {
            version: '0.0.2',
            changes: ['Added team specific coloring.']
        },
        {
            version: '0.0.1',
            changes: ['Initial version, adapted from higlight-portals-missing-resonators.'],
        },
    ];

    // use own namespace for plugin
    window.plugin.highlightFullyDeployed = {};
    var highlightFullyDeployed = window.plugin.highlightFullyDeployed;

    highlightFullyDeployed.styles = {
        oppositionDeployed: {
            fillColor: 'red',
        },
        friendlyDeployed: {
            fillColor: '#FB6FFF',
        },
        partialDeployed: {
            fillColor: 'orange',
        }
    };

    function setDeployedStateFill(data) {
        var playerTeam = window.teamStringToId(window.PLAYER.team);

        if (data.portal.options.team !== window.TEAM_NONE) {
            var res_count = data.portal.options.data.resCount;
            var params;

            if (res_count !== undefined && res_count < 8) {
                var fill_opacity = ((8 - res_count) / 8) * 0.85 + 0.15;
                // Hole per missing resonator
                var dash = new Array(8 - res_count + 1).join('1,4,') + '100,0';

                params = L.extend({}, highlightFullyDeployed.styles.partialDeployed, { fillOpacity: fill_opacity, dashArray: dash });

            }
            else {
                if (data.portal.options.team == playerTeam) {
                    params = L.extend({}, highlightFullyDeployed.styles.friendlyDeployed, { fillOpacity: 0.5 });
                }
                else {
                    params = L.extend({}, highlightFullyDeployed.styles.oppositionDeployed, { fillOpacity: 1.0 });
                }

            }

            data.portal.setStyle(params);
        }
    }

    function setup() {
        window.addPortalHighlighter('Fully Deployed Portals', setDeployedStateFill);
    }

    setup.info = plugin_info; //add the script info data to the function as a property
    if (typeof changelog !== 'undefined') setup.info.changelog = changelog;
    if (!window.bootPlugins) window.bootPlugins = [];
    window.bootPlugins.push(setup);
    // if IITC has already booted, immediately run the 'setup' function
    if (window.iitcLoaded && typeof setup === 'function') setup();

} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('(' + wrapper + ')(' + JSON.stringify(info) + ');'));
(document.body || document.head || document.documentElement).appendChild(script);

