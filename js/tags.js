
/*
 * ZIPit
 *
 * 8/22/2023
 *
 * tags.js
 *
 * Tagging support
 */

// Tags

var gTagList = [];
var gTagSort = "alpha";
var gTagSortDirection = 1;

function buildGlobalTagList ( )
{
	let str = "";
	if ( !empty(gTagList) ) {
		str += `<table><thead><tr/>\n`;
		str += `  <td class='chk_yes'><input type='checkbox' class='ckb ck_inline' id='allYes', onclick='checkAllTags(this,"yes");'></td>\n`;
		str += `  <td class='chk_no'><input type='checkbox' class='ckb ck_inline' id='allNo', onclick='checkAllTags(this,"no");'></td>\n`;
		str += `  <td class='ptr' id='ck_sort_usage', onclick='changeSort(this,"usage");'>` + sortIcon('usage') + `</td>\n`;
		str += `  <td class='ptr' id='ck_sort_alpha', onclick='changeSort(this,"alpha");'>` + sortIcon('alpha') + `</td>\n`;
		str += `  <td>&nbsp;</td>\n`;
		str += `</thead>\n`;

		gData.tags.tag_array.sort ( compare );

		//for ( const tagID in gTagList ) {
		for ( const tag of gData.tags.tag_array ) {
			let tagID = tag['tagID'];
			//let tag = gData.tags.tag_dict[tagID];
			let type = tag['type'];
			let tagName = tag['tagName'];
			let usage = 0;
			if ( !empty(gData.tags.tag_usage) ) usage = gData.tags.tag_usage[tagID];
			if ( type != "2" ) {
				let checked = '';
				if ( false ) checked = 'checked';
				str += `<tr\>\n`;
				str += `  <td><input ${checked} type='checkbox' id='ck_yes_${tagID}' class='ckb ck_inline' onclick='checkTag("yes","${tagID}");'/></td>\n`;
				str += `  <td><input ${checked} type='checkbox' id='ck_no_${tagID}' class='ckb ck_inline' onclick='checkTag("no","${tagID}");'/></td>\n`;
				if ( !empty(gData.tags.tag_usage) ) str += `  <td>${usage}</td>\n`;
				str += `  <td><label for='ck_opt_${tagID}'>` + tagName + `</label></td>\n`;
				str += `</tr>\n`;
			}
		}
		str += `</table>\n`;
		str += `<br/>\n`;
		str += `<div id='b_export' class='roundbutt littlebutt' onclick='exportCSV()'>Export CSV</div><br/>\n`;
		str += `<div id='b_del_tags' class='roundbutt littlebutt' onclick='deleteTags()'>Delete Tags</div>\n`;

		$("#tag_list_head").html ( `${gData.tags.tag_array.length} Tags` );
		$("#tag_area").html ( str );
	}
	return str;
}

function changeSort ( item, method )
{
	if ( gTagSort == method ) {
		gTagSortDirection *= -1;
	} else {
		gTagSort = method;
		if ( method == 'alpha' ) gTagSortDirection = 1;
		if ( method == 'usage' ) gTagSortDirection = -1;
	}
	const icon = (gTagSortDirection > 0) ? '↗️' : '↘️';
	$(`#ck_sort_${method}`).html ( icon );
	buildGlobalTagList();
}

function sortIcon ( method )
{
	let icon = '↗️';
	if ( gTagSort == method ) {
		if ( gTagSortDirection < 0 ) icon = '↘️';
	} else {
		if ( method == 'alpha' ) icon = '↗️';
		if ( method == 'usage' ) icon = '↘️';
	}
	return icon;
}

