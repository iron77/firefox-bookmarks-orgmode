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
                item_pasteFromOrg.hidden   = false;
                item_pasteFromOrg.disabled = false;
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

        pasteFromOrg: function() {
            alert('Content from clipboard: '+this._getDataFromClipboard());
        }
        
    };

    window.addEventListener("load", function load(event) {
        window.removeEventListener("load", load); 
        copyBookmarksAsOrgmode.init();  
    });
};
