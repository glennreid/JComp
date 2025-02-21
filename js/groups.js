
/*
 * 2/25/2023
 *
 * groups.js
 *
 * Support functions for ZIPit groups
 */

var gShowPending = 0;

const cGroupFlag = {
	"OPEN":					 0,
	"INVITE":	 			 1,
	"GROUP_VISIBLE":		 2,
	"MEMBERS_VISIBLE":		 4,
	"POSTS_VISIBLE_ALL":	 8,
	"PEERS_VISIBLE_GROUP":	16,
	"POSTS_VISIBLE_GROUP":	32,
	"EMAIL_VISIBLE":		64,
	"EMAIL_FORWARD":	   128,
	"LOCAL":			   256,
	"NO_MEMBER_POSTS":	   512,
	"LIMITED":			  1024,
	"TICKETED":			  2048,
	"LAST":	 				99
};

const cGroupFields = {
	'OPEN': 				'ck_open',
	'INVITE': 				'ck_invite',
	'GROUP_VISIBLE':		'ck_visgrp',
	'MEMBERS_VISIBLE': 		'ck_vismem',
	'POSTS_VISIBLE_ALL': 	'ck_vispost_all',
	'PEERS_VISIBLE_GROUP': 	'ck_vispeers_group',
	'POSTS_VISIBLE_GROUP': 	'ck_vispost_group',
	'EMAIL_VISIBLE': 		'ck_visemail',
	'EMAIL_FORWARD': 		'ck_email',
	'LOCAL': 				'ck_local',
	'GLOBAL': 				'ck_global',
	'NO_MEMBER_POSTS': 		'ck_no_member_posts',
	'LIMITED': 				'ck_limited',
	'TICKETED': 			'ck_ticketed',
	'LAST':					''
};

const cTypes = {
	'GROUP': [
			'Discussion', 'Work Group', 'Work Project', 'Management Team', SPACER,
			'Community', 'Shared Interest', 'Networking', 'Happy Hour', 'Reunion', SPACER,
			'Family', 'Close Friends', 'Work Friends', 'Mean Girls', SPACER,
			'School Study Group', 'School Parent Group', 'School Sports', 'Bitch About Life', SPACER,
			'Celebrity', 'Politics', 'Sports', SPACER,
			'Bank Heist', 'Overthrow Government', 'Terrorist Plot',
		],
	'CLIENT': [
			'Consultant', 'Attorney', 'Personal Banker', 'Technology', SPACER,
			'Life Coach', 'Builder', 'Trades', 'Pet Services', SPACER,
			'Restaurant', 'Hair Salon', 'Barber Shop', 'Massage Therapy',
		],
	'MLIST': [
            'Community List', 'Announcements', 'School List', SPACER,
            'Musicians', 'Local Interest', 'Neighborhood List', SPACER,
			'Newsletter', 'Customer List', 'Marketing Leads', 'Scrum List', 'Public Service', 'Other',
		],
	'EVENT': [
			'Conference', 'Convention', 'Presentation', 'Zoom Call', 'Brainstorm', SPACER,
			'Concert', 'Art Opening', 'Reunion', 'Sports', SPACER,
			'Breakfast', 'Lunch', 'Meet & Greet', 'Happy Hour', SPACER,
			'Wedding', 'Graduation', 'Party', 'Play Date', 'Sleepover', 'Church Event',
		],
	'TOPIC': [
			'Conference', 'Presentation', 'Zoom Call', 'Happy Hour', SPACER,
			'Concert', 'Art Opening', 'Sports', SPACER,
			'Wedding', 'Graduation', 'Party', 'Play Date', 'Sleepover', 'Church Event',
		],
};

var gSelected = { };			// key is userID
var gUsers = { };

