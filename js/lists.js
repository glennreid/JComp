
/*
 * 2/15/2023
 *
 * lists.js
 *
 * UI for lists (Friends, Members, Features)
 *
 */

var sSideBarLimit = 24;		// max detail items in side bar before [...]

const cFieldFlags = {
	'FIRST': 	   1,
	'LAST': 	   2,
	'EMAIL': 	   4,
	'EMAIL2': 	   8,
	'TAGS': 	  16,
	'ADDR1': 	  32,
	'ADDR2': 	  64,
	'CITY':		 128,
	'STATE':	 256,
	'ZIP':		 512,
	'COUNTRY':	 1024,
	'LOC':		 2048,
	'NOTES':	 4096,
};
const cFL = cFieldFlags;

const cFieldsMIN = cFL.FIRST | cFL.LAST;
const cFieldsEMAIL = cFieldsMIN | cFL.EMAIL;
const cFieldsBASIC = cFieldsEMAIL | cFL.TAGS;
const cFieldsCITY = cFieldsBASIC | cFL.TAGS | cFL.CITY | cFL.STATE | cFL.ZIP;
const cFieldsADDR = cFieldsCITY | cFL.ADDR1;
const cFieldsALL = cFieldsADDR | cFL.EMAIL2 | cFL.ADDR2 | cFL.COUNTRY | cFL.LOC | cFL.NOTES;

function buildFeatureList ( style )
{
	let html = "";
	let list = null;
	let lname = ""
	let params = `?zip=${gMe.zip}`;
	let pid = gPersonOfInterestID;
	let whoID = gUID;

	if ( gPersonOfInterestID ) {
		let friendStatus = isMyFriend ( gPersonOfInterestID );
		html += "<div style='margin-top:30px;'>";
		if ( friendStatus ) {
			let str = "";
			let status = cFriendStatusName[friendStatus];
			let color = 'darkgreen';
			let labelClass = 'feature';
			switch ( friendStatus ) {
				case cFriendStatus.IGNORED:
				case cFriendStatus.BLOCKED:
				case cFriendStatus.DISCONNECTED:
					color = 'darkred'; break;
			}
			if ( friendStatus != cFriendStatus.ACTIVE ) {
				str += 'Connection<br/>';
			}
			if ( friendStatus == cFriendStatus.RECEIVED ) {
				labelClass = 'biglabel';
			}
			str += `<span id='request_status' style='color:${color}'>${status}</span>`;
			html += `<div class='${labelClass} rt' >${str}</div>`;
			if ( friendStatus == cFriendStatus.RECEIVED ) {
				// here are the clickable response buttons:
				for ( let key in cFriendRequestResponseVerb ) {
					let response = cFriendRequestResponseVerb[key];
					html += "<div class='topic pct90 accent rt b_request_responder'";
					html += ` onclick='respondToFriendRequest(this,${pid},"${key}");'>`;
					html += `${response}</div>\n`;
				}
			}
			if ( friendStatus == cFriendStatus.ACTIVE ) {
				// the UnFriend button:
				let key = cFriendRequestVerb.DISCONNECT;
				let response = cFriendRequestResponseVerb[key];
				html += "<div class='topic pct90 accent rt b_request_responder'";
				html += ` onclick='respondToFriendRequest(this,${pid},"${key}");'>`;
				html += `${response}</div>\n`;
			}
		} else {
			html += `<div id='b_friend_req' class='feature rt' onclick='toggleFriend(this,gPersonOfInterestID);'>+Connect</div>`;
		}
		html += "</div>";
	}
	html += "<div id='feature_list'>";
	if ( !gPersonOfInterestID ) {
		html += `<div class='bar_spacer b_top'>&nbsp;</div>`;	// empty one at the top for spacing
	}
	// Groups list
	if ( countMyGroups() > 0 ) {
		lname = "My Groups";
		list = gData.groups;
			if ( gPersonOfInterestID ) {
				lname = `${gName.interest.first}'s Groups`;
				list = gData.users[gPersonOfInterestID].groups;
				whoID = gPersonOfInterestID;
			}
			if ( !empty(list) ) {
				html += `<div class='bar_cat'>${lname}</div>`;
				//html += "<div>";
				if ( !empty(list) ) {
					for ( let idx = 0; idx < list.length; idx++ ) {
						let group = list[idx];
						let genID = group.groupID; // * 1036;
						if ( isGroupAdmin(whoID, group.groupID) ) {
							html += "<div class='topic pct90 accent rt'>";
							html += `<a class='topic pct90 accent rt' href='../groups/home.shtml?gid=${genID}'>`;
							html += group.title + "</a></div>\n";
						}
					}
				}
				if ( !gPersonOfInterestID ) {
					html += "<div class='topic pct90 accent rt darkred'>";
					html += "<a class='topic pct90 accent rt darkred'";
					//html += ` href='../groups/edit.shtml${params}&type=EVENT'>`;
					html += ` href='../groups/edit.shtml${params}&create=1&type=GROUP'>`;
					html += "+Create a Group</a></div>";
					//html += "</div>";
				}
			}
	}
	lname = "Groups"
	list = gData.groups;
	if ( gPersonOfInterestID ) {
		lname = `${gName.interest.first} is Member`;
		list = gData.users[gPersonOfInterestID].groups;
	}
		//html += "<div>";
		if ( !empty(list) ) {
			html += `<div class='bar_cat'>${lname}</div>`;
			for ( let idx = 0; idx < list.length; idx++ ) {
				let group = list[idx];
				let genID = group.groupID; // * 1036;

				if ( group.category == 'TOPIC' ) continue;
				if ( ! isGroupAdmin(whoID, genID) ) {
					let icon = "";
					let createDate = date_from_sql ( group.creation );

					if ( daysElapsedSince(createDate) < 10 ) {
						icon = "✨&nbsp; ";
					}
					html += "  <div class='topic pct90 accent rt'>";
					html += `<a class='topic pct90 accent rt' href='../groups/home.shtml?gid=${genID}'>`;
					html += `${icon}${group.title}</a></div>\n`;
					if ( idx > sSideBarLimit ) {
						html += "  <div class='topic pct90 accent rt'>";
						html += "<a class='topic pct90 accent rt'";
						html += " href='../groups/index.shtml'>";
						html += "[ more ]</a></div>\n";
						break;
					}
				}
			}
		}
		if ( !countMyGroups() && !gPersonOfInterestID ) {
			html += "  <div class='topic pct90 accent rt darkred'>";
			html += "<a class='topic pct90 accent rt darkred'";
			html += ` href='../groups/edit.shtml${params}&create=1&type=GROUP'>`;
			html += "+Create Group</a></div>";
			//html += "</div>\n";
		}
	if ( gPersonOfInterestID ) {
		let button_text = "Conversation"
		html += "  <div class='vspace'></div>\n";
		html += "  <div class='topic pct90 accent rt darkred'>";
		html += "<span id='userMessages' class='topic pct90 accent rt darkred'";
		html += ` onclick='showHideConversation();'>`;
		if ( !empty(gData.users) && !empty(gData.users[gPersonOfInterestID].messages) ) {
			let historyCount = gData.users[gPersonOfInterestID].messages.length;
			let s = 's';
			if ( historyCount == 1 ) s = '';
			if ( historyCount > 0 ) button_text = `${historyCount} Message${s}`;
		}
		html += `${button_text}</span></div>\n`;
	}
	/*
	if ( !gPersonOfInterestID ) {
		// Clients list
		if ( !empty(gData.clients) ) {
			list = gData.clients;
			html += "<div class='bar_cat'>My Clients</div>";
			//html += "<div>";
			if ( !empty(list) ) {
				for ( let idx = 0; idx < list.length; idx++ ) {
					let client = list[idx];
					let genID = client.groupID; // * 1036;
					html += "<div class='topic pct90 accent rt'>";
					html += `<a class='topic pct90 accent rt' href='../groups/home.shtml?gid=${genID}'>`;
					html += client.title + "</a></div>\n";
				}
			}
			html += "<div class='topic pct90 accent rt darkred'>";
			html += "<a class='topic pct90 accent rt darkred'";
			html += ` href='../groups/edit.shtml${params}&create=1&type=CLIENT'>`;
			html += "+Add Clients</a></div>";
		}
	}
	*/
	html += `<div class='bar_spacer'>&nbsp;</div>`;	// empty one at the bottom for spacing
	html += "</div>";
	
	return html;
}

