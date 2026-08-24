// ==UserScript==
// @id             iitc-plugin-recharge-high@Perringaiden
// @name           IITC plugin: High Level Portals needing recharge.
// @category       Misc
// @version        0.0.4
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
            changes: ['Initial Version']
        },
        {
            version: '0.0.3',
            changes: ['Updated highlighting logic']
        },
        {
            version: '0.0.4',
            changes: ['Added the display of the list of high level low charge portals to the dialog box.']
        }
    ];

    self.highlighterHighLevelLowCharge = function (data) {
        var portalData = data.portal.options.data;
        var health = portalData.health;
        var portalLevel = portalData.level;
        var scale = window.portalMarkerScale();

        var style = {};

        style.opacity = 1.0;
        style.fillOpacity = 1.0;

        if (self.shouldHighlightHighLevelLowCharge(data.portal)) {
            // Set the High Level Portal colour.
            if (portalLevel == 8) {
                style.fillColor = 'magenta';
            } else {
                style.fillColor = 'red';
            }
            // Set the size to emphasize lower portals.
            if (health > 40) {
                style.radius = scale * L.PortalMarker.LEVEL_TO_RADIUS[portalLevel] * 0.75;

            } else if (health > 20) {
                style.radius = scale * L.PortalMarker.LEVEL_TO_RADIUS[portalLevel] * 1.25;

            } else {
                style.radius = scale * L.PortalMarker.LEVEL_TO_RADIUS[portalLevel] * 2;
            }

        } else {
            // Hide the portal.
            style.radius = 0.1;
        }

        data.portal.setStyle(style);

    };

    self.shouldHighlightHighLevelLowCharge = function (portal) {
        var portalData = portal.options.data;
        var health = portalData.health;
        var playerTeam = window.teamStringToId(window.PLAYER.team);
        var portalTeam = portal.options.team;
        var portalLevel = portalData.level;

        if ((health !== undefined) && (portalTeam == playerTeam) && (health < 70) && (portalLevel > 6)) {
            return true;
        } else {
            return false;
        }
    };

    self.showHighLevelLowCharge = function () {
        var displayDialog = '';
        var portalList;
        var title;


        title = "High Level Portals Needing Recharge";

        portalList = self.getHighLevelLowChargePortals();

        displayDialog += '<div>';
        displayDialog += '<textarea onClick="this.select();" style="width:96%; height:250px; resize:vertical;" name="RechargePortalList" readonly>';
        displayDialog += portalList;
        displayDialog += '</textarea>';
        displayDialog += '';
        displayDialog += '</div>';

        if (displayDialog !== null) {
            dialog({
                html: displayDialog,
                width: 700,
                title: title
            });
        }
    };

    self.getHighLevelLowChargePortals = function () {
        var rc = "";

        $.each(window.portals, function (i, portal) {
            if (self.shouldHighlightHighLevelLowCharge(portal)) {
                var portalData = portal.options.data;

                if (portalData.health <= 40) {
                    rc += ":rotating_light: ";
                }

                rc += portalData.title + " (P" + portalData.level + ", " + portalData.health + "%) : "
                rc += '<https://www.ingress.com/intel?z=17&ll=' + portalData.latE6 / 1E6 + ',' + portalData.lngE6 / 1E6 + '&pl=' + portalData.latE6 / 1E6 + ',' + portalData.lngE6 / 1E6 + '>\n';
            }
        });

        return rc;
    };

    var setup = function () {
        window.addPortalHighlighter('High Level Low Charge', self.highlighterHighLevelLowCharge);
        $('#toolbox').append(' <a onclick="window.plugin.wolfRecharge.showHighLevelLowCharge()" title="Show Low Charge Portals">Show Low Charge Portals</a>');
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