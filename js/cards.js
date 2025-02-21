
/*
 * 2/12/2023
 *
 * cards.js
 *
 * Support functions for ZIPit cards
 */

var sIncludePhotos = 1;
var sIncludeText = 1;

function make_full_card ( cardType, poster, postRec, toolbar )
{
	let card = "";
	let imageAtBottomOfCard = 0;
	let link = postRec.link;
	let bp = 0;
	let isComment = 0, isMessage = 0, isPost = 0, isAd = 0, isEvent = 0, isFromMe = 0;
	let eventDate = "";
	let eventPast = 0;
	let eventWait = 0;

	if ( !empty(poster) && poster.posterID == gUID ) isFromMe = 1;

	switch ( cardType ) {
		case cPostType.USER:
		case cPostType.GROUP:
		case cPostType.COMMENT:
			isPost = 1; break;
		case cPostType.AD:
			isAd = 1; break;
		case cPostType.WEATHER: break;
		case cPostType.NEWS: 	break;
		case cPostType.BIZ: 	break;
		case cPostType.TICKETS:	break;
		case cPostType.JOKE: 	break;
	}
	if ( is_post_type(cardType) ) isPost = 1;

	if ( !empty(postRec.event) ) {
		let now = Math.round ( Date.now() / 1000 );
		eventWait = postRec.event.timeStart - now;
		isEvent = 1;
		eventDate = postRec.event.timeStart;
		if ( eventWait < 0 ) eventPast = 1;
	}

	let classes = 'card';
		if ( !empty(postRec.parentID) && postRec.parentID != "0" ) {
			isComment = 1; 					classes += " comment";
		}
		if ( cardType == cPostType.AD ) {
			isAd = 1;						classes += " ad";
		}
		if ( cardType == cPostType.MESSAGE ) {
			isMessage = 1;					classes += " bubble";
			if ( poster.posterID == gUID )	classes += " moi";
		}
		if ( !empty(postRec.groupID) ) {
			classes += " group_post";
			if ( postRec.public ) 			classes += " public";
		}
		//if ( !empty(cardType) ) 			classes += " " + gFeedStr[cardType];

	// done with <div class='blah blah blah so we close the single-quotes here:
	card += `<div class='${classes}' id='card-${postRec.postID}'>\n`;

	if ( !empty(postRec.externalURL) ) 	link = postRec.externalURL;

	let vis = (isPost) ? " vis" : "";
		if ( !isMessage ) {
			let card_topbar = `<div class='card_topbar'>\n`;
				card_topbar += "<div class='card_topcontent'>\n";
				if ( !isMessage && !empty(poster) ) {
					if ( isAd ) {
						card_topbar += "      <div class='post_uname'>\n";
						card_topbar += "         <span class='poster_name'>" + "" + "</span>\n";
					} else if ( !empty(poster.posterID) ) {
						let genID = parseInt ( poster.posterID ); //  * 1036;
						card_topbar += `  <div class='author_box' id='user-${genID}'>\n`;
						card_topbar += `    <a href='../me/home.shtml?pid=${genID}'>\n`;
						card_topbar += `      <div class='post_profile'>\n`;
						if ( !empty(poster.zip) ) {
							card_topbar += `        <div class='tinyzip'>${poster.zip}</div>`;
						}
						card_topbar += `        <div><img class='author_img incircle' `;
						card_topbar += ` src='https://files.zipit.social/uimg/${genID}' />\n`;
						card_topbar += `        </div>\n`;
						card_topbar += `      </div>\n`;
						if ( !empty(poster.name) ) {
							let headline = "";
							card_topbar += "      <div class='post_uname'>\n";
							card_topbar += "         <span class='poster_name'>" + poster.name + "</span>\n";
							if ( !empty(poster.headline) ) {
								headline = poster.headline;
								let maxlen = 60;
								if ( is_mobile() ) maxlen = 30;
								if ( headline.length > maxlen ) {
									headline = poster.headline.substring(0,maxlen) + "...";
								}
							}
							if ( gUID == poster.posterID ) {	// my post
								if ( empty(headline) ) headline = `[edit your headline here]`;
								card_topbar += `         <br/><span class='poster_headline' `;
								card_topbar += ` onClick='editAcct()'>${headline}</span>\n`;
							} else {
								card_topbar += `         <br/><span class='poster_headline'>${headline}</span>\n`;
							}
							card_topbar += "      </div>\n";
						}
						card_topbar += "    </a>\n";
						card_topbar += "  </div>\n";
					}
				}
				let dateDiv = "";
				if ( isPost ) { 	// add time stamp
					if ( !isMessage ) dateDiv += make_small_print ( cardType, postRec );
				}
				if ( cardType == cPostType.AD ) {
					dateDiv += make_ad_header ( postRec );
				}
				if ( !empty(postRec.groupID) ) {
					let group = loadGroup ( postRec.groupID );
					if ( !empty(group) ) {
						let genID = postRec.groupID; //  * 1036;
						let grp = "  <div class='group_name'>\n";
						if ( !isComment ) {
							grp += `      <a href='../groups/home.shtml?gid=${genID}'>`;
							grp += group.title + "</a>\n";
						}
						grp += dateDiv;
						grp += "  </div>\n";
						card_topbar += grp;
					} else {
						group = loadGroup ( postRec.groupID );		// retry for debug
						console.log ( `loadGroup(${postRec.groupID}) failed` );
						card_topbar += dateDiv;
					}
				} else {
					if ( !empty(dateDiv) ) {
						card_topbar += `    <div class='group_name'>${dateDiv}</div>\n`;
					}
				}
				card_topbar += "</div>\n";
			card_topbar += "</div>\n";

			card += card_topbar;

			let card_head = `  <div class='card_head`;
				if ( isMessage ) card_head += ` card_msg`;
				card_head += `'>\n`;
				if ( !empty(link) ) {
					card_head += "   <a href='" + link + "' target='_zipit'>\n";
				} else if ( isPost && !contains_url(postRec.title) && !contains_url(postRec.subtitle) ) {
					if ( postRec.singleton ) {
						// return to main feed when clicked
						card_head += `   <a href='/home/index.shtml?scroll=${postRec.postID}'>\n`;
					} else {
						card_head += "   <a href='/post/" + postRec.postID + "'>\n";
					}
				}
				if ( !empty(postRec.event) ) {
					let cls = vis;
					let eventID = postRec.event.eventID;
					let pending = "";
					if ( eventPast ) {
						let ago = anticipateInterval ( eventWait*1000 ) + " ago";
						let now = Math.round ( Date.now() / 1000 );
						let remaining = postRec.event.timeEnd - now;
						if ( remaining > 0 ) {
							let togo = anticipateInterval ( remaining*1000 );
							pending = `Started ${ago}, ${togo} still to go!`;
						} else {
							ago = anticipateInterval ( remaining*1000 );
							pending = `Ended ${ago} ago`;
						}
						cls += ' red';
					} else {
						let starts = anticipateInterval ( eventWait*1000 );
						pending = `Starts in ${starts}...`;
					}
					card_head += `    <div class='post_title${cls}' id='etitle-${eventID}'>${pending}</div>\n`;
				}
				if ( !empty(postRec.title) ) {
					if ( isAd ) vis += ' ad_title';
					card_head += `    <div class='post_title${vis}' id='ptitle-${postRec.postID}'>` + postRec.title + `</div>\n`;
				}
				if ( !empty(postRec.subtitle) ) { // || !empty(postRec.author) || !empty(postRec.source) ) {
					let subtitle = `    <div class='post_subtitle`;
					if ( isMessage ) subtitle += ` msg_text`;
					subtitle += `' id='psubtitle-${postRec.postID}'>`;
					if ( !empty(postRec.subtitle) ) {
						subtitle += "<span class='addr'>" + postRec.subtitle + "</span>";
					}
					if ( cardType != cPostType.USER ) {
						if ( !empty(postRec.author) ) {
							subtitle += "&nbsp;&nbsp; | &nbsp;&nbsp;";
							subtitle += "<span class='attribution'>" + postRec.author + "</span>";
						}
						if ( !empty(postRec.source) ) {
							subtitle += "&nbsp;&nbsp; | &nbsp;&nbsp;";
							subtitle += "<span class='attribution'>" + postRec.source + "</span>";
						}
						if ( cardType == cPostType.ADMIN ) {
							let bp = 1;
						}
					}
					subtitle += "</div>\n";
					card_head += subtitle;
				}
				if ( !empty(postRec.event) ) {
					let details = `    <div class='post_subtitle`;
					let loc = postRec.event.locName;
					let eventID = postRec.event.eventID;
					if ( loc.includes('http') ) {
						let url = loc;
						let domain = get_domain_from_url ( url );
						loc = `<a href="${url}" target='_event'>Link to ${domain}</a>`;
					}
					details += `' id='eloc-${eventID}'>`;
					details += `<span class='addr'>${loc}</span>`;
					details += `    </div>\n`;
					details += `    <div class='post_subtitle`;
					details += `' id='eloc-${eventID}'>`;
					details += `<span class='addr'>${postRec.event.locAddr}</span>`;
					details += `    </div>\n`;
					card_head += details;
				}
				if ( !empty(link) || (isPost && !contains_url(postRec.title) && !contains_url(postRec.subtitle)) ) {
					card_head += "   </a>\n";
				}
			card_head += "  </div>\n";

			card += card_head;
		} // if ( !isMessage )
			
		if ( sIncludeText ) {
			let card_body = "";
			classes = 'card_body';
			if ( isMessage ) classes += ` card_msg`;
			if ( isAd && !empty(link) ) {
				//card_body += "  <a href='" + link + "' target='_ad'>\n";
			}
			if ( isPost && !contains_url(postRec.body) ) {
				if ( postRec.singleton ) {
					// return to main feed when clicked
					card_body += `   <a href='/home/index.shtml?scroll=${postRec.postID}'>\n`;
				} else {
					card_body += "   <a href='/post/" + postRec.postID + "'>\n";
				}
			}
			card_body += `  <div class='${classes}'>\n`;
				if ( !empty(postRec.body) ) {
					classes = 'post_body';
					if ( isMessage ) {
						if ( isFromMe ) classes += ` msg_moi`; else classes += ` msg_vous`;
					}
					let txt = postRec.body;
					if ( isPost ) {
						txt = html_paragraph ( txt );
						txt = filter_body ( txt );
						txt = makeReadMore ( txt, postRec.postID );
					}
					if ( cardType == cPostType.MESSAGE ) {
						txt = filter_body ( txt );
					}
					card_body += `      <div class='${classes}' id='pbody-${postRec.postID}'>`;
					card_body += "        " + txt + "";
					card_body += "      </div>\n";
				}
			card_body += "  </div>\n";
			if ( isAd && !empty(link) ) {
				//card_body += "  </a>\n";
			}
			if ( isPost && !contains_url(postRec.body) ) {
				card_body += "   </a>\n";
			}

			card += card_body;
		}
		
		if ( sIncludePhotos ) {
			let card_media = "  <div class='card_media'>\n";
				let hasImages = ( !empty(postRec.images) && postRec.images.length > 0 );

				if ( !empty(postRec.imageURL) || !empty(postRec.imageDataIdx) || !empty(postRec.serverImageURL) ) {
					if ( !hasImages && !empty(link) ) {
						card_media += "   <a href='" + link + "' target='_zipit'>\n";
					} else if ( isPost ) {
						if ( postRec.singleton ) {
							// return to main feed when clicked
							card_media += `   <a href='/home/index.shtml?scroll=${postRec.postID}'>\n`;
						} else {
							card_media += "   <a href='/post/" + postRec.postID + "'>\n";
						}
					}
					if ( false && !empty(postRec.externalURL) && isYouTube(postRec.externalURL) ) {
						card_media += make_youtube_embed ( postRec.postID, postRec.externalURL );
					} else if ( hasImages ) {
						card_media += make_image_batch ( postRec );
						imageAtBottomOfCard = 1;
					} else if ( !empty(postRec.serverImageURL) ) {
						card_media += "  <div class='image'>";
						card_media += "    <img class='post_image' src='" + postRec.serverImageURL + "' />";
						card_media += "  </div>\n";
						imageAtBottomOfCard = 1;
					} else if ( !empty(postRec.imageURL) ) {
						card_media += "  <div class='image'>";
						card_media += "    <img class='post_image' src='" + postRec.imageURL + "' />";
						card_media += "  </div>\n";
						if ( empty(postRec.caption) && empty(postRec.source) ) {
							imageAtBottomOfCard = 1;
						}
					}
					if ( !empty(postRec.imageDataIdx) ) {
						card_media += "  <div class='image'>";
						card_media += "    <div id='image_" + (postRec.imageDataIdx-1) + "'></div>";
						card_media += "  </div>\n";
						setTimeout ( function(){ addEmbeddedImage(postRec.imageDataIdx-1); }, 100 );
						imageAtBottomOfCard = 1;
					}
					if ( !empty(postRec.caption) ) {
						card_media += "  <div class='post_caption'>";
						// <br/><hr/><span class='post_caption'><i>
						// Wood coated in nanocrystals...</i>
						// </span><br/>
						// <span class='post_source'>Source: New Scientist</span>
						card_media += "    <span class='post_caption'><i>" + postRec.caption + "</i></span><br/>";
						card_media += "    <span class='post_source'>Source: " + postRec.source + "</span>";
						card_media += "  </div>\n";
						imageAtBottomOfCard = 0;
					}
					if ( (!hasImages && (!empty(link)) || isPost) ) {
						card_media += "   </a>\n";
					}
				}
			card_media += "  </div>\n";
			
			card += card_media;
		}

		//////////////card += "</div>\n";		// main card class='card'
		
		if ( toolbar ) {
			if ( cardType != cPostType.USER ) toolbar &= ~BAR_FRIENDS;
			if ( imageAtBottomOfCard ) toolbar |= BAR_NO_RULE;
			let tools = add_toolbar ( postRec, toolbar );
			card += tools;
		}
		if ( toolbar & BAR_COMMENTS ) {
			let comms = add_comment_section ( postRec.postID, postRec.parentID, postRec.groupID );
			card += comms;
		}
	card += "</div>\n";
	return card;
}

