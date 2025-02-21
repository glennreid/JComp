
/*
 * 2/10/2023
 *
 * server.js
 *
 * Server fetch functions for ZIPit
 */

var sLogServerHits = 0;

var gInProgress = {
	'USER': 0,
	'POSTS': 0,
	'ADS': 0,
	'NEWS': 0,
	'WEATHER': 0,
	'GROUPS': 0,
	'CITY': 0,
	'TICKETS': 0,
	'ZIPDATA': 0,
	'LAST': 0
};
// server functions

function getPostsFromServer ( groupID=0, postID=0, force=0 )		// if postID is set, only retriev a single Post from server
{
	let getUrl = `https://${gServer}/php/json_data_posts.php`;
	let sep = '?';
	let zip = encodeURIComponent ( gLoc.view.zip );

	//debug zip = '53233';

	if ( gInProgress.POSTS && ((now() - gInProgress.POSTS) < 10000) ) return;
	gInProgress.POSTS = now();

	if ( sLogServerHits ) console.log ( "getPostsFromServer ... " );
	getUrl += sep + "key=" + gSessionKey; sep = '&';
	getUrl += sep + "uid=" + gUID; sep = '&';
	if ( !empty(groupID) ) 	getUrl += sep + "gid=" + 	groupID; 	sep = '&';
	if ( !empty(zip) ) 		getUrl += sep + "zip=" + 	zip; 		sep = '&';
	if ( !empty(postID) ) 	getUrl += sep + "postid=" + postID; sep = '&';

	/*
	if ( !empty(lat) ) getUrl += sep + "lat=" + lat; sep = '&';
	if ( !empty(lng) ) getUrl += sep + "lng=" + lng; sep = '&';
	*/
	//if ( !empty(gGroupOfInterestID) ) getUrl += sep + "gid=" + gGroupOfInterestID; sep = '&';

	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			gInProgress.POSTS = 0;
			gData.posts =  data;
			if ( !empty(postID) ) {
				gData.meta['singleton'] = 1;
			}
			if ( sLogServerHits ) console.log ( ` ... got ${gData.posts.visible} visible in gData.posts` );
			if ( typeof updateFeed === "function" ) {	// defined?
				update_list ( gFeed.USER, force );
				//updateFeed ( force );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_data_posts" );
			gInProgress.POSTS = 0;
		}
	});
}

function getAdsFromServer ( groupID=0, force=0 )
{
	let getUrl = `https://${gServer}/php/json_data_ads.php`;
	let sep = '?';
	let zip = encodeURIComponent ( gLoc.view.zip );

	//debug zip = '53233';

	if ( gInProgress.ADS && ((now() - gInProgress.ADS) < 10000) ) return;
	gInProgress.ADS = now();

	if ( sLogServerHits ) console.log ( "getAdsFromServer ... " );
	getUrl += sep + "key=" + gSessionKey; sep = '&';
	getUrl += sep + "uid=" + gUID; sep = '&';
	if ( !empty(groupID) ) 	getUrl += sep + "gid=" + 	groupID; 	sep = '&';
	if ( !empty(zip) ) 		getUrl += sep + "zip=" + 	zip; 		sep = '&';

	/*
	if ( !empty(lat) ) getUrl += sep + "lat=" + lat; sep = '&';
	if ( !empty(lng) ) getUrl += sep + "lng=" + lng; sep = '&';
	*/
	//if ( !empty(gGroupOfInterestID) ) getUrl += sep + "gid=" + gGroupOfInterestID; sep = '&';

	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			gInProgress.ADS = 0;
			gData.ads =  data;
			if ( sLogServerHits ) console.log ( ` ... got ${gData.ads.visible} visible in gData.ads` );
			if ( typeof updateFeed === "function" ) {	// defined?
				update_list ( ALL_FEEDS, force );
				//updateFeed ( force );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_data_ads" );
			gInProgress.ADS = 0;
		}
	});
}

