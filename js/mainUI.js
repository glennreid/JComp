
/*
 * 2/15/2023
 *
 * mainUI.js
 *
 * Main user interface - data structures and interaction with DOM
 *
 */

var gRadius = 100; 	// miles
var gPageName = "Home";
var gSheetTimer = null;

var sSideBarLimit = 24;		// max detail items in side bar before [...]

if ( typeof gUID === "undefined" ) {
	var gUID = 0;
	var gServer = "stage.zipit.social";
	var gPersonOfInterestID = 0;
	var gGroupOfInterestID = 0;
	var gName = {
		'me': {	'first': "", 'last': "" },
		'interest': { 'first': "", 'last': "" },
	};
}

function showBar ( which )
{
	var bar = document.getElementById ( `bar-${which}` );
	var state = bar.style.display;
	$('.drop_sheet').hide();
	$('#bar-top').hide();
	$('#bar-left').hide();
	$('#bar-right').hide();
	$('#bar-bottom').hide();
	if ( state != 'block' ) {
		$(`#bar-${which}`).show ( 500, "swing", function() {
			//window.setTimeout ( focusText($("#edit_title")), 1000 );
		});
	}
}

function closeBar ( which )
{
	$(`#bar-${which}`).hide ( 250, "swing", function() {
		//window.setTimeout ( focusText($("#edit_title")), 1000 );
	});
}

function hitSide ( which )
{
	if ( is_mobile() ) {
		showBar ( which );	// toggle it off again
	}
}

function idleForAWhile ( sheet )
{
	closeMenuSheet ( sheet );
}

var sSheetHeight = 0;

function showMenuSheet ( which, height=130 )
{
	var bar = document.getElementById ( `bar-${which}` );
	var button = document.getElementById ( `show-${which}` );
	var state = bar.style.display;
	if ( which == 'filter' ) height = 225;
	if ( is_mobile() ) {
		height += 20;	//spacing thing
		$('#bar-left').hide();
		$('#bar-right').hide();
		$('#bar-bottom').hide();
	}
	if ( state != 'block' ) {
		var heightStr = `${height}px`;
		$('.drop_sheet').hide();
		bar.style.display = 'block';
		if ( !is_mobile() && (which == 'filter' || which == 'explore') ) {
			var buttbox = button.getBoundingClientRect();
			var bLeft = parseInt ( buttbox.left );
			bar.style.left = `${bLeft}px`;
			//bar.style.width = `35%`; // `400px`;
		}
		if ( which == 'account' ) {
			bar.style.left = `auto`;
			bar.style.right = `38px`;
			bar.style.width = `100px`;
		}
		if ( which != 'postX' ) {
			bar.style.height = 0;
			$(`#bar-${which}`).animate ( { height: heightStr }, 500 );
		} else {
			$(`#bar-${which}`).show();
			sSheetHeight = bar.getBoundingClientRect().height;
		}
		//gSheetTimer = setTimeout ( function() { idleForAWhile(which); }, 5000 );		// 5 seconds
	} else {
		closeMenuSheet ( which );
		//var elem = $(`#bar-${which}`);
		//elem.animate ( { height: '0px'}, 500, function() { elem.hide();  });
	}
}

function showExplore (  )
{
	//gShowMap = 1;
	showHideMap ( );
	updateSocialUI ( gPageType );
}

function gotoURL ( url, tab=null )
{
	if ( !empty(tab) ) {
		window.open ( url, tab );
	} else {
		window.location = url;
	}
}

function gotoPage ( page, args="" )
{
	if ( empty(args) ) {
		if ( page.includes('groups') && gGroupOfInterestID ) args = `?gid=${gGroupOfInterestID}`;
	}
	var url = `https://${gServer}/${page}.shtml${args}`;
	if ( gServer == 'stage.zipit.social' ) url = `../${page}.shtml${args}`;
	window.location = url;
}

function closeMenuSheet ( which )
{
	var elem = $(`#bar-${which}`);
	elem.animate ( { height: '0px'}, 500, function () {
		elem.hide();
	});
}