function make_card ( cardType, poster, title, subtitle, body, link, imageURL, imageDataIdx=null )
{
	let postRec = {
		'postID': 0,
		'parentID': 0,
		'title': title,
		'subtitle': subtitle,
		'body': body,
		'link': link,
		'caption': null,
		'source': null,
		'imageURL': imageURL,
		'imageDataIdx': imageDataIdx
	}
	let card = make_full_card ( cardType, poster, postRec, STANDARD );
	return card;
}

function add_toolbar ( postRec, options )
{
	let sect = "";
	let isComment = 0;
	let sections = 0;
	let postID = postRec.postID;
	let parentID = postRec.parentID;
	let reactions = postRec.reactions;
	
	if ( !empty(parentID) && parentID != "0" ) isComment = 1;
	
	if ( (options & BAR_VOTES) || (options & BAR_LOVES) ) sections++;
	if ( (options & BAR_FRIENDS) || (options & BAR_COMMENTS) && !isComment ) sections++;

	sect += "<div class='post_toolbar'>";
		if ( !(options & BAR_NO_RULE) ) {
			sect += "  <hr/>\n";
		}
		if ( options & BAR_VOTES ) {
			let score = 0;
			let votes = 0;
			// always include this section so the first-ever reactions can get scored too
			if ( !empty(reactions) ) {
				reactions = score_reactions ( reactions );

				score = parseFloat ( reactions.score );
				votes = parseFloat ( reactions.votes );
			}
			if ( votes ) {
				// build list of people/reactions
				sect += `<div class='like_row' id='reactors-${postID}'>\n`;
				sect += buildReactors ( postID, reactions );
				sect += `</div><div class='clearboth'></div>\n`;
			}
			// Score
			sect += `  <span id='score-${postID}'`;
			let addClass = "";
			if ( score > 0 ) addClass = ' green';
			if ( score < 0 ) addClass = ' darkred';
			if ( score == 0 && votes == 0 ) score = "";
			sect += ` class='score${addClass}'>${score}</span>`;
			// Votes
			let voteStr = "";
			let s = "";
			if ( votes != 1 ) s = "s";
			if ( votes > 0 ) voteStr = ` (${votes} vote${s})`;
			sect += ` <span id='votes-${postID}' class='toolbar_data tight'>${voteStr}</span>`;
			sect += `<span class='toolbar_space'>&nbsp;</span>`;
			// Like
			sect += `  <span id='b_like-${postID}'`;
			sect += ` class='toolbar_item tight' onclick='clickReaction(cReactions.LIKED,${postID});'>`;
			sect += cEmoji[cReactions.LIKED]; // "🤟Yep";
			sect += "</span>";
			// Dislike
			sect += `  <span id='b_dislike-${postID}'`;
			sect += ` class='toolbar_item tight' onclick='clickReaction(cReactions.DISLIKED,${postID});'>`;
			sect += cEmoji[cReactions.DISLIKED]; // "👎Nope";
			sect += "</span>";
			sect += "\n";
		}
		if ( options & BAR_LOVES ) {
			// Love
			sect += `  <span id='b_love-${postID}'`;
			sect += ` class='toolbar_item tight' onclick='clickReaction(cReactions.LOVED,${postID});'>`;
			if ( empty(reactions) || empty(reactions.lovedByMe) || reactions.lovedByMe == -1 ) {
				sect += cEmoji[cReactions.UNLOVED]; // "🤍Love";
			} else {
				sect += cEmoji[cReactions.LOVED]; // "❤️Love";
			}
			sect += "</span>";
			// Fuckya
			sect += `  <span id='b_loathe-${postID}'`;
			sect += ` class='toolbar_item tight' onclick='clickReaction(cReactions.LOATHED,${postID});'>`;
			if ( empty(reactions) || empty(reactions.loathedByMe) || reactions.loathedByMe == -1 ) {
				sect += cEmoji[cReactions.UNLOATHED]; // "🤬Loathe"
			} else {
				sect += cEmoji[cReactions.LOATHED]; // "😠Loathe";
			}
			sect += "</span>";
			sect += "\n";
		}
		if ( sections > 1 ) {
			sect += "  <span class='toolbar_item'> | </span>\n"; 			// vertical bar separator
		}
		if ( options & BAR_FRIENDS ) {
			// Add Friend
			if ( postRec.authorID == gUID ) {
				sect += `  <span id='b_friend-${postID}'`;
				sect += ` class='toolbar_item disabled'>`;
				sect += "Me!";
				sect += "</span>";
				sect += "\n";
			} else {
				sect += `  <span id='b_friend-${postID}'`;
				sect += ` class='toolbar_item' onclick='clickFriend(${postID});'>`;
				sect += "+Friend";
				sect += "</span>";
				sect += "\n";
			}
		}
		if ( (options & BAR_COMMENTS) && !isComment ) {
			let comments = getCommentList ( postID );
			let count = comments.length;
			let s = "";
			sect += `  <span id='b_comment-${postID}'`;
			sect += ` class='toolbar_item' onclick='showHideComments(${postID});'>`;
			if ( count > 0 ) {
				if ( count > 1 ) s = "s";
				sect += `${count} Comment${s}`;
			} else {
				sect += "+Comment";
			}
			sect += "</span>";
			sect += "\n";
		}
	sect += "</div>\n";

	return sect;
}