function getZipDataFromServer ( oneZip="" )
{
	let getUrl = `https://${gServer}/php/zip_codes.php`;
	let sep = '?';
	
	if ( gInProgress.ZIPDATA && ((now() - gInProgress.ZIPDATA) < 10000) ) return;
	gInProgress.ZIPDATA = now();

	/*
	getUrl += sep + "uid=" + gUID; sep = '&';
	getUrl += sep + "lat=" + lat; sep = '&';
	getUrl += sep + "lng=" + lng; sep = '&';
	getUrl += sep + "zip=" + encodeURIComponent(zip); sep = '&';
	*/
	if ( !empty(oneZip) ) {
		getUrl += sep + "zip=" + encodeURIComponent(oneZip); sep = '&';
	}
	if ( sLogServerHits ) console.log ( "getZipDataFromServer ... " );
	
	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			gInProgress.ZIPDATA = 0;
			if ( typeof getZipDataCallback === "function" ) {	// defined?
				getZipDataCallback ( data );
				//updateFeed ( force );
			}
			gData.zipcodes = data;
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " zip_codes" );
			gInProgress.ZIPDATA = 0;
		}
	});
}

function getPhotosFromServer ( batch )
{
	let getUrl = `https://${gServer}/php/json_data_photos.php`;
	let sep = '?';
	let zip = encodeURIComponent ( gLoc.view.zip );

	if ( gInProgress.POSTS && ((now() - gInProgress.POSTS) < 10000) ) return;
	gInProgress.POSTS = now();

	if ( sLogServerHits ) console.log ( "getPostsFromServer ... " );
	getUrl += sep + "key=" + gSessionKey; sep = '&';
	getUrl += sep + "uid=" + gUID; sep = '&';
	getUrl += sep + "batch=" + 	batch; 	sep = '&';

	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			gInProgress.POSTS = 0;
			gPhotos =  data;
			if ( sLogServerHits ) console.log ( " ... got gPhotos" );
			if ( typeof updatePhotos === "function" ) {	// defined?
				updatePhotos ( );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_data_photos" );
			gInProgress.POSTS = 0;
		}
	});
}


function refreshGroupDataFromServer ( only=0 )
{
	getGroupDataFromServer ( gLoc.view.lat, gLoc.view.lng, gLoc.view.zip, only );
}

function getGroupDataFromServer ( lat, lng, zip=0, groupID=0, withAddr=0, withTags=1, withMembers=1 )
{
	let getUrl = `https://${gServer}/php/json_data_groups.php`;
	let sep = '?';
	let when = now();
	let last = (when - gInProgress.GROUPS);
	
	if ( gInProgress.GROUPS && (last < 10000) ) return;
	gInProgress.GROUPS = when;

	getUrl += sep + "key=" + gSessionKey; sep = '&';
	getUrl += sep + "uid=" + gUID; sep = '&';
	getUrl += sep + "lat=" + lat; sep = '&';
	getUrl += sep + "lng=" + lng; sep = '&';
	if ( withAddr ) { getUrl += sep + "addr=1"; sep = '&'; }
	if ( withMembers ) { getUrl += sep + "members=1"; sep = '&'; }
		else { getUrl += sep + "members=0"; sep = '&'; }
	if ( !empty(zip) ) { getUrl += sep + "zip=" + encodeURIComponent(zip); sep = '&'; }
	if ( !empty(groupID) ) { getUrl += sep + `gid=${groupID}`; sep = '&'; }

	if ( sLogServerHits ) console.log ( "getGroupDataFromServer ... " );
	
	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			gInProgress.GROUPS = 0;
			if ( !empty(data['categories']) ) 	gData.categories =  data['categories'];
			if ( !empty(data['topic_areas']) ) 	gData.topic_areas =	data['topic_areas'];
			if ( !empty(data['topics']) ) 		gData.topics = 		data['topics'];
			if ( !empty(data['groups']) ) 		gData.groups =  	data['groups'];
			if ( !empty(data['clients']) ) 		gData.clients =  	data['clients'];
			if ( !empty(data['events']) ) 		gData.events =  	data['events'];
			if ( !empty(data['friends']) ) 		gData.friends =  	data['friends'];
			if ( !empty(data['links']) ) 		gData.links =  		data['links'];
			if ( !empty(data['files']) ) 		gData.files =  		data['files'];
			if ( sLogServerHits ) console.log ( " ... got gData.groups, categories, friends" );

			if ( typeof groupLoadedCallback === "function" ) {
				groupLoadedCallback();
			}
			if ( typeof updateSocialUI === "function" ) {	// defined?
				updateSocialUI ( gPageType );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_data_groups" );
			gInProgress.GROUPS = 0;
		}
	});
}