function refreshZipCodeList ( listJQ )
{

	if ( (gUID != 6) ) {
		listJQ.hide();
		return;
	}
	
	var html = "";
	var zip = "";
	listJQ.empty();
	var list = listJQ[0];
	var opt = null;
	var selectZip = gLoc.view.zip;
	if ( gLocHistory.length > 1 ) {
		for ( var idx = gLocHistory.length - 1; idx >= 0; idx-- ) {		// reverse order
			var rec = gLocHistory[idx];
			if ( empty(zip) ) zip = rec.zip;		// save to select it in the list
			opt = `<option value='${rec.zip}'>${rec.zip} - ${rec.city}</option>`;
			listJQ.append ( opt );
			//what?! if ( idx == gLocHistory.length-2 ) selectZip = rec.zip;
		}
		opt = `<option disabled value="———">———</option>`;
		listJQ.append ( opt );
		opt = `<option value='CURR'>My Current Location</option>`;
		listJQ.append ( opt );
		if ( empty(selectZip) ) selectZip = zip;
		listJQ.val ( selectZip );
		listJQ.show();
	} else {
		listJQ.hide();
	}
}

function updateLocationUI ( page="All" )
{
	// VIEW first -- what we're actually looking at (home town)
	var stats = "";
	var str = "" + gLoc.view.lat + ", " + gLoc.view.lng;
	$("#field_latlng").html ( str );
	var city = "Finding...";
	var zip = "";

	if ( gBrowserLocation && empty(gLoc.view.lat) ) {
		findMyself();
	}
	if ( !gBigLocationChange ) {
		if ( !empty(gLoc.view) && !empty(gLoc.view.city) ) {
			city = gLoc.view.city;
			zip =  gLoc.view.zip;
			refreshZipCodeList ( $("#zip_list") );
		} else {
			if ( !empty(gMe) && (!empty(gMe.zip) || !empty(gMe.lat)) ) {
				city = gMe.city;
				zip = gMe.zip;
				rememberLocation ( gMe );
				refreshZipCodeList ( $("#zip_list") );
			}
		}
	}
	$("#field_city").html ( city );
	$("#field_zip").html ( zip );
	if ( !empty(gLoc.view.region) ) {
		stats += "&nbsp;&nbsp;&nbsp; Region: " + gLoc.view.region;
	}
	if ( !empty(gLoc.view.population) ) {
		stats += "&nbsp;&nbsp; Population: " + commas(gLoc.view.population);
	}
	// https://www.wikidata.org/wiki/Q169943
	if ( !empty(gLoc.view.wikiDataId) ) {
		var wikiID = gLoc.view.wikiDataId;
		stats += "&nbsp;&nbsp;&nbsp;";
		stats += "<a href='https://www.wikidata.org/wiki/";
		stats += gLoc.view.wikiDataId;
		stats += "' target='_citydata'>[info]</a>";
	}
	$("#field_stats").html ( stats );
	/* not sure about this
	if ( empty(gLoc.view.zip) || gLoc.view.zip != gRelevantZip ) {
		if ( empty(gLoc.view.zip) ) {
			gLoc.view.zip = gRelevantZip;
		} else {
			gRelevantZip = gLoc.view.zip;
		}
		$("#field_zip").html ( gLoc.view.zip );
		if ( !empty($("#zip_list")) ) {
			//$("#zip_list")[0].value = gLoc.view.zip;
		}
		if ( empty(gLocalTest) ) {
			gData.refreshZipCode = 1;
			if ( gData.timer ) clearTimeout ( gData.timer );
			gData.timer = setTimeout(function() {
				refreshFeedData ( DATA_FORCE );
			}, 3000);
			//gData.timer = setTimeout ( refreshFeedData, 3000 );
		}
	}
	*/
	// CURR location (browser, IP address, where you actually are)
	str = "";
	if ( !empty(gLoc.curr.zip) ) {
		if ( gLoc.curr.zip != gLoc.view.zip ) {
			str += "<span style='font-size:0.75em'>Browser thinks you are in: </span>";
			str += gLoc.curr.zip;
			if ( !empty(gLoc.curr.city) ) {
				str += " " + gLoc.curr.city;
			}
			if ( !empty(gLoc.curr.region) ) {
				str += ", " + gLoc.curr.region;
			}
		}
	}
	$("#field_location").html ( str );
}