function buildEventFeatures ( style )
{
	let html = "";

	//html += "Event Features";

	return html;
}

var sKnownList = null;

function buildGroupFeatureList ( style )
{
	let html = "";
	let list = null;
	let myMembership = findMember ( gUID, gGroup );
	let members = gGroup.members;
	let memberCount = 0;

	if ( gPageType == cPage.TOPIC ) {
		// show Follower count
		if ( !empty(members) ) memberCount = members.length;
		if ( memberCount > 0 ) {
			let s = (memberCount == 1 ? "" : "s");
			let memLabel = `Follower${s}`;
			if ( gPageType != cPage.TOPIC ) memLabel = `Member${s}`;
			//html += `<div class='sect_head' id='title_join'>${menuSection}</div>`;
			html += `<div id='mem_count' class='topic pct90 accent rt'>${memberCount}`;
			html += ` ${memLabel}</div>`;
		}
	}
	// "copy this group URL"
	if ( !empty(gGroup.handle) ) {
		html += `<div class='bar_subtitle' id='group_handle' onclick='copyHandle()'>`;
		html += `📋Copy URL to ${gGroup.handle}`;
		html += `<input hidden type="text" value="https://${gServer}/group/${gGroup.handle}" id='handle_url'>`;
		html += `</div>\n`;
	}
	html += `<div class='sect_head' id='title_email'>Email</div>\n`;
	list = gData.email;
	if ( !empty(list) ) {
		html += "  <div id='email_list'>\n";
		for ( let idx = 0; idx < list.length; idx++ ) {
			let email = list[idx];
			if ( !empty(email) && !empty(email['subject']) ) {
				//let title = `${email.emailID} ${email.subject}`;
				let title = `${email.subject}`;
				let link = `../groups/compose.shtml?gid=${gGroupOfInterestID}&emailID=${email.emailID}`;
				html += `    <div class='ulink topic pct90 accent rt'>\n`;
				html += `       <a href='${link}' target='_zipexternal'>\n`;
				html += `		  ${title}\n`;
				html += `		</a>\n`;
				html += `	 </div>\n`;
				if ( idx > sSideBarLimit ) {
					html += `    <div class='topic pct90 accent rt'>`;
					html += `<a class='topic pct90 accent rt'`;
					html += ` href='../groups/newsletter_history.shtml'>`;
					html += `[ more ]</a></div>\n`;
					break;
				}
			}
		}
		html += "  <div id='b_new_email_sidebar' class='topic pct90 accent rt darkred'";
		//html += "<span class='topic pct90 accent rt'";
		html += ` onclick='goCompose();'>`;
		html += "+Start New Email</div>\n";
		html += "  </div>\n";
	}
	html += "<div class='sect_head' id='title_links'>Links</div>\n";
	list = gData.links;
	if ( !empty(list) ) {
		let keepers = 0;
		html += "  <div id='link_list'>\n";
		for ( let idx = 0; idx < list.length; idx++ ) {
			let link = list[idx];
			if ( link.groupID == gGroupOfInterestID ) {
				html += "    <div class='ulink topic pct90 accent rt'>";
				html += `<a href='${link.externalURL}' target='_zipexternal'>`;
				if ( is_mobile() ) {
					html += `🔗 ${link.title}</a></div>\n`;
				} else {
					html += `${link.title} 🔗</a></div>\n`;
				}
				if ( ++keepers > sSideBarLimit ) {
					html += "    <div class='topic pct90 accent rt'>";
					html += "<a class='topic pct90 accent rt'";
					//html += " href='../groups/index.shtml'>";
					html += " href='#'>";
					html += "[ more ]</a></div>\n";
					break;
				}
			}
		}
		html += "  </div>\n";
	}
	if ( userIsValidMember(gUID, gGroupOfInterestID) ) {
		html += "  <div id='b_add_link_sidebar' class='topic pct90 accent rt darkred'";
		//html += "<span class='topic pct90 accent rt'";
		html += ` onclick='showHidePost(cPostType.LINK);'>`;
		html += "+Add Link</div>\n";
		//html += "</div>\n";
	}
	html += "<div class='sect_head'>Files</div>\n";
	list = gData.files;
	sKnownList = [];
	if ( !empty(list) ) {
		for ( let idx = 0; idx < list.length; idx++ ) {
			let file = list[idx];
			if ( file.gid == gGroupOfInterestID ) {
				if ( !sKnownList.includes(file.orig_filename) ) {
					html += "  <div class='topic pct90 accent rt'>";
					html += `<a href='https://files.zipit.social/php/file_download.php?gid=${gGroupOfInterestID}&type=GROUP&filename=${file.orig_filename}&down=1' target='_zipit'>`;
					html += file.orig_filename + " ⤵️</a></div>\n";
					if ( idx > sSideBarLimit ) {
						break;
					}
					sKnownList.push ( file.orig_filename );
				}
			}
		}
	}
	html += "  <div id='b_upload' class='topic pct90 accent rt darkred'";
	//html += "<span class='topic pct90 accent rt'";
	html += ` onclick='showHideUpload(cPostType.GROUP);'>`;
	html += "+Upload Files</div>\n";
	
	if ( gPageType == cPage.TOPIC ) {		// else it gets displayed in the right bar
		let menuSection = "Follow";
		let menuVerb = "+Follow";
		let proc = "followGroup";
		let myState = userMemberState ( gUID, gGroupOfInterestID );
		let active = userIsValidMember ( gUID, gGroupOfInterestID );
		if ( isGroupAdmin(gUID, gGroupOfInterestID) ) {
			menuSection = `Administrator`;
			menuVerb = `-Leave Group`;
			proc = 'leaveGroup';
		} else {
			if ( active ) {
				menuSection = `Member`;
				menuVerb = `-Leave Group`;
				proc = 'leaveGroup';
				if ( gPageType == cPage.TOPIC ) {
					menuSection = `You are Following`;
					menuVerb = `-Unfollow`;
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
					}
				}
			}
		}
		html += `<div class='sect_head' id='title_join'>${menuSection}</div>`;
		html += `  <div id='b_join' class='topic pct90 accent rt darkred'`;
		html += ` onclick='${proc}(${gGroupOfInterestID});'>`;
		html += `${menuVerb}</div>\n`;
	}
	/*
	if ( "Active" == userMemberState(gUID, gGroupOfInterestID) ) {
		if ( gPageType == cPage.TOPIC ) {
			html += "<div class='sect_head' id='title_join'>Following</div>";
			html += "  <div id='b_leave' class='topic pct90 accent rt darkred'";
			html += ` onclick='leaveGroup(${gGroupOfInterestID});'>`;
			html += "-Unfollow</div>";
		} else {
			html += "<div class='sect_head' id='title_join'>Member</div>";
			html += "  <div id='b_leave' class='topic pct90 accent rt darkred'";
			html += ` onclick='leaveGroup(${gGroupOfInterestID});'>`;
			html += "-Leave Group</div>";
		}
	} else {
		if ( gPageType == cPage.TOPIC ) {
			html += "<div class='sect_head' id='title_join'>Follow</div>";
			html += "  <div id='b_follow' class='topic pct90 accent rt darkred'";
			html += ` onclick='followGroup(${gGroupOfInterestID});'>`;
			html += "+Follow</div>";
		} else {
			if ( gGroup.flags & cGroupFlag.INVITE ) {
			} else {
			}
			html += "<div class='sect_head' id='title_join'>Join</div>";
			html += "  <div id='b_ask' class='topic pct90 accent rt darkred'";
			html += ` onclick='askToJoin(${gGroupOfInterestID});'>`;
			html += "+Join Group</div>";
		}
	}
	*/
	
	return html;
}

