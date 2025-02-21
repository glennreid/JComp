
/*
 * 2/10/2023
 *
 * feed.js
 *
 * Feed/Content functions for ZIPit
 */

var sShowSkips = 0;
var sShownGeneration = 1;
var sFeedWait = 0;
var sRetryFeed = 0;
var sReloadTimer = null;
var sUpdateTimer = null;
var sLoadedWeather = 0;
var sLoadedFirstAd = 0;
var sLoadedFirstUserPost = 0;

var gLinksShown = [];
var	gArticlesShown = [];
var gGenresShown = [];
var gSkip = ["zareens-palo-alto"];	// special case blacklist (comma-separated)
var gEditing = 0;
var gEmbeddedImages = [];
var gImageIdx = 0;
var gFeedReset = 0;
var gWeatherUnits = "imperial";
var gFeedTrack = {};


// --------------------------------- functions ------------------------------

function updateFeedPrefs ( )
{
	let defaultState = 1;
	if ( gPageType == cPage.ME || gPageType == cPage.POST ) {
		defaultState = 0;
	}
	for ( let type in gFeed ) {
		let show = defaultState;
		let idx = gFeed[type];
		if ( type == 'ANY' ) continue;
		if ( type == 'GPT' ) continue;
		if ( type == 'JOKES' ) continue;
		//if ( type == 'REDDIT' ) continue;
		if ( getSet(`HIDE_${type}`) ) show = 0;
		if ( type == 'USER' ) {
			if ( empty(rawSetting('SHOW_USER')) )
				show = 0;
		}
		gPrefs[idx] = show;
	}
	if ( gPageType == cPage.ME || gPageType == cPage.POST ) {
		gPrefs[gFeed.USER] = 1;
	}
	gPrefs[gFeed.AD] = 1;
}


function reload_list ( onlyFeedType=0, force=0 )
{
	let html = "<!-- reload_list() -->\n";
	let preamble = "";
	let reloadSecs = 0; // 30;
	let feedsAvailable = dataAvailable();
	
	updateFeedPrefs();

	let tryAgainLater = 0;
	if ( !feedsAvailable ) tryAgainLater = 1;
	if ( 00 && feedPref(gFeed.USER) ) {
		if ( empty(gData.posts) ) tryAgainLater = 1;
		if ( empty(gData.groups) ) tryAgainLater = 1;
	}
	if ( tryAgainLater ) {
		clearTimeout ( sReloadTimer );
		sReloadTimer = setTimeout ( function() { reload_list(onlyFeedType,force); }, 500 );
		return;
	}

	if ( feedPref(gFeed.WEATHER) && !empty(gData.weather) ) {
		$("#weather_block").html ( make_weather_card() );
	} else {
		$("#weather_block").html ( "" );
	}

	gLinksShown = [];
	gArticlesShown = [];
	gGenresShown = [];
	sShownGeneration++;
	//sLoadedFirstAd = 0;
	//sLoadedFirstUserPost = 0;
	
	// always start with an Ad if there are any:
	if ( feedPref(gFeed.AD) && !sLoadedFirstAd ) {
		let card = generateAd ( gPersonOfInterestID, gGroupOfInterestID );
		if ( !empty(card) ) {
			html += card;
			sLoadedFirstAd = 1;
		}
	} else {
		// start with a feed Post if there are any:
		if ( feedPref(gFeed.USER) ) {
			let card = nextPost ( gPersonOfInterestID, gGroupOfInterestID );
			if ( !empty(card) ) {
				html += card;
				sLoadedFirstUserPost = 1;
			}
		}
	}
 	$("#main_feed").html ( html );
 	
 	if ( sRetryFeed++ < 4 ) {
		clearTimeout ( sUpdateTimer );
		sUpdateTimer = setTimeout ( function() { update_list(); }, 500 );
 	} else {
		//console.log ( `reload_list: sRetryFeed: ${sRetryFeed}` );
 	}
 	if ( typeof tellYouTubeWeAreReady === "function" ) {	// defined?
		tellYouTubeWeAreReady();
	}
}

