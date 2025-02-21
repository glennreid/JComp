
/*
 * 2/12/2023
 *
 * posts.js
 *
 * Support functions for ZIPit cards
 */

var gCreatingAd = 	 0;

var gParentID = 0;

var gPost = {
	'title': null,
	'body': null,
	'zip': null,
	'type': null,
	'url': null,
	'imageURL': null,
	'groupID': null,
	'parentID': null,
	'recipientID': null,
	'postID': null,
	'caption': null,
	'source': null,
	'inviteStart': null,
	'inviteEnd': null,
	'inviteTZOffset': null,
	'inviteLocName': null,
	'inviteAddr': null,
	'emailActiveWithPost': null,
	'emailSleepersWithPost': null,
};

var gTextType = cPostType.USER;
var gInviteStart = null;
var gInviteEnd = null;
var gInviteLocName = null;
var gInviteAddr = null;
var gEmailActiveWithPost = 1;
var gEmailSleepersWithPost = 0;
var gShowTimes = 0;
 
// https://youtu.be/xhRvU00TXT0

function clickLogin()
{
	window.location.href = "/account/login.shtml";
}

function showHidePost ( textType )
{
	var area = $("#post_area");
	var editor = $("#edit-0");
	var visible = area.is(":visible");
	if ( visible ) {
		closePostArea();
	} else {
		//area.show(1000, "swing", onEditStart(textType) );
		//setupPostArea ( gTextType );
		area.show ( 500, "swing", function() {
			window.setTimeout ( focusText($("#edit_title")), 1000 );
		});
		gEditing = 1;
		gParentID = 0;
		gCreatingAd = textType;
		$("#b_show_post").hide();
		$("#b_send").show();
		$("#b_cancel").show();
		$("#b_ad").hide();
		$("#b_add_link").hide();
		$("#b_event").hide();
		$("#msg_history").hide();
		$("#b_add_file").hide();
		if ( textType == cPostType.USER ) {	// regular post
			$("#new_post_title").html ( `Create a new Post` );
			$("#ad_area").show();
		}
		if ( textType == cPostType.AD ) {	// UI for ads
			$("#new_post_title").html ( `Post an Ad` );
			$("#ad_area").show();
		}
		if ( textType == cPostType.MESSAGE ) {
			$("#new_post_title").html ( `Private Conversation with <span class='darkred'>${gName.interest.first}</span>` );
			$("#ad_area").show();
		}
		if ( textType == cPostType.TOPIC ) {
			$("#new_post_title").html ( `Contribute to "${gGroup.title}"` );
			$("#date_area").show();
		}
		if ( textType == cPostType.EVENT ) {
			$("#new_post_title").html ( `Create an Event for "${gGroup.title}"` );
			$("#date_area").show();
			$("#b_email").hide();
		}
		if ( textType == cPostType.LINK ) {
			$("#new_post_title").html ( "Contribute a Link to " + gGroup.title + "" );
			$("#edit-0")[0].placeholder = "Paste link here";
			$("#post_help").html ( "Contributed links get added to the sidebar. Use good judgment." );
			$("#label_subtitle").hide();
			$("#edit_subtitle").hide();
			$("#drop_image").hide();
			$("#b_add_photo").hide();
			$("#b_email").hide();
			$("#b_send").hide();
			$("#send_options").hide();
			$("#sep_butt").hide();
			$("#b_send_link").show();
			setSendEmailCheckBox ( 0 );
		}
		if ( textType == cPostType.EVENT ) {
		}
		if ( textType == cPostType.AD ) {
			$("#b_send").hide();
			$("#b_send_ad").show();
		}
	}
	gTextType = textType;
}

function showHideUpload ( textType )
{
	var area = $("#upload_box");
	//var editor = $("#edit-0");
	var visible = area.is(":visible");
	if ( visible ) {
		closeUploadArea();
	} else {
		//area.show(1000, "swing", onEditStart(textType) );
		//setupPostArea ( gTextType );
		area.show ( 500, "swing", function() {
			window.setTimeout ( focusText($("#edit_title")), 1000 );
			$("#new_post_title")[0].scrollIntoView();
		});
		/*
		gEditing = 1;
		gParentID = 0;
		gCreatingAd = textType;
		$("#b_show_post").hide();
		$("#b_send").show();
		$("#b_cancel").show();
		$("#b_ad").hide();
		$("#b_add_link").hide();
		$("#b_event").hide();
		*/
	}
	gTextType = textType;
}