function copyHandle ( )
{
	// Get the text field
	var copyText = document.getElementById("handle_url");

	// Select the text field
	copyText.select();
	copyText.setSelectionRange(0, 99999); // For mobile devices

	// Copy the text inside the text field
	navigator.clipboard.writeText(copyText.value);

	// Alert the copied text
	alert("Copied to clipboard: " + copyText.value);
}

function buildTopicList ( style )
{
	let html = "";
	let list = gData.groups;
	let keepers = 0;
	html += "<div>";
	if ( !empty(list) ) {
		html += "<div>";
		for ( let idx = 0; idx < list.length; idx++ ) {
			let group = list[idx];
			if ( empty(group) || group.category != 'TOPIC' ) {
				continue;
			}
			let name = `${group.title}`;
			let gid = parseInt(group.groupID); // * 1036;
			//let name = `${topic.firstName} ` + topic.lastName.substring(0,1) + ".";
			html += `  <div class='${style}'>`;
			html += `<a class='${style}'`;
			html += ` href='../topics/home.shtml?gid=${gid}'>`;
			html += `✨${group.title}`; // `🙏🏻🤞🏻`;
			/*
			if ( topic.userState == "Invited" ) {
				html += `${name} 💤`; // `🙏🏻🤞🏻`;
			} else {
				html += `👍🏻 ${name}`;
			}
			*/
			html += "</a>";
			html += "</div>\n";
			if ( ++keepers >= sSideBarLimit ) {
				html += `  <div class='${style}'>`;
				html += `<a class='${style}'`;
				html += ` href='../topics/index.shtml'>`;
				html += "[ more ]</a></div>\n";
				break;
			}
		}
	}
	html += `  <div class='${style} darkred'>`;
	html += `<a class='${style} darkred'`;
	//html += ` href='../topics/edit.shtml'>`;
	let startURL = '../topics/edit.shtml?create=1&type=TOPIC';
	if ( empty(gUID) ) startURL = '../account/create.shtml';
	html += ` href='${startURL}'>`;
	html += "+Start a Conversation</a></div>\n";
	//html += "</div>\n";
	html += `<div class='bar_spacer'>&nbsp;</div>`;	// empty one at the bottom for spacing
	html += "</div>";

	return html;
}