function make_ad_header ( postRec )
{
	let fullDiv = "";

	fullDiv += `<div id='post_time' class='post_time'>`;
	fullDiv += `<span style='color:darkred'>Promoted</span>`;
	fullDiv += `</div>\n`;

	return fullDiv;
}

function make_small_print ( cardType, postRec )
{
	let sqlDate = postRec.modified;
	let postID = postRec.postID;
	let groupID = postRec.groupID;
	let parentID = postRec.parentID;
	let fullDiv = "";
	let cCount = getCommentList(postID).length;
	let commSpan = "";
	let dateSpan = "";
	let cancelButt = $(`#b_commentX-${parentID}`);	// cancel button

	if ( cCount > 0 ) {
		let s = ( cCount == 1 ? "" : "s" );
		commSpan += `<span class='ptr' id='comms-${postID}' onclick='showHideComments(${postID});'>`;
		commSpan += `${cCount} Comment${s}</span>`;
	}
	if ( !empty(sqlDate) ) {
		let jDate = date_from_sql ( sqlDate );
		if ( is_today(jDate) ) {
			dateSpan = "<span style='color:red'>Today " + short_time(jDate) + "</span>";
		} else if ( is_yesterday(jDate) ) {
			dateSpan = "<span style='color:red'>Yesterday " + short_time(jDate) + "</span>";
		} else {
			dateSpan = elapsedTime ( jDate ) + " ago";
		}
		if ( is_glenn() ) {
			const ppid = postRec.postID;
			let lnk = `<span class='darkred ptr' onclick='replyGPT(${ppid});'>[${ppid}]</span>`;
			dateSpan = `${lnk} ${dateSpan}`;
		}
	} else {
		dateSpan = "<span style='color:red'>No Date</span>";
	}
	if ( !empty(commSpan) || !empty(dateSpan) ) {
		fullDiv += `    <div id='post_time' class='post_time'>`;
		if ( !empty(dateSpan) ) {
			fullDiv += `${dateSpan}`;
		}
		if ( !empty(commSpan) ) {
			fullDiv += `<br/>`;
			fullDiv += `${commSpan}`;
		}
		if ( postRec.authorID == gUID ) {
			let linkEdit = `<span title='[Edit]' onclick='postEdit(${postRec.postID});' class='clickable'> ✏️  </span>`;
			let linkDel = `<span title='[Delete]' onclick='postDelete(${postRec.postID});' class='clickable'> ❌  </span>`;
			fullDiv += `<br/><br/>Your Post: ${linkDel}&nbsp;&nbsp;&nbsp;${linkEdit}`;
		} else if ( gAdmin || isGroupAdmin(gUID,groupID) ) {
			let linkDel = `<span title='[Delete]' onclick='postDelete(${postRec.postID});' class='clickable'> ❌  </span>`;
			fullDiv += `<br/><br/>Admin: ${linkDel}`;
		}
		fullDiv += `</div>\n`;
	}

	return fullDiv;
}