function findPost ( postID )
{
	var result = null;
	var list = gData.posts ? gData.posts.list : null;
	if ( !empty(list) ) {
		for ( var idx = 0; idx < list.length; idx++ ) {
			var post = list[idx];
			if ( !empty(post) && !empty(post.postID) ) {
				if ( postID == post.postID ) {
					result = post;
					break;
				}
			}
		}
	}
	return result;
}

function postEdit ( postID )
{
	var title = "Existing Title";
	var subtitle = "Existing SubTitle";
	var body = "Existing Body";
	var post = findPost ( postID );

	if ( empty(post) ) {
		console.log ( "Can't find post" + postID );
		return;
	} else {
		title = post.title;
		subtitle = post.subtitle;
		body = post.body;
		gPost = post;
	}
	showHidePost ( cPostType.USER );
	if ( gTextType == cPostType.USER && !gGroupOfInterestID ) {
		 showMenuSheet("post",650)
	}
	$("#new_post_title").val ( "Edit Your Post" );
	$("#edit_title").val ( title );
	$("#edit_subtitle").val ( subtitle );
	$("#edit-0").html ( body );
	$("#b_delete").show();

}

function postDelete ( postID=0 )
{
	if ( empty(postID) ) {
		postID = gPost['postID'];
		closePostArea();
	}
	if ( !empty(postID) ) {
		deletePostLocally ( postID );
		deletePostOnServer ( postID );
	}
}

function deletePostLocally ( postID )
{
	var result = null;
	var list = gData.posts ? gData.posts.list : null;
	if ( !empty(list) ) {
		// remove from server data
		for ( var idx = 0; idx < list.length; idx++ ) {
			var post = list[idx];
			if ( !empty(post) && !empty(post.postID) ) {
				if ( postID == post.postID ) {
					gData.posts.list.splice(idx, 1);
					break;
				}
			}
		}
	}
	// remove from DOM
	var domItem = $(`#card-${postID}`);
	if ( !empty(domItem) ) {
		   domItem.animate({
			height: "0px",
		  }, 500, function() {
			  domItem.remove();
		  });
		  //domItem.remove();
	}
}


function clickInvite ( )
{
}

var sCurrentTextArea = null;
var sCurrentDateArea = null;
var sCurrentTimeArea = null;
var sCurrentPlaceArea = null;

function clearPostFields ( )
{
	if ( !gLocalTest ) {
		$("#edit-0").html ( "" );
		$("#edit_title").val ( "" );
		$("#edit_subtitle").val ( "" );
	}
	$("#edit_help").html ( "" );
	gPost.url = null;
	gPost.imageURL = null;
}

function closePostArea ( )
{
	clearPostFields();
	if ( isGroupType(gPageType) ) {
		$("#new_post_title").html ( "Contribute to " + gGroup.title + "" );
		$("#post_area").hide(500, "swing");
		showHideButtons();
		/*
		$("#b_show_post").show();
		$("#b_send").hide();
		$("#b_delete").hide();
		if ( gPageType == cPage.HOME ) {
			$("#b_ad").show();
		} else {
			$("#b_event").show();
		}
		$("#b_add_link").show();
		$("#b_add_photo").show();
		$("#b_add_file").show();

		*/
		$("#b_send_link").hide();
		$("#b_cancel").hide();
		$("#label_subtitle").show();
		$("#edit_subtitle").show();
		$("#photo_chooser").show();
		$("#image_div").hide();
		$("#date_area").hide();
	} else {
		closeMenuSheet ( "post" );
	}
	
	setSendEmailCheckBox ( 1 );
	gEditing = 0;
	gCreatingAd = 0;
	gParentID = 0;
}

function closeUploadArea ( )
{
	$("#upload_box").hide(500, "swing");
}

function showHideComments ( parentID )
{
	var area = $("#comment-" + parentID);
	var visible = area.is(":visible");
	if ( visible ) {
		closeCommentArea ( parentID );
	} else {
		showCommentArea ( parentID );
	}
}