function buildGroupMemberList ( pageType, params, max=0, fields=cFieldsBASIC ) // XXX
{
	let html = "";
	let style = 		params.style;
	let addInvites = 	params.invites;
	let align = 		params.align ? params.align : cAlign.LEFT;
	let select = 		params.select ? params.select : 0;
	let showMugs = 		params.showMugs ? params.showMugs : 1;
	let totalDisplayed = 0;
	let debug = 0;

	if ( groupMembersVisible(gUID, gGroup) ) {
		let list = gGroup.members;
		if ( addInvites ) {
			/* don't need/want this anymore
			html += `  <div class='feature'>`;
			html += `    <a class='${style} darkred' onclick='editMembers(event);'>+Add People</a>`;
			html += "  </div>";
			*/
		} else {
			select = 0;
		}
		if ( !empty(list) ) {
			let display = list.length;
			let isAdmin = isGroupAdmin ( gUID, gGroup.groupID );
			let extra = 0;
			let col_align = "";
			let txt_align = "";
			let img_align = "";
			let table = ""
			let ckbox = "";
			let tableFields = 0;
			let dummy = `<div class='dummy'>&nbsp;</div>`;

			if ( gGroup.category == 'MLIST' && !empty(params.includeEmail) ) tableFields = 1;
			if ( max ) display = max;
			if ( display > list.length ) display = list.length;
			if ( list.length ) {
				extra = list.length - display;
				if ( extra > 0 && extra < 3 ) { display = list.length; extra = 0; }
				html += "<div id='member_list' class='members'>";
			}
			if ( align == cAlign.RIGHT ) {
				col_align = 'text_right';
				txt_align = 'text_right';
				img_align = 'text_left';
				table += `<div class='float_right '>`;
			} else {
				col_align = 'natural';
			}
			html += `<div class='member_col ${col_align}'>\n`;
			table += `<table class='member_table lines ${col_align}'>\n`;
			if ( tableFields ) {
				table += `<thead>\n`;
				if ( select ) {
					let checked = "";
					ckbox += "<span class='ckleft'><input type='checkbox' class='ckb' ";
					ckbox += `id='sel-ALL' ${checked} `;
					//ckbox += `onclick='selectMember(event,gGroup.members,this);' /></span>`;
					ckbox += `onclick='selectMany(event,gGroup.members,this,1);' /></span>`;
					table += `<td style='margin:0; font-size:0.7rem;'></td>`;
					table += `<td>${ckbox}</td>`;
					table += "<td></td><td></td>";
				} else {
					table += "<td></td><td></td><td></td><td></td>";
				}
				if ( fields & cFieldFlags.FIRST ) {
					table += "<td class='thmem text_right pad12'>First</td>";
				}
				if ( fields & cFieldFlags.LAST ) {
					table += "<td class='thmem text_left pad12'>Last</td>";
				}
				if ( debug ) {
					table += "<td></td>";
				}
				if ( fields & cFieldFlags.EMAIL ) {
					table += "<td class='thmem text_left pad12'>Email</td>";
				}
				if ( fields & cFieldFlags.EMAIL2 ) {
					table += "<td class='thmem text_left pad12'>Email2</td>";
				}
				if ( isAdmin && params.includeAddress ) {
					if ( fields & cFieldFlags.ADDR1 ) {
						table += "<td class='thmem text_left pad12'>Address 1</td>";
					}
					if ( fields & cFieldFlags.ADDR2 ) {
						table += "<td class='thmem text_left pad12'>Address 2</td>";
					}
					if ( fields & cFieldFlags.CITY ) {
						table += "<td class='thmem text_left pad12'>City</td>";
					}
					if ( fields & cFieldFlags.STATE ) {
						table += "<td class='thmem text_left pad12'>State</td>";
					}
					if ( fields & cFieldFlags.ZIP ) {
						table += "<td class='thmem text_left pad12'>ZIP</td>";
					}
					if ( fields & cFieldFlags.COUNTRY ) {
						table += "<td class='thmem text_left pad12'>Country</td>";
					}
					if ( fields & cFieldFlags.LOC ) {
						table += "<td class='thmem text_left pad12'>Latitude</td>";
						table += "<td class='thmem text_left pad12'>Longitude</td>";
					}
				}
				if ( fields & cFieldFlags.TAGS ) {
					table += "<td class='thmem text_left pad12'>Tags</td>";
					//? table += "<td class='hd lj'>Tags</td>\n";
				}
				if ( fields & cFieldFlags.NOTES ) {
					table += "<td class='thmem text_left pad12'>Notes</td>";
				}
				table += "</thead>\n";
			}
			if ( display < 20 ) gShowPending = 1;
			let displayMax = display;
			if ( !empty(gSearch) ) displayMax = list.length;

			for ( let idx = 0; idx < displayMax; idx++ ) {
				let member = list[idx];
				if ( !empty(member) ) {
					let mug = "";
					let name = "";
					let icons = "";
					let ckbox = "";
					let emailStr = "";
					if ( !empty(gSearch) ) {
						let find = gSearch.toLowerCase();
						let found = 0;
						let mbr = member;
						displayMax = list.length;		// don't limit results if there are matches
						//if ( displayMax > 500 ) displayMax = 500;
						if ( totalDisplayed >= 500 ) break;

						if ( !empty(mbr.firstName) && mbr.firstName.toLowerCase().includes(find) ) { found = 1; }
						if ( !empty(mbr.lastName) && mbr.lastName.toLowerCase().includes(find) ) { found = 1; }
						if ( !empty(mbr.email) && mbr.email.toLowerCase().includes(find) ) { found = 1; }
						if ( gDisplayFields & cFieldFlags['TAGS'] ) {
							if ( !empty(mbr.tags) && mbr.tags.toLowerCase().includes(find) ) { found = 1; }
						}
						if ( gDisplayFields & cFieldFlags['NOTES'] ) {
							if ( !empty(mbr.notes) && mbr.notes.toLowerCase().includes(find) ) { found = 1; }
						}
						if ( !found )
							continue;
					}
					let memberIsAdmin = isGroupAdmin ( member.userID, gGroupOfInterestID );
					let memberIsActive = userIsActiveMember ( member.userID, gGroupOfInterestID )
					if ( fields & cFieldFlags.FIRST ) {
						if ( empty(member.first) ) member.first = 'First';
					}
					if ( fields & cFieldFlags.LAST ) {
						if ( empty(member.last) ) member.last = 'Last';
					}
					if ( gGroup.category != 'MLIST' ) {
						if ( !memberIsActive ) {
							if ( !gShowPending ) {
								if ( !memberIsAdmin ) {
									extra++;
									continue;
								}
							}
							if ( member.memberState == "Reminded" ) icons = "&nbsp;&nbsp;🛎 ";
							if ( member.memberState == "Asked" ) icons = "❓ ";	// 🙏🏻🎣❓
						}
						if ( member.userState == "Invited" ) icons = "&nbsp;&nbsp;💤 ";
					}
					if ( select ) {
						let checked = "";
						if ( gSelected[member.userID] ) checked = " checked";
						ckbox += "<span class='ckleft'><input type='checkbox' class='ckb' ";
						ckbox += `id='sel-${member.userID}' ${checked} `;
						ckbox += `onclick='selectMember(event,gGroup.members,this);' /></span>`;
					}
					table += "<tr>\n";
					//table += "<div class='member clickable'>";
					let recID = member.userID; // * 1036;
					let aTag = `<a href='/me/home.shtml?pid=${recID}' >`
					if ( memberIsAdmin ) {
						icons += `&nbsp;<span class='ptr' onclick='perform("ADMIN_REM",${member.userID});'>🔑 <span>`;
					}
					if ( isAdmin && params.includeEmail ) {
						if ( fields & cFieldFlags.EMAIL ) {
							if ( empty(member.email) ) member.email = '';
							emailStr = ` &lt;${member.email}&gt;`;
						}
					}
					if ( tableFields ) {
						let cls = '';
						table += `<td style='margin:0; font-size:0.7rem;'>${idx+1}</td>`;
						table += `<td>${ckbox}</td>`;
						if ( isAdmin && params.allowEdits ) {
							let edit = `<span class='member_name ptr' id='edit-${idx}' onclick='editUser(${idx});'>✏️</span>`;
							//table += `<td><span class='member_name ptr' id='edit-${idx}' onclick='editUser(${idx});'>✏️</td>`;
							table += `<td><span id='edit-${idx}'>${edit}</span></td>`;
						}
						// icons
						table += `<td class='text_right'>${icons}</td>`;
						// member name
						if ( member.memberState == 'Unsubscribed' ) {
							cls = ' darkred';
						}
						table += `<td class='text_right pad12'>`;
							let fName = !empty(member.firstName) ? member.firstName : '';
							let lName = !empty(member.lastName) ? member.lastName : '';
							table += `<span class='member_name${cls}' id='first-${idx}'>`;
							table += `${fName}</span></td>`;
							table += `<td class='text_left pad12'><span class='member_name${cls}' id='last-${idx}'>`;
							table += `${lName}\n`;
						table += `</span></td>`;
						if ( isAdmin && params.includeEmail ) {
							let bad = '';
							if ( member.memberState == 'Unsubscribed' ) {
								cls = ' darkred bold';
								bad = ' [UNSUB]';
							}
							if ( parseInt(member.email_BAD) > 0 ) {
								cls = ' darkred';
								bad = ' [BAD]';
							}
							if ( debug ) {
								table += `<td style='margin:0; font-size:0.8rem;'>${recID}</td>`;
							}
							if ( fields & cFieldFlags.EMAIL ) {
								if ( empty(member.email) ) member.email = '';
								table += `<td class='text_left pad12'><span class='member_name${cls}' id='email-${idx}'>`;
								table += `${member.email}${bad}</span></td>`;
							}
							if ( fields & cFieldFlags.EMAIL2 ) {
								if ( !empty(member.email2) ) {
									cls = '';
									bad = '';
									if ( parseInt(member.email2_BAD) > 0 ) {
										cls = ' darkred bold';
										bad = ' BAD';
									}
									table += `<td class='text_left pad12'><span class='member_name${cls}' id='email2-${idx}'>`;
									table += `${member.email2}${bad}</span></td>`;
								} else {
									table += `<td></td>`;
								}
							}
						}
						if ( isAdmin && params.includeAddress ) {
							let cls = '';
							let bad = '';
							//table += `<td class='text_left pad12'><span class='member_name${cls}' id='email-${idx}'>`;
							if ( fields & cFieldFlags.ADDR1 ) {
								if ( empty(member.addr1) ) member.addr1 = '';
								table += `<td class='text_left pad12'><span class='member_name${cls}' id='addr1-${idx}'>`;
								table += `${member.addr1}</span></td>`;
							}
							if ( fields & cFieldFlags.ADDR2 ) {
								if ( empty(member.addr2) ) member.addr2 = '';
								table += `<td class='text_left pad12'><span class='member_name${cls}' id='addr2-${idx}'>`;
								table += `${member.addr2}</span></td>`;
							}
							if ( fields & cFieldFlags.CITY ) {
								if ( empty(member.city) ) member.city = '';
								table += `<td class='text_left pad12'><span class='member_name${cls}' id='city-${idx}'>`;
								table += `${member.city}</span></td>`;
							}
							if ( fields & cFieldFlags.STATE ) {
								if ( empty(member.state) ) member.state = '';
								table += `<td class='text_left pad12'><span class='member_name${cls}' id='state-${idx}'>`;
								table += `${member.state}</span></td>`;
							}
							if ( fields & cFieldFlags.ZIP ) {
								if ( empty(member.zip) ) member.zip = '';
								let zip5 = member.zip.substring(0,5);
								table += `<td class='text_left pad12'><span class='member_name${cls}' id='zip-${idx}'>`;
								table += `${zip5}</span></td>`;
							}
							if ( fields & cFieldFlags.COUNTRY ) {
								if ( empty(member.country) ) member.country = '';
								table += `<td class='text_left pad12'><span class='member_name${cls}' id='country-${idx}'>`;
								table += `${member.country}</span></td>`;
							}
							if ( fields & cFieldFlags.LOC ) {
								if ( empty(member.lat) ) member.lat = '';
								table += `<td class='text_left pad12'><span class='member_name${cls}' id='lat-${idx}'>`;
								table += `${member.lat}</span></td>`;
								if ( empty(member.lng) ) member.lng = '';
								table += `<td class='text_left pad12'><span class='member_name${cls}' id='lng-${idx}'>`;
								table += `${member.lng}</span></td>`;
							}
							if ( fields & cFieldFlags.TAGS ) {
								table += `<td class='text_left pad12'><span class='member_name${cls}' id='tags-${idx}'>`;
								table += buildUserTagList ( idx, member );
								table += `</span></td>`;
							}
							if ( fields & cFieldFlags.NOTES ) {
								table += `<td class='text_left pad12'><span class='member_name${cls}' id='notes-${idx}'>`;
								if ( empty(member.notes) ) member.notes = '';
								table += `${member.notes}`;
							}
						}
					} else {
						let fName = !empty(member.firstName) ? member.firstName : '';
						let lName = !empty(member.lastName) ? member.lastName : '';
						name = `<span class='member_name'>${aTag} ${fName} ${lName}${emailStr} ${icons}</span>\n`;
						if ( align == cAlign.RIGHT ) {
							name = `<span class='member_name'>${aTag}${icons}&nbsp;&nbsp;${fName} ${lName}${emailStr}</a></span>\n`;
						}
						if ( showMugs ) {
							mug += `${aTag}  <img class='member_img incircle' `;
							mug += ` src='https://files.zipit.social/uimg/${recID}' /></a>`;
						}
						//table += "<div class='member_row'>\n";
						if ( align == cAlign.RIGHT ) {
							table += `<td class='txt_align'>${name}</td><td class='img_align'>${mug}</td><td>${ckbox}</td>`;
						} else {
							table += `<td>${ckbox}</td><td class='img_align'>${mug}</td><td class='txt_align'>${name}</td>`;
						}
					}
				}
				totalDisplayed++;
			}
			table += "</table></div></div>\n";
			if ( list.length ) {
				if ( extra ) {
					table += "<div class='clickable indent headroom'";
						table += ` onclick='seeMoreRows(${gGroup.groupID});' >`;
							table += `<div class='member_row'>[${gDisplayIncrement} More]</div>\n`;
						table += "</a>";
					html += "</div>";
					/* we don't always want this (like on group/members edit page), so for now let's not do it
					table += "<div class='clickable'";
						table += ` onclick='viewMembers(event);' >`;
							table += `<div class='member_row'>[See All]</div>\n`;
						table += "</a>";
					html += "</div>";
					*/
				}
				if ( align == cAlign.RIGHT ) {
					html += `${dummy}${table}`;
				} else {
					html += `${table}${dummy}`;
				}
				html += "</div>";	// end of list
			}
		}
	} else {
		html += "<div>";
		html += `  <div class='${style}'>Private</div>\n`;
		html += "</div>";
	}
	params['totalDisplayed'] = totalDisplayed;

	return html;
}

