// ==UserScript==
// @id             iitc-plugin-display-p8s@Perringaiden
// @name           IITC plugin: Display P8s List on Screen
// @category       Misc
// @version        0.0.7
// @updateURL      https://github.com/perringaiden/iitc-plugins-public/raw/refs/heads/main/iitc-plugin-display-p8s.user.js
// @downloadURL    https://github.com/perringaiden/iitc-plugins-public/raw/refs/heads/main/iitc-plugin-display-p8s.user.js
// @description    Display RES P8s in a list.
// @include        *://*.ingress.com/*
// @match          *://*.ingress.com/*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
    // ensure plugin framework is there, even if iitc is not yet loaded
    if (typeof window.plugin !== 'function') window.plugin = function () { };

    //PLUGIN START ////////////////////////////////////////////////////////

    //use own namespace for plugin
    window.plugin.showeight = function () { };

    var self = window.plugin.showeight;

    self.timestamp = function () {
        var now = new Date();
        return now.getFullYear() +
            '-' + zeroPad(now.getMonth() + 1, 2) +
            '-' + zeroPad(now.getDate(), 2) +
            ' ' + zeroPad(now.getHours(), 2) +
            '.' + zeroPad(now.getMinutes(), 2) +
            '.' + zeroPad(now.getSeconds(), 2);
    };

    self.teamName = function (team) {
        switch (team) {
            case TEAM_RES: { return 'RES'; }
            case TEAM_ENL: { return 'ENL'; }
        }
    };

    self.saveFile = function (data, extension, file) {
        var blob = new Blob([data], { type: 'application/octet-stream' });
        var url = window.URL.createObjectURL(blob);

        // create an anchor and insert it into the document
        var a = $('<a>')[0];
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = url;
        a.download = file + '-' + self.timestamp() + '.' + extension;

        // click it
        a.click();
    };

    self.doCSVDump = function () {
        var displayBounds = map.getBounds();

        var portals = "Name,Intel,Map Link\r\n";

        $.each(window.portals, function (i, portal) {
            // Only display portals that fall within the displayed view.
            if (!displayBounds.contains(portal.getLatLng())) return true;

            var d = portal.options.data;

            if (getTeam(d) == TEAM_RES) {
                if (d.level == 8) {

                    var portalName = '"' + escapeJavascriptString(d.title) + '"';

                    var googleMapLink = '"https://maps.google.com/maps?ll=' + d.latE6 / 1E6 + ',' + d.lngE6 / 1E6 + '&q=' + d.latE6 / 1E6 + ',' + d.lngE6 / 1E6 + '"';
                    var intelLink = '"https://www.ingress.com/intel?z=17&ll=' + d.latE6 / 1E6 + ',' + d.lngE6 / 1E6 + '&pl=' + d.latE6 / 1E6 + ',' + d.lngE6 / 1E6 + '"';

                    var thisPortal = portalName + ', ' + intelLink + ', ' + googleMapLink;

                    portals += thisPortal + "\r\n";
                }
            }
        });

        self.saveFile(portals, 'csv', 'RES_P8s');
    };

    self.getP8s = function (res, enl) {
        var displayBounds = map.getBounds();
        var rc = [];


        $.each(window.portals, function (i, portal) {
            // If the portal is not within the display bounds, then don't add it.
            if (!displayBounds.contains(portal.getLatLng())) return true;

            var d = portal.options.data;


            if (d.level == 8) {
                var team = getTeam(d);
                var include = false;


                include = (((team == TEAM_RES) && res) || ((team == TEAM_ENL) && enl));

                if ((((team == TEAM_RES) && res) || ((team == TEAM_ENL) && enl))) {
                    rc.push({ team: team, title: d.title, latE6: d.latE6, lngE6: d.lngE6 });
                }
            }

        });

        return rc;
    };

    self.getP8sList = function (res, enl) {
        var output;

        if (res || enl) {
            output = 'P8 List (';

            if (res) {
                output += 'RES';

                if (enl) { output += ', ENL'; }
            } else if (enl) {
                output += 'ENL';
            }

            output += ')';
            debugger;

            var p8s = self.getP8s(res, enl);

            $.each(p8s, function (i, portal) {
                output += '' + escapeJavascriptString(portal.title) + ' (' + self.teamName(portal.team) + ')\r\n';
                output += 'https://www.ingress.com/intel?z=17&ll=' + portal.latE6 / 1E6 + ',' + portal.lngE6 / 1E6 + '&pl=' + portal.latE6 / 1E6 + ',' + portal.lngE6 / 1E6 + '\r\n';
            });
        }

        return output;
    };

    self.displayP8s = function () {
        var displayDialog = '';
        var portalList;
        var title;


        title = "P8s visible on screen";

        portalList = self.getP8sList(true, false);

        displayDialog += '<div>';
        displayDialog += '<p>P8s displayed on screen.</p>';
        displayDialog += '<textarea onClick="this.select();" style="width:96%; height:250px; resize:vertical;" name="P8List" readonly>';
        displayDialog += portalList;
        displayDialog += '</textarea>';
        displayDialog += '';
        displayDialog += '</div>';
        displayDialog += '<p><a onclick="window.plugin.showeight.dumpList()" title="Save to CSV">Save to CSV</a>';

        if (displayDialog !== null) {
            dialog({
                html: displayDialog,
                width: 700,
                title: title
            });
        }
    };

    var setup = function () {
        $('#toolbox').append(' <a onclick="window.plugin.showeight.displayP8s()" title="Show P8s">Show P8s</a>');
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