function date_bubble ( postRec, visible=0 )
{
	let sqlDate = postRec.modified;
	let html = "";
	let vis = visible ? " visible" : "";

	if ( !empty(sqlDate) ) {
		if ( postRec.authorID == gUID ) {
			html += `<div class='date_moi${vis}'>`;
		} else {
			html += `<div class='date_vous${vis}'>`;
		}
		let jDate = date_from_sql ( sqlDate );
		if ( is_today(jDate) ) {
			//html += `<span style='color:red'>Today ` + short_time(jDate) + `</span>`;
			html += `Today ` + short_time(jDate);
		} else if ( is_yesterday(jDate) ) {
			//html += `<span style='color:red'>Yesterday ` + short_time(jDate) + `</span>`;
			html += `Yesterday ` + short_time(jDate);
		} else {
			html += elapsedTime ( jDate ) + " ago";
		}
		if ( is_glenn() ) {
			//html = `[${postRec.postID}] ${html}`;
		}
		html += `</div>`;
	}
	return html;
}

function make_image_batch ( postRec )
{
	let html = "";
	let list = postRec.images;
	let postID = postRec.postID;
	let batch = postRec.imageBatch;
	let single = (list.length > 1) ? 0 : 1;
	
	for ( let idx = 0; idx < list.length; idx++ ) {
		let name = list[idx];
		let imageURL = `https://files.zipit.social/imgs/post_images/${name}`;
		let div_class = 'image';
		let img_class = 'post_image';

		if ( single ) { // img tag
			html += `  <div class='img_single'>\n`;
			html += `    <img class='${img_class}' id='${name}' src='${imageURL}' `;
			html += ` onclick='imgClick(this)'`;
			html += ` />`;
			html += `  </div>\n`;
		} else {
			let multi = `m1`;
			div_class += ` multi`;
			if ( idx > 0 ) multi = `m2`;
			if ( idx > 2 ) multi = `m3`;
			if ( idx > 5 ) multi = `m4`;
			if ( idx > 13 ) multi = `m5`;
			div_class += ` ${multi}`;
			html += `  <div class='${div_class}'>\n`;
			html += `    <div class='crop clickable' onclick='imgClick(${postID},${batch},${idx})'`;
			html += ` style="background-image: url('${imageURL}');">\n`;
			html += `    </div>\n`;
			html += `  </div>\n`;
		}
	}
	if ( list.length > 1 ) {
		html += "<div class='clearboth'></div>";
	}
	return html;
}

