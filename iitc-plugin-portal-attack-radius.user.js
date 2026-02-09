// ==UserScript==
// @id             iitc-plugin-portal-attack-radius@Perringaiden
// @name           IITC plugin: Portal attack Radius
// @category       Misc
// @version        0.0.4
// @updateURL      https://github.com/perringaiden/iitc-plugins-public/raw/refs/heads/main/iitc-plugin-portal-attack-radius.user.js
// @downloadURL    https://github.com/perringaiden/iitc-plugins-public/raw/refs/heads/main/iitc-plugin-portal-attack-radius.user.js
// @description    Defines the area inside which a portal can be attacked by X8s.
// @include        *://*.ingress.com/*
// @match          *://*.ingress.com/*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
    // ensure plugin framework is there, even if iitc is not yet loaded
    if (typeof window.plugin !== 'function') window.plugin = function () { };

    //PLUGIN START ////////////////////////////////////////////////////////

    //use own namespace for plugin
    window.plugin.attackRadius = function () { };

    // Provides a circle object storage array for adding and
    // removing specific circles from layers.  Keyed by GUID.
    window.plugin.attackRadius.portalCircles = {};

    // This is the circle object for the currently selected 
    // portal, which is stored separately on a different layer.
    window.plugin.attackRadius.selectedCircle = null;

    // Minimum map zoom to display circles. Lower (wider)
    // than this and circles are indistinguishable.
    window.plugin.attackRadius.MIN_MAP_ZOOM = 17;

    // Default opacity for the circles.  Can be adjusted in the toolbox.
    window.plugin.attackRadius.opacity = 0.1;

    /**
     * Draw the exclusion circle for a specific portal.
     */
    window.plugin.attackRadius.drawAttackableArea = function (guid) {
        // Gather the location of the portal, and generate a 20m
        // radius red circle centered on the lat/lng of the portal.
        var d = window.portals[guid];
        var coo = d._latlng;
        var latlng = new L.LatLng(coo.lat, coo.lng);

        var optCircle = {
            color: 'red',
            opacity: window.plugin.attackRadius.opacity,
            fillColor: 'gray',
            fillOpacity: 0.0,
            weight: 1,
            interactive: false
        };

        var range = 180; // X8 Range.
        var circle = new L.Circle(latlng, range, optCircle);


        // Add the circle to the circle display layer.
        circle.addTo(window.plugin.attackRadius.circleDisplayLayer);

        // Store a reference to the circle to allow removal.
        window.plugin.attackRadius.portalCircles[guid] = circle;
    }

    /**
     * Removes the exclusion circle for a specific portal.
     */
    window.plugin.attackRadius.removeAttackableArea = function (guid) {
        var previousLayer = window.plugin.attackRadius.portalCircles[guid];


        if (previousLayer) {
            // Remove the circle from the layer.
            window.plugin.attackRadius.circleDisplayLayer.removeLayer(previousLayer);

            // Delete the circle from storage, so we don't build up
            // a big cache, and we don't have complex checking on adds.
            delete window.plugin.attackRadius.portalCircles[guid];
        }
    }

    /**
     * Draw the exclusion circle for the selected portal.
     */
    window.plugin.attackRadius.drawSelectedAttackableArea = function (guid) {
        // Gather the location of the portal, and generate a 20m
        // radius red circle centered on the lat/lng of the portal.
        var d = window.portals[guid];
        var coo = d._latlng;
        var latlng = new L.LatLng(coo.lat, coo.lng);

        var optCircle = {
            color: 'orange',
            opacity: window.plugin.attackRadius.opacity,
            fillColor: 'red',
            fillOpacity: 0.5 * window.plugin.attackRadius.opacity,
            weight: 1,
            interactive: false
        };

        var range = 180; // X8 Range.
        var circle = new L.Circle(latlng, range, optCircle);


        // Add the circle to the circle display layer.
        circle.addTo(window.plugin.attackRadius.selectedDisplayLayer);

        // Store a reference to the circle to allow removal.
        window.plugin.attackRadius.selectedCircle = circle;
    }

    /**
     * Removes the exclusion circle for the selected portal.
     */
    window.plugin.attackRadius.removeSelectedAttackableArea = function () {
        if (window.plugin.attackRadius.selectedCircle) {
            // Remove the circle from the layer.
            window.plugin.attackRadius.selectedDisplayLayer.removeLayer(window.plugin.attackRadius.selectedCircle);

            // Delete the circle from storage, so we don't build up
            // a big cache, and we don't have complex checking on adds.
            delete window.plugin.attackRadius.selectedCircle;
        }
    }

    /**
     * Reacts to a portal being added or removed.
     */
    window.plugin.attackRadius.portalAdded = function (data) {
        data.portal.on('add', function () {
            window.plugin.attackRadius.drawAttackableArea(this.options.guid);
        });

        data.portal.on('remove', function () {
            window.plugin.attackRadius.removeAttackableArea(this.options.guid);
        });
    }

    /**
     * Reacts to a portal being selected or deselected.
     * @param {*} data 
     */
    window.plugin.attackRadius.portalSelected = function () {
        window.plugin.attackRadius.removeSelectedAttackableArea();

        if ((window.selectedPortal != null) && (window.selectedPortal != undefined)) {
            window.plugin.attackRadius.drawSelectedAttackableArea(window.selectedPortal);
        }
    }

    /**
     * Hides or shows the circle display layer as requested.
     */
    window.plugin.attackRadius.showOrHide = function () {

        if (map.getZoom() >= window.plugin.attackRadius.MIN_MAP_ZOOM) {
            // Add the circle layer back to the display layer if necessary, and remove the disabled mark.
            if (!window.plugin.attackRadius.displayLayer.hasLayer(window.plugin.attackRadius.circleDisplayLayer)) {
                window.plugin.attackRadius.displayLayer.addLayer(window.plugin.attackRadius.circleDisplayLayer);
                $('.leaflet-control-layers-list span:contains("Attackable Portal Area")').parent('label').removeClass('disabled').attr('title', '');
            }
        } else {
            // Remove the circle layer from the display layer if necessary, and add the disabled mark.
            if (window.plugin.attackRadius.displayLayer.hasLayer(window.plugin.attackRadius.circleDisplayLayer)) {
                window.plugin.attackRadius.displayLayer.removeLayer(window.plugin.attackRadius.circleDisplayLayer);
                $('.leaflet-control-layers-list span:contains("Attackable Portal Area")').parent('label').addClass('disabled').attr('title', 'Zoom in to show those.');
            }
        };
    }

    /**
     * Adds the toolbox options for the plugin.
     */
    window.plugin.attackRadius.addToolbox = function () {
        let optionTemplate = `
<strong>Opacity: </strong>
<select onchange="window.plugin.attackRadius.attackRadiusOpacitySelect()" id="attackRadiusOpacitySelect">
<option value=1>100%</option>
<option value=0.5>50%</option>
<option value=0.25>25%</option>
<option value=0.1>10%</option>
<option value=0.05>5%</option>
</select>`;

        $('#toolbox').after('<div id="attack-radius-toolbox" style="padding:3px;"></div>');
        $('#attack-radius-toolbox').append(optionTemplate);

        var opacitySelect = document.getElementById("attackRadiusOpacitySelect");
        opacitySelect.options.selectedIndex = 2;
    }

    window.plugin.attackRadius.attackRadiusOpacitySelect = function () {
        var opacitySelect = document.getElementById("attackRadiusOpacitySelect");
        var opacity = opacitySelect.options[opacitySelect.selectedIndex].value;

        window.plugin.attackRadius.opacity = opacity;

        $.each(window.portals, function (i, portal) {
            var guid = portal.options.ent[0];

            window.plugin.attackRadius.removeAttackableArea(guid);
            window.plugin.attackRadius.drawAttackableArea(guid);
        });

        window.plugin.attackRadius.portalSelected();
    }

    /**
      * Setup methods to initialize the plugin.
      */
    var setup = function () {
        // This layer is added to the layer chooser, to be toggled on/off, regardless of zoom.
        window.plugin.attackRadius.displayLayer = new L.LayerGroup();

        // This layer is added into the above layer, and removed from it when we zoom out too far.
        window.plugin.attackRadius.circleDisplayLayer = new L.LayerGroup();

        // This is the layer for the selected portal's attackable area.
        window.plugin.attackRadius.selectedDisplayLayer = new L.LayerGroup();

        // Initially add the circle display layer into base display layer.  We will trigger an assessment below.
        window.plugin.attackRadius.displayLayer.addLayer(window.plugin.attackRadius.circleDisplayLayer);

        // Add the base layer to the main window.
        window.addLayerGroup('Attackable Portal Area', window.plugin.attackRadius.displayLayer, true);

        // Hook the portalAdded event so that we can adjust circles.
        window.addHook('portalAdded', window.plugin.attackRadius.portalAdded);

        // Add the selected portal display layer.
        window.addLayerGroup('Selected Portal Attack Area', window.plugin.attackRadius.selectedDisplayLayer, true);

        // Hook the portalSelected event so that we can adjust circles.
        window.addHook('portalSelected', window.plugin.attackRadius.portalSelected);

        // Add a hook to trigger the showOrHide method when the map finishes zooming.
        map.on('zoomend', window.plugin.attackRadius.showOrHide);

        // Trigger an initial assessment of displaying the circleDisplayLayer.
        window.plugin.attackRadius.showOrHide();

        window.plugin.attackRadius.addToolbox();
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