var sFeedTrack = {
					// these are percentages and must add up to 100
		'USER':		{ 'wantPct':40, 'availPct':40, 'used':0, 'last':0, 'data':gData.posts },
		'BIZ':		{ 'wantPct':26, 'availPct':26, 'used':0, 'last':0, 'data':gData.biz },
		'TICKETS':	{ 'wantPct': 6, 'availPct': 6, 'used':0, 'last':0, 'data':gData.tickets },
		'NEWS':		{ 'wantPct':26, 'availPct':26, 'used':0, 'last':0, 'data':gData.news },
		'REDDIT':	{ 'wantPct': 2, 'availPct': 2, 'used':0, 'last':0, 'data':gData.reddit },
		//'GPT':		{ 'wantPct':10, 'availPct':10, 'used':0, 'data':gData.gpt },
		//		   must sum to 100            100
	};

function resetFeedTrack ( )
{
	let posts = gData.posts;
	if ( !empty(gData.posts) ) posts = gData.posts.list;
	let old = gFeedTrack;
	gFeedTrack = Object.assign ( {}, sFeedTrack );
	if ( !empty(gData.posts) ) gFeedTrack.USER.data = gData.posts;
	if ( !empty(old) ) {
		for ( let key in gFeedTrack ) {
			gFeedTrack[key].used = old[key].used;
			gFeedTrack[key].last = old[key].last;
			// console.log ( key, dict[key] );
		}
	}
	if ( sLoadedFirstUserPost ) {
		gFeedTrack.USER.used = 1;
	}
}

var sRetryList = 0;