function buildUserTagList ( idx, member )
{
	let str = "";
	let tagList = null;

	if ( !empty(member.tags) ) {
		// already in string form
		return member.tags;
	}
	if ( !empty(member.tagArray) ) {
		tagList = member.tagArray;
		if ( typeof tagList == 'string' ) tagList = tagList.split("|");
	}
	if ( !empty(tagList) ) {
		/*
		str += `<table><thead><tr/>\n`;
		str += `  <td class='chk_yes'><input type='checkbox' class='ckb ck_inline' id='allYes', onclick='checkAllTags(this,"yes");'/></td>\n`;
		str += `  <td class='chk_no'><input type='checkbox' class='ckb ck_inline' id='allNo', onclick='checkAllTags(this,"no");'/></td>\n`;
		str += `  <td>&nbsp;</td>\n`;
		str += `</thead>\n`;
		*/
		for ( let tagID of tagList ) {
			if ( !empty(gData.tags) ) {
				let tag = gData.tags.tag_dict[tagID];
				if ( !empty(tag) ) {
					if ( !empty(str) ) str += ", ";
					str += tag.tagName;
				} else {
					console.log ( `can't find tag ${tagID} in global list` );
				}
			}
			/*
			let type = tag['type'];
			if ( type != "2" ) {
				let checked = '';
				if ( false ) checked = 'checked';
				str += `<tr\>\n`;
				str += `  <td><input ${checked} type='checkbox' id='ck_yes_${tagIdx}' class='ckb ck_inline' onclick='checkTag("yes","${tagIdx}");'/></td>\n`;
				str += `  <td><input ${checked} type='checkbox' id='ck_no_${tagIdx}' class='ckb ck_inline' onclick='checkTag("no","${tagIdx}");'/></td>\n`;
				str += `  <td><label for='ck_opt_${tagIdx}'>${tagName}</label></td>\n`;
				str += `</tr>\n`;
			}
			*/
		}
		if ( empty(member.tags) ) gGroup.members[idx].tags = str;
		/*
		str += `</table>\n`;
		str += `<br/>\n`;
		str += `<div id='b_export' class='roundbutt littlebutt' onclick='exportCSV()'>Export CSV</div><br/>\n`;
		str += `<div id='b_del_tags' class='roundbutt littlebutt' onclick='deleteTags()'>Delete Tags</div>\n`;

		$("#tag_area").html ( str );
		*/
	}
	return str;
}