function editAcct ( )
{
	let fake = gUID; // * 1036;
	window.location = `/account/edit.shtml?uid=${fake}`;
}

function imgClick ( postID, batch, which )
{
	let post = findPost ( postID );
	if ( !empty(post) ) {
		if ( !empty(post.imageBatch) ) {
			let url = `../photo/view.shtml?b=${post.imageBatch}&idx=${which}`;
			window.open ( url, name );
		} else if ( !empty(post) && !empty(post.images) ) {
			let name = post.images[which];
			if ( !empty(name) ) {
				let url = `../photo/view.shtml?p=${name}`;
				window.open ( url, name );
			}
		}
	}
	console.log ( `imgClick: ${which}` );
}

function score_reactions ( reactions )
{
	let score = 0;
	let votes = 0;
	//$myReactions = [ 'LIKE'=> 0, 'LOVE'=> 0, 'LOATHE'=> 0 ];
	reactions['likedByMe'] = 0;
	reactions['lovedByMe'] = 0;
	reactions['loathedByMe'] = 0;

	if ( !empty(reactions) ) {
		for ( let idx = 0; idx < reactions.length; idx++ ) {
			let rec = reactions[idx];
			let me = ( rec['userID'] == gUID ? 1 : 0 );
			//error_log ( rec['postID'] . " reaction by me: " . rec['type'] );
			switch ( parseInt(rec['type']) ) {
				case cReactions.LIKED:		score +=  1;	if ( me ) reactions['likedByMe'] = 	 1;	break;
				case cReactions.DISLIKED:	score -=  1;	if ( me ) reactions['likedByMe'] = 	-1;	break;
				case cReactions.LOVED:		score += 10;	if ( me ) reactions['lovedByMe'] = 	 1;	break;
				case cReactions.UNLOVED:	score -= 10;	if ( me ) reactions['lovedByMe'] = 	-1;	break;
				case cReactions.LOATHED:	score -= 10;	if ( me ) reactions['loathedByMe'] = 	 1;	break;
				case cReactions.UNLOATHED: 	score += 10;	if ( me ) reactions['loathedByMe'] = 	-1;	break;
			}
			votes++;
		}
	}
	/* debug code
	fields = ['likedByMe', 'lovedByMe', 'loathedByMe'];
	foreach ( fields as key ) {
		if ( !empty(reactions[key]) ) {
			error_log ( "Post postID key: " . reactions[key] );
		}
	}
	*/
	reactions['score'] = score;
	reactions['votes'] = votes;

	return reactions;
}