function groupSettings ( type, category )
{
	var flags = 0;
	var CGF = cGroupFlag;
	
	// start with boilerplate by group type:
	switch ( type ) {
		case 'GROUP':
			flags |= CGF.INVITE | CGF.MEMBERS_VISIBLE | CGF.POSTS_VISIBLE_ALL | CGF.EMAIL_FORWARD;
			break;
		case 'CLIENT':
			flags |= CGF.INVITE | CGF.POSTS_VISIBLE_ALL | CGF.EMAIL_FORWARD;
			break;
		case 'MLIST':
			flags |= CGF.INVITE | CGF.EMAIL_FORWARD;
			break;
		case 'EVENT':
			flags |= CGF.GROUP_VISIBLE | CGF.MEMBERS_VISIBLE | CGF.EMAIL_FORWARD;
			break;
	}
	// refine by specific category:
	switch ( category ) {
		case 'Work Group':
		case 'Work Project':
		case 'Management Team':
			break;
		case 'School Study Group':
		case 'School Parent Group':
		case 'School Sports':
		case 'Bitch About Life':
			flags |= CGF.EMAIL_VISIBLE;
			break;
		case 'Community':
		case 'Shared Interest':
		case 'Happy Hour':
			flags &= ~CGF.INVITE;
			flags |= CGF.GROUP_VISIBLE | CGF.MEMBERS_VISIBLE;
			break;
		case 'Celebrity':
		case 'Politics':
		case 'Sports':
			flags &= ~CGF.INVITE;
			flags |= CGF.GROUP_VISIBLE;
			break;
		case 'Bank Heist':
		case 'Overthrow Government':
		case 'Terrorist Plot':
			flags &= ~ CGF.MEMBERS_VISIBLE;
			break;

		case 'Consultant':
		case 'Attorney':
		case 'Technology':
		case 'Personal Banker':
		case 'Hair Salon':
		case 'Barber Shop':
		case 'Massage Therapy':
			flags &= ~ CGF.MEMBERS_VISIBLE;
			flags &= ~ CGF.EMAIL_VISIBLE;
			flags &= ~ CGF.POSTS_VISIBLE_ALL;
			flags &= ~ CGF.PEERS_VISIBLE_GROUP;
			flags &= ~ CGF.POSTS_VISIBLE_GROUP;
			break;
		case 'Conference':
		case 'Presentation':
		case 'Zoom Call':
			flags |= CGF.MEMBERS_VISIBLE;
			flags &= ~ CGF.EMAIL_VISIBLE;
			break;
		case 'Happy Hour':
		case 'Concert':
		case 'Art Opening':
		case 'Graduation':
			flags |= CGF.MEMBERS_VISIBLE;
			flags &= ~ CGF.EMAIL_VISIBLE;
			break;
		case 'Party':
		case 'Play Date':
		case 'Sleepover':
			flags |= CGF.MEMBERS_VISIBLE;
			flags |= CGF.EMAIL_VISIBLE;
			break;
	}
	return flags;
}

function setSendEmailCheckBox ( onOrOff )
{
	gEmailActiveWithPost = onOrOff;
	var emailCkBox = document.getElementById ( "ck_emailtoo" );
	if ( !empty(emailCkBox) ) {
		emailCkBox.checked = gEmailActiveWithPost;
	}
}