function updateSocialUI ( pageType, reactType=0, retry=0 )
{
	var list = null;
	var showLeftBar = 1, showRightBar = 1;
	var params = `?zip=${gMe.zip}`;
	var isAdmin = 0;

	if ( pageType == WEATHER_CARD ) {
		var str = "";
		switch ( reactType ) {
			case cReactions.LIKE: 		str += "Not bad."; break;
			case cReactions.DISLIKE:	str += "Sorta shitty."; break;
			case cReactions.LOVE: 		str += "Right?! It's awesome!"; break;
			case cReactions.LOATHE: 	str += "Right?! It sucks!"; break;
			default: str += "Yeah."; break;
		}
		$("#weather_comment").html ( str );
		return;
	}
	if ( pageType == cPage.HISTORY ) {
		showLeftBar = 0;
		showRightBar = 0;
	}
	if ( isGroupType(pageType) || pageType == cPage.EVENT ) {
		if ( empty(gGroup) || empty(gGroup.title) ) {
			if ( !empty(gData.groups) ) {
				var group = loadGroup ( gGroupOfInterestID );
				if ( !empty(group) ) gGroup = group;
			} else { // we don't have the group data from the server yet; retry
				if ( retry > 5 ) { console.log ( "updateSocialUI(cPage.GROUP) sees empty(gGroup)" ); return; }
				setTimeout(function() { updateSocialUI ( pageType, reactType, retry+1 ); }, 500 * retry);
				return;
			}
		}
	}
	isAdmin = isGroupAdmin ( gUID, gGroupOfInterestID );

	if ( pageType == cPage.ME ) {
		if ( gPersonOfInterestID ) {
			if ( empty(gData.users[gPersonOfInterestID]) ) {
				if ( retry > 5 ) { console.log ( "updateSocialUI(cPage.GROUP) sees empty(gGroup)" ); return; }
				setTimeout(function() { updateSocialUI ( pageType, reactType, retry+1 ); }, 500 * retry);
				return;
			}
		}
	}
	if ( showLeftBar ) {
		refreshSidebarFeatures ( pageType );
	}
	// right side bar
	if ( showRightBar ) {
		html = "";
		
		if ( isGroupType(pageType) && pageType != cPage.TOPIC ) {		// else it gets displayed in the right bar
			var menuSection = "Follow";
			var menuVerb = "+Follow";
			var proc = "followGroup";
			var myState = userMemberState ( gUID, gGroupOfInterestID );
			var active = userIsValidMember ( gUID, gGroupOfInterestID );
			var displayedJoinBlock = 0;
			if ( isAdmin ) {
				menuSection = `<span class='darkred'>You are an Admin</span>`;
				menuVerb = `-Leave Group`;
				proc = 'leaveGroup';
			} else if ( active ) {
				menuSection = `You are a Member`;
				menuVerb = `-Leave Group`;
				proc = 'leaveGroup';
				if ( gPageType == cPage.TOPIC ) {
					menuSection = `Following`;
					menuVerb = `-Unfollow`;
				}
			} else if ( !empty(myState) ) {
				menuSection = `Join`;
				menuVerb = `+Join Group`;
				proc = 'joinGroup';
				if ( gGroup.flags & cGroupFlag.INVITE ) {
					proc = 'askToJoin';
					menuVerb = `+Ask to Join Group`;
				}
				if ( myState == "Left" ) {
					menuSection = `You Left This Group`;
					menuVerb = `+Rejoin`;
				} else if ( myState == "Asked" ) {
					menuSection = `Pending Join`;
					menuVerb = `-Withdraw Request`;
					proc = 'leaveGroup';
				} else if ( myState == "Blocked" ) {
					menuSection = `You are Blocked`;
					menuVerb = `Oh for Fuck's Sake`;
					proc = 'leaveGroup';
				}
			} else {
				if ( gPageType == cPage.TOPIC ) {
					// defaults from above
				} else {
					menuSection = `Join`;
					menuVerb = `+Join Group`;
					proc = 'joinGroup';
					if ( gGroup.flags & cGroupFlag.INVITE ) {
						menuVerb = `+Ask to Join`;
						proc = 'askToJoin';
					}
				}
			}
			//if ( is_mobile() || gPageType == cPage.TOPIC ) {
				html += `<div class='sect_head' id='title_join'>${menuSection}</div>`;
				html += `  <div id='b_join' class='topic pct90 accent rt darkred'`;
				html += ` onclick='${proc}(${gGroupOfInterestID});'>`;
				html += `${menuVerb}</div>`;
				displayedJoinBlock = 1;
			//}
		}
		if ( pageType == cPage.TOPIC ) {
			var lname = "Other Topics";
			var style = `topic pct90 accent`;
			html += `<div class='bar_cat bc_right'>${lname}</div>`;
			html += buildTopicList ( style );
		} else if ( isGroupType(pageType) ) {
			if ( pageType == cPage.TOPIC ) {
				// what do we do here?
			} else {
				var list = gGroup.members;
				var colAlign = cAlign.LEFT;
				if ( is_mobile() ) colAlign = cAlign.RIGHT;
				if ( !empty(list) ) {
					var lname = `${list.length} Members`;
					if ( groupMembersVisible(gUID, gGroup) ) {
						var style = `topic pct90 accent`;
						var link = `<span title='[View]' id='link_edit' style='font-size: 0.6em' onclick='viewMembers(event);'>`;
						if ( isAdmin ) {
							link = `<span title='[Edit]' id='link_edit' style='font-size: 0.6em' onclick='viewMembers(event);'>`;
							link += `[View] ✏️ </span>`;
						} else {
							link += `[View]</span>`;
						}
						lname += "&nbsp;&nbsp;";
						lname += link;
					}
					html += `<div class='sect_head'>${lname}</div>`;
					var params = { 'style':style, 'select':0, 'align':colAlign };
					var max = gGroupSidebarMax;
					if ( is_mobile() ) max = 5;
					html += buildGroupMemberList ( pageType, params, max );	// uses gGroup
				}
			}
		} else if ( pageType == cPage.ME ) {
			var lname = "Connections";
			var params = { 'select':0, 'align':cAlign.LEFT };
			var max = 25;
			if ( gPersonOfInterestID ) {
				lname = `${gName.interest.first}'s Connections`;
			}
			html += `<div class='bar_cat bc_right'>${lname}</div>`;
			html += buildFriendsList ( gPersonOfInterestID, params );
		} else if ( pageType == cPage.LAST ) {		// fake, just holding Friends list for now [3/18]
			var lname = "Connections";
			var params = { 'select':0, 'align':cAlign.LEFT };
			html += `<div class='bar_cat bc_right'>${lname}</div>`;
			html += buildFriendsList ( gPersonOfInterestID, params );
		} else if ( pageType == cPage.PHOTO ) {
			// setup for Photo viewer
		} else if ( pageType == cPage.EVENT ) {
			// setup for Events
			if ( !empty(gEventID) ) {
				lname = `Attendees`;
				html += `<div class='bar_cat bc_right'>${lname}</div>`;
				var params = { 'select':0, 'align':colAlign, 'invites':0 };
				var max = 25;
				if ( is_mobile() ) max = 5;
				//html += buildGroupMemberList ( pageType, params, max );	// uses gGroup
				html += buildAttendeeList ( gEventID, params, 5 );
			}
		} else {
			var lname = "Topics";
			var style = `topic pct90 accent`;
			var params = { 'style':style, 'select':0, 'align':cAlign.LEFT };
			html += `<div class='bar_cat bc_right'>${lname}</div>`;
			html += buildTopicList ( style );

			let whoseFriends = gUID;
			if ( gPersonOfInterestID ) {
				whoseFriends = gPersonOfInterestID;
				lname = `${gName.interest.first}'s Connections`;
			}
			lname = "Connections";
			html += `<div class='bar_cat bc_right'>${lname}</div>`;
			html += buildFriendsList ( whoseFriends, params );
		}
		$("#right-list").html ( html );
		$("#right-list-drop").html ( html );
	}
	/*
	list = gData.topics;
	if ( !empty(list) ) {
		var str = "<div>";
		for ( var idx = 0; idx < list.length; idx++ ) {
			var topic = list[idx];
			str += "<div class='topic'>" + topic.title + "</div>";
		}
		str += "</div>";
		$("#right-list").html ( str );
		$("#right-list-drop").html ( str );
	}
	*/
}