function getUserDataFromServer ( interestID )
{
	let getUrl = `https://${gServer}/php/json_data_user.php`;
	let sep = '?';

	if ( gInProgress.USER && ((now() - gInProgress.USER) < 10000) ) return;
	gInProgress.USER = now();

	getUrl += sep + "key=" + gSessionKey; sep = '&';
	getUrl += sep + "uid=" + gUID; sep = '&';
	getUrl += sep + "pid=" + interestID; sep = '&';

	if ( sLogServerHits ) console.log ( "getUserDataFromServer ... " );

	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			gInProgress.USER = 0;
			gData.users[interestID] = data;
			if ( interestID == gUID ) gData.friends = data.friends;
			if ( sLogServerHits ) console.log ( ` ... got gData.users[${interestID}` );
			if ( typeof updateSocialUI === "function" ) {	// defined?
				updateSocialUI ( gPageType );
			}
			if ( typeof userLoadedCallback === "function" ) {
				userLoadedCallback();
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_data_user" );
			gInProgress.USER = 0;
		}
	});
}

function getUserMessagesFromServer ( interestID, lastStamp=0 )
{
	let getUrl = `https://${gServer}/php/json_data_user_msgs.php`;
	let sep = '?';

	if ( empty(gUID) ) return;
	
	getUrl += sep + "key=" + gSessionKey; sep = '&';
	getUrl += sep + "uid=" + gUID; sep = '&';
	getUrl += sep + "pid=" + interestID; sep = '&';
	getUrl += sep + "last=" + encodeURIComponent(lastStamp); sep = '&';

	if ( sLogServerHits ) console.log ( "getUserMessagesFromServer ... " );

	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			mergeMessages ( interestID, data );
			if ( sLogServerHits ) console.log ( ` ... got MESSAGES gData.users[${interestID}` );
			if ( typeof updateConversationUI === "function" ) {	// defined?
				updateConversationUI ( interestID );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_data_user_msgs" );
		}
	});
}

function getEventsFromServer ( groupID, eventID )
{
	let getUrl = `https://${gServer}/php/json_data_events.php`;
	let sep = '?';

	if ( gInProgress.EVENTS && ((now() - gInProgress.EVENTS) < 10000) ) return;
	gInProgress.EVENTS = now();

	getUrl += sep + "key=" + gSessionKey; sep = '&';
	getUrl += sep + "uid=" + gUID; sep = '&';
	getUrl += sep + "gid=" + groupID; sep = '&';
	getUrl += sep + "eid=" + eventID; sep = '&';
	//getUrl += sep + "zip=" + encodeURIComponent(zip); sep = '&';

	if ( sLogServerHits ) console.log ( `getEventsFromServer(${groupID},${eventID}) ... ` );

	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			gInProgress.EVENTS = 0;
			if ( sLogServerHits ) console.log ( " ... got gData.events" );

			if ( typeof eventsLoadedCallback === "function" ) {
				eventsLoadedCallback ( data );
			}
			if ( typeof updateSocialUI === "function" ) {	// defined?
				updateSocialUI ( gPageType );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_data_events" );
			gInProgress.GROUPS = 0;
		}
	});
}

function getEmailBodiesFromServer ( uid, gid, summaryOnly=0 )
{
	let getUrl = `https://${gServer}/php/json_email_body.php`;
	let sep = '?';

	getUrl += sep + "key=" + gSessionKey; sep = '&';
	getUrl += sep + "uid=" + uid; sep = '&';
	getUrl += sep + "gid=" + gid; sep = '&';
	if ( !empty(summaryOnly) ) {
		getUrl += sep + "summary=1"; sep = '&';
	}
	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			if ( typeof updateEmailFromServer === "function" ) {	// defined?
				updateEmailFromServer ( data );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_data_user_msgs" );
		}
	});
}