function buildFriendsList ( personID=0, params, max=0 )
{
	let html = "";
	let list = gData.friends;
	let align = (params && params.align) ? params.align : cAlign.LEFT;
	let select = (params && params.select) ? params.select : 0;
	let totalDisplayed = 0;

	if ( is_mobile() ) align = cAlign.RIGHT;

	if ( personID ) {
		if ( !empty(gData.users[personID]) ) {
			let personRec = gData.users[personID];
			list = personRec.friends;
		}
	}

	html += "<div>";
	if ( !empty(list) ) {
		let display = list.length;
		let extra = 0;
		let col_align = "";
		let txt_align = "";
		let img_align = "";
		let table = ""
		let dummy = `<div class='dummy'>&nbsp;</div>`;

		list.sort(function(a, b) {
			if ( a.userState == "Invited" ) {
				if ( b.userState == "Invited" ) return 0;
				return 1;
			}
			if ( b.userState == "Invited" ) {
				if ( a.userState == "Invited" ) return 0;
				return -1;
			}
			return 0;
		});
		if ( max ) display = max;
		if ( display > list.length ) display = list.length;
		if ( list.length ) {
			extra = list.length - display;
			if ( extra < 3 ) { display = list.length; extra = 0; }
			html += "<div id='friends' class='members'>";
		}
		if ( align == cAlign.RIGHT ) {
			col_align = 'text_right';
			txt_align = 'text_right';
			img_align = 'text_left';
			table += `<div class='float_right '>`;
		} else {
			col_align = 'natural';
		}
		html += `<div class='member_col ${col_align}'>\n`;
		table += `<table class='member_table ${col_align}'>\n`;
		if ( select ) {
			let box = `<span class='ckleft'><input type='checkbox' class='ckb' `;
			box += `id='select_all' `;
			box += `onclick='selectMany(event,gData.friends,this);' /></span>`;
			html += `<h1>${box}Friends</h1>`;
		}
		for ( let idx = 0; idx < display; idx++ ) {
			let friend = list[idx];
			let name = "";
			let state = "";
			let ckbox = "";
			let friendStatus = isFriend ( personID, friend.userID );
			let genID = friend.userID; // * 1036;
			let mug = "";

			if ( friendStatus == cFriendStatus.NOT_FRIENDS ) continue;
			if ( friendStatus == cFriendStatus.DISCONNECTED ) continue;
			if ( friend.fake == "1" ) state += "👻";

			if ( select ) {
				let checked = "";
				if ( gSelected[friend.userID] ) checked = " checked";
				ckbox += "<span class='ckleft'><input type='checkbox' class='ckb' ";
				ckbox += `id='sel-${friend.userID}' ${checked} `;
				ckbox += `onclick='selectMember(event,gData.friends,this);' /></span>`;
			}
			//let name = `${friend.firstName} ` + friend.lastName.substring(0,1) + ".";
			table += "<tr>\n";
			let aTag = `<a href='../me/home.shtml?pid=${genID}'>`;
			if ( friend.userState == "Invited" ) {
				state = `&nbsp;&nbsp;💤`; // `🙏🏻🤞🏻`;
			} else {
				switch ( friendStatus ) {
					case cFriendStatus.ACTIVE:		state = `&nbsp;&nbsp;👍🏻`; break;
					case cFriendStatus.REQUESTED:	state = `&nbsp;&nbsp;❓`; break;
					case cFriendStatus.RECEIVED:	state = `&nbsp;&nbsp;🙏🏻`; break;
					default:						state = `&nbsp;&nbsp;❌`; break;
				}
			}
			let fName = !empty(friend.firstName) ? friend.firstName : '';
			let lName = !empty(friend.lastName) ? friend.lastName : '';
			name = `<span class='member_name'>${aTag} ${fName} ${lName} ${state}</span>\n`;
			if ( align == cAlign.RIGHT ) {
				name = `<span class='member_name'>${aTag}${state}&nbsp;&nbsp;${fName} ${lName}</a></span>\n`;
			}
			mug += `${aTag}  <img class='member_img incircle' `;
			mug += ` src='https://files.zipit.social/uimg/${genID}' /></a>`;
			if ( align == cAlign.RIGHT ) {
				table += `<td class='txt_align'>${name}</td><td class='img_align'>${mug}</td><td>${ckbox}</td>`;
			} else {
				table += `<td>${ckbox}</td><td class='img_align'>${mug}</td><td class='txt_align'>${name}</td>`;
			}
			/*
			if ( idx >= max ) {
				html += `  <div class='${style}'>`;
				html += `<a class='${style}'`;
				html += " href='../network/index.shtml'>";
				html += "[ more ]</a></div>\n";
				break;
			}
			*/
			totalDisplayed++;
		}
		table += "</table></div></div>\n";
		if ( list.length ) {
			if ( extra ) {
				table += "<div class='clickable indent headroom'>";
					table += `<a href='../network/index.shtml?uid=${gUID}' >`;
						table += `<div class='member_row'>[See All ${list.length} Friends]</div>\n`;
					table += "</a>";
				table += "</div>";
			}
			if ( align == cAlign.RIGHT ) {
				html += `${dummy}${table}`;
			} else {
				html += `${table}${dummy}`;
			}
			html += "</div>";	// end of list
		}
	}
	html += `  <div class='member_name darkred'>`;
	html += `<a class='member_name darkred'`;
	html += ` href='../network/edit.shtml?zip=${gMe.zip}'>`;
	html += "+Add People</a></div>\n";
	//html += "</div>\n";
	html += `<div class='bar_spacer'>&nbsp;</div>`;	// empty one at the bottom for spacing
	html += "</div>";
	params['totalDisplayed'] = totalDisplayed;

	return html;
}