function buildReactors ( postID, reactions )
{
	let html = "";
	if ( !empty(reactions) ) {
		let scores = {};
		//html += `<div class='like_row' id='reactors-${postID}'>\n`;
		for ( let idx = reactions.length-1; idx >= 0 ; idx-- ) {
			let rec = reactions[idx];
			let delta = 0;
			let type = parseInt ( rec.type );
			switch ( type ) {
				case cReactions.LIKED:		delta =    1;	break;
				case cReactions.DISLIKED:	delta =   -1;	break;
				case cReactions.LOVED:
				case cReactions.UNLOVED:
					delta = 10 * reactions.lovedByMe;	break;
				case cReactions.LOATHED:
				case cReactions.UNLOATHED:
					delta = -10 * reactions.loathedByMe;	break;
			}
			if ( scores[rec.userID] === undefined ) {
				scores[rec.userID] = delta;
			} else {
				scores[rec.userID] += delta;
			}
		}
		for ( let voter in scores ) {
			let score = scores[voter];
			if ( score != 0 ) {
				let mug = `  <div class='liker ptr'><img class='author_img incircle' `;
				mug += ` onclick='visitUser(${voter});'\n`;
				mug += ` src='https://stage.zipit.social/uimg/${voter}' />\n`;
				//mug += ` src='https://stage.zipit.social/imgs/user-104/initials.svg' />\n`;
				mug += "  </div>\n";
				html += mug;
			}
		}
		//html += `</div><div class='clearboth'></div>\n`;
	}
	return html;
}