function showCommentArea ( parentID )
{
	var area = $("#comment-" + parentID);
	var editor = $("#edit-" + parentID);
	if ( !area.is(":visible") ) {
		//area.show(1000, "swing", onEditStart(postType) );
		var count = setupComments ( parentID );
		area.show ( 500, "swing", function() {
			//area[0].scrollIntoView();
			if ( !count ) window.setTimeout ( focusText(editor), 2000 );
		});
		gParentID = parentID;
		gEditing = 1;
	}
}

function closeCommentArea ( parentID )
{
	$("#edit-" + parentID).html ( "" );
	$("#comment-" + parentID).hide(500, "swing");
	gEditing = 0;
	gCreatingAd = 0;
	gParentID = 0;
}

function setInviteDetails ()
{
	var dur_hours = parseInt ( $("#edit_dur_hours").val() );
	var dur_mins = parseInt ( $("#edit_dur_mins").val() );

	if ( !empty(gInviteStart) ) {
		//gInviteStart = ics_format ( jDate );
		gInviteEnd = new Date ( gInviteStart.getTime() );
		gInviteEnd = new Date ( gInviteEnd.setHours(gInviteStart.getHours() + dur_hours) );
		gInviteEnd = new Date ( gInviteEnd.setMinutes(gInviteStart.getMinutes() + dur_mins) );
		
		/*
		var end = gInviteStart.getTime() / 1000;
		var hourJQ = $("#edit_dur_hours");
		var minJQ = $("#edit_dur_mins");
		var hours = parseInt ( hourJQ.val() );
		var minutes = parseInt ( minJQ.val() );
		var hours = parseInt ( $("#edit_dur_hours").val() );
		var minutes = parseInt ( $("#edit_dur_mins").val() );
		var seconds = ((hours * 60) + minutes) * 60;
		end += seconds;
		var endDate = new Date(end);
		
		gInviteEnd = new Date ( gInviteEnd.setHours(jDate.getHours() + 1) );
		*/
		
		gPost.inviteStart = gInviteStart.getTime() / 1000;
		gPost.inviteEnd = gInviteEnd.getTime() / 1000;
		gPost.inviteTZOffset = gInviteStart.getTimezoneOffset();
		gPost.inviteLocName = gInviteLocName;
		gPost.inviteAddr = gInviteAddr;
	}
}

function postSend ( postType )
{
	reallyPost ( gPost.postID );
}

function reallyPost ( postID, groupIDParam=0 )
{
	var title_field = document.getElementById ( "edit_title" );
	var subtitle_field = document.getElementById ( "edit_subtitle" );
	//var post_area = document.getElementById ( "post_textarea" );	// doesn't have 'value' ?!
	//var val = post_area.value;
	//var fieldName = `#edit-${postID}`;
	//var fieldJQ = $(fieldName);
	var textarea = sCurrentTextArea;

	if ( !empty(textarea) ) {
		gPost.body = textarea.value.trim();
	} else {
		gPost.body = "";
	}
	
	gPost.title = "";
	if ( !empty(title_field) ) {
		gPost.title = title_field.value.trim();
	}
	gPost.subtitle = "";
	if ( !empty(subtitle_field) ) {
		gPost.subtitle = subtitle_field.value.trim();
	}
	if ( gTextType == cPostType.LINK ) {
		if ( empty(gPost.url) ) {
			let firstURL = extract_first_url ( gPost.body );
			if ( empty(firstURL) ) {
				$("#edit_help").html ( "LINK is empty for some reason" );
				$("#post_help").html ( "LINK is empty for some reason" );
				return;
			}
			gPost.url = firstURL;
		}
		if ( empty(gPost.title) ) {
			gPost.title = get_domain_from_url ( gPost.url );
		}
	}
	gPost.groupID = gGroupOfInterestID;
	if ( !empty(groupIDParam) ) gPost.groupID = groupIDParam;
	gPost.zip = gRelevantZip;
	gPost.type = gTextType;
	gPost.parentID = gParentID;
	gPost.emailActiveWithPost = gEmailActiveWithPost;
	gPost.emailSleepersWithPost = gEmailSleepersWithPost;
	if ( empty(gPost.groupID) ) {
		gPost.emailActiveWithPost = 0;
		gPost.emailSleepersWithPost = 0;
	}
	if ( gTextType == cPostType.MESSAGE ) {
		if ( empty(postID) ) {
			gPost.recipientID = gPersonOfInterestID;
		} else {
			gPost.recipientID = 0;		// commenting on another post
			gPost.type = cPostType.USER;
		}
	}

	if ( !empty(gInviteStart) ) {
		setInviteDetails();
	}
	sendPostToServer ( gPost );

	if ( gUID != 6 ) {
		//setTimeout ( updateFeed, 2000 );
	}
	if ( !empty(postID) ) {	// this is a comment
		var uiItem = $(`#b_comment-${postID}`);
		if ( !empty(uiItem) ) {
			var commentCount = extractNum ( uiItem.html() );
			var s = "s";
			commentCount++;
			if ( commentCount == 1 ) s = "";	// plural handler
			uiItem.html ( `${commentCount} comment${s}` );
		}
		uiItem = $(`#b_commentX-${postID}`);	// cancel button
		uiItem.html ( "Done" );
		textarea.value = "";
		// closeCommentArea ( postID );
	} else {
		closePostArea();
	}
	if ( gPost.postID ) {	// we were editing an existing post
		var post = findPost ( postID );
		if ( post ) {
			post.title = gPost.title;
			post.subtitle = gPost.subtitle;
			post.body = gPost.body;
			$(`#ptitle-${postID}`).html ( gPost.title );
			$(`#psubtitle-${postID}`).html ( gPost.subtitle );
			$(`#pbody-${postID}`).html ( gPost.body );
		}
	}
}