function buildAttendeeList ( eventID, params, max=0 )
{
	let html = "";
	let style = 		params.style;
	let addInvites = 	params.invites;
	let align = 		params.align ? params.align : cAlign.LEFT;
	let select = 		params.select ? params.select : 0;
	let event = loadEvent ( eventID );
	let list = gData.eventpeople;
	let totalDisplayed = 0;

	if ( is_mobile() ) align = cAlign.RIGHT;

	if ( !empty(event) ) {
		//let personRec = gData.users[gPersonOfInterestID];
		//list = personRec.friends;
		//list = event.people;
	}

	html += "<div>";
	if ( !empty(list) ) {
		let display = list.length;
		let extra = 0;
		let col_align = "";
		let txt_align = "";
		let img_align = "";
		let table = ""
		let dummy = `<div class='dummy'>&nbsp;</div>`;
		let isAdmin = isGroupAdmin ( gUID, gGroupOfInterestID );

		list.sort(function(a, b) {
			if ( a.userState == "Invited" ) {
				if ( b.userState == "Invited" ) return 0;
				return 1;
			}
			if ( b.userState == "Invited" ) {
				if ( a.userState == "Invited" ) return 0;
				return -1;
			}
			return 0;
		});
		if ( max ) display = max;
		if ( display > list.length ) display = list.length;
		if ( list.length ) {
			extra = list.length - display;
			if ( extra < 3 ) { display = list.length; extra = 0; }
			html += "<div id='member_list' class='members'>";
		}
		if ( align == cAlign.RIGHT ) {
			col_align = 'text_right';
			txt_align = 'text_right';
			img_align = 'text_left';
			table += `<div class='float_right '>`;
		} else {
			col_align = 'natural';
		}
		html += `<div class='member_col ${col_align}'>\n`;
		table += `<table class='member_table ${col_align}'>\n`;
		for ( let idx = 0; idx < display; idx++ ) {
			let person = list[idx];
			let name = "";
			let state = "";
			let ckbox = "";
			let genID = person.userID; // * 1036;
			let mug = "";
			let showID = "";
			if ( isAdmin ) showID = `[${genID}] `;
			if ( person.fake == "1" ) state += "👻";

			//let name = `${person.firstName} ` + person.lastName.substring(0,1) + ".";
			table += "<tr>\n";
			let aTag = `<a href='../me/home.shtml?pid=${genID}'>`;
			if ( person.userState == "Invited" ) {
				if ( empty(person.email) || person.email.includes('@zipit.email') ) {
					state = `&nbsp;&nbsp;❓`;
				} else {
					state = `&nbsp;&nbsp;💤`; // `🙏🏻🤞🏻`;
				}
			} else {
			}
			if ( select ) {
				let checked = "";
				if ( gSelected[person.userID] ) checked = " checked";
				ckbox += "<span class='ckleft'><input type='checkbox' class='ckb' ";
				ckbox += `id='sel-${person.userID}' ${checked} `;
				ckbox += `onclick='selectMember(event,gEvent.attendees,this);' /></span>`;
			}
			let fName = !empty(person.firstName) ? person.firstName : '';
			let lName = !empty(person.lastName) ? person.lastName : '';
			name = `<span class='member_name'>${aTag} ${showID}${fName} ${lName} ${state}</span>\n`;
			if ( align == cAlign.RIGHT ) {
				name = `<span class='member_name'>${aTag}${state}&nbsp;&nbsp;${fName} ${lName}</a></span>\n`;
			}
			mug += `${aTag}  <img class='member_img incircle' `;
			mug += ` src='https://files.zipit.social/uimg/${genID}' /></a>`;
			if ( align == cAlign.RIGHT ) {
				table += `<td class='txt_align'>${name}</td><td class='img_align'>${mug}</td><td>${ckbox}</td>`;
			} else {
				table += `<td>${ckbox}</td><td class='img_align'>${mug}</td><td class='txt_align'>${name}</td>`;
			}
			/*
			if ( idx >= max ) {
				html += `  <div class='${style}'>`;
				html += `<a class='${style}'`;
				html += " href='../network/index.shtml'>";
				html += "[ more ]</a></div>\n";
				break;
			}
			*/
			totalDisplayed++;
		}
		table += "</table></div></div>\n";
		if ( list.length ) {
			if ( extra ) {
				table += "<div class='clickable indent headroom'>";
					table += `<a href='./attendees.shtml?eid=${gEventID}' >`;
						table += `<div class='member_row'>[See All ${list.length} Attendees]</div>\n`;
					table += "</a>";
				table += "</div>";
			}
			if ( align == cAlign.RIGHT ) {
				html += `${dummy}${table}`;
			} else {
				html += `${table}${dummy}`;
			}
			html += "</div>";	// end of list
		}
	}
	if ( addInvites ) {
		html += `  <div class='member_name darkred'>`;
		html += `<a class='member_name darkred'`;
		html += ` href='../events/attendees.shtml?eid=${gEventID}'>`;
		html += "+Invite People</a></div>\n";
	}
	//html += "</div>\n";
	html += `<div class='bar_spacer'>&nbsp;</div>`;	// empty one at the bottom for spacing
	html += "</div>";
	params['totalDisplayed'] = totalDisplayed;

	return html;
}