function refreshSidebarFeatures ( pageType )
{
	var html = "";
	var lname = "";
	var style = `topic pct90 accent rt`;

	if ( isGroupType(pageType) ) {
		html += buildGroupFeatureList ( style );
	} else if ( pageType == cPage.EVENT ) {
		html += buildEventFeatures ( style );
	} else {
		html += buildFeatureList ( style );
	}
	$("#left-list").html ( html );
	$("#left-list-drop").html ( html );
}

function setupUser ()
{
	if ( !empty(gUrlProfile) ) {
		var user_img = document.getElementById ( 'user_bar_img' );
		if ( !empty(user_img) ) user_img.src = gUrlProfile;
		user_img = document.getElementById ( 'user_img' );
		if ( !empty(user_img) ) user_img.src = gUrlProfile;
	}
	if ( !empty(gUID) ) {
		var user_banner = document.getElementById ( 'user_banner' );
		if ( !empty(user_banner) ) {
			if ( !empty(gUrlBanner) ) {
				user_img.src = gUrlBanner;
			}
		}
	} else {
	}
	//$("#acct_img").attr ( 'src', gUrlProfile );
	$("#acct_img").attr ( 'src', `https://files.zipit.social/uimg/${gUID}` );
	$("#acct_name").html ( gName.me.full );
	
	$("#img_profile").attr ( 'src', gUrlProfile );
	$("#img_banner").attr  ( 'src', gUrlBanner );

	$("#headline").html ( gName.me.headline );
	$("#about").html ( html_paragraph(gName.me.about) );
}

