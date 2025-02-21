
/*
 * 3/22/2023
 *
 * connections.js
 * Support functions for ZIPit connections
 */

cFriendStatus = {
	"NOT_FRIENDS":	0,
	"ACTIVE": 	 	1,
	"REQUESTED": 	2,
	"IGNORED":		3,
	"BLOCKED":	 	4,
	"RECEIVED":	 	5,
	"I_IGNORED":	6,
	"I_BLOCKED":	7,
	"DISCONNECTED":	8,
	"LAST": 99999
};

cFriendStatusKey = {
	0: "NOT_FRIENDS",
	1: "ACTIVE",
	2: "REQUESTED",
	3: "IGNORED",
	4: "BLOCKED",
	5: "RECEIVED",
	6: "I_IGNORED",
	7: "I_BLOCKED",
	8: "DISCONNECTED",
	99999: "LAST"
};

cFriendStatusName = {
	0: "Not Connected",
	1: "Connected",
	2: "Requested",
	3: "Ignored",
	4: "Blocked",
	5: "Requested",
	6: "Ignored by Me",
	7: "Blocked by Me",
	8: "Disconnected",
	99999: "LAST"
};

cFriendRequestResponseVerb = {
	//1: "We're Good",
	//2: "Waiting",
	//3: "Ignored",
	//4: "Blocked",
	5: "+Approve",
	6: "-Ignore",
	7: "-Block",
	8: "-Disconnect"
	//99999: "LAST"		// no, because we iterate this list
};

cFriendRequestResponse = {
	//1: "We're Good",
	//2: "Waiting",
	//3: "Ignored",
	//4: "Blocked",
	"APPROVE_FRIEND":	5,
	"IGNORE": 			6,
	"BLOCK": 			7,
	"DISCONNECTED": 	8
	//"LAST":		99999	// no, because we iterate this list
};

cFriendRequestAfter = {
	//1: "We're Good",
	//2: "Waiting",
	//3: "Ignored",
	//4: "Blocked",
	5: "Approved",
	6: "Ignored",
	7: "Blocked",
	8: "Disconnected",
	99999: "LAST"
};

cFriendRequestVerb = {
	//"ACTIVE":			1,
	//"REMIND":			2,
	//"IGNORED":		3,
	//"BLOCKED":		4,
	"APPROVE_FRIEND": 	5,
	"IGNORE": 			6,
	"BLOCK": 			7,
	"DISCONNECT":		8,
	"LAST":			   99
};

cFriendRequestVerbName = {
	//1: "ACTIVE",
	//2: "REMIND",
	//3: "IGNORED",
	//4: "BLOCKED",
	5: "APPROVE_FRIEND",
	6: "IGNORE",
	7: "BLOCK",
	8: "DISCONNECT",
	99: "LAST"
};

function findFriend ( personID, otherID )
{
	var friend = null;
	var list = null;
	
	if ( personID == 0 || personID == gUID ) {
		list = gData.friends;
	} else {
		if ( !empty(gData.users[personID]) ) {
			var personRec = gData.users[gPersonOfInterestID];
			if ( personID == otherID ) {
				friend = personRec;
			} else {
				list = personRec.friends;
			}
		}
	}
	if ( empty(friend) && !empty(list) ) {
		for ( var idx = 0; idx < list.length; idx++ ) {
			var candidate = list[idx];
			if ( candidate.userID == otherID ) {
				friend = candidate;
				break;
			}
		}
	}
	return friend;
}

function isFriend ( personID, otherID )
{
	var friendStatus = 0;
	var friend = findFriend ( personID, otherID );
	if ( !empty(friend) ) {
		friendStatus = parseInt ( friend.approved );
		if ( friend.approved == cFriendStatus.DISCONNECTED ) {
			friendStatus = 0;	// just show as "not a friend" rather than hostile DISCONNECTED
		}
	}
	return friendStatus;
}