function refreshSelectionUI ( title='Member' )
{
	let selectCount = countSelected();
	let total = gGroup.members.length;
	let allSelected = (selectCount == total) ? 1 : 0;
	let s = "";
	if ( selectCount != 1 ) s = "s";
	let text = `${selectCount} ${title}${s} Selected`;
	$(".sel_count").html ( text );
	if ( selectCount ) {
		$(".sel_count").prop('disabled', false);
		$(".selonly").prop('disabled', false);
	} else {
		$(".sel_count").prop('disabled', true);
		$(".selonly").prop('disabled', true);
		//$("#sel_count1").hide();
		//$("#actions").hide();
	}
	let ckbox = document.getElementById(`select_all`);
	if ( !empty(ckbox) ) ckbox.checked = allSelected;
	//let count = countSelected();
	let heading = `${total} Members`;
	let toGroup = `${total}`;
	if ( selectCount > 0 && !allSelected ) {
		heading = `${selectCount} Member${s} selected of ${total} Total`;
		toGroup = `${selectCount} of ${total}`;
	}
	let add = `<span class='ptr smaller' onclick='newUser(event);'>[+Add]</span>`;
	$("#member_list_header").html ( `${heading} ${add}` );
	let obj = $("#to_group");
	$("#to_selected").text ( `${toGroup}` );

	let active = countSelected();
	let sleepers = total - active;
	if ( sleepers > 0 ) {
		const msg = `Send to <span class='to_group' id='to_selected'>${active} of ${total}</span> people`;
		//updateTargetUI ( sleepers );
		$("#to_whom").html ( `${msg} in ` );
		$("#target_summary").html ( msg );
	} else {
		const msg = `Send to <span class='to_group' id='to_selected'>${active}</span> people`;
		$("#to_whom").html ( `${msg} in ` );
		$("#target_summary").html ( msg );
	}

}

function countSelected()
{
	let count = 0;
	for ( let userID in gSelected ) {
		if ( gSelected[userID] ) count++;
	}

	return count;
}

function listOfSelected()
{
	let count = 0;
	for ( let userID in gSelected ) {
		if ( gSelected[userID] ) {
		}
	}

	return count;
}

function countImported()
{
	let count = 0;
	if ( !empty(gEmailList) ) count = gEmailList.length;
	if ( !empty(gUploadData) ) {
		if ( gUploadData.actual != count ) count = gUploadData.actual;
	}

	return count;
}

function havePartialImportList()
{
	let count = 0;
	let partial = 0;
	if ( !empty(gEmailList) ) count = gEmailList.length;
	if ( !empty(gUploadData) ) {
		if ( gUploadData.total > count ) {
			count = gUploadData.total;
			partial = 1;
		}
	}
	if ( count ) partial = 1;
	return partial;
}

function selectAllMembers ( list )
{
	for ( let member of list ) {
		let userID = member.userID;
		let ckbox = document.getElementById ( `sel-${userID}` );
		if ( !empty(ckbox) ) {
			ckbox.checked = 1;
			gSelected[userID] = 1;
		}
	}
	refreshSelectionUI ( );
}

function selectMember ( event, list, item )
{
	let userID = item.id.split("-")[1];
	if ( item.checked ) {
		//console.log ( `Selected user ${userID}` );
		gSelected[userID] = 1;
	} else {
		//console.log ( `DEselected user ${userID}` );
		gSelected[userID] = 0;
	}

	refreshSelectionUI ( );

	if ( typeof memberSelectCallBack === "function" ) {	// defined?
		memberSelectCallBack ( item );
	}
	gNonTrivialActions++;
}

function selectMany ( event, list, item, includeSleepers=0, verb="ALL" )
{
	let active = countActiveMembers ( list );
	let someSelected = countSelected();
	let select = 1;
	let numShown = active;
	let memberIsActive = true;

	if ( includeSleepers ) {
		numShown = list.length;
	}
	if ( someSelected ) {
		if ( someSelected == numShown ) {
			select = 0;
			item.checked = 0;	// select none
		} else {
			item.checked = 1;	// select the rest
		}
	}

	for ( let member of list ) {
		memberIsActive = true;
		if ( list == gGroup.members ) {
			 memberIsActive = userIsActiveMember ( member.userID, gGroupOfInterestID );
		}
		if ( memberIsActive || includeSleepers ) {
			let userID = member.userID;
			let ckbox = document.getElementById ( `sel-${userID}` );
			if ( !empty(ckbox) ) {
				if ( verb == "ALL" ) {
					ckbox.checked = select;
					gSelected[userID] = select;
				}
				if ( verb == "PENDING" ) {
					if ( !memberIsActive ) {
						select = 1;
						ckbox.checked = select;
						gSelected[userID] = select;
					}
				}
			} else {
				let bp = 1;
			}
		}
	}
	refreshSelectionUI ( );
}

function refreshFriendSelectionUI ( list )
{
	let selectCount = countSelected();
	let allSelected = (selectCount == list.length) ? 1 : 0;
	let s = "";
	if ( selectCount != 1 ) s = "s";
	let text = `${selectCount} Friend${s} Selected`;
	$(".sel_count").html ( text );
	if ( selectCount ) {
		$(".sel_count").prop('disabled', false);
		$(".selonly").prop('disabled', false);
	} else {
		$(".sel_count").prop('disabled', true);
		$(".selonly").prop('disabled', true);
		//$("#sel_count1").hide();
		//$("#actions").hide();
	}
	let ckbox = document.getElementById(`select_all`);
	if ( !empty(ckbox) ) ckbox.checked = allSelected;
}