function addPostLocally ( poster, parentID, postRec )
{
	var type = cPostType.USER;
	var barType = STANDARD;
	var postID = postRec.postID;
	if ( postRec.type == cPostType.MESSAGE ) {
		// shouldn't ever really get here
		addMessageLocally ( poster, parentID, postRec );
		return;
	}
	if ( !empty(parentID) ) {
		type = cPostType.COMMENT;
	}
	if ( !empty(postRec.type) ) type = postRec.type;
	if ( !empty(postRec.authorHeadline) ) {
		poster['headline'] = postRec.authorHeadline;
	} else {
		poster['headline'] = gName.me.headline;
	}
	if ( empty(postRec.modified) ) {
		postRec.modified = date_to_sql ( new Date() );	// now
	}
	postRec['authorID'] = poster.posterID;
	postRec['authorName'] = poster.name;
	if ( empty(postRec['authorHeadline']) ) postRec['authorHeadline'] = gName.me.headline;
	if ( parentID && postRec.authorID != gUID ) ( postRec['subtitle'] = `✨New response ` + short_time() );
	var newcard = make_full_card ( type, poster, postRec, barType );

	if ( parentID ) {
		var list = getCommentList ( parentID );
		var cCount = 1 + list.length;
		var comment_list = $(`#comment_list-${parentID}`);
		var last = comment_list.last();
		last.append ( newcard );
		if ( empty(gData.posts.list) ) gData.posts.list = [];
		gData.posts.push ( postRec );
		var s = ( cCount == 1 ? "" : "s" );
		$(`#comms-${parentID}`).html ( `✨${cCount} Comment${s}` );
		showCommentArea ( parentID );
	} else {
		var main_feed = $("#main_feed");
		var first = main_feed.first();
		first.prepend ( newcard );
	}
	//if ( gUID != 6 ) {
		clearGPost();
	//}
}

function addMessageLocally ( poster, parentID, postRec )
{
	var type = cPostType.MESSAGE;
	var barType = BAR_NONE;

	if ( empty(postRec.modified) ) {
		postRec.modified = date_to_sql ( new Date() );	// now
	}
	postRec['authorID'] = poster.posterID;
	postRec['authorName'] = poster.name;
	postRec['authorHeadline'] = gName.me.headline;
	var newcard = make_full_card ( type, poster, postRec, barType );

	var chat = $(`#msg_thread`);
	var last = chat.last();
	var timestamp = date_bubble ( postRec, gShowTimes );
	last.append ( timestamp );
	last.append ( newcard );

	var userdata = gData.users[gPersonOfInterestID];
	if ( !empty(userdata) ) {
		if ( empty(userdata.messages) ) {
			gData.users[gPersonOfInterestID].messages = [];
		}
		gData.users[gPersonOfInterestID].messages.push ( postRec );
		console.log ( `local postID: ${postRec.postID}` );
	}
	update_summary ( gUID, gPersonOfInterestID );
	//if ( gUID != 6 ) {
		clearGPost();
	//}
}