function getEmailHistoryFromServer ( emailID, readerID=0 )
{
	let getUrl = `https://${gServer}/php/json_email_history.php`;
	let sep = '?';

	if ( emailID ) {
		getUrl += sep + "emailID=" + emailID; sep = '&';
	}
	if ( readerID ) {
		getUrl += sep + "userID=" + readerID; sep = '&';
	}
	/*
	getUrl += sep + "uid=" + uid; sep = '&';
	getUrl += sep + "flag=" + flagValue; sep = '&';
	console.log(getUrl);
	*/
	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			if ( typeof updateHistoryFromServer === "function" ) {	// defined?
				updateHistoryFromServer ( data );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_email_history.php" );
		}
	});
}

function getThemesFromServer ( )
{
	let getUrl = `https://${gServer}/php/json_data_themes.php`;
	let sep = '?';

	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			if ( typeof themesLoadedCallback === "function" ) {
				themesLoadedCallback ( data );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_data_themes" );
			gInProgress.USER = 0;
		}
	});
}

function getTagsFromServer ( userID, groupID, usage=1 )
{
	if ( groupID ) {
		let getUrl = `https://${gServer}/php/json_data_tags.php`;
		let sep = '?';

		getUrl += sep + "uid=" + userID; sep = '&';
		if ( !empty(groupID) ) { getUrl += sep + "gid=" + groupID; sep = '&'; }
		if ( !empty(usage) ) { getUrl += sep + "usage=1"; sep = '&'; }
		/*
		getUrl += sep + "flag=" + flagValue; sep = '&';
		console.log(getUrl);
		*/
		jQuery.ajax({url:getUrl,  dataType:'json',
			success:function(data) {
				if ( typeof tagsLoadedCallback === "function" ) {	// defined?
					tagsLoadedCallback ( data );
				}
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				console.log('Error: ' + errorThrown + " / " + textStatus + " json_data_tags.php" );
			}
		});
	}
}

function getCityDataFromServer ( where, lat, lng, zip=0 )
{
	let getUrl = `https://${gServer}/php/json_data_nearby_cities.php`;
	let sep = '?';
	
	getUrl += sep + "key=" + gSessionKey; sep = '&';
	getUrl += sep + "uid=" + gUID; sep = '&';
	getUrl += sep + "lat=" + lat; sep = '&';
	getUrl += sep + "lng=" + lng; sep = '&';
	if ( !empty(zip) ) {
		let zip = encodeURIComponent(gLoc.view.zip);
		getUrl += sep + "zip=" + zip; sep = '&';
	}

	if ( sLogServerHits ) console.log ( "getCityDataFromServer ... " );

	//if ( gNearbyCities[where].loading ) return;		// already in progress
	//gNearbyCities[where].loading = 1;

	if ( gInProgress.CITY && ((now() - gInProgress.CITY) < 10000) ) return;
	gInProgress.CITY = now();

	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			gInProgress.CITY = 0;
			if ( !empty(data) && !empty(data['data']) ) {
				if ( sLogServerHits ) console.log ( " ... got City Data" );
				let list = data['data'];
				mergeCityData ( where, list );
				//gNearbyCities[where].loading = 0;
				//updateLocationData();
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_data_nearby_cities" );
			gInProgress.CITY = 0;
			//gNearbyCities[where].loading = 0;
		}
	});
}