function update_list ( onlyFeedType=0, force=0 )
{
	let html = "";
	let feedsAvailable = dataAvailable();
	let feedsWaiting = dataWaiting();
	let articles = 5;
	let tries = 0;
	let lastJoke = -1;
	let feed = document.getElementById ( 'main_feed' );
	//let children = feed.children;
	let count = feed.children.length;
	let existingHTML = $("#main_feed").html();
	let targetQty = 200;
	let sortFeeds = [];
	let goodFeeds = 0;
	let missingFeeds = 0;
	let usedFeeds = 0;
	let missingPct = 0;
	let useFeedType = gFeed.USER;
	let useFeedKey = 'USER';
	let newcard = null;
	let showStats = 1;
	
	if ( feedsWaiting ) {
		setTimeout ( refreshFeedData, sShownGeneration * 1000 );
		if ( !feedsAvailable && sRetryList++ < 5 ) {
			clearTimeout ( sReloadTimer );
			sReloadTimer = setTimeout ( function() { reload_list(onlyFeedType,force); }, 500 );
			return;
		}
		sUpdateTimer = setTimeout ( update_list, 5 * 1000 );
	}
	sRetryList = 0;
	targetQty = 40;

	//if ( existingHTML.length < 100 ) { // existingHTML still is placeholder; we got here before reload_list
		if ( existingHTML.includes("missing") ) {	// feed is just turned off, it's okay
		} else {
			let tryAgainLater = 0;
			if ( !feedsAvailable ) tryAgainLater = 1;
			//if ( feedPref(gFeed.USER) && empty(gData.posts) ) tryAgainLater = 1;
			//if ( feedPref(gFeed.USER) && empty(gData.groups) ) tryAgainLater = 1;
			if ( tryAgainLater ) {
				clearTimeout ( sReloadTimer );
				sReloadTimer = setTimeout ( function() { reload_list(onlyFeedType,force); }, 250 );
				return;
			}
		}
	//}
	
	if ( gFeedReset ) {
		gFeedReset = 0;
		//console.log ( `gFeedReset ` + gFeedStr[onlyFeedType] );
		reload_list ( onlyFeedType, force );
		return;
	}
	if ( force && empty(onlyFeedType) ) {
		gFeedReset = 0;
		//console.log ( `gFeedReset ` + gFeedStr[onlyFeedType] );
		reload_list ( onlyFeedType, force );
		return;
	}
	sRetryFeed = 0;

	if ( feedsAvailable <= 0 ) {
		return;
	}
	if ( feedPref(gFeed.WEATHER) && !empty(gData.weather) ) {
		$("#weather_block").html ( make_weather_card() );
	} else {
		$("#weather_block").html ( "" );
	}
	updateFeedPrefs();
	resetFeedTrack();

	if ( !empty(onlyFeedType) ) {
		let str = gFeedStr[onlyFeedType];
		//console.log ( `update_list: ${str} ` + gLoc.view.city );
		if ( onlyFeedType == gFeed.WEATHER && feedPref(gFeed.WEATHER) && !empty(gData.weather) ) {
			$("#weather_block").html ( make_weather_card() );
			return;
		}
		targetQty /= 5;		// just sprinkle some of the new ones in.
	}
	if ( feedsAvailable >= 1 ) {
		let firstGoodFeed = 0;
		// determine which feeds are available and adjust percentages
		for ( let key in gFeedTrack ) {			// start with Desired values
			gFeedTrack[key].availPct = gFeedTrack[key].wantPct;
		}
		gFeedTrack.USER.data = null;
		if ( !empty(gData.posts) && !empty(gData.posts.list) ) gFeedTrack.USER.data = gData.posts.list;
		gFeedTrack.BIZ.data = gData.biz;
		gFeedTrack.TICKETS.data = null;
		if ( !empty(gData.tickets) && !empty(gData.tickets._embedded) ) {
			gFeedTrack.TICKETS.data = gData.tickets._embedded.events;
		}
		gFeedTrack.NEWS.data = gData.news;
		if ( !empty(gFeedTrack.REDDIT) ) gFeedTrack.REDDIT.data = gData.reddit;
		//gFeedTrack.GPT.data = gData.gpt;
		for ( let key in gFeedTrack ) {
			let rec = gFeedTrack[key];
			if ( feedPref(gFeed[key]) && !empty(rec.data) ) {
				if ( rec.used >= rec.data.length ) {
					usedFeeds++;
					missingPct += rec.wantPct;
					rec.availPct = 0;
				} else {
					goodFeeds++;
					if ( empty(firstGoodFeed) ) firstGoodFeed = gFeed[key];
				}
			} else {
				missingFeeds++;
				missingPct += rec.wantPct;
				rec.availPct = 0;
			}
		}
		if ( goodFeeds ) {
			if ( goodFeeds == 1 && !empty(firstGoodFeed) ) {
				onlyFeedType = firstGoodFeed;
			} else {
				let reallocatePct = Math.floor ( missingPct / goodFeeds );
				let cumulative = 0;
				for ( let key in gFeedTrack ) {
					if ( gFeedTrack[key].availPct ) {
						gFeedTrack[key].availPct += reallocatePct;
						cumulative += gFeedTrack[key].availPct;
						sortFeeds.push ( { 'pct':gFeedTrack[key].availPct, 'key':key } );
					}
				}
			}
		} else {
			// we don't have any good feed data -- only the Weather (if that)
			// unless the feeds are just exhausted...
			let retry = 1;
			if ( !empty(onlyFeedType) ) {
				let key = gFeedStr[onlyFeedType];
				let rec = gFeedTrack[key];
				if ( !empty(rec) ) {
					if ( feedPref(onlyFeedType) && !empty(rec.data) ) {
						if ( rec.used >= rec.data.length ) {
							retry = 0; // this feed is exhausted
						}
					}
				} else {
					retry = 0;
				}
			} else {
				if ( !feedsWaiting ) retry = 0;		// probably exhausted multiple feeds
			}
			if ( retry && sRetryList++ < 5  ) {
				clearTimeout ( sReloadTimer );
				sReloadTimer = setTimeout ( function() { reload_list(onlyFeedType,force); }, 1000 );
			}
			return;
		}
		if ( !empty(sortFeeds) && sortFeeds.length > 1 ) {
			sortFeeds.sort(function(a, b){
				return (a.pct - b.pct);
			});
		}
	} else {
		onlyFeedType = useFeedType;
	}
	let loops = 0;
	let insertCount = 0;
	// select a post from one of the feeds randomly
	while ( insertCount++ < targetQty ) {
		let retries = 0;
		while ( retries++ < 5 ) {
			if ( empty(onlyFeedType) ) {
				let rnd = Math.floor(Math.random() * 100);
				let floor = 0;
				for ( let idx = 0; idx < sortFeeds.length; idx++ ) {
					floor += sortFeeds[idx].pct;
					if ( rnd < floor ) {
						let key = sortFeeds[idx].key;
						useFeedType = gFeed[key];
						useFeedKey = key;
						//console.log ( `rnd ${rnd} feed ${key}` );
						break;
					}
				}
			} else {
				useFeedType = onlyFeedType;
				useFeedKey = gFeedStr[useFeedType];
			}
			switch ( useFeedType ) {
				case gFeed.USER:
					if ( !empty(gData.posts) && !empty(gData.posts.list) ) {
						newcard = nextPost ( gPersonOfInterestID, gGroupOfInterestID );
					}
					break;
				case gFeed.NEWS:
					newcard = newsStory();
					break;
				case gFeed.BIZ:
					newcard = localBusiness();
					break;
				case gFeed.TICKETS:
					newcard = ticketEvent();
					break;
				case gFeed.REDDIT:
					newcard = redditPost();
					break;
				case gFeed.GPT:
					newcard = gptPost();
					break;
				case gFeed.AD:
					newCard = generateAd ( gPersonOfInterestID, gGroupOfInterestID );
					break;
			}
			if ( !empty(newcard) && newcard.length > 10 ) {
				break;	// got one
			}
			// else that feed is tapped out
			if ( empty(onlyFeedType) ) {
				//gFeed[key].tapped = true;
			} else {
				// we're outta beer...
				break;
			}
		}
		if ( !empty(newcard) ) {
			gFeedTrack[useFeedKey].used += 1;
		}
		let afterWhich = 0;
		if ( empty(newcard) ) {
			targetQty = insertCount;	// force loop to stop
			if ( isGroupType(gPageType) ) {
				let count = gFeedTrack[useFeedKey].used;
				let s = "s";
				let gname = ` in ${gGroup.title}`;
				if ( empty(gGroup) || empty(gGroup.title) ) gname = "";
				//if ( empty(count) ) count = "No";
				if ( count == 1 ) s = "";
				let pTitle = `<span class='darkred'>${count}</span> Post${s}${gname}`;
				newcard = getOuttaJailCard ( pTitle, ` Go 👈🏻 to Main Feed` );
			}
		}
		//feed = document.getElementById ( 'main_feed' );
		count = feed.children.length;
		if ( count == 0 ) {		// first post
			$("#main_feed").html ( newcard );
		} else {
			if ( count < 8 || onlyFeedType == gFeed.USER ) {		// append
				afterWhich = feed.children[count - 1];
			} else {		// mixed content
				let offset = 0;
				let range = count;
				if ( useFeedType == gFeed.USER ) {
					offset = gFeedTrack.USER.last;
					range -= offset;
				}
				let insertIdx = offset + Math.floor(Math.random() * range);
				if ( useFeedType == gFeed.USER ) {
					gFeedTrack.USER.last = insertIdx;
				}
				afterWhich = feed.children[insertIdx];
			}
			afterWhich.insertAdjacentHTML ( "afterend", newcard );
		}
		if ( loops++ > 100 ) break;
	}
	if ( showStats ) {
		let ctReddit = 0;
		if ( !empty(gFeedTrack.REDDIT) ) ctReddit = gFeedTrack.REDDIT.used;
		//let ctGPT = gFeedTrack.GPT.used;
		//$("#stat_debug").html ( str );
		//console.log ( str );
		//$("#f_P").html ( `POSTS: ${count}` );
		$("#f_S").html ( `USER:` + (feedPref(gFeed.USER) ? '👍🏻' : '❌') );
		$("#f_N").html ( `NEWS:` + (feedPref(gFeed.NEWS) ? '👍🏻' : '❌') );
		$("#f_B").html ( `BIZ:` + (feedPref(gFeed.BIZ) ? '👍🏻' : '❌') );
		$("#f_T").html ( `TICKETS:` + (feedPref(gFeed.TICKETS) ? '👍🏻' : '❌') );
		$("#f_R").html ( `REDDIT:` + (feedPref(gFeed.REDDIT) ? '👍🏻' : '❌') );

		$("#s_P").html ( `POSTS: ${count}` );
		$("#s_S").html ( `USER:${gFeedTrack.USER.used}` );
		$("#s_N").html ( `NEWS:${gFeedTrack.NEWS.used}` );
		$("#s_B").html ( `BIZ:${gFeedTrack.BIZ.used}` );
		$("#s_T").html ( `TICKETS:${gFeedTrack.TICKETS.used}` );
		$("#s_R").html ( `REDDIT:${ctReddit}` );
	}
}