/* doesn't work for some reason (DOM changes don't happen)
function addLinkLocally ( postRec )
{
	var anchor = $("#b_add_link_sidebar");
	var link_list = $("#link_list");
	var last = link_list.last();
	var html = "";
	$("#title_links").html ( "HiJinks" );
	$("#title_links").remove();
	anchor.html ( "+Adder Stink" );
	html += "<div class='topic pct90 accent rt'>";
	html += `<a href='${postRec.url}' target='_zipit'>`;
	html += postRec.title + "</a></div>\n";
	last.html ( "LAST here" );
	last.after ( html );
	//last.append ( "<div style='height:30px; width:80px; background-color:pink'>LINK HERE</div>" );
	link_list.append ( html );
}
*/

function justPosted ( serverData )
{
	var type = serverData.type;
	var postID = serverData.postID;
	var parentID = serverData.parentID;
	var name = empty(serverData.authorName) ? gName.me.full : serverData.authorName;
	var poster = { 'posterID':serverData.authorID, 'name': name };
	var isEdit = (gPost.postID == postID);
	gPost.postID = postID;
	gPost.type = type;
	gPost.parentID = parentID;
	gPost.modified = date_to_sql ( new Date() );
	if ( !empty(serverData.body) ) gPost.body = serverData.body;
	//gPost['imageURL'] = serverData.imageURL; // `https://files.zipit.social/postimg/${postID}`;
	if ( !empty(serverData.imageURL) ) {
		gPost['serverImageURL'] = serverData.imageURL;
		gPost['imageURL'] = `https://files.zipit.social/postimg/${postID}`;
	}
	if ( !empty(gPost['type']) && gPost['type'] != serverData.type ) {
		console.log ( `justPosted: type mismatch returned from save_post on server: ${serverData.type}` );
	}
	if ( gPost['type'] == cPostType.LINK ) {
		refreshGroupDataFromServer ( gGroupOfInterestID );
	} else if ( gPost['type'] == cPostType.MESSAGE ) {
		addMessageLocally ( poster, parentID, gPost );
		gLastMessageID = postID;
	} else {
		addPostLocally ( poster, parentID, gPost );
		if ( !serverData.auto && !isEdit ) {	// the "auto" flag is critical or it will infinite-loop on you
			if ( !is_glenn() ) postAIResponseOnServer ( type, postID, parentID );
		}
	}
}

function justDeleted ( serverData )
{
	var postID = serverData.postID;
	// TODO: remove from list and redisplay
	gPost['postID'] = postID;
	//gPost['imageURL'] = serverData.imageURL; // `https://files.zipit.social/postimg/${postID}`;
	if ( !empty(serverData.imageURL) ) {
		gPost['serverImageURL'] = serverData.imageURL;
		gPost['imageURL'] = `https://files.zipit.social/postimg/${postID}`;
	}
	if ( gPost['type'] != serverData.type ) {
		console.log ( `justPosted: type mismatch returned from save_post on server: ${serverData.type}` );
	}
	if ( gPost['type'] == cPostType.LINK ) {
		refreshGroupDataFromServer ( gGroupOfInterestID );
	} else {
		//no! addPostLocally ( null, postID, gPost );
	}
}

function postCancel ( postID=0 )
{
	if ( postID ) {
		var item = document.getElementById ( "edit-" + postID );
		if ( !empty(item) ) {
			item.value = "";
			item.placeholder = "changed my mind!";
		}
		closeCommentArea ( postID );
	} else {
		closePostArea();
	}
}

function uploadCancel ( )
{
	closeUploadArea();
}

function justGotAIResponse ( serverData )
{
	var blurb = serverData.body;
	var area = sCurrentTextArea;
	var parentID = serverData.parentID;
	if ( empty(area) ) {
		area = $(`#edit-${parentID}`)[0];
		sCurrentTextArea = area;
	}
	if ( !empty(area) ) {
		area.value = blurb;
		//insertAtCursor ( area, blurb );
	}
}