function getWeatherFromServer ( units='imperial', force=0 )
{
	let getUrl = `https://${gServer}/php/json_data_weather.php`;
	let sep = '?';

	if ( empty(units) && !empty(gLoc.view.zip) ) {
		let intZip = parseInt ( gLoc.view.zip );
		if ( empty(intZip) ) {
			units = "metric";
		}
	}
	if ( gInProgress.WEATHER && ((now() - gInProgress.WEATHER) < 10000) ) return;
	if ( sLogServerHits ) console.log ( "getWeatherFromServer ... " );
	gInProgress.WEATHER = now();

	getUrl += sep + "key=" + gSessionKey; sep = '&';
	getUrl += sep + "uid=" + gUID; sep = '&';
	getUrl += sep + "lat=" + gLoc.view.lat; sep = '&';
	getUrl += sep + "lng=" + gLoc.view.lng; sep = '&';
	getUrl += sep + "units=" + units; sep = '&';
	if ( !empty(gLoc.view.zip) ) {
		let zip = encodeURIComponent(gLoc.view.zip);
		getUrl += sep + "zip=" + zip; sep = '&';
	}

	//console.log ( getUrl );

	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			gInProgress.WEATHER = 0;
			data['units'] = units;
			gData.weather = data; // data['offers'];
			if ( sLogServerHits ) console.log ( " ... got gData.weather" );
			if ( typeof update_list === "function" ) {	// defined?
				update_list ( gFeed.WEATHER, force );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_data_weather" );
			gPrefs[gFeed.WEATHER] = 0;
			gInProgress.WEATHER = 0;
		}
	});
}

function getBizListFromServer ( force=0 )
{
	let getUrl = `https://${gServer}/php/json_data_yelp.php`;
	let sep = '?';
	
	if ( sLogServerHits ) console.log ( "getBizListFromServer ... " );

	if ( gInProgress.BIZ && ((now() - gInProgress.BIZ) < 10000) ) return;
	gInProgress.BIZ = now();

	getUrl += sep + "key=" + gSessionKey; sep = '&';
	getUrl += sep + "uid=" + gUID; sep = '&';
	if ( !empty(gLoc.view.lat) && !empty(gLoc.view.lng) ) {
		getUrl += sep + "lat=" + gLoc.view.lat; sep = '&';
		getUrl += sep + "lng=" + gLoc.view.lng; sep = '&';
	}
	if ( !empty(gLoc.view.zip) ) {
		let zip = encodeURIComponent(gLoc.view.zip);
		getUrl += sep + "zip=" + zip; sep = '&';
	}
	//console.log ( getUrl );

	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			gInProgress.BIZ = 0;
			gData.biz = data; // data['offers'];
			if ( empty(data) )gPrefs[gFeed.BIZ] = 0;
			if ( sLogServerHits ) console.log ( " ... got gData.biz" );
			//console.log ( "gBizDat[0]: " + data.businesses[0].name );
			if ( typeof update_list === "function" ) {	// defined?
				update_list ( gFeed.BIZ, force );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_data_yelp" );
			gPullBizData = 0;
			gInProgress.BIZ = 0;
		}
	});
}

function getNewsFromServer ( force=0 )
{
	let getUrl = `https://${gServer}/php/json_data_news.php`;
	let sep = '?';
	let plus = '';
	let cities = "";
	let country = gLoc.view.country;
	
	if ( empty(country) ) country = "us";
	
	if ( sLogServerHits ) console.log ( "getNewsFromServer ... " );
	if ( empty(gNearbyCities) || empty(gNearbyCities.View) || empty(gNearbyCities.View.data) ) {
		if ( sLogServerHits ) console.log ( "getNewsFromServer ... don't have gNearbyCities.View.data, can't get NEWS data" );
		return;
	}
	if ( gInProgress.NEWS && ((now() - gInProgress.NEWS) < 10000) ) return;
	gInProgress.NEWS = now();

	getUrl += sep + "key=" + gSessionKey; sep = '&';
	getUrl += sep + "uid=" + gUID; sep = '&';
	if ( !empty(gLoc.view.zip) ) {
		let zip = encodeURIComponent(gLoc.view.zip);
		getUrl += sep + "zip=" + zip; sep = '&';
	}
	if ( !empty(gLoc.view.city) ) {
		cities += plus + gLoc.view.city; plus = '+';
	}
	if ( !empty(gLoc.view.lat) && !empty(gLoc.view.lng) ) {
		getUrl += sep + "lat=" + gLoc.view.lat; sep = '&';
		getUrl += sep + "lng=" + gLoc.view.lng; sep = '&';
	}
	if ( !empty(gNearbyCities) && !empty(gNearbyCities.View) ) {
		let list = gNearbyCities.View.data;
		if ( !empty(list) ) {
			for ( let idx = 0; idx < list.length; idx++ ) {
				let city = list[idx];
				if ( !empty(city) ) {
					let name = city.city;
					name = name.replace ( " ", "_" );
					//if ( name.includes(" ") ) name = `"${city}"`;	// no quotes yet...
					cities += plus + name; plus = "+";
				}
			}
		}
	}
	if ( !empty(cities) ) {
		cities = encodeURIComponent ( cities );
		getUrl += sep + "city=" + cities; sep = '&';
	}
	if ( !empty(country) ) {
		getUrl += sep + "country=" + country; sep = "&";
	}

	if ( sLogServerHits ) console.log ( getUrl );

	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			gInProgress.NEWS = 0;
			gData.news = data; // data['offers'];
			if ( sLogServerHits ) console.log ( " ... got gData.news" );
			if ( typeof update_list === "function" ) {	// defined?
				update_list ( ALL_FEEDS /*gFeed.NEWS*/, force );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_data_news" );
			gPullNewsData = 0;
			gInProgress.NEWS = 0;
		}
	});
}