function dataAvailable()
{
	let dataFeeds = 0;
	
	if ( !empty(gData.weather) )	dataFeeds++;
	if ( !empty(gData.posts) && !empty(gData.posts.list) ) 		dataFeeds++;
	if ( !empty(gData.news) ) 		dataFeeds++;
	if ( !empty(gData.biz) ) 		dataFeeds++;
	if ( !empty(gData.tickets) ) 	dataFeeds++;
	if ( !empty(gData.reddit) ) 	dataFeeds++;
	if ( !empty(gData.gpt) ) 		dataFeeds++;

	return dataFeeds;
}

function dataWaiting()
{
	let waiting = 0;
	
	if ( feedPref(gFeed.WEATHER) && empty(gData.weather) ) waiting++;
	if ( feedPref(gFeed.USER) && empty(gData.posts) ) 		waiting++;
	if ( feedPref(gFeed.NEWS) && empty(gData.news) ) 		waiting++;
	if ( feedPref(gFeed.BIZ) && empty(gData.biz) ) 		waiting++;
	if ( feedPref(gFeed.TICKETS) && empty(gData.tickets) ) waiting++;
	if ( feedPref(gFeed.REDDIT) && empty(gData.reddit) ) waiting++;
	/*
	if ( feedPref(gFeed.GPT) && empty(gData.gpt) )			waiting++;
	if ( feedPref(gFeed.JOKES) && empty(gData.jokes) )		waiting++;
	*/

	return waiting;
}