var sDidButtons = 0;

function chooseHomeIcon()
{
	var home_icon = document.getElementById("home_img");
	if ( is_mobile() ) {
		if ( gServer.includes("stage") ) {
			home_icon.src = "../icon/home_red.png";
		} else {
			home_icon.src = "../icon/home.png";
		}
		home_icon.width = 48;
		home_icon.height = 48;
		home_icon.removeAttribute("style");
	} else {
		home_icon.src = "../main/img/logo-small.png";
		//home_icon.height = 48;
		home_icon.setAttribute("style","height:52px");
		home_icon.setAttribute("style","width:100%");
		//home_icon.width = 48;
		//home_icon.height = 48;
	}
}

function setupPage ( pageType, retry=0 )
{
	showHideButtons();
	chooseHomeIcon();
	window.addEventListener('resize', function(event) {
		chooseHomeIcon();
	});
	if ( empty(gUID) ) {		// anonymous user
		$("#show-post").hide();
		$("#show-join").show();
		$("#show-login").show();
		$("#acct_name").hide();
		$("#acct_img").hide();
		$("#b_upload").hide();
		$("#b_add_file").hide();
	} else {
		$("#show-join").hide();
		$("#show-login").hide();
	}
	if ( pageType != cPage.HOME ) {
		//$("#haut").hide();
		$("#show-filter").hide();
		$("#show-explore").hide();
		$("#show-post").hide();
	}
	//$("#show-filter").hide();
	//$("#show-explore").hide();
	if ( pageType == cPage.HOME ) {
		// HOME does not mean user home, it means main feed.
		if ( !empty($("#field_bar_username")) ) $("#field_bar_username").html ( gName.me.full );
		if ( !empty($("#field_username")) ) $("#field_username").html ( gName.me.full );
		$("#invite_box").hide();
		showHideMap ( JUST_UI );
	}
	if ( pageType == cPage.ME ) {
		var viewID = gPersonOfInterestID;
		if ( empty(viewID) ) viewID = gUID;
		var profile_url = make_user_url(viewID,0,"USER_PROFILE");
		var banner_url = make_user_url(viewID,0,"USER_BANNER");
		var banner_area = make_banner_area ( banner_url );
		if ( !empty(gName.interest.userID) ) viewID = gName.interest.userID;
		$("#map_box").height(520);
		$("#map_box").html ( banner_area );
		//$("#post_box").hide();
		$("#new_post_title").html ( `Private Conversation with <span class='darkred'>${gName.interest.first}</span>` );
		if ( !empty($("#field_bar_username")) ) $("#field_bar_username").html ( gName.interest.full );
		if ( !empty($("#field_username")) ) $("#field_username").html ( gName.interest.full );
		if ( !empty($("#field_headline")) ) $("#field_headline").html ( gName.interest.headline );
		if ( !empty($("#field_about")) ) {
			var txt = html_paragraph ( gName.interest.about );
			txt = filter_body ( txt );
			txt = makeReadMore ( txt, `${gPersonOfInterestID}`, 0, 1 );
			$("#field_about").html ( txt );
		}
		var profile = $("#user_img");
		var banner = $("#img_banner");
		$("#user_bar_img").attr ( 'src', profile_url );
		$("#user_img").attr ( 'src', profile_url );
		//banner.attr  ( 'src', banner_url );
		document.title = "ZIPit - " + gName.interest.full;
		if ( !empty(gLocalTest) ) document.title += " LOC";
	}
	if ( pageType == cPage.POST ) {
		$("#map_box").hide();
		$("#left-column").hide();
		$("#right-column").hide();
		$("#field_latlng").hide();
	}
	if ( isGroupType(pageType) || pageType == cPage.EVENT ) {
		let banner = $("#img_banner")[0];
		let url = make_user_url(viewID,gGroupOfInterestID,"GROUP_BANNER");
		let haveData = 1;
		let variant = "Group";
		let isAdmin = isGroupAdmin(gUID, gGroupOfInterestID);
		
		if ( pageType == cPage.EVENT ) variant = "Event";
		if ( pageType == cPage.CLIENT ) variant = "Client Group";
		if ( pageType == cPage.MLIST ) variant = "Email List";
		if ( pageType == cPage.TOPIC ) variant = "Discussion";
		
		if ( !empty(banner) && empty(banner.src) ) banner.src = url;
		$("#map_box").hide();
		$("#b_ad").hide();
		//$("#right-column").hide();
		$("#field_latlng").hide();
		//if ( pageType == cPage.CLIENT ) {
			$("#title_intro").html ( `${variant}` );
			$("#title_charter").html ( "Summary" );
		//}
		let resend = 0;
		if ( empty(gGroup) || empty(gGroup.title) || empty(gData.groups) ) resend = 1;
		if ( resend ) {	// we don't have the group data from the server yet; retry
			if ( retry > 6 ) { console.log ( "setupPage(cPage.GROUP) sees empty(gGroup)" ); return; }
			setTimeout(function() { setupPage ( pageType, retry+1 ); }, 500 * retry);
			return;	// ***************** note early return
		}
		let group = loadGroup ( gGroupOfInterestID );
		if ( !empty(group) ) gGroup = group;
		if ( typeof groupLoadedCallback === "function" ) {
			groupLoadedCallback();
		}
		// if we get here, we have group data
		showHideButtons();
		if ( isAdmin ) {
			$("#link_edit").html ( " ✏️ " );
		}
		if ( gEventID ) {
			let titleStr = "Event";
			document.title = gEvent.title;
			if ( !empty(gLocalTest) ) document.title += " LOC";
			if ( gEvent.flags & cGroupFlag.GROUP_VISIBLE ) {
				if ( gEvent.flags & cGroupFlag.INVITE ) {
					titleStr = `Invite Only ${variant}`;
				} else {
					titleStr = `Public ${variant}`;
				}
				$("#group_bar_title").html ( titleStr );
			} else {
				$("#group_bar_title").html ( `Private ${variant}` );
			}
			titleStr = "Free"
			if ( gEvent.flags & cGroupFlag.TICKETED ) {
				titleStr = "Tickets Required";
			}
			if ( gEvent.flags & cGroupFlag.LIMITED ) {
				titleStr += " • Limited Seating";
			}
			$("#group_bar_subtitle").html ( titleStr );
			//if ( !empty(gEvent.type) ) {
			//	$("#group_bar_subtitle").html ( gEvent.type );
			//}
			setupOptionCheckboxes ( gEvent.flags );
		} else if ( gGroupOfInterestID ) {
			document.title = "ZIPit - " + gGroup.title;
			if ( !empty(gLocalTest) ) document.title += " LOC";
			if ( gGroup.flags & cGroupFlag.GROUP_VISIBLE ) {
				let titleStr = "Group";
				if ( gGroup.flags & cGroupFlag.POSTS_VISIBLE_ALL ) {
					titleStr = `Public ${variant}`;
				} else {
					titleStr = `Invite Only ${variant}`;
				}
				if ( is_glenn() ) {
					titleStr = `<span class='smaller'>[${gGroupOfInterestID}]</span> ${titleStr}`;
				}
				$("#group_bar_title").html ( titleStr );
			} else {
				$("#group_bar_title").html ( `Private ${variant}` );
			}
			if ( !empty(gGroup.type) ) {
				$("#group_bar_subtitle").html ( gGroup.type );
			}
			if ( !empty(gGroup.zip) ) {
				gRelevantZip = gGroup.zip;
				gLoc.view.zip = gGroup.zip;
				gLoc.view.city = gGroup.city;
				//updateLocationUI();
				$("#field_city").html ( gGroup.city );
				$("#field_zip").html ( gGroup.zip );
				refreshZipCodeList ( $("#zip_list") );
				// $("#zip_list")[0].value = gGroup.zip;
			}
			if ( !empty(gGroup.title) ) {
				$("#field_username").html ( gGroup.title );
				if ( pageType == cPage.MLIST ) {
					$("#new_post_title").html ( `Send Email to "${gGroup.title}"` );
				} else {
					$("#new_post_title").html ( `Contribute to "${gGroup.title}"` );
				}
				$("#field_desc").html ( html_paragraph(gGroup.description) );
			}
			let subtext = "";
			let div = $("#field_subtext");
			if ( !empty(gGroup.charter) ) {
				//subtext += "<span style='font-size:0.75em'>" + gGroup.charter + "</span>";
				subtext += `<span class='group_charter'>${gGroup.charter}</span>`;
			}
			div.html ( subtext );
			setupOptionCheckboxes ( gGroup.flags );
		}
		//setupCategories ( pageType, $("#category_list") );
	}
	if ( pageType == cPage.ACCOUNT ) {
		if ( !empty(gName.me.headline) ) $("#headline").html ( gName.me.headline );
		if ( !empty(gName.me.about) ) $("#about").html ( html_paragraph(gName.me.about) );
	}
	if ( false && pageType == cPage.EVENT ) {
		let variant = "Event";
		/*
		setupCategories ( pageType, null, $("#type_list") );
		let flags = groupSettings ( cPageName[pageType], 0 );
		if ( !empty(gGroup.flags) ) flags = gGroup.flags;
		setupOptionCheckboxes ( flags, EDITING );
		*/
		if ( gGroupOfInterestID ) {
			document.title = `${gGroup.title} ${variant}`;
			if ( !empty(gLocalTest) ) document.title += " LOC";
			if ( gGroup.flags & cGroupFlag.GROUP_VISIBLE ) {
				let titleStr = "Event";
				if ( gGroup.flags & cGroupFlag.POSTS_VISIBLE_ALL ) {
					titleStr = `Public ${variant}`;
				} else {
					titleStr = `Invite Only ${variant}`;
				}
				if ( is_glenn() ) {
					titleStr = `<span class='smaller'>[${gGroupOfInterestID}]</span> ${titleStr}`;
				}
				$("#group_bar_title").html ( titleStr );
			} else {
				$("#group_bar_title").html ( `Private ${variant}` );
			}
			if ( !empty(gGroup.type) ) {
				$("#group_bar_subtitle").html ( gGroup.type );
			}
		}
	}
}