function setupOptionCheckboxes ( flags, editing=0 )
{
	var CGF = cGroupFlag;
	var field;
	var disabled = "";
	var admin = isGroupAdmin ( gUID, gGroupOfInterestID );

	if ( !editing ) {
		$(`.gopt`).attr("disabled", true);
	}
	var click = `onclick='toggleGroupSettings(event);'`;
	var head = `<span id='b_settings' ${click}>Settings&nbsp;&nbsp;&nbsp;&nbsp;</span>`;
	var view = `<span id='b_sets_view' style='font-size: 0.6em' ${click}>`;
		head += `${view}[View]`;
		head += `</span>`;
	if ( admin ) {
		var editor = 'editGroup';
		if ( !empty(gEventID) ) editor = 'editEvent';
		var link =  `<span id='link_edit' title='[Edit]' style='font-size: 0.6em' onclick='${editor}(event);'>`;
		link += ` ✏️ `;
		link += `</span>`;
		head += "<span class='hspace'></span>";
		head += link;
	}
	if ( gGroup.category == 'TOPIC' ) {
		$("#group_settings_head").html ( "Trending" );
	} else {
		$("#group_settings_head").html ( head );
	}
	// ck_invite ck_open ck_local ck_visgrp ck_vismem ck_vispost ...
	if ( !empty(document.getElementById(cGroupFields.OPEN)) )
	  document.getElementById(cGroupFields.OPEN).checked = 				!(flags & CGF.INVITE);

	if ( !empty(document.getElementById(cGroupFields.INVITE)) )
	  document.getElementById(cGroupFields.INVITE).checked = 				flags & CGF.INVITE;

	if ( !empty(document.getElementById(cGroupFields.GROUP_VISIBLE)) )
	  document.getElementById(cGroupFields.GROUP_VISIBLE).checked = 		flags & CGF.GROUP_VISIBLE;

	if ( !empty(document.getElementById(cGroupFields.MEMBERS_VISIBLE)) )
	  document.getElementById(cGroupFields.MEMBERS_VISIBLE).checked = 		flags & CGF.MEMBERS_VISIBLE;

	if ( !empty(document.getElementById(cGroupFields.POSTS_VISIBLE_ALL)) )
	  document.getElementById(cGroupFields.POSTS_VISIBLE_ALL).checked = 	flags & CGF.POSTS_VISIBLE_ALL;

	if ( !empty(document.getElementById(cGroupFields.PEERS_VISIBLE_GROUP)) )
	  document.getElementById(cGroupFields.PEERS_VISIBLE_GROUP).checked = 	flags & CGF.PEERS_VISIBLE_GROUP;

	if ( !empty(document.getElementById(cGroupFields.POSTS_VISIBLE_GROUP)) )
	  document.getElementById(cGroupFields.POSTS_VISIBLE_GROUP).checked = 	flags & CGF.POSTS_VISIBLE_GROUP;

	if ( !empty(document.getElementById(cGroupFields.EMAIL_VISIBLE)) )
	  document.getElementById(cGroupFields.EMAIL_VISIBLE).checked = 		flags & CGF.EMAIL_VISIBLE;

	if ( !empty(document.getElementById(cGroupFields.EMAIL_FORWARD)) )
	  document.getElementById(cGroupFields.EMAIL_FORWARD).checked = 		flags & CGF.EMAIL_FORWARD;

	if ( !empty(document.getElementById(cGroupFields.LOCAL)) )
	  document.getElementById(cGroupFields.LOCAL).checked = 				flags & CGF.LOCAL;
	if ( !empty(document.getElementById(cGroupFields.GLOBAL)) )
	  document.getElementById(cGroupFields.GLOBAL).checked = 				!(flags & CGF.LOCAL);

	if ( !empty(document.getElementById(cGroupFields.NO_MEMBER_POSTS)) )
	  document.getElementById(cGroupFields.NO_MEMBER_POSTS).checked = 		flags & CGF.NO_MEMBER_POSTS;


	if ( !empty(document.getElementById(cGroupFields.LIMITED)) )
	  document.getElementById(cGroupFields.LIMITED).checked = 				flags & CGF.LIMITED;

	if ( !empty(document.getElementById(cGroupFields.TICKETED)) )
	  document.getElementById(cGroupFields.TICKETED).checked = 				flags & CGF.TICKETED;

	var emailCkBox = document.getElementById ( "ck_emailtoo" );
	if ( !empty(emailCkBox) ) {
		emailCkBox.checked = gEmailActiveWithPost;
	}
}

function isGroupAdmin ( uid, gid )
{
	var admin = false;
	if ( empty(uid) || empty(gid) ) return false;

	var group = loadGroup ( gid );
	if ( !empty(group) ) {
		if ( uid == group.ownerID ) admin = true;
		if ( !admin ) {
			var member = findMember ( uid, gid );
			if ( !empty(member) ) {
				var roles = parseInt ( member.roles );
				if ( roles >= 16 ) admin = true;
			}
		}
	}
	//if ( uid == 6 ) admin = true;	// Glenn :)
	
	return admin;
}