function getTicketEventsFromServer ( force=0 )
{
	let getUrl = `https://${gServer}/php/json_data_ticket_events.php`;
	let sep = '?';
	
	if ( sLogServerHits ) console.log ( "getTicketsFromServer ... " );

	if ( gInProgress.TICKETS && ((now() - gInProgress.TICKETS) < 10000) ) return;
	gInProgress.TICKETS = now();

	getUrl += sep + "key=" + gSessionKey; sep = '&';
	getUrl += sep + "uid=" + gUID; sep = '&';
	getUrl += sep + "lat=" + gLoc.view.lat; sep = '&';
	getUrl += sep + "lng=" + gLoc.view.lng; sep = '&';
	if ( !empty(gLoc.view.zip) ) {
		let zip = encodeURIComponent(gLoc.view.zip);
		getUrl += sep + "zip=" + zip; sep = '&';
	}

	//console.log ( getUrl );

	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			gInProgress.TICKETS = 0;
			gData.tickets = data; // data['offers'];
			if ( empty(data) ) gPullTicketData = 0;
			if ( sLogServerHits ) console.log ( " ... got gData.tickets" );
			if ( typeof update_list === "function" ) {	// defined?
				update_list ( gFeed.TICKETS, force );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_data_ticket_events" );
			gPullTicketsData = 0;
			gInProgress.TICKETS = 0;
		}
	});
}

function getGPTFromServer ( force=0 )
{
	let getUrl = `https://${gServer}/php/json_data_gpt.php`;
	let sep = '?';

	/*
	if ( sLogServerHits ) console.log ( "getGPTFromServer ... " );

	getUrl += sep + "key=" + gSessionKey; sep = '&';

	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			gData.gpt = data;
			if ( sLogServerHits ) console.log ( " ... got gData.gpt" );
			if ( typeof update_list === "function" ) {	// defined?
				update_list ( gFeed.GPT, force );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_data_gpt" );
			gPullGPTData = 0;
		}
	});
	*/
}

var sAlreadyReddit = 0;

function getRedditFromServer ( force=0 )
{
	let getUrl = `https://${gServer}/php/json_data_reddit.php`;
	let sep = '?';

	if ( sAlreadyReddit ) { console.log ( "sAlreadyReddit." ); return; }
	sAlreadyReddit = 1;

	if ( sLogServerHits ) console.log ( "getRedditFromServer ... " );

	getUrl += sep + "key=" + gSessionKey; sep = '&';

	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			gData.reddit = data;
			if ( sLogServerHits ) console.log ( " ... got gData.reddit" );
			if ( typeof update_list === "function" ) {	// defined?
				update_list ( ALL_FEEDS /*gFeed.REDDIT*/, force );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_data_reddit" );
			gPullRedditData = 0;
		}
	});
}