function resetOptionsXX ( pageType, categoryListJQ, typeListJQ )
{
	if ( pageType == cPage.CLIENT ) {
		$("#title_intro").html ( "Client Group" );
		$("#title_charter").html ( "Summary" );
		$("#title_your_group").html ( "Client Group" );
		$("#reserve_link_row").hide();
	}
	if ( pageType == cPage.MLIST ) {
		$("#title_intro").html ( "Mailing List" );
		$("#title_charter").html ( "Summary" );
		$("#title_your_group").html ( "Mailing List" );
		$("#reserve_link_row").hide();
	}
	if ( pageType == cPage.TOPIC ) {
		$("#title_intro").html ( "Create a new Topic for discussion" );
		$("#group_name")[0].placeholder = 'such as: "March Madness"';
		$("#charter")[0].placeholder = 'such as: "Discuss March Madness"';
		$("#description")[0].placeholder = 'Describe this Topic to the world...';
		$("#title_group_name").html ( "Title" );
		$("#title_your_group").html ( "Your Topic" );
		//$("#title_charter").html ( "" );
		$("#reserve_url").html ( `https://${gServer}/topics/` );
		$("#reserve_link_row").hide();
		$("#title_options").html ( "Options" );
		$("#desc_options").html ( "<b>Topics</b> are open to anyone and don't require joining a group. But if the topic is inherently local, select the <b>Local Interest</b> option so it doesn't show up, say, to people in <b>Chicago</b> if your topic is the <b>Green Bay Packers</b>." );
		$("#hide_category").hide();
		$("#hide_options_1").hide();
	}
}