function compare (a, b)
{
	if ( gTagSort == "alpha" ) {
		if ( a.tagName > b.tagName ) { return gTagSortDirection * 1; }
		else if ( a.tagName < b.tagName ) { return gTagSortDirection * -1; }
		return 0;
	}
	if ( gTagSort == "usage" && !empty(gData.tags.tag_usage) ) {
		const usageA = gData.tags.tag_usage[a.tagID];
		const usageB = gData.tags.tag_usage[b.tagID];
		if ( usageA > usageB ) { return gTagSortDirection * 1; }
		else if ( usageA < usageB ) { return gTagSortDirection * -1; }
		if ( a.tagName > b.tagName ) { return gTagSortDirection * 1; }
		else if ( a.tagName < b.tagName ) { return gTagSortDirection * -1; }
		return 0;
	}
}
function createNewTag ( userID, tagName, tagID=0 )
{
	let exists = false;
	for ( idxID in gTagList ) {
		let tag = gTagList[idxID];
		let existingTagName = tag['tagName'];
		if ( tagName == existingTagName ) {
			alert ( "Already exists: " + tagName );
			exists = true;
			break;
		}
	}
	if ( !exists ) {
		if ( tagID == 0 ) {
			// async, will end up back in this function with real tagID when it completes
			createTagOnServer ( userID, tagName );
		} else {
			let tag = {};
			tag['tagID'] = tagID;
			tag['tagName'] = tagName;
			gTagList[tagID] = tag;
			userToggleTag ( userID, tagID );
			$(`#tags-${userID}`).html ( buildTagLink(userID) );
			buildGlobalTagList();
		}
	}
}

function findGlobalTag ( findID )
{
	let foundIdx = -1;
	for ( idxID in gTagList ) {
		let tag = gTagList[idxID];
		if ( findID == tag['tagID'] ) {
			foundIdx = idxID;
			break;
		}
	}
	return foundIdx;
}

function deleteTags ( )
{
	let deleteList = [ ];

	for ( let tagIdx in gTagList ) {
		let checked = 0;
		let tag = gTagList[tagIdx];
		//tag['selected'] = checked;
		let box = document.getElementById ( `ck_yes_${tagIdx}` );
		if ( box.checked ) checked++;
		box = document.getElementById ( `ck_no_${tagIdx}` );
		if ( box.checked ) checked++;
		if ( checked ) {
			deleteList.push ( tag.tagID );
		}
	}
	if ( !empty(deleteList) ) {
		deleteTagsOnServer ( gUID, deleteList );
		deleteTagsLocal ( gUID, deleteList );
		buildGlobalTagList();
	}
}

function deleteTagsLocal ( userID, tagList )
{
	// remove tags from local users in gUsers:
	for ( let memberID in gUsers ) {
		let member = gUsers[memberID];
		if ( !empty(member['tagArray']) ) {
			for ( let idx = 0; idx < tagList.length; idx++ ) {
				let tagID = tagList[idx];
				let tag = gTagList[tagID];
				let tagName = tag['tagName'];
				if ( userHasTag(memberID, tagID) ) {
					let memberTags = member['tagArray'];
					let jdx = memberTags.indexOf(tagID);
					memberTags.splice ( jdx, 1 );		// removes the object from the array
					console.log ( `remove tag ${tagName} from ${member.firstName} ${member.lastName}` );
				}
			}
		}
	}
	// remove tags from gTagList and remove checkboxes:
	for ( let idx = 0; idx < tagList.length; idx++ ) {
		let tagID = tagList[idx];
		let globalIdx = findGlobalTag ( tagID );
		let tag = gTagList[globalIdx];
		/* checkboxes disappear via buildGlobalTagList()
		let boxYes = document.getElementById ( `ck_yes_${tagIdx}` );
		let boxNo = document.getElementById ( `ck_no_${tagIdx}` );
		box = document.getElementById ( `ck_no_${tagIdx}` );
		*/
		console.log ( `delete tag ${tag.tagName} at idx ${globalIdx} from gTagList` );
		if ( globalIdx >= 0 && globalIdx < gTagList.length ) {
			gTagList.splice ( globalIdx, 1 );		// removes the object from the array
		}
	}
}