function getCSVDataFromServer ( fileID, pageSize=0 )
{
	let getUrl = `https://${gServer}/php/json_data_uploaded.php`;
	let sep = '?';
	//let first = parseInt(gUploadData.first) + parseInt(gUploadData.page);
	let first = parseInt(gUploadData.lastRow);
	getUrl += sep + "key=" + gSessionKey; sep = '&';
	getUrl += sep + "uid=" + gUID; sep = '&';
	getUrl += sep + "gid=" + gGroupOfInterestID; sep = '&';
	getUrl += sep + "fileID=" + fileID; sep = '&';
	getUrl += sep + "first=" + first; sep = '&';
	if ( !empty(gUploadData.delimiter) ) getUrl += sep + "delim=" + gUploadData.delimiter; sep = '&';
	if ( !empty(pageSize) ) getUrl += sep + "page=" + pageSize; sep = '&';
	if ( !empty(gGeolocate) ) getUrl += sep + "geo=1"; sep = '&';

	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			//let decode = JSON.parse ( data );
			if ( !empty(data) ) {
				if ( data.type == 'CSV' || data.type == 'CSV_ADDR' ) {
					processServerCSV ( data, 1 );
				}
			} else {
				alert ( "Bad return from server: " + data );
			}
//			if ( typeof update_list === "function" ) {	// defined?
//				update_list ( ALL_FEEDS /*gFeed.REDDIT*/, force );
//			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_data_uploaded" );
			gPullRedditData = 0;
		}
	});
}

function getJokesFromServer ( force=0 )
{
	let getUrl = `https://${gServer}/php/json_data_jokes.php`;
	let sep = '?';
	
	if ( sLogServerHits ) console.log ( "getJokesFromServer ... " );

	getUrl += sep + "key=" + gSessionKey; sep = '&';

	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			gData.jokes = data;
			if ( sLogServerHits ) console.log ( " ... got gData.jokes" );
			if ( typeof update_list === "function" ) {	// defined?
				update_list ( gFeed.JOKES, force );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_data_jokes" );
			gPullJokesData = 0;
		}
	});
}

// -------- send to server --------------

function quickLogin ( userID, password )
{
	let getUrl = `https://${gServer}/php/login.php?uid=${userID}&pw=${password}`;
	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			//console.log(`success: ${data}`);
			if ( typeof loginResult === "function" ) {	// defined?
				loginResult ( data );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " quickLogin" );
		}
	});
}

function traction ( type, ipNum, pageName='none', ad='none' ) {
	let getUrl = `https://${gServer}/track/action.php?type=${type}&ipNum=${ipNum}&page=${pageName}&ad=${ad}`;
	jQuery.ajax({url:getUrl,  dataType:'text',
		success:function(data) { console.log("success"); }, error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " traction" );
		}
	});
}

function sendPostToServer ( postRec )
{
	let postUrl = `https://${gServer}/php/save_post.php`;
	let sep = '?';

	if ( empty(gSessionKey) || empty(gUID) ) return;

	postUrl += sep + "key=" + gSessionKey; sep = '&';

	let package = postRec;
	// add a few things:
	package['uid'] = gUID;

	let json = JSON.stringify( package );
	json = encodeURIComponent ( json );
	
	jQuery.ajax({url:postUrl,
		dataType: 'json',
		type: 'post',
		contentType: 'application/x-www-form-urlencoded',
		data: json,
		processData: false,
		success:function(data) {
			if ( typeof justPosted === "function" ) {	// defined?
				justPosted ( data );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " save_post" );
		}
	});
}

function deletePostOnServer ( postID )
{
	let getUrl = `https://${gServer}/php/delete.php`;
	let sep = '?';

	if ( empty(gSessionKey) || empty(gUID) ) return;

	getUrl += sep + "key=" + gSessionKey; sep = '&';
	getUrl += sep + "uid=" + gUID; sep = '&';
	getUrl += sep + "postID=" + postID; sep = '&';
	jQuery.ajax({url:getUrl,  dataType:'text',
		success:function(data) {
			if ( typeof justDeleted === "function" ) {	// defined?
				justDeleted ( data );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " create_reaction" );
		}
	});
}

