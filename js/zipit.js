
/*
 * 7/4/2022
 *
 * zipit.js
 *
 * Support functions for ZIPit
 */

var THEME_SHOW = 1;
var THEME_HIDE = 0;

var sSendInvites =	0;		// off by default
var gPrefs = { };

function switchViews ( event, pageName, whichID = 0 )
{
	var viewURL = "./" + pageName + ".shtml?uid=" + gUID;

	if ( whichID > 0 ) {
		viewURL += "&viewID=" + whichID;
	}

	window.open ( viewURL, pageName );
}

function switchViewsDeep ( event, pageName, whichID = 0, area='admin' )
{
	var viewURL = "/" + area;
	if ( pageName == "dashboard" || pageName == "god_view" ) {
		viewURL = "https://laundry.network/" + area;
	}
	viewURL += "/" + pageName + ".shtml?uid=" + gUID;

	if ( whichID > 0 ) {
		viewURL += "&viewID=" + whichID;
	}

	window.open ( viewURL, pageName );

  /* games with modifier keys...
	//window.location = viewURL;
	//if ( event !== null && event.shiftKey ) {
	if ( event !== null && event.altKey ) {
		window.open ( viewURL, "_self" );
	} else {
		window.open ( viewURL, pageName );
	}
  */
}

function extractNum ( str )
{
	var num = 0;
	var tmpStr = str.replace ( /[^@0-9]/g, '' );	// get rid of non-numerics like " ( votes)"
	num = parseFloat ( tmpStr );
	if ( empty(num) ) num = 0;						// handle 'undefined' and useless shit like that

	return num;
}

function rawSetting ( key )
{
	var value = null;
	if ( gSettings !== undefined && gSettings[key] !== undefined ) {
		value = gSettings[key];
	}
	return value;
}

function getSet ( key, type="INT" )
{
	var result = null;
	var rawVal = rawSetting ( key );
	if ( type == "INT" ) {
		result = 0;
		if ( !empty(rawVal) ) result = parseInt ( rawVal );
	} else {
		result = rawVal;
	}
	return result;
}

function isGroupType ( pageType )
{
	isGroup = 0;
	
	if ( pageType == cPage.GROUP ) isGroup = 1;
	if ( pageType == cPage.CLIENT ) isGroup = 1;
	if ( pageType == cPage.MLIST ) isGroup = 1;
	if ( pageType == cPage.TOPIC ) isGroup = 1;
	//if ( pageType == cPage.EVENT ) isGroup = 1;

	return isGroup;
}

function loadGroup ( groupID )
{
	var found = null;
	if ( empty(groupID) || empty(gData) || empty(gData['groups']) ) {
		return null;
	}
	if ( !empty(gData) && !empty(gData.groups) ) {
		var list = gData.groups;
		if ( !empty(list) ) {
			for ( var idx = 0; idx < list.length; idx++ ) {
				var group = list[idx];
				if ( !empty(group) ) {
					if ( groupID == group.groupID ) {
						found = group;
						break;
					}
				}
			}
		}
	}
	return found;
}

function loadEvent ( eventID )
{
	var found = null;
	if ( empty(eventID) ) {
		return null;
	}
	if ( !empty(gData.events) ) {
		var list = gData.events;
		if ( !empty(list) ) {
			for ( var idx = 0; idx < list.length; idx++ ) {
				var event = list[idx];
				if ( !empty(event) ) {
					if ( eventID == event.eventID ) {
						found = event;
						break;
					}
				}
			}
		}
	}
	return found;
}

function make_user_url ( uid, gid, type="USER_PROFILE" )
{
	var url = `https://files.zipit.social/uimg/${uid}`;
	if ( type == "USER_BANNER" ) {
		url = `https://files.zipit.social/bimg/${uid}`;
	}
	if ( type == "GROUP_BANNER" ) {
		if ( gAllowed ) {
			url = `https://files.zipit.social/gimg/${gid}`;
		} else {
			url = `https://files.zipit.social/gimg/-1`;
		}
	}
	//console.log ( "make_user_url: " + url );
	return url;
}

function loadUser ( uid )
{
	var user = null;
	if ( !empty(gData.users) ) {
		user = gData.users[uid];
	}
	return user;
}

function isAdmin ( uid )
{
	var admin = false;
	if ( empty(uid) ) return false;

	var user = loadUser ( uid );
	if ( !empty(user) ) {
		var roles = parseInt ( user.roles );
		if ( roles >= 16 ) admin = true;
	}
	//if ( uid == 6 ) admin = true;	// Glenn :)

	return admin;
}

function is_glenn()
{
	if ( gUID == 6 ) return true;
	return false;
}

function visitUser ( userID )
{
	//if ( userID < 1036 ) userID *= 1036;
	var url = `https://${gServer}/me/home.shtml?pid=${userID}`;
	window.open ( url, '_zipvisit' );
}

function logout()
{
	gSessionKey = "";
	gUID = 0;
	
	window.location = '/php/logout.php'
}

function emailToo()
{
	gEmailActiveWithPost = 1 - gEmailActiveWithPost;
	console.log ( `gEmailActiveWithPost: ${gEmailActiveWithPost}` );
	var ck = $("#ck_emailtoo")[0];
	ck.checked = gEmailActiveWithPost;
}

function sleepersToo()
{
	gEmailSleepersWithPost = 1 - gEmailSleepersWithPost;
}

function makeEditableField ( localID, key, value, size='4', placeholder='', align='' )
{
	let result = "";
	let eclass = `edit-${key}`;
	let style = '';
	if ( !empty(align) ) {
		eclass += ` ${align}`;
	}
	if ( empty(value) ) value = '';

	result = `<input type='text' class='${eclass}' ${style} id='${localID}' size=${size}`;
	//if ( !empty(value) ) {
		result += " value='" + value + "'";
	//}
	if ( !empty(placeholder) ) {
		result += " placeholder='" + placeholder + "'";
	}
	result += "/>";
	//alert ( result );

	return result;
}

function makeEditableTextArea ( localID, key, value )
{
	let result = "";
	result = "<input type='text' id='" + localID + "' size='4'";
	if ( value !== undefined && value != null && value != 0 ) {
		result += " value='" + value + "'";
	}
	result += "/>";
	//alert ( result );

	return result;
}

function editExistingField ( localID, key, value, size='4' )
{
	var result = "";
	//result = "<span class='clickable' id='#tag-list-popup' id='" + id + "'>" + value + "</span>";
	result = "<span class='make_editable' id='edit-" + localID + "'>" + value + "</span>";
	//alert ( result );

	return result;
}