function removeOptionsXX ( selectBox )
{
	while ( selectBox.options.length > 0 ) { selectBox.remove(0); }
}

function make_banner_area ( backgroundURL )
{
	let html = "";
	
	html += `<div class='banner' style='background-image:url(${backgroundURL});'>`;
	html += "	<div class='banner_img'>";
	//html += "		<img id='img_banner' src='' width='100%' height='auto' />";
	html += "	</div>";
	html += "</div>";
	
	return html;
}

function showHideButtons()
{
	let isAdmin = isGroupAdmin ( gUID, gGroupOfInterestID );
	$("#b_send").hide();
	$("#b_ad").hide();

	if ( !empty(gUID) ) {		// user is logged in
		$("#b_join").hide();
		$("#b_show_post").show();
		if ( isGroupType(gPageType) ) {
			$("#b_add_link").show();
			$("#b_add_file").show();
			$("#sep_butt").show();
		}
	} else {					// otherwise change buttons to force Join
		$("#b_join").show();
		$("#b_show_post").hide();
		$("#b_event").hide();
		$("#b_add_link").hide();
	}
	if ( isAdmin ) {
		$("#b_event").show();
		$("#b_email").show();
	} else {
		$("#b_event").hide();
		$("#b_email").hide();
	}
	if ( gPageType == cPage.MLIST ) {
		$("#b_add_link").hide();
		$("#b_add_file").hide();
		$("#b_show_post").hide();
		$("#sep_butt").hide();
	} else {
	}
}

