/**
 *
 */
// use strict?
if (typeof copyBookmarksAsOrgmode == "undefined") {
    var copyBookmarksAsOrgmode = {

        init: function() {
            var placesContext = document.getElementById('placesContext');
            if ( ! placesContext ) return;
            placesContext.addEventListener("popuphiding", function(event) {
                if ( event.target.triggerNode.id != 'PlacesToolbarItems' ) return;
                event.target.ownerDocument.getElementById("placesContext_copyAsOrg").hidden = false;
            });
            placesContext.addEventListener("popupshowing", function(event) {
                if ( event.target.triggerNode.id != 'PlacesToolbarItems' ) return;
                var item_pasteFromOrg = event.target.ownerDocument.getElementById("placesContext_pasteFromOrg");
                var clipboard = copyBookmarksAsOrgmode._getDataFromClipboard();
                var showPaste = (copyBookmarksAsOrgmode.maybeParseOrgLink(clipboard) || copyBookmarksAsOrgmode.maybeParseOrgOutline(clipboard));                
                item_pasteFromOrg.hidden   = !showPaste;
                item_pasteFromOrg.disabled = !showPaste;
            });
        },

        _getOrgStringForNode(placesNode, level) {
            if (!placesNode) {
                return '';
            }
            if (typeof level == "undefined") {
                var level = 1;
            }

            var orgString = '';
            for ( var i = 0; i < level; i ++ ) {
                orgString += '*';
            }
            orgString += ' ';

            var nodeTitle = placesNode.title.replace(/\n+/g, " ");
            if (PlacesUtils.nodeIsFolder(placesNode) || placesNode.hasOwnProperty('childCount')) {
                orgString += nodeTitle + "\n";

                var folderUri = placesNode.uri.replace(/place:folder=([^&]+).*/g, "$1");
                if ( folderUri == 'TOOLBAR' ) {
                    var folderID = PlacesUtils.toolbarFolderId;
                }
                else {
                    var folderID = placesNode.itemId;
                }

                var children = PlacesUtils.getFolderContents(folderID).root;
                for ( var i = 0; i < children.childCount; i++ ) {
                    orgString += this._getOrgStringForNode(children.getChild(i), level+1) + "\n";
                }
            }
            else if ( PlacesUtils.nodeIsBookmark(placesNode) ) {
                var bookmarkUrl = PlacesUtils.bookmarks.getBookmarkURI(placesNode.itemId).spec;
                nodeTitle = nodeTitle.replace(/\[/g, "(").replace(/\]/g, ")");
                orgString += "[[" + bookmarkUrl + "][" + nodeTitle + "]]";
            }

            return orgString;
        },

        copyAsOrg: function() {
            var placesNode = PlacesUIUtils.getViewForNode(document.popupNode).selectedNode;
            var orgString = this._getOrgStringForNode(placesNode)
                                .replace(/(\n)+/g, "\n")
                                .replace(/\n$/, "");
            const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
                                               .getService(Components.interfaces.nsIClipboardHelper);
            gClipboardHelper.copyString(orgString);
        },

        _getDataFromClipboard: function() {
            var trans = Cc["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable);
            trans.init(null)
            trans.addDataFlavor("text/unicode");

            Services.clipboard.getData(trans, Services.clipboard.kGlobalClipboard);
            var str       = {};
            var strLength = {};
            trans.getTransferData("text/unicode", str, strLength);

            return str ? str.value.QueryInterface(Ci.nsISupportsString).data : '';
        },

        maybeParseOrgLink: function(orgString) {
            var parseOrgLink = orgString.trim().match(/^\[\[(.+)\]\[(.+)\]\]$/);
            return parseOrgLink ? { "title": parseOrgLink[2], "url": parseOrgLink[1] } : false;
        },

        maybeParseOrgFolder: function(orgString) {
            var matchOrgFolder = orgString.trim().match(/^(?!\*+ )(.+)(\n(\*+ ((.|\n)+)))?/);
            return matchOrgFolder ? {
                "name":    matchOrgFolder[1],
                "content": typeof matchOrgFolder[3] !== "undefined" ? matchOrgFolder[3] : null
            } : false;
        },

        maybeParseOrgOutline: function(orgString) {
            orgString = orgString.trim();
            var matchFirstOutline = orgString.match(/^(\*+) .+/);
            if (!matchFirstOutline) return false;
            var splitCurrentLevels = ("\n"+orgString).split(new RegExp("\n\\*{"+matchFirstOutline[1].length+"} ", "g"));
            splitCurrentLevels.shift();
            return splitCurrentLevels;
        },

        parseOrgString: function(orgString, pasteToFolderId) {
            if (typeof this.bookmarksService === "undefined") {
                this.bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                                                  .getService(Components.interfaces.nsINavBookmarksService);
                this.ioService        = Components.classes["@mozilla.org/network/io-service;1"]
                                                  .getService(Components.interfaces.nsIIOService);
            }

            var link = this.maybeParseOrgLink(orgString);
            if (link) {
                this.bookmarksService.insertBookmark(pasteToFolderId, this.ioService.newURI(link.url, null, null),
                    this.bookmarksService.DEFAULT_INDEX, link.title);
                return;
            }
            var folder = this.maybeParseOrgFolder(orgString);
            if (folder) {
                var newFolderId = this.bookmarksService.createFolder(pasteToFolderId, folder.name, this.bookmarksService.DEFAULT_INDEX);
                if (folder.content) {
                    this.parseOrgString(folder.content, newFolderId);
                }
                return;
            }
            var outline = this.maybeParseOrgOutline(orgString);
            if (outline) {
                for ( var i=0; i<outline.length; i++ ) {
                    this.parseOrgString(outline[i], pasteToFolderId);
                }
            }
        },

        pasteFromOrg: function() {
            var placesNode = PlacesUIUtils.getViewForNode(document.popupNode).selectedNode;
            if (placesNode) {
                var folderID = placesNode.itemId;
            }
            else if (document.popupNode.id == 'PlacesToolbarItems') {
                var folderID = PlacesUtils.toolbarFolderId;
            }
            else {
                console.log(document.popupNode);
                return;
            }

            this.parseOrgString(this._getDataFromClipboard(), folderID);
        }

    };

    window.addEventListener("load", function load(event) {
        window.removeEventListener("load", load);
        copyBookmarksAsOrgmode.init();
    });
};