function countFriends ( memberList )
{
	var count = 0;
	if ( !empty(memberList) ) {
		for ( var member of memberList ) {
			var active = 0;
			if ( member.memberState == 'Active' ) active = 1;
			if ( member.memberState == 'Added' ) active = 1;

			// if they've been Added but never accepted the invite, they're not active:
			if ( member.userState == "Invited" ) active = 0;
			// if they're an admin, always count them as active (Steve Glynn):
			//No. if ( isGroupAdmin(member.userID,gGroupOfInterestID) ) active = 1;

			if ( active ) count++;
		}
	}
	return count;
}

function isMyFriend ( otherID )
{
	var friendStatus = isFriend ( 0, otherID );
	
	return friendStatus;
}

// --- group connections (maybe this shouldn't be here; is it even used?)

function findConnection ( uid, gid )
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


function editConnections ( event, invite=0 )
{
	var genID = gGroupOfInterestID; // * 1036;
	var url =`./connections.shtml?gid=${genID}`;
	if ( invite ) url += "&invite=1";
	window.location = url;
}

function performAllConnections ( verb )
{
	for ( var userID in gSelected ) {
		var selected = gSelected[userID];
		if ( selected ) {
			console.log ( `sendSocialRequestToServer ( ${gUID}, ${userID}, ${gGroupOfInterestID}, ${verb} );` );
			sendSocialRequestToServer ( gUID, userID, gGroupOfInterestID, verb );
			if ( verb == "ADMIN_ADD" ) {
				setGroupAdmin ( userID, gGroup, 16 );
			}
			if ( verb == "ADMIN_REM" ) {
				setGroupAdmin ( userID, gGroup, 0 );
			}
		}
	}
	gNonTrivialActions++;
	displayGroupMembers ( gPageType, gUID, gGroup, 0, "" );
	$("#actions").hide();
}

function toggleFriend ( item, pid )
{
	var alreadyFriends = isMyFriend ( pid );
	verb = "CONNECT";
	if ( alreadyFriends ) verb = "DUMP";
	var response = 0;
	var friend = findFriend ( gUID, pid );
	if ( empty(friend) ) {
		var interestRec = gData.users[gPersonOfInterestID];
		if ( !empty(interestRec) ) {
			if ( !empty(interestRec.person) ) {
				if ( interestRec.person.userID == pid ) {
					friend = interestRec.person;
					response = cFriendStatus.REQUESTED;
				}
			}
		}
	}
	if ( !empty(friend) ) {
		friend['approved'] = response;
		if ( verb == "CONNECT" ) {
			response = cFriendStatus.REQUESTED;
			if ( !alreadyFriends ) {	// have to add to gData.friends
				gData.friends.push ( friend );
			}
		}
	}
	refreshSidebarFeatures ( gPageType );
	sendSocialRequestToServer ( gUID, pid, 0, verb );
}

function respondToFriendRequest ( item, pid, which )
{
	var verb = cFriendRequestVerbName[which];
	/*
	var after = cFriendRequestAfter[which];
	var butt = $("#request_status");
	var oldText = $("#request_status").text();
	var newText = cFriendRequestAfter[which];
	$("#request_status").text ( newText );
	butt[0].innerHTML = newText;
	*/
	var response = 0;
	var friend = findFriend ( gUID, pid );
	if ( !empty(friend) ) {
		switch ( parseInt(which) ) {
			case cFriendRequestVerb.APPROVE_FRIEND:	response = cFriendStatus.ACTIVE; break;
			case cFriendRequestVerb.IGNORE: 		response = cFriendStatus.IGNORED; break;
			case cFriendRequestVerb.BLOCK: 			response = cFriendStatus.BLOCKED; break;
			case cFriendRequestVerb.DISCONNECT: 	response = cFriendStatus.DISCONNECTED; break;
		}
		friend['approved'] = response;
	}
	$(".b_request_responder").remove();		// all the possible response buttons
	refreshSidebarFeatures ( gPageType );
	sendSocialRequestToServer ( gUID, pid, 0, verb );
}