function createTagOnServer ( userID, tagName )
{
	let getUrl = `https://${gServer}/php/edit_user_tag.php`;
	let sep = '?';

	getUrl += sep + "userID=" + userID; sep = '&';
	getUrl += sep + "operation=create"; sep = '&';
	getUrl += sep + "tagName=" + encodeURIComponent(tagName); sep = '&';
	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			let newTagID = data['tagID'];
			let newTagName = data['tagName'];
			console.log(data);
			createNewTag ( userID, newTagName, newTagID );
			//load_list();
			//setTimeout ( refreshFromServer, 500 * 1 );
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " createTagOnServer" );
		}
	});
}

function deleteTagsOnServer ( userID, tagList )
{
	let getUrl = `https://${gServer}/php/edit_user_tag.php`;
	let sep = '?';

	// build list if comma-separated tags
	let commaList = "";
	for ( let idx = 0; idx < tagList.length; idx++ ) {
		let tagID = tagList[idx];
		let tag = gTagList[tagID];
		let tagName = tag['tagName'];
		if ( idx > 0 ) commaList += ",";
		commaList += encodeURIComponent ( tagName );
	}
	//alert ( `deleteTagsOnServer: ${commaList}` );
	getUrl += sep + "userID=" + userID; sep = '&';
	getUrl += sep + "operation=delete"; sep = '&';
	getUrl += sep + `tagList=${commaList}`; sep = '&';
	jQuery.ajax({url:getUrl,  dataType:'text',
		success:function(data) {
			console.log(data);
			if ( typeof refreshTags === 'function' ) refreshTags();
			//createNewTag ( userID, newTagName, newTagID );
			//load_list();
			//setTimeout ( refreshFromServer, 500 * 1 );
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " createTagOnServer" );
		}
	});
}

function setTagOnServer ( personID, tagID, onOrOff, tagName="" )
{
	let getUrl = `https://${gServer}/php/set_user_tags.php`;
	let sep = '?';
	
	getUrl += sep + "ownerID=" + gUID; sep = '&';
	getUrl += sep + "personID=" + personID; sep = '&';
	getUrl += sep + "groupID=" + gGroupOfInterestID; sep = '&';
	getUrl += "&tagID=" + tagID; sep = '&';
	if ( !empty(tagName) ) getUrl += "&tagName=" + tagName;
	getUrl += "&value=";
	if ( onOrOff ) getUrl += "1"; else getUrl += "0";
	jQuery.ajax({url:getUrl,  dataType:'text',
		success:function(data) {
			if ( data > 0 ) {
				console.log(data);
			}
			//setTimeout ( refreshFromServer, 500 * 1 );
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " setTagOnServer" );
		}
	});
}

function getTagListFromServerXX ( groupID )
{
	let getUrl = `https://${gServer}/php/json_data_tags.php`;
	let sep = '?';

	getUrl += sep + "uid=" + gUID; sep = '&';
	getUrl += sep + "gid=" + groupID; sep = '&';
	/*
	getUrl += sep + "flag=" + flagValue; sep = '&';
	console.log(getUrl);
	*/
	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			if ( empty(gTagList) ) gTagList = [];
			for ( let tdx = 0; tdx < data.length; tdx++ ) {
				let tag = data[tdx];
				let tagID = tag['tagID'];
				let tagName = tag['tagName'];
				if ( !empty(gTagList[tagID]) ) {
					oldTag = gTagList[tagID];
					tag.includeYes = oldTag.includeYes;
					tag.includeNo = oldTag.includeNo;
				}
				gTagList[tagID] = tag;
			}
			updateTargetedMembers ( gGroup.members );
			buildGlobalTagList();
			//load_list();
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_order_list" );
		}
	});
}