function sendReactionToServer ( postID, authorID, type )
{
	let getUrl = `https://${gServer}/php/create_reaction.php`;
	let sep = '?';
	
	if ( empty(gSessionKey) || empty(gUID) ) return;

	getUrl += sep + "key=" + gSessionKey; sep = '&';
	getUrl += sep + "uid=" + gUID; sep = '&';
	getUrl += sep + "postID=" + postID; sep = '&';
	getUrl += sep + "authorID=" + authorID; sep = '&';
	getUrl += sep + "type=" + type; sep = '&';

	jQuery.ajax({url:getUrl,  dataType:'text',
		success:function(data) {
			//gData.categories =  data;
			//updateSocialUI(cPage.USER);
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " create_reaction" );
		}
	});
}

function sendSettingToServer ( key, value )
{
	let getUrl = `https://${gServer}/php/save_setting.php`;
	let sep = '?';
	
	if ( empty(gSessionKey) || empty(gUID) ) return;

	getUrl += sep + `key=${gSessionKey}`; sep = '&';
	getUrl += sep + `uid=${gUID}`; sep = '&';
	getUrl += sep + `set=${key}`; sep = '&';
	getUrl += sep + `value=${value}`; sep = '&';

	jQuery.ajax({url:getUrl,  dataType:'text',
		success:function(data) {
			//gData.categories =  data;
			//updateSocialUI(cPage.USER);
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " save_setting" );
		}
	});
}

function sendSocialRequestToServer ( uid, otherID, gid, verb )
{
	let getUrl = `https://${gServer}/php/social_request.php`;
	let sep = '?';
	
	//need to be able to handle requests like unsubscribe when not logged in
	//if ( empty(gSessionKey) || empty(gUID) ) return;

	getUrl += sep + "key=" + gSessionKey; sep = '&';
	getUrl += sep + "uid=" + gUID; sep = '&';
	if ( !empty(otherID) ) { getUrl += sep + "otherID=" + otherID; sep = '&'; }
	if ( !empty(gid) ) { getUrl += sep + "gid=" + gid; sep = '&'; }
	getUrl += sep + "verb=" + verb; sep = '&';

	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			if ( !empty(data) && !empty(data.dest) ) {
				console.log ( `gotoPage(${data.dest});` );
				gotoPage ( data.dest );
			} else {
				if ( !empty(gGroup) && !empty(data) ) {
					gGroup.members = data;
				}
				updateSocialUI ( gPageType );
				let isAdmin = isGroupAdmin ( gUID, gGroupOfInterestID );
				displayGroupMembers ( gPageType, gUID, gGroup, isAdmin ); // , ltitle );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " social_request" );
		}
	});
}

function postAIResponseOnServer ( type, postID, parentID=0 )
{
	let getUrl = `https://${gServer}/php/generate_AI_response.php`;
	let sep = '?';

	if ( empty(gSessionKey) || empty(gUID) ) return;

	getUrl += sep + "type=" + type; sep = '&';
	getUrl += sep + "postID=" + postID; sep = '&';
	if ( !empty(parentID) ) getUrl += sep + "parentID=" + parentID; sep = '&';
	getUrl += sep + "andPost=1"; sep = '&';

	//leave this to the server to decide
	//getUrl += sep + "authorID=27"; sep = '&';
	//getUrl += sep + "sentiment=neutral"; sep = '&';

	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			if ( typeof justPosted === "function" ) {	// defined?
				justPosted ( data );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " social_request" );
		}
	});
}

function generateAIResponseOnServer ( type, postID, parentID=0, sentiment='positive' )
{
	let getUrl = `https://${gServer}/php/generate_AI_response.php`;
	let sep = '?';

	if ( empty(gSessionKey) || empty(gUID) ) return;

	getUrl += sep + "type=" + type; sep = '&';
	getUrl += sep + "postID=" + postID; sep = '&';
	if ( !empty(gPost.parentID) ) getUrl += sep + "parentID=" + parentID; sep = '&';

	if ( !empty(sentiment) ) getUrl += sep + `sentiment=${sentiment}`; sep = '&';

	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			if ( typeof justGotAIResponse === "function" ) {	// defined?
				justGotAIResponse ( data );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " social_request" );
		}
	});
}

