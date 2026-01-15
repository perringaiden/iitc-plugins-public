// ==UserScript==
// @id             iitc-plugin-portal-submission-radius@Perringaiden
// @name           IITC plugin: Portal Submission Radius
// @category       Misc
// @version        0.0.4
// @updateURL      https://github.com/perringaiden/iitc-plugins-public/raw/refs/heads/master/iitc-plugin-portal-submission-radius.user.js
// @downloadURL    https://github.com/perringaiden/iitc-plugins-public/raw/refs/heads/master/iitc-plugin-portal-submission-radius.user.js
// @description    Defines the area inside which a portal submission is too close to another portal.
// @include        *://*.ingress.com/*
// @match          *://*.ingress.com/*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
    // ensure plugin framework is there, even if iitc is not yet loaded
    if (typeof window.plugin !== 'function') window.plugin = function () { };

    //PLUGIN START ////////////////////////////////////////////////////////

    //use own namespace for plugin
    window.plugin.submissionRadius = function () { };

    // Provides a circle object storage array for adding and
    // removing specific circles from layers.  Keyed by GUID.
    window.plugin.submissionRadius.portalCircles = {};

    // Minimum map zoom to display circles. Lower (wider)
    // than this and circles are indistinguishable.
    window.plugin.submissionRadius.MIN_MAP_ZOOM = 17;

    /**
     * Draw the exclusion circle for a specific portal.
     */
    window.plugin.submissionRadius.drawPortalExclusion = function (guid) {
        // Gather the location of the portal, and generate a 20m
        // radius red circle centered on the lat/lng of the portal.
        var d = window.portals[guid];
        var coo = d._latlng;
        var latlng = new L.LatLng(coo.lat, coo.lng);
        var optCircle = { color: 'red', opacity: 0.7, fillColor: 'red', fillOpacity: 0.1, weight: 1, clickable: false };
        var range = 20;
        var circle = new L.Circle(latlng, range, optCircle);


        // Add the circle to the circle display layer.
        circle.addTo(window.plugin.submissionRadius.circleDisplayLayer);

        // Store a reference to the circle to allow removal.
        window.plugin.submissionRadius.portalCircles[guid] = circle;
    }

    /**
     * Removes the exclusion circle for a specific portal.
     */
    window.plugin.submissionRadius.removePortalExclusion = function (guid) {
        var previousLayer = window.plugin.submissionRadius.portalCircles[guid];


        if (previousLayer) {
            // Remove the circle from the layer.
            window.plugin.submissionRadius.circleDisplayLayer.removeLayer(previousLayer);

            // Delete the circle from storage, so we don't build up
            // a big cache, and we don't have complex checking on adds.
            delete window.plugin.submissionRadius.portalCircles[guid];
        }
    }

    /**
     * Reacts to a portal being added or removed.
     */
    window.plugin.submissionRadius.portalAdded = function (data) {
        data.portal.on('add', function () {
            window.plugin.submissionRadius.drawPortalExclusion(this.options.guid);
        });

        data.portal.on('remove', function () {
            window.plugin.submissionRadius.removePortalExclusion(this.options.guid);
        });
    }

    /**
     * Hides or shows the circle display layer as requested.
     */
    window.plugin.submissionRadius.showOrHide = function () {

        if (map.getZoom() >= window.plugin.submissionRadius.MIN_MAP_ZOOM) {
            // Add the circle layer back to the display layer if necessary, and remove the disabled mark.
            if (!window.plugin.submissionRadius.displayLayer.hasLayer(window.plugin.submissionRadius.circleDisplayLayer)) {
                window.plugin.submissionRadius.displayLayer.addLayer(window.plugin.submissionRadius.circleDisplayLayer);
                $('.leaflet-control-layers-list span:contains("Submission Exclusion Area")').parent('label').removeClass('disabled').attr('title', '');
            }
        } else {
            // Remove the circle layer from the display layer if necessary, and add the disabled mark.
            if (window.plugin.submissionRadius.displayLayer.hasLayer(window.plugin.submissionRadius.circleDisplayLayer)) {
                window.plugin.submissionRadius.displayLayer.removeLayer(window.plugin.submissionRadius.circleDisplayLayer);
                $('.leaflet-control-layers-list span:contains("Submission Exclusion Area")').parent('label').addClass('disabled').attr('title', 'Zoom in to show those.');
            }
        };
    }

    /**
      * Setup methods to initialize the plugin.
      */
    var setup = function () {
        // This layer is added to the layer chooser, to be toggled on/off, regardless of zoom.
        window.plugin.submissionRadius.displayLayer = new L.LayerGroup();

        // This layer is added into the above layer, and removed from it when we zoom out too far.
        window.plugin.submissionRadius.circleDisplayLayer = new L.LayerGroup();

        // Initially add the circle display layer into base display layer.  We will trigger an assessment below.
        window.plugin.submissionRadius.displayLayer.addLayer(window.plugin.submissionRadius.circleDisplayLayer);

        // Add the base layer to the main window.
        window.addLayerGroup('Submission Exclusion Area', window.plugin.submissionRadius.displayLayer, true);

        // Hook the portalAdded event so that we can adjust circles.
        window.addHook('portalAdded', window.plugin.submissionRadius.portalAdded);

        // Add a hook to trigger the showOrHide method when the map finishes zooming.
        map.on('zoomend', window.plugin.submissionRadius.showOrHide);

        // Trigger an initial assessment of displaying the circleDisplayLayer.
        window.plugin.submissionRadius.showOrHide();
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
