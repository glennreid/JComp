
/*
 * 6/9/2023
 *
 * messages.js
 *
 * Support functions for ZIPit direct messaging
 */

function showHideConversation()
{
	var area = $("#message_area");
	var visible = area.is(":visible");
	if ( visible ) {
		area.hide ( 500, "swing", function() {
			window.setTimeout ( focusText($("#edit_title")), 1000 );
		});
		$("#b_show_convo").show();
	} else {
		//area.show(1000, "swing", onEditStart(textType) );
		//setupPostArea ( gTextType );
		showHidePost ( cPostType.MESSAGE );
		area.show ( 500, "swing", function() {
			window.setTimeout ( focusText($("#edit-0")), 1000 );
			if ( empty(gUID) ) {	// not logged in
				if ( !empty(gVisitorID) ) {
					$("#msg_pword").show();
					$("#msg_login").hide();
				} else {
					$("#msg_pword").hide();
					$("#msg_login").show();
				}
				$("#post_area").hide();
			} else {
				$("#msg_pword").hide();
				$("#msg_login").hide();
				$("#post_area").show();
			}
		});
		$("#b_show_convo").hide();
	}
}

function buildConversation ( uid, pid )
{
	var convo = "";
	if ( !empty(gData.users[pid].messages) ) {
		var list = gData.users[pid].messages;
		//reverse for ( var idx = list.length-1; idx >= 0 ; idx-- ) {
		for ( var idx = 0; idx < list.length; idx++ ) {
			var rec = list[idx];
			var authorID = rec['authorID'];
			var authorName = rec['authorName'];
			var imageURL = rec['imageURL'];
			var author = { 'posterID':authorID, 'name': authorName };
			var when = date_from_sql ( rec['modified'] );
			if ( authorID == gUID ) gLastSentMessageTime = when;
				else gLastReceivedMessageTime = when;
			convo += date_bubble ( rec );
			convo += make_full_card ( cPostType.MESSAGE, author, rec, BAR_NONE, imageURL );
			//convo += `<div class='card'>Message ${rec.postID}</div>`;
		}
		var lastMsg = list[list.length-1];
		if ( !empty(lastMsg) ) {
			gLastMessageID = lastMsg.postID;
		}
		//$("#userMessages").html ( `${historyCount} Messages` );
	}
	update_summary ( uid, pid );
	$("#msg_thread").html ( convo );
}

function update_summary ( uid, pid )
{
	var lastMessage = "";
	var count = 0;
	var s = 's';

	if ( !empty(gData.users[pid].messages) ) {
		var list = gData.users[pid].messages;
		var idx = list.length - 1;
		if ( idx >= 0 ) {
			var rec = list[idx];
			var jDate = date_from_sql ( rec.modified );
			if ( empty(rec.modified) || empty(jDate) ) jDate = now();
			var lastMsgDate = elapsedTime ( jDate ) + " ago";
			if ( (now() - jDate) < 3 ) lastMsgDate = "just now";
			if ( list.length > 1 ) {
				lastMessage = `&ndash; last was ${lastMsgDate}`;
			} else {
				lastMessage = `&ndash; ${lastMsgDate}`;
			}
		}
		count = list.length;
	}

	if ( count == 1 ) s = '';
	$("#msg_summary").html ( `${count} message${s} ${lastMessage}` );
}

function messageSend ( )
{

	reallyPost ( 0 );

	gLastSentMessageTime = Date.now();
	if ( gMessageRefreshTimer ) clearTimeout ( gMessageRefreshTimer );
	gMessageRefreshTimer = setTimeout ( checkForNewMessages, (3*1000) );
}

function countMessagesFrom ( interestID )
{
	var total = 0;
	if ( !empty(gData.users[interestID]) ) {
		for ( const message of gData.users[interestID].messages ) {
			if ( !interestID || message.authorID == interestID ) {
				total++;
			}
		}
	}
	return total;
}

var gMessageRefreshTimer = null;
var gLastMessageID = 0;
var gLastSentMessageTime = 0;
var gLastReceivedMessageTime = 0;
var gMessageCheckInterval = 300;		// in seconds

function checkForNewMessages ( )
{
	var lastCount = countMessagesFrom ( 0 );
	var secondsSinceMyLastMessage = Math.round ( (Date.now()-gLastSentMessageTime) / 1000 );
	var secondsSinceLastReceivedMessage = Math.round ( (Date.now()-gLastReceivedMessageTime) / 1000 );

	//if ( lastCount == 0 ) gLastMessageID = 0;

	if ( gMessageRefreshTimer ) clearTimeout ( gMessageRefreshTimer );

	if ( secondsSinceMyLastMessage < (60*60*4) ) {		// last four hours
		gMessageCheckInterval = 2;
		if ( secondsSinceLastReceivedMessage > 30 ) gMessageCheckInterval = 5;
		if ( secondsSinceLastReceivedMessage > 60 ) gMessageCheckInterval = 10;
		if ( !is_glenn() ) {
			if ( secondsSinceLastReceivedMessage > 300 ) gMessageCheckInterval = 30;
		}
	}
	update_summary ( gUID, gPersonOfInterestID );
	gMessageRefreshTimer = setTimeout ( checkForNewMessages, (gMessageCheckInterval*1000) );

	getUserMessagesFromServer ( gPersonOfInterestID, gLastMessageID );
}

function is_dupe ( msg )
{
	var dupe = false;
	var udata = gData.users[gPersonOfInterestID];
	if ( !empty(udata) &&  !empty(udata.messages) ) {
		for ( var idx = udata.messages.length - 1; idx >= 0; idx-- ) {
			const existing = udata.messages[idx];
			if ( msg.postID == existing.postID ) {
				dupe = true;
				console.log ( `dupe: postID: ${existing.postID}` );

			}
			//if ( msg.body == existing.body ) dupe = true;
			if ( dupe ) break;
		}
	}
	return dupe;
}

function mergeMessages ( interestID, data )
{
	if ( !empty(data) ) {
		var userdata = gData.users[interestID];
		if ( !empty(userdata) ) {
			var list = userdata.messages;
			if ( empty(list) ) {
				gData.users[interestID].messages = [];
				list = gData.users[interestID].messages;
			}
			if ( !empty(data.messages) ) {
				for ( msg of data.messages ) {
					if ( !is_dupe(msg) ) {
						//list.push ( msg );
						var poster = { 'posterID':msg.authorID, 'name': msg.name };
						addMessageLocally ( poster, 0, msg );
						gLastMessageID = msg.postID;
					}
				}
				gLastReceivedMessageTime = Date.now();
				gMessageCheckInterval = (2*1000);
			} else {
				//buildConversation ( gUID, gPersonOfInterestID );
			}
		}
	}
}

function updateConversationUI ( interestID )
{
}