function setGroupAdmin ( uid, group, state )
{
	var member = findMember ( uid, group.groupID );
	if ( !empty(member) ) {
		member.roles = state;
	}
}

function countMyGroups ( )
{
	var total = 0;
	if ( !empty(gData.groups) ) {
		for ( const group of gData.groups ) {
			if ( isGroupAdmin(gUID,group.groupID) ) {
				total++;
			}
		}
	}
	return total;
}

function findMember ( uid, gid )
{
	var member = null;
	var group = loadGroup ( gid );;
	
	if ( !empty(group) ) {
		var list = group.members;
		if ( !empty(list) ) {
			for ( var idx = 0; idx < list.length; idx++ ) {
				var candidate = list[idx];
				if ( !empty(candidate) ) {
					if ( uid == candidate['userID'] ) {
						member = candidate;
						break;
					}
				}
			}
		}
	}
	return member;
}

function userMemberState ( uid, gid )
{
	var memberState = "Unknown";
	var member = findMember ( uid, gid );

	if ( !empty(member) ) {
		//if ( uid == member['userID'] ) {	// findMember ensures this
			memberState = member['memberState'];
		//}
	}
	return memberState;
}

function setMemberState ( uid, gid, state )
{
	var memberState = "Unknown";
	var member = findMember ( uid, gid );

	if ( !empty(member) ) {
		member['memberState'] = state;
	}
}

function userIsValidMember ( uid, gid )
{
	var valid = 0;
	var memberState = userMemberState ( uid, gid );
	var member = findMember ( uid, gid );

	if ( memberState == "Active" ) valid = 1;
	if ( memberState == "Invited" ) valid = 1;
	if ( memberState == "Reminded" ) valid = 1;
	if ( memberState == "Added" ) valid = 1;
	return valid;
}

function userIsActiveMember ( uid, gid )
{
	var active = 0;
	var memberState = userMemberState ( uid, gid );
	var member = findMember ( uid, gid );

	if ( memberState == "Active" ) active = 1;
	if ( memberState == "Added" ) active = 1;
	if ( isGroupAdmin(uid, gid) ) active = 1;
	
	if ( member.userState == "Invited" ) active = 0;
	
	return active;
}

function countActiveMembers ( list )
{
	var count = 0;
	if ( !empty(list) ) {
		for ( var member of list ) {
			var active = 0;
			if ( list == gData.friends ) {
				let friendStatus = parseInt ( member.approved );
				switch ( friendStatus ) {
					case cFriendStatus.NOT_FRIENDS:
					case cFriendStatus.ACTIVE:
					case cFriendStatus.REQUESTED:
					case cFriendStatus.RECEIVED:
						active = 1;
						break;
					case cFriendStatus.IGNORED:
					case cFriendStatus.BLOCKED:
					case cFriendStatus.I_IGNORED:
					case cFriendStatus.DISCONNECTED:
						active = 0;
						break;
				}
			} else {
				if ( member.memberState == 'Active' ) active = 1;
				if ( member.memberState == 'Added' ) active = 1;

				// if they've been Added but never accepted the invite, they're not active:
				if ( member.userState == "Invited" ) active = 0;
				// if they're an admin, always count them as active (Steve Glynn):
				//No. if ( isGroupAdmin(member.userID,gGroupOfInterestID) ) active = 1;
			}
			if ( active ) count++;
		}
	}
	return count;
}

function groupMembersVisible ( uid, group )
{
	var display = false;
	if ( !empty(group) ) {
		if ( group.flags & cGroupFlag.MEMBERS_VISIBLE ) {
			return true;
		}
		if ( isGroupAdmin(uid, group.groupID) ) {
			return true;
		}
		if ( userIsValidMember(uid, group.groupID) ) {
			return true;
		}
		if ( group.category == 'TOPIC' ) {
			return false;
		}
	}
	
	return false;
}