function replyGPT ( postID, sentiment='positive' )
{
	var area = sCurrentTextArea;
	if ( !empty(postID) ) {
		area = $(`#edit-${postID}`)[0];
		sCurrentTextArea = area;
	}
	if ( !empty(area) ) {
		area.value = `Generating ${sentiment} response with ChatGPT...`;
	}
	var post = findPost ( postID );
	if ( !empty(post) ) {
		var type = post.type;
		generateAIResponseOnServer ( type, postID, post.parentID, sentiment );
	}
}

function clearGPost()
{
	var title_field = document.getElementById ( "edit_title" );
	var subtitle_field = document.getElementById ( "edit_subtitle" );
	//var fieldName = `#edit-${gPostID.postID}`;
	//var fieldJQ = $(fieldName);
	var textarea = sCurrentTextArea;

	gPost.title = null;
	gPost.subtitle = null;
	gPost.body = null;
	gPost.zip = null;
	gPost.parentID = null;
	gPost.groupID = null;
	gPost.postID = null;
	gPost.type = null;
	gPost.url = null;
	gPost.imageURL = null;
	gPost.caption = null;
	gPost.source =  null;
	gPost.inviteStart = null;
	gPost.inviteEnd = null;
	gPost.inviteTZOffset = null;
	gPost.inviteLocName = null;
	gPost.inviteAddr = null;
	gPost.batch = null;
	gPost.images = null;

	gEditing = 0;
	gCreatingAd = 0;
	gParentID = 0;
	
	if ( !empty(title_field) ) title_field.value = "";
	if ( !empty(subtitle_field) ) subtitle_field.value = "";
	if ( !empty(textarea) ) textarea.value = "";
}

function focusText ( area )
{
	area.focus();
}

function editKeyText ( event, textarea )
{
	var keyStroke = event.which;
	var postID = textarea.id.split("-")[1];
	gParentID = postID;

	if ( keyStroke == 13 ) {
		if ( textarea.id == "edit-title" ) {
			focusText ( $("#edit-0") );
		} else {
			if (   event.code && event.code.includes('NumpadEnter')
				// || event.shiftKey
			) {
				var groupID = gGroupOfInterestID;
				if ( !empty(postID) ) {
					var post = findPost ( postID );
					if ( !empty(post) && !empty(post.groupID) ) {
						groupID = post.groupID;
					}
				}

				reallyPost ( postID, groupID );
			} else {
				$("#edit_help").html ( "Use ENTER or Shift-Return to post" );
			}
		}
	} else if ( keyStroke == 9 ) {
		if ( textarea.id == "edit-title" ) {
			focusText ( $("#edit-subtitle") );
		}
		if ( textarea.id == "edit-subtitle" ) {
			focusText ( $("#edit-0") );
		}
		if ( textarea.id == "edit-0" ) {
			focusText ( $("#edit-title") );
		}
	} else {
		var txt = textarea.value;
		if ( txt && txt.length > 0 ) {
			$("#b_comment-"+gParentID).show();
		} else {
			$("#b_comment-"+gParentID).hide();
		}
		//textarea.value = "" + (keyStroke + 32);
	}
}

function editKeyMain ( event, textarea )
{
	sCurrentTextArea = textarea;
	editKeyText ( event, textarea );
}

function editKeyComment ( event, textarea )
{
	sCurrentTextArea = textarea;
	editKeyText ( event, textarea );
}