function updateFeed()
{
 	if ( typeof resetYouTubePlayers === "function" ) {	// defined?
		resetYouTubePlayers()
	}
	update_list();
}

function nextPost ( personOfInterest=0, groupOfInterest=0 )
{
	let result = "";
	if ( empty(gData.posts) ) return missingDataCard ( "Posts" );
	let postList = gData.posts.list;
	//if ( empty(postList) ) return missingDataCard ( "Posts" );

	for ( let idx = 0; idx < postList.length; idx++ ) {
		let rec = postList[idx];
		if ( !empty(rec) ) {
			let when = rec['creation'];
			let posterID = rec['authorID'];
			let posterName = rec['authorName'];
			let posterZip = rec['authorZip'];
			let posterHeadline = rec['authorHeadline'];
			let poster = { 'posterID':posterID, 'name':posterName, 'zip':posterZip, 'headline':posterHeadline };

			// not comments
			if ( parseInt(rec.parentID) > 0 || rec.type == cPostType.COMMENT ) continue;
			// filter out non-matches for personOfInterest:
			if ( empty(groupOfInterest) && !empty(personOfInterest) && personOfInterest != posterID ) continue;
			// filter out non-matches for groupOfInterest:
			if ( !empty(groupOfInterest) && empty(rec.groupID) ) continue;
			if ( !empty(rec.groupID) ) {
				if ( !empty(groupOfInterest) && groupOfInterest != rec.groupID ) continue;
			}
			// check gSkip list for intentional omissions:
			if ( gSkip.includes(rec['title']) ) { if(sShowSkips) console.log(`Skipping ${title}`); continue; }

			// if we've already shown it, skip over it:
			if ( !empty(rec['shown']) && rec['shown'] >= sShownGeneration ) {
				continue;
			}

			/* ----- made it through the filters -------- */
			//console.log ( `Show ${sShownGeneration}: ${rec.title}` );

			if ( !empty(gData.meta['singleton']) ) {
				rec['singleton'] = 1;
			}
			if ( !empty(when) ) {
				let dateStr = "";
				let jDate = new Date(when);
				if ( empty(jDate) ) {
					when = when.replace ( ' ', 'T' );	// try ISO date
					jDate = new Date(when);
				}
				if ( !empty(jDate) ) {
					dateStr = day_time ( jDate );
				}
				subtitle = dateStr;
			}
			postList[idx]['shown'] = sShownGeneration;

			result += make_full_card ( cPostType.USER, poster, rec /*postRec*/, STANDARD );

			break;

		}
 	}
 	return result;
}

function gptPost ( existingPost=0 )
{
	let result = "";
	if ( empty(gData.gpt) ) return missingDataCard ( "GPT" );
	let genList = gData.gpt;
	if ( empty(genList) ) return missingDataCard ( "GPT" );

	for ( let idx = 0; idx < genList.length; idx++ ) {
		let rec = genList[idx];
		if ( !empty(rec) ) {
			let when = rec['creation'];
			let posterID = rec['authorID'];
			let posterName = rec['authorName'];
			let poster = { 'posterID':posterID, 'name': posterName };

			// comments
			//if ( parseInt(rec.parentID) > 0 || rec.type == cPostType.COMMENT ) continue;

			// if we've already shown it, skip over it:
			if ( !empty(rec['shown']) && rec['shown'] >= sShownGeneration ) {
				continue;
			}

			/* ----- made it through the filters -------- */
			//console.log ( `Show ${sShownGeneration}: ${rec.title}` );

			if ( !empty(gData.meta['singleton']) ) {
				rec['singleton'] = 1;
			}
			if ( !empty(when) ) {
				let dateStr = "";
				let jDate = new Date(when);
				if ( empty(jDate) ) {
					when = when.replace ( ' ', 'T' );	// try ISO date
					jDate = new Date(when);
				}
				if ( !empty(jDate) ) {
					dateStr = day_time ( jDate );
				}
				subtitle = dateStr;
			}
			genList[idx]['shown'] = sShownGeneration;

			result += make_full_card ( cPostType.USER, poster, rec /*postRec*/, STANDARD );

			break;

		}
 	}
 	return result;
}