function groupOpenInvite ( code )
{
	var isOpenInvite = 0;
	var params = decode_params ( code );
	if ( !empty(params) ) {
		if ( !empty(params.gid) ) {
			if ( empty(params.pid) ) isOpenInvite = 1;
		}
	}
	return isOpenInvite;
}

function displayGroupMembers ( pageType, uid, group, invites=1, title="Member", max=0, fields=cFieldsBASIC )
{
	var style = `topic pct90 right accent rt`;
	var params = { 'style':style, 'invites':invites, 'select':0, 'includeEmail':0, 'includeAddress':0, 'showMugs':1, 'allowEdits':0 };
	var html = "";
	var heading = "";
	var isAdmin = isGroupAdmin(gUID, gGroupOfInterestID);
	if ( invites ) {
		var box = `<span class='ckleft'><input type='checkbox' class='ckb' `;
		box += `id='select_all' `;
		box += `onclick='selectMany(event,gGroup.members,this,1);' /></span>`;
		heading += box;
	}
	if ( pageType == cPage.MEMBERS ) {
		params.select = 1;
		params.includeEmail = 1;
		params.includeAddress = 1;
		//params.showMugs = 0;
		params.allowEdits = 1;
	}
	html += buildGroupMemberList ( pageType, params, max, fields );	// uses gGroup
	if ( !empty(params['totalDisplayed']) ) {
		let displayed = params['totalDisplayed'];
		let s = 's';
		if ( displayed == 1 ) s = '';
		heading = `${displayed} ${title}${s}`;
		if ( !empty(group) && !empty(group.members) ) {
			let total = group.members.length;
			if ( total == 1 ) s = '';
			if ( total > displayed ) {
				heading = `${displayed} Displayed of ${total} Total ${title}${s}`;
			}
		}
	} else {
		heading = `${title}`;
	}
	let add = `<span class='ptr smaller' onclick='newUser(event);'>[+Add]</span>`;
	$("#member_list_header").html ( `${heading} ${add}` );
	$("#member_list_div").html ( html );
}

function displayAttendees ( pageType, uid, event, invites=1, title="Attendees", max=0 )
{
	var style = `topic pct90 right accent rt`;
	var params = { 'style':style, 'invites':invites, 'select':0, 'includeEmail':0 };
	var html = "";
	var heading = "";
	var isAdmin = isGroupAdmin(gUID, gGroupOfInterestID);
	if ( invites ) {
		var box = `<span class='ckleft'><input type='checkbox' class='ckb' `;
		box += `id='select_all' `;
		box += `onclick='selectMany(event,gEvent.attendees,this,1);' /></span>`;
		heading += box;
	}
	if ( !empty(title) ) {
		heading += ` ${title}`;
	}
	if ( pageType == cPage.MEMBERS ) {
		params.select = 1;
		params.includeEmail = 1;
		params.showMugs = 1;
	}
	html += buildAttendeeList ( gEventID, params );

	$("#member_list_header").html ( heading );
	$("#member_list_div").html ( html );
}

function editGroup ( browser_event )
{
	var genID = gGroupOfInterestID; // * 1036;
	var url =`./edit.shtml?gid=${genID}`;
	window.location = url;
}

function editEvent ( browser_event )
{
	var url =`./edit.shtml?eid=${gEventID}`;
	window.location = url;
}

function viewMembers ( event, invite=0 )
{
	var genID = gGroupOfInterestID; // * 1036;
	var url =`./members.shtml?gid=${genID}`;
	if ( invite ) url += "&invite=1";
	window.location = url;
}

function toggleGroupSettings ( event )
{
	var area = $("#group_settings");
	if ( !empty(area) ) {
		var isVisible = area.is(":visible");
		if ( isVisible ) {
			area.hide ( 500, "swing");
			$("#b_sets_view").html ( "[View]" );
		} else {
			area.show ( 500, "swing");
			$("#b_sets_view").html ( "[Hide]" );
		}
	}
}

