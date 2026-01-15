// ==UserScript==
// @id             iitc-plugin-bookmarkextras@Perringaiden
// @name           IITC plugin: Bookmark Extras
// @category       Misc
// @version        0.0.9
// @updateURL      https://github.com/perringaiden/iitc-plugins-public/raw/refs/heads/master/iitc-plugin-bookmark-extras.user.js
// @downloadURL    https://github.com/perringaiden/iitc-plugins-public/raw/refs/heads/master/iitc-plugin-bookmark-extras.user.js
// @description    Extra tools for use with Bookmarks
// @include        *://*.ingress.com/*
// @match          *://*.ingress.com/*
// @grant          none
// @author         Perringaiden
// ==/UserScript==

function wrapper(plugin_info) {
    // ensure plugin framework is there, even if iitc is not yet loaded
    if (typeof window.plugin !== 'function') window.plugin = function () { };

    //PLUGIN START ////////////////////////////////////////////////////////

    //use own namespace for plugin
    window.plugin.bookmarkextras = function () { };

    var self = window.plugin.bookmarkextras;

    // CSS setup
    window.plugin.bookmarkextras.setupCSS = function () {
        //$('<style>').prop('type', 'text/css').html()
    };

    window.plugin.bookmarkextras.onPortalDetailsUpdated = function () {
        //$('.folderlist').remove();
        if (window.selectedPortal === null) return;

        //'<div id="bookmarkextras_folder_list" style="text-align:center"></div>');
        self.createBookmarkFolderList();
    };

    window.plugin.bookmarkextras.createBookmarkFolderList = function () {
        $('#portaldetails').append('<div id="bookmarkextras_folder_div" style="text-align:center"><br>Bkmrk Fldr: <select id="bookmarkextras_folder_list"></select> <button type="button" onclick="window.plugin.bookmarkextras.moveSelectedPortal()">Go</button><br></div>');

        var listElement = window.document.getElementById("bookmarkextras_folder_list");
        var portalFolder = 0;


        if (localStorage[window.plugin.bookmarks.KEY_STORAGE].search(window.selectedPortal) != -1) {
            var bkmrkData = window.plugin.bookmarks.findByGuid(window.selectedPortal);

            if (bkmrkData) {
                portalFolder = bkmrkData.id_folder;
            }
        }

        var list = window.plugin.bookmarks.bkmrksObj.portals;
        var foundFolder = false;


        for (var idFolders in list) {
            var folders = list[idFolders];
            var active = '';
            var folderName = folders.label;
            var opt;


            opt = window.document.createElement('option');
            opt.className = 'ui-state-default';
            opt.id = 'bookmarkextras_folder_list_' + idFolders;
            opt.value = idFolders;
            opt.innerHTML = folderName;

            if (idFolders == portalFolder) {
                opt.selected = true;
                foundFolder = true;
            }

            listElement.appendChild(opt);
        }

        var optNone = window.document.createElement('option');


        optNone.className = 'ui-state-default';
        optNone.id = 'bookmarkextras_folder_list_none';
        optNone.value = 0;
        optNone.innerHTML = 'Not bookmarked';

        if (!foundFolder) {
            optNone.selected = true;
            foundFolder = true;
        }

        listElement.appendChild(optNone);
    };

    window.plugin.bookmarkextras.moveSelectedPortal = function () {
        var selectedFolder;


        selectedFolder = $('#bookmarkextras_folder_list').val();

        if (selectedFolder === 0) {
            // Delete the bookmark.
            self.removePortal(window.selectedPortal);
        } else {
            // Move the portal.
            self.movePortal(window.selectedPortal, selectedFolder);
        }
    };

    window.plugin.bookmarkextras.movePortal = function (guid, newFolder) {
        // If we didn't get a folder, or we didn't get a portal, return.
        if ((newFolder === null) || (guid === 0)) {
            return;
        }

        var bkmrkData = window.plugin.bookmarks.findByGuid(guid);
        var list = window.plugin.bookmarks.bkmrksObj.portals;
        var label;
        var latlng;
        var bookmarkID;

        if (bkmrkData !== undefined) {

            delete list[bkmrkData.id_folder]['bkmrk'][bkmrkData.id_bookmark];
            $('.bkmrk#' + bkmrkData.id_bookmark + '').remove();

            window.plugin.bookmarks.saveStorage();
            window.plugin.bookmarks.refreshBkmrks();

            window.runHooks('pluginBkmrksEdit', { "target": "portal", "action": "remove", "folder": bkmrkData.id_folder, "id": bkmrkData.id_bookmark, "guid": guid });

            bookmarkID = bkmrkData.id_bookmark;
        } else {
            bookmarkID = window.plugin.bookmarks.generateID();
        }

        var p = window.portals[guid];
        var ll = p.getLatLng();

        latlng = ll.lat + ',' + ll.lng;
        label = p.options.data.title;

        window.plugin.bookmarks.bkmrksObj['portals'][newFolder]['bkmrk'][bookmarkID] = { "guid": guid, "latlng": latlng, "label": label };

        window.plugin.bookmarks.saveStorage();
        window.plugin.bookmarks.refreshBkmrks();
        window.runHooks('pluginBkmrksEdit', { "target": "portal", "action": "add", "id": bookmarkID, "guid": guid });
    };

    window.plugin.bookmarkextras.removePortal = function (guid) {
        var bkmrkData = window.plugin.bookmarks.findByGuid(guid);
        var list = window.plugin.bookmarks.bkmrksObj.portals;


        if (bkmrkData !== undefined) {
            delete list[bkmrkData.id_folder]['bkmrk'][bkmrkData.id_bookmark];
            $('.bkmrk#' + bkmrkData.id_bookmark + '').remove();

            window.plugin.bookmarks.saveStorage();
            window.plugin.bookmarks.refreshBkmrks();

            window.runHooks('pluginBkmrksEdit', { "target": "portal", "action": "remove", "folder": bkmrkData.id_folder, "id": bkmrkData.id_bookmark, "guid": guid });
        }
    };

    var setup = function () {
        window.addHook('portalDetailsUpdated', window.plugin.bookmarkextras.onPortalDetailsUpdated);
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