function getOuttaJailCard ( title="", subtitle="" )
{
	let result = "";
	let postTitle = `${title}`;
	let postSubtitle = null;
	let when = null;
	let link = `/`; // `https://${gServer}`;
	
	//if ( empty(postTitle) ) postTitle = `Back to Main Feed`;
	if ( !empty(subtitle) ) postSubtitle = `<span class='darkred'>${subtitle}</span>`;
	let postRec = {
		'title': postTitle,
		'subtitle': postSubtitle,
		'body': null,
		'author': null,
		'source': null,
		'link': link,
		'imageURL': null,
	}
	result += make_full_card ( cPostType.ADMIN, null, postRec, BAR_NONE );
	
 	return result;
}

function missingDataCard ( str )
{
	let result = "";
	let title = `Missing ${str} Data`;
	let when = null;
	if ( !empty(when) ) {
		let jDate = new Date(when);
		let dateStr = day_time ( jDate );
		subtitle = dateStr;
	}
	let postRec = {
		'title': `Missing ${str} Data`,
		'subtitle': null,
		'body': null,
		'author': null,
		'source': null,
		'link': null,
		'imageURL': null
	}
	result += make_full_card ( cPostType.NEWS, null, postRec, STANDARD );
	
 	return result;
}

function feedPref ( prefVal ) 	// is an integer
{
	let result = 0;
	if ( isGroupType(gPageType) ) {
		if ( prefVal == gFeed.USER ) result = 1;
	} else {
		//let key = gFeedStr[prefVal];
		if ( !empty(gPrefs) ) { //&& !empty(key) ) {
			//result = gPrefs[key];
			result = gPrefs[prefVal];
		}
	}
	return result;
}

function refreshFeedData ( force=0 )
{
	if ( gEditing ) return;
	
	if ( force ) gFeedReset = 1;
	
	if ( force ) {
		//console.log ( "refreshFeedData(force)" );
		clearTimeout ( sReloadTimer );
		sReloadTimer = setTimeout ( function() { reload_list(0,force); }, 1500 );
	}
	updateFeedPrefs();

	if ( empty(gData.categories) ) {	// not location-specific
		getGroupDataFromServer ( gLoc.view.lat, gLoc.view.lng, gLoc.view.zip );
	}
	if ( feedPref(gFeed.WEATHER) && (force || empty(gData.weather)) ) {
		getWeatherFromServer();
	}
	if ( feedPref(gFeed.USER) && (force || empty(gData.posts)) ) {
		getPostsFromServer ( gGroupOfInterestID, gPostOfInterestID, force );
	}
	if ( feedPref(gFeed.AD) && (force || empty(gData.ads)) ) {
		getAdsFromServer ( gGroupOfInterestID, force );
	}
	if ( gData.refreshZipCode ) {
		//getCityFromServer ( gLoc.view.lat, gLoc.view.lng, FIND_ZIP );
		//getCityDataFromServer ( "View", gLoc.view.lat, gLoc.view.lng );
		//NO! doesn't work for anonymous folks, need IPAddressLoc value...
		//gLoc.view.zip = 0;
		setTimeout ( getMoreCityData, 100 );
		gData.refreshZipCode = 0;
	}
	if ( feedPref(gFeed.BIZ) && (force || empty(gData.biz)) ) {
			getBizListFromServer ( force );
	}
	if ( feedPref(gFeed.NEWS) && (force || empty(gData.news)) ) {
		getNewsFromServer ( force );
	}
	if ( feedPref(gFeed.TICKETS) && (force || empty(gData.tickets)) ) {
		getTicketEventsFromServer ( force );
	}
	if ( feedPref(gFeed.REDDIT) && (force || empty(gData.reddit)) ) {
		getRedditFromServer ( force );
	}
	/*
	if ( feedPref(gFeed.GPT) && (force || empty(gData.gpt)) ) {
		gPullGPTData = 0;
		getGPTFromServer ( force );
	}
	if ( feedPref(gFeed.JOKES) && (force || empty(gData.jokes)) ) {
		getJokesFromServer ( force );
	}
	*/
}