function editKeyTextCal ( event, editField )
{
	var keyStroke = event.which;
	if ( keyStroke == 9 || event.key == "Backspace" ) {		// Backspace
	} else if ( keyStroke == 13 || keyStroke == 9 ) {		// "Enter
		/*
		if ( editField.id == "edit-title" ) {
			focusText ( $("#edit-0") );
		} else {
			var postID = editField.id.split("-")[1];
			if (   event.code && event.code.includes('NumpadEnter')
				|| event.shiftKey
			) {
				reallyPost ( postID, gGroupOfInterestID );
			} else {
				$("#edit_help").html ( "Use ENTER or Shift-Return to post" );
			}
		}
		*/
	} else {
		/* too confusing to start with 'right now', let 'em edit...
		var today = new Date();
		var day = today.getDate(),
			month = today.getMonth() + 1,
			year = today.getFullYear(),
			hour = today.getHours(),
			minute = today.getMinutes();
		*/
		var year = 0, month = 0, day = 0, hour = 0;
		var minute = "";
		var merid = "";
		var dateArea = sCurrentDateArea
		if ( editField.id.includes("date") ) {
			dateArea = editField;
		}
		if ( !empty(dateArea) ) {
			var txt = dateArea.value;
			var comps = txt.split("/");
			if ( comps.length > 1 ) {
				var complete = 0;
				month = comps[0];
				day = 	comps[1];
				year = current_year();
				if ( !empty(month) && !empty(day) ) {
					if ( day.length == 2 ) complete = 1;
					if ( month < 1 ) month = 1;
					if ( month > 12 ) month = 12;
					if ( day < 1 ) day = 1;
					if ( day > 31 ) day = 31;
					if ( complete || comps.length > 2 ) {
						if ( !empty(comps[2]) ) {
							year = comps[2];
						}
						dateArea.value = `${month}/${day}/${year}`;
					}
				}
			}
		}
		if ( editField.id.includes("date") ) {
			sCurrentDateArea = editField;		// hack
		}

		var timeArea = sCurrentTimeArea
		if ( editField.id.includes("time") ) {
			timeArea = editField;
		}
		if ( !empty(timeArea) ) {
			var txt = timeArea.value;
			var comps = txt.split(":");
			var sep = "";
			var complete = 0;
			if ( comps.length > 1 ) {
				hour = comps[0];
				minute = comps[1];
				merid = "";
				if ( minute.includes(" ") ) {
					var merids = minute.split(" ");
					minute = merids[0];
					merid = " ";	// still editing...
					if ( !empty(merids[1]) ) {
						merid += merids[1];
					}
					if ( merid.includes("a") ) merid = " AM";
					if ( merid.includes("p") ) merid = " PM";
				}
			} else {
				hour = timeArea.value;
			}
			if ( !empty(hour) ) {
				if ( txt.includes(":") ) {
					if ( minute < 0 ) minute = "0";
					if ( minute.length == 2 ) complete = 1;
				}
				if ( minute > 59 ) minute = "00";
				if ( hour < 1 ) hour = "1";
				if ( hour > 1 ) sep = ":";
				if ( hour >= 12 ) {
					merid = " PM";
					if ( hour > 12 ) hour = "" + parseInt(hour) - 12;
				}
				var update = `${hour}${sep}`;
				//if ( complete && !txt.includes(" ") && txt.includes(":") ) {
				if ( complete && txt.includes(":") ) {
					if ( empty(merid) ) {
						merid = " AM";
						if ( hour < 8 ) merid = " PM";	// best guess is 03 is not AM
					}
					update += `${minute}${merid}`;
				} else {
					//if ( minute > 0 || minute == "0" ) {
					update = txt;
					if ( minute != "" ) {
						//update += `${minute}`;
					}
				}
				timeArea.value = update;
			}
		}
		// YYYY-MM-DDTHH:mm:ss.sssZ
		if ( merid == " PM" ) {	// convert to 24-hr time
			if ( hour < 12 ) hour = parseInt(hour) + 12;
		}
		if ( month < 10 ) month = "0" + month;
		if ( month == 0 ) month = "00";
		if ( day < 10 ) day = "0" + day;
		if ( day == 0 ) day = "00";
		if ( hour < 10 ) hour = "0" + hour;
		if ( minute == "" ) minute = "0";
		if ( minute < 10 ) minute = "0" + minute;
		if ( minute == 0 ) minute = "00";
		if ( year < 10 ) year = "0" + year;
		if ( year == 0 ) year = "00";
		if ( year < 2000 ) year = "20" + year;
		var iso = `${year}-${month}-${day}T${hour}:${minute}:00.000`;
		var jDate = new Date ( Date.parse(iso) );
		if ( !empty(jDate) ) {
			var ics = ics_format ( jDate );
			var formal = day_time_long( jDate );
			gInviteStart = jDate;
			$("#time_place").show();
			$("#cal_date_formal").html ( `${formal}` );
			if ( parseInt(hour) || parseInt(minute) ) {
				updateDuration();
			}
		} else {
			console.log ( `bad date: ${iso}` );
		}
		//area.value = "" + (keyStroke + 32);
	}
}