function add_comment_section ( postID, parentID, groupID )
{
	let sect = "";
	
	// see "setupComments()" in posts.js

	sect += "<div class='comment_section'>\n";
		//sect += "<hr/>";
		sect += "  <div hidden class='comment_area' id='comment-" + postID + "'>\n";
			sect += "    <div id='comment_list-" + postID + "'";
				//sect += " onclick='closeComments(" + postID + ");'";
			sect += ">";
			sect += "</div>\n";
			sect += "    <div>";
				sect += "<textarea id='edit-" + postID + "'";
				sect += " placeholder='add a meaningful comment...'"; //  + postID + "'";
				sect += " onkeyup='editKeyComment(event,this);'";
				//sect += " onkeypress='editKeyText(event," + postID + ");'";
				sect += " class='zedit pbox' type='textfield' rows='3' >";
				sect += "</textarea>"
			sect += "</div>";
			sect += "\n";
			/* no photos yet on comments
			sect += "<div class='edit_options'>";
				sect += "<span class='feature' onclick='addPhoto(" + postID + ");'>";
				sect += "Add Photo</span>";
			sect += "</div>";
			*/
	//		sect += make_email_area();
			sect += `    <div class='ai_button_area'>`;
				sect += `<div class='floatleft ai_label'>ChatGPT</div>`;
				sect += aiButton ( postID, 'positive' );
				sect += aiButton ( postID, 'neutral' );
				sect += aiButton ( postID, 'negative' );
			sect += `</div>`;
			sect += `    <div class='comment_button_area'>`;
				sect += `<button id='b_commentX-${postID}' class='std b_post roundbutt' onclick='postCancel(${postID});'>`;
				sect += `Cancel</button>`;
				sect += `<button id='b_commentS-${postID}' class='std b_post roundbutt' onclick='reallyPost(${postID},${groupID});'>`;
				sect += `Post It</button>`;
			sect += `</div>`;
			sect += `\n`;
		sect += `</div>\n`;
	sect += `</div>\n`;
	
	// see "setupComments()" in posts.js
	
	return sect;
}

function aiButton ( postID, sentiment, ord=0 )
{
	let butt = "";
	let cls = "";
	if ( ord == 1 ) cls = ' ai_b1';
	butt += `<div id='b_pos-${postID}' class='ptr floatleft ai_butt${cls}' onclick='replyGPT(${postID},"${sentiment}");'>`;
	butt += `<img class='ai_icon' src='../icon/${sentiment}.png' /></div>`;
	return butt;
}