function getTopicAreas()
{
	var list = [];
	
	if ( !empty(gData.topic_areas) ) {
		for ( var idx = 0; idx < gData.topic_areas.length; idx++ ) {
			var topic = gData.topic_areas[idx];
			if ( !empty(topic) ) {
				list.push ( topic.title );
			}
		}
	}
	
	return list;
}

function performAction ( verb, userID )
{
	if ( !userID ) {
		console.log ( `No userID specified for ${verb}` );
		//console.log ( `sendSocialRequestToServer ( ${gUID}, ${userID}, ${gGroupOfInterestID}, ${verb} );` );
		return;
	}
	sendSocialRequestToServer ( gUID, userID, gGroupOfInterestID, verb );
	if ( verb == "ADMIN_ADD" ) {
		setGroupAdmin ( userID, gGroup, 16 );
		$("#b_admin_add").html ( "Remove Admin" );
	}
	if ( verb == "ADMIN_REM" ) {
		setGroupAdmin ( userID, gGroup, 0 );
		$("#b_admin_add").html ( "Make Admin" );
	}
	if ( verb == "APPROVE_MEMBER" ) {
		setMemberState ( userID, gGroupOfInterestID, "Active" );
	}
}

function performAll ( verb )
{
	for ( var userID in gSelected ) {
		var selected = gSelected[userID];
		if ( selected ) {
			performAction ( verb, userID );
		}
	}
	gNonTrivialActions++;
	$("#actions").hide();
}

function opt_out ( uid, gid, reason="" )
{
	if ( reason == "EMAIL" ) {
		//console.log ( `optOutEmail ( ${uid}, ${uid}, ${gid} );` );
		optOutEmail ( uid, uid, gid, reason );
	} else {
		console.log ( `removeFromGroup ( ${uid}, ${uid}, ${gid} );` );
		removeFromGroup ( uid, uid, gid, reason );
	}
}

function createGroup ( gid )
{
}

function joinGroup ( gid )
{
	if ( !empty(gUID) ) {
		sendSocialRequestToServer ( gUID, 0, gid, "JOIN" );
		updateSocialUI ( gPageType );
	} else {
		var msg = `You have to sign up first, before you can join '${gGroup.title}'`;
		var action = "JOIN";
		joinFirst ( gid, action, msg );
	}
}

function askToJoin ( gid )
{
	if ( !empty(gUID) ) {
		sendSocialRequestToServer ( gUID, 0, gid, "ASKJOIN" );
		updateSocialUI ( gPageType );
	} else {
		var msg = `You have to sign up first, before you can join '${gGroup.title}'`;
		var action = "JOIN";
		joinFirst ( gid, action, msg );
	}
}

function followGroup ( gid )
{
	if ( !empty(gUID) ) {
		sendSocialRequestToServer ( gUID, 0, gid, "FOLLOW" );
		updateSocialUI ( gPageType );
	} else {
		var msg = `You have to join first, before you can Follow '${gGroup.title}'`;
		var action = "FOLLOW";
		joinFirst ( gid, action, msg );
	}
}

function joinFirst ( gid, action, message )
{
	var msg = encodeURIComponent ( message );
	var url = `/account/create.shtml?gid=${gid}&action=${action}&msg=${msg}`;
	window.location = url;
}

function inviteGroup ( gid )
{
	sendSocialRequestToServer ( gUID, 0, gGroupOfInterestID, "INVITE" );
}

function leaveGroup ( gid )
{
	sendSocialRequestToServer ( gUID, 0, gGroupOfInterestID, "LEAVE" );
}

function optOutEmail ( uid, otherID, gid, reason )
{
	sendSocialRequestToServer ( uid, otherID, gid, "NO_EMAIL" );
}

function removeFromGroup ( uid, otherID, gid, reason )
{
	sendSocialRequestToServer ( uid, otherID, gid, reason );
}

