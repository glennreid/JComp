
/*
 * 2/15/2023
 *
 * editUI.js
 *
 * Main user interface - data structures and interaction with DOM
 *
 */

var gPageName = "Home";
var gEditing = 0;
var sSideBarLimit = 24;		// max detail items in side bar before [...]

if ( typeof gUID === "undefined" ) {
	var gUID = 0;
	var gPersonOfInterestID = 0;
	var gGroupOfInterestID = 0;
	var gServer = "stage.zipit.social";
	var gName = {
		'me': {	'first': "", 'last': "" },
		'interest': { 'first': "", 'last': "" },
	};
}

// --------------------------------- functions ------------------------------

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

function showMenuSheet ( which, height=150 )
{
	var bar = document.getElementById ( `bar-${which}` );
	var button = document.getElementById ( `show-${which}` );
	var state = bar.style.display;
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
			bar.style.width = `35%`; // `400px`;
		}
		if ( which == 'account' ) {
			bar.style.left = `auto`;
			bar.style.right = `20px`;
			bar.style.width = `120px`;
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

function gotoURL ( url, tab=null )
{
	if ( !empty(tab) ) {
		window.open ( url, tab );
	} else {
		window.location = url;
	}
}

function gotoPage ( page )
{
	var url = `https://zipit.social/${page}.shtml`;
	if ( gServer == 'stage.zipit.social' ) url = `../${page}.shtml`;
	window.location = url;
}

function closeMenuSheet ( which )
{
	var elem = $(`#bar-${which}`);
	elem.animate ( { height: '0px'}, 500, function () {
		elem.hide();
	});
}


function updateLocationUI ( pageType="All" )
{
	// VIEW first -- what we're actually looking at (home town)
	var stats = "";
	var str = "" + gLoc.view.lat + ", " + gLoc.view.lng;
	$("#field_latlng").html ( str );
	if ( !empty(gMe) && !empty(gMe.city) ) {
		$("#field_city").html ( gMe.city );
		$("#field_zip").html ( gMe.zip );
	} else {
		$("#field_city").html ( gLoc.view.city );
	}
	if ( !empty(gLoc.region) ) {
		stats += "&nbsp;&nbsp;&nbsp; Region: " + gLoc.region;
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
	if ( empty(gLoc.view.zip) || gLoc.view.zip != gRelevantZip ) {
		if ( empty(gLoc.view.zip) ) {
			gLoc.view.zip = gRelevantZip;
		} else {
			gRelevantZip = gLoc.view.zip;
		}
		$("#field_zip").html ( gLoc.view.zip );
		if ( !empty(gLocalTest) ) {
			gData.refreshZipCode = 1;
			if ( gData.timer ) clearTimeout ( gData.timer );
			gData.timer = setTimeout ( refreshFeedData, 3000 );
		}
	}
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

function updateSocialUI ( reactType=0, postID=0 )
{
	var list = null;
	
	/*
	if ( !empty(gPersonOfInterestID) && !gName.interest.full.includes("Unknown") ) {
		$("#field_username").html ( gName.interest.full );
	} else {
		$("#field_username").html ( gName.me.full );
	}
	*/
	if ( !empty($("#field_bar_username")) ) $("#field_bar_username").html ( gName.me.full );
	if ( !empty($("#field_username")) ) $("#field_username").html ( gName.me.full );
	/*
	if ( postID == cPage.GROUP || gPageName == "Groups" ) {
		if ( gGroupOfInterestID ) {
			$("#map_box").hide();
		}
		if ( empty(gGroup.title) ) {
			var group = loadGroup ( gGroupOfInterestID );
			if ( !empty(group) ) {
				gGroup = group;
			}
		}
		if ( !empty(gGroup) ) {
			if ( !empty(gGroup.zip) ) {
				gRelevantZip = gGroup.zip;
			}
			if ( !empty(gGroup.title) ) {
				$("#field_username").html ( gGroup.title );
				$("#new_post_title").html ( "Contribute to " + gGroup.title + "" );
			}
			var subtext = "";
			var div = $("#field_subtext");
			if ( !empty(gGroup.charter) ) {
				subtext += gGroup.charter;
			}
			if ( !empty(gGroup.category) ) {
				subtext += "<br\><span style='font-size:0.75em'>" + gGroup.category + "</span>";
			}
			div.html ( subtext );
		}
	}
	*/
	if ( 1 ) {
		var str = "<ul>";
		str += "<li class='topic'>Friends</li>";
		list = gData.friends;
		if ( !empty(list) ) {
			str += "<ul>";
			for ( var idx = 0; idx < list.length; idx++ ) {
				var group = list[idx];
				str += "<li class='topic pct90 accent rt'>" + group.title + "</li>";
			}
			str += "</ul>";
		}
		str += "<li class='topic'>Groups</li>";
		list = gData.groups;
			str += "<ul>";
			if ( !empty(list) ) {
				for ( var idx = 0; idx < list.length; idx++ ) {
					var group = list[idx];
					str += "<li class='topic pct90 accent rt'>";
					if ( 1 ) {
						str += "<a class='topic pct90 accent rt' href='../groups/local_test.shtml?gid=" + group.groupID + "'>";
					} else {
						var genID = group.groupID; // * 1036;
						str += `<a class='topic pct90 accent rt' href='../groups/home.shtml?gid=${genID}'>`;
					}
					str += group.title + "</li></a>";
				}
			}
			str += "<li class='topic pct90 accent rt'>";
			str += "<a class='topic pct90 accent rt'";
			str += ` href='../groups/edit.shtml?zip=${gMe.zip}&create=1&type=GROUP'>`;
			str += "+Create Group</li></a></ul>";
		str += "<li class='topic'>Discussions</li>";
		str += "<li class='topic'>Marketplace</li>";
		str += "</ul>";
		$("#left-list").html ( str );
	}
	list = gData.topic_areas;
	if ( !empty(list) ) {
		var str = "<ul>";
		for ( var idx = 0; idx < list.length; idx++ ) {
			var topic = list[idx];
			str += "<li class='topic'>" + topic.title + "</li>";
		}
		str += "</ul>";
		$("#right-list").html ( str );
	}
}

function setupUser ()
{
	if ( !empty(gUID) ) {
		if ( !empty(gUrlProfile) ) {
			var user_img = document.getElementById ( 'user_bar_img' );
			if ( !empty(user_img) ) user_img.src = gUrlProfile;
			user_img = document.getElementById ( 'user_img' );
			if ( !empty(user_img) ) user_img.src = gUrlProfile;
		}
		var user_banner = document.getElementById ( 'user_banner' );
		if ( !empty(user_banner) ) {
			if ( !empty(gUrlBanner) ) {
				user_img.src = gUrlBanner;
			}
		}
		$("#b_send").hide();
		$("#b_join").hide();

		$("#b_show_post").show();
		$("#b_ad").show();
	} else {
		$("#b_show_post").hide();
		$("#b_send").hide();
		$("#b_ad").hide();

		$("#b_join").show();
	}
	$("#acct_img").attr ( 'src', gUrlProfile );
	$("#acct_name").html ( gName.me.full );

	$("#img_profile").attr ( 'src', gUrlProfile );
	$("#img_banner").attr  ( 'src', gUrlBanner );
}

function showHideButtons()
{
	if ( !empty(gUID) ) {		// if user is not logged in, hide some of the post buttons
		$("#b_send").hide();
		$("#b_join").hide();

		$("#b_show_post").show();
		$("#b_ad").show();
	} else {
		$("#b_show_post").hide();
		$("#b_send").hide();
		$("#b_ad").hide();

		$("#b_join").show();
	}
}


function radio ( nameA, nameB )
{
	var A = document.getElementById ( nameA );
	var B = document.getElementById ( nameB );
	B.checked = ! A.checked;
}

function checkedBox ( item, event )
{
	var ckb = item[0];
	if ( ckb.id == 'ck_invite' ) {
		radio ( 'ck_invite', 'ck_open' );
	}
	if ( ckb.id == 'ck_open' ) {
		radio ( 'ck_open', 'ck_invite'  );
	}
	if ( ckb.id == 'ck_local' ) {
		radio ( 'ck_local', 'ck_global' );
	}
	if ( ckb.id == 'ck_global' ) {
		radio ( 'ck_global', 'ck_local'  );
	}
	//gTemplateBody = item.value;
	//previewEditedTemplate ( false );
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
	var isAdmin = 0;
	if ( !sDidButtons ) {
		showHideButtons();
		sDidButtons = 1;
	}
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
	if ( isGroupType(pageType) || pageType == cPage.MEMBERS ) {
		// make sure group data is loaded
		if ( empty(gGroup) || empty(gGroup.title) ) {
			if ( !empty(gData.groups) ) {
				var group = loadGroup ( gGroupOfInterestID );
				if ( !empty(group) ) {
					gGroup = group;
				}
			} else {
				// we don't have the group data from the server yet; retry
				if ( retry > 3 ) {
					console.log ( "setupPage(cPage.GROUP) sees empty(gGroup)" );
					return;
				}
				setTimeout(function() {
					setupPage ( pageType, retry+1 );
				}, 500 * retry);
				return;
			}
		}
	}
	isAdmin = isGroupAdmin ( gUID, gGroupOfInterestID );
	if ( pageType == cPage.ME ) {
		//$("#map_box").hide();
		$("#post_box").hide();
		var profile = $("#user_img");
		var banner = $("#img_banner");
		var viewID = gUID;
		if ( !empty(gName.interest.userID) ) viewID = gName.interest.userID;
		profile.attr ( 'src', make_user_url(viewID,0,"USER_PROFILE") );
		banner.attr  ( 'src', make_user_url(viewID,0,"USER_BANNER") );
		if ( !empty(gInvite) ) {
			var exist = $("#welcome").html();
			if ( empty(exist) || exist.length == 0 ) {
				var welcome = "You've been invited to ZIPit! Awesome.";
				$("#welcome").html ( welcome );
			}
			var subtext = "Your email address is already in our system because of the invite, so all you have to do is add a password and you're in.";
			if ( groupOpenInvite(gInvite) ) {
				subtext = "This is a limited-time invite.";
			}
			$("#welcome_subtext").html ( subtext );
			$("#edit_title").html ( "Set up your Account" );
		}
		if ( !empty(gName.interest.full) ) {
			document.title = "ZIPit - " + gName.interest.full;
			if ( !empty(gLocalTest) ) document.title += " LOC";
		}
	}
	if ( pageType == cPage.FRIENDS ) {
		//$("#map_box").hide();
		$("#post_box").hide();
		/*
		var profile = $("#user_img");
		var banner = $("#img_banner");
		var viewID = gUID;
		if ( !empty(gName.interest.userID) ) viewID = gName.interest.userID;
		profile.attr ( 'src', make_user_url(viewID,0,"USER_PROFILE") );
		banner.attr  ( 'src', make_user_url(viewID,0,"USER_BANNER") );
		if ( !empty(gInvite) ) {
			var exist = $("#welcome").html();
			if ( empty(exist) || exist.length == 0 ) {
				var welcome = "You've been invited to ZIPit! Awesome.";
				$("#welcome").html ( welcome );
			}
			var subtext = "Your email address is already in our system because of the invite, so all you have to do is add a password and you're in.";
			if ( groupOpenInvite(gInvite) ) {
				subtext = "This is a limited-time invite.";
			}
			$("#welcome_subtext").html ( subtext );
			$("#edit_title").html ( "Set up your Account" );
		}
		if ( !empty(gName.interest.full) ) {
			document.title = "ZIPit - " + gName.interest.full;
			if ( !empty(gLocalTest) ) document.title += " LOC";
		}
		*/
		//displayGroupMembers ( pageType, gUID, gGroup, isAdmin, ltitle );
		var params = { 'select':1, 'align':cAlign.LEFT };
		var max = 25;
		let list = buildFriendsList ( gUID, params );
		$("#friends").html ( list );
	}
	if ( isGroupType(pageType) ) {
		var banner = $("#img_banner")[0];
		var url = make_user_url(viewID,gGroupOfInterestID,"GROUP_BANNER");
		if ( !empty(banner) ) banner.src = url;
		$("#map_box").hide();
		$("#right-column").hide();
		resetOptions ( pageType );

		setupCategories ( pageType, $("#category_list"), $("#type_list") );
		var flags = 0;
		if ( !empty(gGroup) ) {
			flags = gGroup.flags;
		} else {
			groupSettings ( cPageName[pageType], 0 );
		}
		setupOptionCheckboxes ( flags, EDITING );
		if ( isAdmin ) {
			$("#link_edit").html ( " ✏️ " );
		}
		if ( groupMembersVisible(gUID, gGroup) ) {
			if ( !empty(gGroup.members) ) {
				var mname = `Members`;
				var ltitle = `${gGroup.members.length} Members`;
				if ( gGroup.category == 'MLIST' ) {
					var active = countActiveMembers ( gGroup.members );
					ltitle += ` (${active} Active)`;
					mname = `List`;
				}
				var manage = `<div class='feature' name='manage_members' onclick='manageMembers();'>Manage ${mname}✏️</div>`;
				$("#member_list_header").html ( ltitle );
				$("#member_list_div").html ( manage );
			}
		}
		if ( !empty(gGroup) && !empty(gGroup.title) ) {
			document.title = "ZIPit - " + gGroup.title;
			if ( !empty(gLocalTest) ) document.title += " LOC";
			if ( !empty(gGroup.zip) ) {
				gRelevantZip = gGroup.zip;
			}
			if ( 1 || !empty(gGroup.title) ) {
				$("#title_intro").html ( `<span class='darkred'>${gGroup.title}</span> - Edit Settings` );
				$("#field_username").html ( gGroup.title );
				//$("#new_post_title").html ( "Contribute to " + gGroup.title + "" );
			}
			$("#field_desc").html ( html_paragraph(gGroup.description) );
			if ( !empty(gGroup.category) ) {
				$("#category_list")[0].value = gGroup.category;
				setupCategories ( cPage[gGroup.category], $("#category_list"), $("#type_list") );
			}
			if ( !empty(gGroup.flags) ) {
				setupOptionCheckboxes ( gGroup.flags, EDITING );
			}
			var subtext = "";
			var div = $("#field_subtext");
			if ( !empty(gGroup.charter) ) {
				subtext += "<span style='font-size:0.75em'>" + gGroup.charter + "</span>";
			}
			//if ( !empty(gGroup.category) ) {
			//	subtext += "<span style='font-size:0.75em'>" + gGroup.category + "</span>";
			//}
			div.html ( subtext );
		}
	}
	if ( pageType == cPage.EVENT ) {
		setupCategories ( pageType, null, $("#type_list") );
		var flags = groupSettings ( cPageName[pageType], 0 );
		if ( !empty(gGroup.flags) ) flags = gGroup.flags;
		setupOptionCheckboxes ( flags, EDITING );
	}
	if ( pageType == cPage.MEMBERS ) {
		$("#map_box").hide();
		$("#right-column").hide();
		if ( !empty(gLocalTest) ) document.title += " LOC";
		if ( !empty(gGroup.title) ) {
			var title = `<span class='darkred'>${gGroup.title}</span>`;
			if ( gGroup.category == 'MLIST' ) {
				$("#title_intro").html ( `${title} - Mailing List` );
			} else {
				$("#title_intro").html ( `${title} - Membership` );
			}
		}
		if ( isAdmin ) {
			$("#link_edit").html ( " ✏️ " );
			$("#invite_area").show();
		} else {
			$("#link_edit").hide();
		}
		if ( groupMembersVisible(gUID, gGroup) ) {
			if ( !empty(gGroup.members) ) {
				let max = (typeof gDisplayPageSize === 'undefined') ? 0 : gDisplayPageSize;
				let fields = (typeof gDisplayFields === 'undefined') ? cFieldsBASIC : gDisplayFields;
				/*
				var active = countActiveMembers ( gGroup.members );
				var ltitle = `${gGroup.members.length} Members (${active} Active)`;
				if ( gGroup.category == 'MLIST' ) {
					ltitle = `${gGroup.members.length} People`;
				}
				*/
				displayGroupMembers ( pageType, gUID, gGroup, isAdmin, "Member", max, fields ); // , ltitle );
			}
		}
	}
}

function setupTiers()
{
	if ( gTier > 0 ) {
		var plan = `Free Plan`;
		var limit = 1000;
		var units = `Messages per Month`;
		var msg = ``;
		var span = `<span class='darkred bold'>`;
		switch ( gTier ) {
			case 2: plan = `Smart Choice Plan`; limit = 5000; break;
			case 3: plan = `Professional Plan`; limit = 10000; break;
			case 9: plan = `Topics are Free`; limit = 0; break;
		}
		limitText = `Up to ` + commas ( limit );
		$("#tier_box").show();
		$("#tier_name").html ( `✅ ${plan}` );
		if ( gTier > 0 ) {
			var special = `Free Plan`;
			if ( gTier > 1 ) {
				special = `${span}Free</span> for 1 month`;
				if ( !empty(gPrice) ) {
					var price = dollar_string ( gPrice );
					special += `<br/>${span}${price}</span> / month after that`;
				}
			}
			msg += special + `<br/>${span}${limitText}</span> ${units}`;
		}
		$("#tier_limits").html ( msg );
	} else {
		$("#tier_box").hide();
	}
}

function setupCategories ( pageType, categoryListJQ, typeListJQ )
{
	var selectBox = null;
	var options = [];
	var categories = [ ['Group','GROUP'], ['Event','EVENT'], ['Topic','TOPIC'], ['Email List','MLIST'], ['Clients','CLIENT'] ];
	var listContainsExistingGroupType = 0;

	//$("#tier_box").show();
	setupTiers()
	if ( !empty(categoryListJQ) ) {
		selectBox = categoryListJQ[0];
		removeOptions ( selectBox );
		for ( var idx = 0; idx < categories.length; idx++ ) {
			var cat = categories[idx];
			var newOption = new Option ( cat[0], cat[1] );
			if ( choice == SPACER ) newOption.disabled = true;
			selectBox.add ( newOption, undefined );
		}
		categoryListJQ[0].value = cPageName[pageType];
		console.log ( "category value: " + categoryListJQ[0].value );
	}
	if ( !empty(typeListJQ) ) {
		selectBox = typeListJQ[0];
		// remove existing choices:
		if ( pageType == cPage.GROUP ) {
			options = cTypes.GROUP;
			removeOptions ( selectBox );
		}
		if ( pageType == cPage.CLIENT ) {
			options = cTypes.CLIENT;
			removeOptions ( selectBox );
		}
		if ( pageType == cPage.MLIST ) {
			options = cTypes.MLIST;
			removeOptions ( selectBox );
		}
		if ( pageType == cPage.EVENT ) {
			options = cTypes.EVENT;
			removeOptions ( selectBox );
		}
		if ( pageType == cPage.TOPIC ) {
			options = getTopicAreas();
			removeOptions ( selectBox );
			//gTier = 9;
			$("#tier_name").html ( `✅ Creating a Topic is Free` );
			$("#tier_limits").html ( `Unlimited Participants` );
		}
		for ( var idx = 0; idx < options.length; idx++ ) {
			var choice = options[idx];
			var newOption = new Option ( choice, choice );
			if ( choice == SPACER ) newOption.disabled = true;
			if ( choice == gGroup.type ) listContainsExistingGroupType = 1;
			selectBox.add ( newOption, undefined );
		}
		if ( !empty(gSubType) ) {
			selectBox.value = gSubType;
			console.log ( "type value: " + gSubType );
		}
	}
	if ( !empty(gGroup.type) ) {
		if ( !listContainsExistingGroupType ) {
			var newOption = new Option ( gGroup.type, gGroup.type );
			selectBox.add ( newOption, undefined );
		}
		typeListJQ[0].value = gGroup.type;
	}
}

function resetOptions ( pageType, categoryListJQ, typeListJQ )
{
	if ( pageType == cPage.CLIENT ) {
		$("#title_intro").html ( "Create a Client Group" );
		$("#title_charter").html ( "Summary" );
		$("#title_your_group").html ( "Your Client Group" );
		$("#reserve_link_row").hide();
	}
	if ( pageType == cPage.MLIST ) {
		$("#title_intro").html ( "Create a Mailing List" );
		$("#title_charter").html ( "Summary" );
		$("#title_your_group").html ( "Your List" );
		$("#title_group_name").html ( "List Name" );
		$("#title_options").html ( "Options" );
		$("#description")[0].placeholder = '';
		$("#desc_options").html ( "Be careful about these settings if you don't want members of your list to see and interact with other members." );
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
	$("#ck_open")[0].checked = false;
	$("#ck_invite")[0].checked = true;

	$("#ck_global")[0].checked = false;
	$("#ck_local")[0].checked = true;

	$("#ck_visgrp")[0].checked = false;
	$("#ck_vismem")[0].checked = false;
	$("#ck_vispost_all")[0].checked = false;
	$("#ck_vispeers_group")[0].checked = true;
	$("#ck_vispost_group")[0].checked = true;
}

function removeOptions ( selectBox )
{
	while ( selectBox.options.length > 0 ) { selectBox.remove(0); }
}

function refreshUploadedPhoto ( uid, gid, eid, batch, idx, total, type, imageJQ, filename )
{
	if ( !empty(imageJQ) ) {
		var imageDiv = imageJQ[0];
		var imageURL = "";
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
			var imageName = $("#main_image_name");
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
	var imageDiv = document.getElementById ( "main_image" );
	addPhoto(cPostType.USER);		// opens up the UI
	if ( !empty(imageDiv) ) {
		$("#main_image_name").html ( filename );
		gPost.imageURL = imageURL;
		gPost.url = url
		imageDiv.src = imageURL;
	}
}