function make_email_area ( )
{
	let html = `
	<div class='post_options' id='send_options'>
		<div class='admin_not hslug clearboth'>
			<div class='ckemail'>
				<input checked type='checkbox' class='ckb' name='ck_emailtoo' id='ck_emailtoo' onclick='emailToo();' />
				<label for='ck_emailtoo' class='zlabel zsm'><span class='l_active'>Send Email Too</span></label></li>
			</div>
		</div>
		<div class='vspace'></div>
	</div>
	`;
	return html;
}
					
function make_plate ( block, proc, which, bg="", border="" )
{
	let plate = "";

	plate += "<div class='plate";
	if ( !empty(bg) ) {
		plate += " " + bg;
	}
	if ( !empty(border) ) {
		plate += " " + border;
	}
	plate += "'";
	plate += ` onclick='${proc}(event,this,${which});'`;
	plate += ">\n";
		// selection widget
		plate += `<div id='selected-${which}' class='bigcheck'></div>\n`;
		plate += `<div class='plate_title'>\n`;
		plate += `${block.title}`;
		plate += "</div>\n";

		/*
		plate += `<div class='plate_subtitle'>\n`;
		plate += `Up to ${block.max_units} Members<br/>`;
		plate += `</div>\n`;
		*/
		plate += `<div class='plate_members'>\n`;
		plate += `  <span class='bold darkred bigger'>${block.max_units}</span> ${block.units}\n`;
		plate += `</div>\n`;

		let basePrice = parseFloat(block.price);
		let price = Math.trunc ( basePrice * (1.0 - block.discount) );
		if ( price > 0 ) {
			let interval = "once a month";
			let priceStr = dollar_string ( price );
			plate += "  <div class='plate_price'>\n";
			plate += `${priceStr}/mo`;
			plate += "  </div>\n";
			let equiv = "";
			if ( price < 15 ) {
				let cups = Math.trunc ( price / 3.75 );
				interval = "a month";
				for ( let idx = 0; idx < cups; idx++ ) {
					equiv += `&nbsp<span><img src='../images/coffee.png' height='38' width='auto'></span>`;
				}
				equiv += `<span class='equiv'> like ${cups} Lattés ${interval}</span>`;
			} else { 	// 🍱 🍸 🍷 🍗 🥩 🥡
				let adj="", art="a", noun="lunch", icon="🌮";
				if ( price >= 25 ) { adj="nice"; icon="🍱"; }
				if ( price >= 40 ) {
					if ( price < 60 ) {
						let drinks = Math.trunc ( (price / 15) );
						adj=""; art="some"; noun="drinks"; icon=""; interval="a month";
						for ( let idx=0; idx<drinks; idx++ ) { icon += `🍷`; }
					} else {
						adj=""; noun="dinner"; icon="🍗";
						if ( price > 70 ) { adj="nice"; icon="🥩" }
						if ( price >= 75 ) { //test 100 ) {
							adj="really nice"; icon="🍸🥩🍷";
							interval="!";
						}
					}
				}
				equiv += `<span class='equiv'> like ${art} ${icon} ${adj} ${noun} ${interval}</span>`;
			}
			if ( !empty(equiv) ) {
				plate += `    <div class='price_equiv'>${equiv}</div>\n`;
			}
			if ( block.discount ) {
				let rate = (block.discount * 100) + "%";
				plate += `    <div class='plate_price darkgreen'>${rate} Discount</div>`;
			}
		}
		plate += "  <div class='plate_body'>\n";
			
			plate += "<div class='included'><h4>Included:</h4>\n";
				plate += "  <ul class='list_features'>\n";
					plate += `<li class='li_f'>✅ `;
					plate += `<span class='bold darkred bigger'>`;
					if ( block.max_space > 0 ) {
						plate += `${block.max_space}</span>MB Storage</li\n`;
					}
					for ( let idx = 0; idx < block.features.length; idx++ ) {
						const desc = block.features[idx];
						plate += `    <li class='li_f'>✅ ${desc}</li>\n`;
					}
				plate += "  </ul>\n";
			plate += "</div>\n";

		plate += "</div>\n";
			
	plate += "</div>\n";
	
	return plate;
}


function filter_body ( body )
{
	let result = body;

//	result = replace_urls_split ( result, " " );
//	result = replace_urls_split ( result, "http" );
	result = replace_urls ( result );
	return result;
}

function addEmbeddedImage ( imageDataIdx )
{
	if ( imageDataIdx >= 0 ) {
		let imageID = "image_" + imageDataIdx;
		let elem = document.getElementById ( imageID );
		let image = gEmbeddedImages[imageDataIdx];
		if ( image && elem ) {
			elem.appendChild ( image );
		}
	}
}