function updateBanner ( pageType )
{
	if ( pageType == cPage.ME ) {
		let banner = $("#img_banner");
		banner.attr  ( 'src', make_user_url(viewID,gGroupOfInterestID,"USER_BANNER") );
	}
}

function refreshUploadedPhoto ( uid, gid, eid, batch, idx, total, type, imageJQ, filename )
{
	if ( !empty(imageJQ) ) {
		let imageDiv = imageJQ[0];
		let imageURL = "";
		if ( type == "POST" ) {
			addPhoto(cPostType.USER);		// opens up the UI
			gPost.imageURL = filename;
			gPost.batch = batch;
			if ( empty(gPost.images) ) {
				gPost.images = new Array(total);
			}
			gPost.images[idx] = filename;
		}
		if ( !empty(imageDiv) ) {
			let imageName = $("#main_image_name");
			if ( !empty(imageName) ) {
				$("#main_image_name").html ( filename );
			}
			imageURL = `https://files.zipit.social/php/file_download.php`;
			imageURL += `?uid=${uid}&gid=${gid}&eid=${eid}&type=${type}&filename=${filename}`;
			imageDiv.src = imageURL;
		}
	}
}


function refreshImageURL ( imageURL, url, filename )
{
	let imageDiv = document.getElementById ( "upload_image" );
	addPhoto(cPostType.USER);		// opens up the UI
	if ( !empty(imageDiv) ) {
		$("#main_image_name").html ( filename );
		gPost.imageURL = imageURL;
		gPost.url = url
		imageDiv.src = imageURL;
	}
}