function updateDuration()
{
	var hours = $("#edit_dur_hours").val();
	var minutes = $("#edit_dur_mins").val();
	var sh = "";
	var sm = "";
	if ( hours != 1 ) sh = "s";
	if ( minutes != 1 ) sm = "s";
	var text = `Event lasts ${hours} hour${sh}`;
	if ( minutes > 0 ) text += ` and ${minutes} min${sm}`;
	$("#time_place").show();
	$("#cal_until_formal").html ( `${text}` );
}

function editKeyTextDuration ( event, editField )
{
	var keyStroke = event.which;
	var text = editField.value;
	if ( keyStroke == 13 || keyStroke == 9 ) {
	} else {
		updateDuration();
	}
}

function editKeyTextLoc ( event, editField )
{
	var keyStroke = event.which;
	var text = editField.value;
	if ( keyStroke == 13 || keyStroke == 9 ) {
	} else {
		$("#time_place").show();
		gInviteLocName = text;
		if ( text.includes('http') ) {
			var url = text;
			var domain = get_domain_from_url ( url );
			$("#cal_place_formal").html ( `<a href="${url}" target='_event'>Link to ${domain}</a>` );
		} else {
			$("#cal_place_formal").html ( `${text}` );
		}
	}
}

function editKeyTextAddr ( event, editField )
{
	var keyStroke = event.which;
	var text = editField.value;
	if ( keyStroke == 13 || keyStroke == 9 ) {
	} else {
		$("#time_place").show();
		$("#cal_addr_formal").html ( `${text}` );
		gInviteAddr = text;
	}
}

function addPhoto ( )
{
	$("#image_div").show();
	if ( gTextType == cPostType.LINK ) {
		$("#photo_chooser").hide();
		$("#b_add_photo").hide();
	}
}

function setupComments ( parentID )
{
	var area = $("#comment_list-" + parentID);
	var html = "";
	var list = getCommentList ( parentID );
	var count = list.length;
	var s = "";
	var cancelButt = $(`#b_commentX-${parentID}`);	// cancel button
	
	cancelButt.html ( "Cancel" );					// gets set to "Done" after commenting, so we need to reset it

	if ( count > 0 ) {
		if ( count > 1 ) s = "s";
		$("#b_comment-" + parentID).html ( `${count} Comment${s}` );
		// do comments in chronological order, unlike posts
		//for ( var idx = 0; idx < list.length; idx++ ) {
		for ( var idx = list.length-1; idx >= 0 ; idx-- ) {
			var rec = list[idx];
			var authorID = rec['authorID'];
			var authorName = rec['authorName'];
			var authorHeadline = rec['authorHeadline'];
			var grandparentID = rec['parentID'];
			var title = rec['title'];
			var subtitle = rec['subtitle'];
			var body = rec['body'];
			var when = rec['creation'];
			var link = rec['link'];
			var imageURL = rec['imageURL'];
			var author = { 'posterID':authorID, 'name':authorName, 'headline':authorHeadline };
			if ( !empty(when) ) {
				var jDate = new Date(when);
				var dateStr = day_time ( jDate );
				subtitle = dateStr;
			}

			var postRec = {
				'postID': parentID,
				'parentID': grandparentID,
				'title': title,
				'subtitle': subtitle,
				'body': body,
				'link': link,
				'caption': null,
				'source': null,
				'imageURL': imageURL
			}
			//console.log ( `setupComments: parentID:${parentID} grandParent:${grandparentID}` );
			html += make_full_card ( cPostType.COMMENT, author, rec /*postRec*/, STANDARD, imageURL );
		}
	} else {
		$("#b_comment-" + parentID).html("+Comment");
	}
	area.html ( html );

	return count;
}

function closeComments ( parentID )
{
	var area = $("#comment_list-" + parentID);
	area.hide();
}

function getCommentList ( postID )
{
	var result = [];
	if ( empty(gData.posts) ) return result;
	if ( empty(postID) ) return result;
	var postList = gData.posts.list;
	if ( empty(postList) ) return result;
	for ( var idx = 0; idx < postList.length; idx++ ) {
		var rec = postList[idx];
		if ( !empty(rec) ) {
			var parentID = rec['parentID'];
			var type = rec['type'];
			
			if ( postID == parseInt(parentID) ) {
				result.push ( rec );
			}
		}
 	}
 	return result;
}

$(document).ready(function() {
	//
});