function checkTag ( yesOrNo, tagIdx )
{
	let tag = gTagList[tagIdx];
	if ( !empty(tag) ) {
		let boxAllYes = document.getElementById ( `allYes` );
		let boxAllNo = document.getElementById ( `allNo` );
		if ( yesOrNo == 'yes' ) {
			if ( empty(tag.includeYes) ) tag.includeYes = 0;
			tag.includeYes = 1 - tag.includeYes;
			if ( tag.includeYes ) {
				let box = document.getElementById ( `ck_no_${tagIdx}` );
				if ( !empty(box) ) box.checked = false;
				tag.includeNo = 0;
			}
		} else {
			if ( empty(tag.includeNo) ) tag.includeNo = 0;
			tag.includeNo = 1 - tag.includeNo;
			if ( tag.includeNo ) {
				let box = document.getElementById ( `ck_yes_${tagIdx}` );
				if ( !empty(box) ) box.checked = false;
				tag.includeYes = 0;
			}
		}
		let someYes = numberTagsChecked('yes');
		let someNo = numberTagsChecked('no');
		if ( someYes + someNo > 0 ) {
			let s = 's';
			if ( someYes == 1 ) s = '';
			//gOptions['unselected'].state = 0;
			$("#b_del_tags").html ( `Delete ${someYes} Tag${s}` );
		} else {
			$("#b_del_tags").html ( `Delete Tags` );
			//gOptions['unselected'].state = 1;
		}
		updateTargetedMembers ( gGroup.members );
		update_people_list();
	}
}

function listOfTagsChecked ( yesOrNo )
{
	let list = [ ];

	for ( let tagIdx in gTagList ) {
		let tag = gTagList[tagIdx];
		//tag['selected'] = checked;
		let box = document.getElementById ( `ck_yes_${tagIdx}` );
		if ( yesOrNo == 'no' ) {
			box = document.getElementById ( `ck_no_${tagIdx}` );
		}
		if ( !empty(box) && box.checked ) {
			list.push ( tag.tagID );
		}
	}
	return list;
}

function numberTagsChecked ( yesOrNo )
{
	let numChecked = 0;

	for ( let tagIdx in gTagList ) {
		let tag = gTagList[tagIdx];
		//tag['selected'] = checked;
		let box = document.getElementById ( `ck_yes_${tagIdx}` );
		if ( yesOrNo == 'no' ) {
			box = document.getElementById ( `ck_no_${tagIdx}` );
		}
		if ( !empty(box) && box.checked ) {
			numChecked++;
		}
	}
	return numChecked;
}

function allTagsChecked ( yesOrNo )
{
	let allChecked = true;

	for ( let tagIdx in gTagList ) {
		let tag = gTagList[tagIdx];
		let box = document.getElementById ( `ck_yes_${tagIdx}` );
		if ( yesOrNo == 'no' ) {
			box = document.getElementById ( `ck_no_${tagIdx}` );
		}
		if ( !empty(box) && !box.checked ) {
			allChecked = false;
			break;
		}
	}
	return allChecked;
}

function tagChecked ( yesOrNo, tagID )
{
	let isChecked = false;
	let tagIdx = parseInt ( tagID );

	let box = document.getElementById ( `ck_yes_${tagIdx}` );
	if ( yesOrNo == 'no' ) {
		box = document.getElementById ( `ck_no_${tagIdx}` );
	}
	if ( !empty(box) && box.checked ) {
		isChecked = true;
	}
	let boxAllYes = document.getElementById ( `allYes` );
	let boxAllNo = document.getElementById ( `allNo` );
	return isChecked;
}

function checkAllTags ( elem, yesOrNo )
{
	let totalTags = gTagList.count;
	let val = elem.checked;
	let boxAllYes = document.getElementById ( `allYes` );
	let boxAllNo = document.getElementById ( `allNo` );
	let checked = true;
	if ( yesOrNo == 'yes' ) {
		if ( allTagsChecked('yes') ) checked = false;
	} else {
		if ( allTagsChecked('no') ) checked = false;
	}
	if ( elem == boxAllYes ) {
		let bp = 1;
	}

	for ( let tagIdx in gTagList ) {
		let tag = gTagList[tagIdx];
		let tagName = tag['tagName'];
		tag['selected'] = checked;
		let boxYes = document.getElementById ( `ck_yes_${tagIdx}` );
		let boxNo = document.getElementById ( `ck_no_${tagIdx}` );
		if ( !empty(boxYes) && !empty(boxNo) ) {
			if ( yesOrNo == 'yes' ) {
				boxYes.checked = checked;
				if ( checked ) boxNo.checked = false;
			} else {
				boxNo.checked = checked;
				if ( checked ) boxYes.checked = false;
			}
		}
	}
	boxAllYes.checked = allTagsChecked('yes');
	boxAllNo.checked = allTagsChecked('no');

	updateTargetedMembers ( gGroup.members );
	update_people_list();
}

