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
                if ( event.target.triggerNode.id == 'PlacesToolbarItems' ) {
                    event.target.ownerDocument.getElementById("bmorg-cx-copyasorg").hidden = false;
                }
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
                nodeTitle = nodeTitle.replace("[", "(").replace("]", ")");
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
        }
        
    };

    window.addEventListener("load", function load(event) {
        window.removeEventListener("load", load); 
        copyBookmarksAsOrgmode.init();  
    });
};