function countUsersWithTag ( findTagID )
{
	let count = 0;
	for ( let udx = 1; udx < gSequence.length; udx++ ) {
		let userID = gSequence[udx];
		let user = gUsers[userID];
		let tagList = user['tagArray'];
		if ( !empty(tagList) ) {
			for ( let tdx = 0; tdx < tagList.length; tdx++ ) {
				let tagID = parseInt(tagList[tdx]);
				if ( tagID == findTagID ) count++;
			}
		}
	}
	return count;
}

function countSelectedTags()
{
	let count = 0;
	for (let tagID in gTagList) {
		//if ( gTagSelection[tagID] ) count++;
		if ( gTagList[tagID].includeYes ) count++;
	}
	return count;
}

function countKnownTags()
{
	let count = 0;
	for (let globalTagID in gTagList ) { count++; }
	return count;
}

function countExcludedTags()
{
	let count = 0;
	for (let tagID in gTagList) {
		//if ( gTagExcluded[tagID] ) count++;
		if ( gTagList[tagID].includeNo ) count++;
	}
	
	return count;
}

function someApplicableTags()
{
	let result = ( (countSelectedTags() + countExcludedTags()) > 0);
	return result;
}

function allSelectedTags()
{
	let result = false;
	let count = countSelectedTags();
	if ( count > 0 && count >= (countKnownTags()) ) result = true;
	return result;
}

function allExcludedTags()
{
	let result = false;
	let count = countExcludedTags();
	if ( count > 0 && count >= (countKnownTags()) ) result = true;
	return result;
}

function firstSelectedTag()
{
	let result = null;
	for (let tagID in gTagList) {
		if ( gTagSelection[tagID] ) {
			result = tagID;
			break;
		}
	}
	return result;
}

function userHasTag ( userID, tagID )
{
	let user = gUsers[userID];
	let tag = gTagList[tagID];
	let hasTag = false;
	if ( !empty(user) ) {
		let taglist = user['tagArray'];
		if ( !empty(taglist) ) {
			hasTag = taglist.includes(tagID);
		}
	}
	return hasTag;
}

function userToggleTag ( userID, tagID )
{
	let user = gUsers[userID];
	let tag = gTagList[tagID];
	let newValue = false;
	
	if ( userHasTag(userID, tagID) ) {
		let taglist = user['tagArray'];
		let idx = taglist.indexOf(tagID);
		taglist.splice ( idx, 1 );		// removes the object from the array
	} else {	// if user doesn't have tag, it is the same as "false"
		let taglist = user['tagArray'];
		if ( empty(taglist) ) {
			taglist = [];
			user['tagArray'] = taglist;
		}
		taglist.push ( tagID );			// adds the object to the array
		newValue = true;
	}
	setTagOnServer ( userID, tagID, newValue, tag['tagName'] );
}

function makeTagMenuTitle ( userID )
{
	//let user = gGroup.members[idx];
	let user = gUsers[userID];
	let label = "Add Tags";
	if ( !empty(user) && !empty(user['tagArray']) && !empty(gData.tags) ) {
		let taglist = user['tagArray'];
		if ( !empty(taglist) && taglist.length > 0 ) {
			let tagCount = taglist.length;
			//let idx = taglist[0];
			let key = taglist[0];
			let tag = gData.tags.tag_dict[key]; // gTagList[idx];
			if ( !empty(tag) ) {
				label = tag['tagName'];
			}
			if ( tagCount > 1 ) {
				label += `+` + (tagCount-1);
			}
		}
	}
	return label;
}

function buildTagLink ( userID )
{
	let user = gUsers[userID];
	let result = "";
	let id = `tag-list-${userID}`;
	let value = "";

//	if ( empty(user.tagList) ) {
//		result += makeEditableField ( `tag-edit-${userID}`, 'tag', '', 12, '+New Tag' );
//	} else {
		value += makeTagMenuTitle ( userID );
		result += "<span class='clickable' data-jq-dropdown='#tag-list-popup'";
	//	result += "<span class='clickable' data-jq-dropdown='#tag-list-" + userID + "'";
		result += " id='" + id + "'>" + value + "</span>";
//	}
	return result;
}

function buildTagDropDown ( user )
{
	let userID = user['userID'];
	let result = "";
	let id = "tag-list-" + userID;
	let value = "";
	let html = "";
	let tagCount = 0;
	let tagArray = user['tagArray'];

	if ( gEditing ) {
		return;
	}
	html += "<ul class='jq-dropdown-menu'>";

	for ( const tagID in gTagList ) {
		let tag = gTagList[tagID]; // gTagList[idx];
		let tagName = tag['tagName'];
		let type = tag['type'];
		if ( type != "2" ) {
			let inner = `<li><a href='#1' class='tag-list-item' id='tag-list-item-${userID}-${tagID}-${tagName}'>\n`;
			if ( !empty(user) && !empty(user.tagArray) ) {
				if ( userHasTag(userID, tagID) ) {
					//tagCount = tagArray.length;
					//inner += '&#9745; &nbsp;';
					inner += '&#x2714; &nbsp;';
				}
			}
			inner += tagName;
			inner += "</a></li>";
			html += inner;
		}
	}
	// add a "create new tag" option:
	html += `<li><a href='#1' class='tag-list-item' id='tag-list-item-${userID}-0-MakeNew'>+New Tag</a></li>\n`;

	html += "</ul>";
	// update the contents of the user-specific dropdown (shows their tags as checked)
	//let listID = "#tag-list-" + userID;
	let listID = "#tag-list-popup";
	let item = $(listID);
	item.html ( html );

	$(".tag-list-item").click(function(event) {
		invokeTagListItem ( $(this), event, "tagListItem" );
	});
	/*

	value += makeTagMenuTitle ( userID );

	result += "<span class='clickable' data-jq-dropdown='#tag-list-popup'";
//	result += "<span class='clickable' data-jq-dropdown='#tag-list-" + userID + "'";
	result += " id='" + id + "'>" + value + "</span>";
	// <a href="#" data-jq-dropdown="#jq-dropdown-1">dropdown</a>
	return result;
	*/
}

function invokeTagListItem ( field, event, label )
{
	let userID = gListClickedUserID;
	let incoming = event.currentTarget.id;
	let parts = incoming.split("-");
	let labelInList = "#tag-list-" + userID;
	//let userID = parts[3];
	let tagID = parts[4];
	let tagName = parts[5];
	if ( label == "notused" ) {
	}
	if ( tagName == 'MakeNew' ) {	// create new tag
		let editBoxHTML = makeEditableField ( `tag-edit-${userID}`, 'tag', '', 12, 'New Tag' );
		$(`#tag-list-${userID}`).html ( editBoxHTML );
		let editBox = $(`#tag-edit-${userID}`);
		gEditing = 1;
		//if ( !empty(elem) ) {
			editBox.focus();
			editBox.keyup(function(event) {
				acceptEdit ( $(this), event, "tag" );
			});
		//}
	} else {
		userToggleTag ( userID, tagID );
		buildTagDropDown ( gUsers[userID] );
		// update the UI in the list ("Add Tags" or "3 Tags", etc):
		$(labelInList).html ( makeTagMenuTitle(userID) );
	}
	//setStatusForUser ( userID, type );
	//alert ( userID + " gets tag " + tagID + "/" + tagName );
}

