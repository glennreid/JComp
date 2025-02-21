
/*
 * 3/10/2023
 *
 * external.js
 *
 * External Content functions for ZIPit
 */

function newsStory()
{
	var result = "";
	if ( empty(gData.news) ) return "-missing news event data-";
	var newsList = gData.news.data;
	if ( empty(newsList) ) newsList = gData.news.value;
	if ( empty(newsList) ) newsList = gData.news.articles;
	if ( empty(newsList) ) {
		return ""; // -bad news list-";
	}
	for ( var idx = 0; idx < newsList.length; idx++ ) {
		var rec = newsList[idx];
		if ( !empty(rec) ) {
			var title = rec['title'];
			var subtitle = null;
			var desc = rec['description'];
			var author = rec['author'];
			var source = rec['source'];
			var when = rec['published_at'];
			var link = rec['url'];
			var imageURL = rec['image'];

			// some fields are different, depending on news sourc
			if ( empty(title) ) title = rec['name'];
			if ( empty(when) ) when = rec['datePublished'];
			if ( empty(when) ) when = rec['publishedAt'];
			if ( empty(imageURL) ) imageURL = rec['urlToImage'];
			if ( typeof(imageURL) == "object" ) {	// object -- probably Bing data
				if ( !empty(imageURL.contentUrl) ) {
					imageURL = imageURL.contentUrl;
				} else if ( !empty(imageURL.thumbnail) ) {
					imageURL = imageURL.thumbnail.contentUrl;
				} else {
					imageURL = "";
				}
			}
			/* if ( empty(author) ) {				// check for Bing data
				var about = rec['about'];
				if ( !empty(about) ) {
					author = about[0].name;
					source = about[about.length-1].name;
				}
			} */
			if ( empty(source) ) {				// check for Bing data
				var provider = rec['provider'];
				if ( !empty(provider) ) {
					source = provider[0].name;
				}
			}
			if ( typeof(imageURL) != "string" ) {	// object -- probably Bing data
			}
			
			if ( gSkip.includes(rec['source']) ) {
				if ( sShowSkips ) console.log ( "Skipping " + title );
				continue;
			}
			if ( !empty(rec['shown']) && rec['shown'] >= sShownGeneration ) {
				//console.log ( "Skipping " + title );
				continue;
			}
			if ( gLinksShown.includes(link) ) {
				//console.log ( "Duplicate: " + title );
				continue;
			}
			if ( gArticlesShown.includes(title) ) {
				//console.log ( "Duplicate: " + title );
				continue;
			}
			//console.log ( "Adding News Story " + title );
			newsList[idx]['shown'] = sShownGeneration;
			gLinksShown.push ( link );
			gArticlesShown.push ( title );
			
			title = "<span class='accent'>📰 News: </span>" + title;
			if ( !empty(when) ) {
				var jDate = new Date(when);
				var dateStr = day_time ( jDate );
				subtitle = dateStr;
				if ( this_week(jDate) ) {
					subtitle = `<span class='red'>${subtitle}</span>`;
				}
			}
			var postRec = {
				'title': title,
				'subtitle': subtitle,
				'body': desc,
				'author': author,
				'source': source,
				'link': link,
				'imageURL': imageURL
			}
			result += make_full_card ( cPostType.NEWS, null, postRec, STANDARD );
			//result += make_card ( cPostType.NEWS, null, title, subtitle, desc, link, imageURL );
			break;
		} else break;
 	}
 	return result;
}

function newsStoryV2()
{
	var result = "";
	if ( empty(gData.news) ) return "-missing news event data-";
	var newsList = gData.news.data;
	if ( empty(newsList) ) {
		newsList = gData.news.articles;
		if ( empty(newsList) ) {
			return "-bad news list-";
		}
	}
	for ( var idx = 0; idx < newsList.length; idx++ ) {
		var rec = newsList[idx];
		if ( !empty(rec) ) {
			var title = rec['title'];
			var subtitle = null;
			var desc = rec['description'];
			var author = rec['author'];
			var source = rec['source'];
			var when = rec['published_at'];
			var link = rec['url'];
			var imageURL = rec['image'];

			if ( gSkip.includes(rec['source']) ) {
				if ( sShowSkips ) console.log ( "Skipping " + title );
				continue;
			}
			if ( !empty(rec['shown']) && rec['shown'] >= sShownGeneration ) {
				//console.log ( "Skipping " + title );
				continue;
			}
			if ( gLinksShown.includes(link) ) {
				//console.log ( "Duplicate: " + title );
				continue;
			}
			if ( gArticlesShown.includes(title) ) {
				//console.log ( "Duplicate: " + title );
				continue;
			}
			//console.log ( "Adding News Story " + title );
			newsList[idx]['shown'] = sShownGeneration;
			gLinksShown.push ( link );
			gArticlesShown.push ( title );

			title = "<span class='accent'>📰 News: </span>" + title;
			if ( !empty(when) ) {
				var jDate = new Date(when);
				var dateStr = day_time ( jDate );
				subtitle = dateStr;
				if ( this_week(jDate) ) {
					subtitle = `<span class='red'>${subtitle}</span>`;
				}
			}
			var postRec = {
				'title': title,
				'subtitle': subtitle,
				'body': desc,
				'author': author,
				'source': source,
				'link': link,
				'imageURL': imageURL
			}
			result += make_full_card ( cPostType.NEWS, null, postRec, STANDARD );
			//result += make_card ( cPostType.NEWS, null, title, subtitle, desc, link, imageURL );
			break;
		} else break;
 	}
 	return result;
}

function redditPost()
{
	var result = "";
	if ( empty(gData.reddit) ) return "-missing reddit data-";
	if ( empty(gData.reddit.posts) ) return "-bad reddit list-";
	var list = gData.reddit.posts;
	for ( var idx = 0; idx < list.length; idx++ ) {
		var rec = list[idx];
		if ( !empty(rec) ) {
			var title = rec['title'];
			var subtitle = "";
			var desc = ""; // rec['description'];
			var author = rec['author'];
			var source = "Reddit"; // rec['source'];
			var score = rec['score'];
			var when = rec['created'];
			var link = rec['permalink'];
			var imageURL = null;

			//if ( rec.isNSFW ) continue;
			if ( parseInt(score) < 400 ) continue;		// not interesting enough...

			if ( gSkip.includes(rec['source']) ) {
				if ( sShowSkips ) console.log ( "Skipping " + title );
				continue;
			}
			if ( !empty(rec['shown']) && rec['shown'] >= sShownGeneration ) {
				//console.log ( "Skipping " + title );
				continue;
			}
			if ( gLinksShown.includes(link) ) {
				//console.log ( "Duplicate: " + title );
				continue;
			}
			if ( gArticlesShown.includes(title) ) {
				//console.log ( "Duplicate: " + title );
				continue;
			}
			if ( title.includes("stunning") || title.includes("XXJetski") ) {
				let bp = 1;
			}
			if ( !empty(rec['media']) ) {
				let media = rec['media'];
				if ( media['type'] == 'video' ) {
					list[idx]['shown'] = sShownGeneration;
					continue;
				}
				imageURL = media['posterUrl'];
				if ( empty(imageURL) && !empty(media['gallery'])) {
					let first = media['gallery'].items[0];
					let meta = media['mediaMetadata'];
					if ( !empty(first) ) {
						let mediaID = first['mediaId'];
						let inner = meta[mediaID];
						if ( !empty(inner) ) {
							imageURL = inner['s']['u'];
						}
					}
				}
			}
			if ( !empty(rec['preview']) ) {
				imageURL = rec['preview']['url'];
			}
			// skip over posts with no images
			if ( empty(imageURL) ) {
				list[idx]['shown'] = sShownGeneration;
				continue;
			}
			if ( !empty(author) ) author = `@${author}`;
			source += ` +${score}`;

			//console.log ( "Adding News Story " + title );
			list[idx]['shown'] = sShownGeneration;
			gLinksShown.push ( link );
			gArticlesShown.push ( title );
			
			title = "<span class='accent'>🧠 Hmmm: </span>" + title;
			if ( !empty(when) ) {
				var jDate = new Date(when);
				var dateStr = day_time ( jDate );
				subtitle = dateStr;
				if ( this_week(jDate) ) {
					subtitle = `<span class='red'>${subtitle}</span>`;
				}
			}
			var postRec = {
				'title': title,
				'subtitle': subtitle,
				'body': desc,
				'author': author,
				'source': source,
				'link': link,
				'imageURL': imageURL
			}
			result += make_full_card ( cPostType.REDDIT, null, postRec, STANDARD );
			//result += make_card ( cPostType.NEWS, null, title, subtitle, desc, link, imageURL );
			break;
		} else break;
 	}
 	return result;
}

function isSports ( genre ) {
	if ( genre.includes("ball") ) return true;
	if ( genre.includes("Hockey") ) return true;
	return false;
}

function ticketEvent()
{
	var result = "";
	if ( empty(gData.tickets) ) return "-missing ticket event data-";
	//var tickList = gData.tickets['_embedded']['events'];
	var tickList = gData.tickets._embedded.events;
	if ( empty(tickList) ) return "-bad ticket list-";
	for ( var idx = 0; idx < tickList.length; idx++ ) {
		var rec = tickList[idx];
		if ( !empty(rec) ) {
			var intro = "🎟 Tickets:";
			var link = rec['url'];
			var title = rec['name'];
			var subtitle = "";
			var desc = "";
			var when = "";
			var genreStr = "";
			var venueStr = "";
			var ticketStr = "";
			var subdata = rec['_embedded'];
			var nearby = 0;
			var imageURL = "";
			
			if ( !empty(rec['shown']) && rec['shown'] >= sShownGeneration ) {
				//console.log ( "Skipping " + title );
				continue;
			}
			if ( gLinksShown.includes(link) ) {
				//console.log ( "Duplicate: " + title );
				continue;
			}
			if ( !empty(subdata) ) {
				var venues = subdata['venues'];
				if ( !empty(venues) ) {
					for ( var jdx = 0; jdx < venues.length; jdx++ ) {
						var venRec = venues[jdx];
						if ( venRec ) {
							var lat1 = venRec['location']['latitude'];
							var lng1 = venRec['location']['longitude'];
							var dist = geoDistance ( lat1, lng1, gLoc.view.lat, gLoc.view.lng );
							if ( dist < gRadius ) {
								// distance is within radius
								nearby = 1;
								venueStr += venRec['name'];
								break;
							}
						}
					}
				}
			}
			if ( !nearby ) continue;
			
			var images = rec['images'];
			if ( !empty(images) ) {
				for ( var jdx = 0; jdx < images.length; jdx++ ) {
					var imgRec = images[jdx];
					if ( imgRec ) {
						if ( imgRec['ratio'] == "16_9" ) {
							if ( parseInt(imgRec['width']) >= 600 ) {
								imageURL = imgRec['url'];
								break;
							}
						}
					}
				}
			}
			if ( gLinksShown.includes(imageURL) ) {
				//console.log ( "Duplicate: " + title );
				continue;
			}
			var types = rec['classifications'];
			if ( !empty(types) ) {
				for ( var jdx = 0; jdx < types.length; jdx++ ) {
					var typeRec = types[jdx];
					if ( typeRec && typeRec['primary'] ) {
						var genre = "";
						var subgenre = "";
						if ( !empty(typeRec['genre']) ) {
							genre = typeRec['genre']['name'];
						}
						if ( !empty(typeRec['subgenre']) ) {
							subgenre = typeRec['subgenre']['name'];
						}
						if ( !empty(genre) ) {
							genreStr += genre;
							if ( !empty(subgenre) && genre != subgenre ) {
								genreStr += " / " + subgenre;
							}
						}
					}
				}
			}
			if ( !empty(genreStr) ) {
				var times = gGenresShown[genreStr];
				if ( empty(times) ) times = 0;
				times++;
				if ( genreStr.includes('Basketball') ) {
					var bp = 1;
				}
				gGenresShown[genreStr] = times;
				if ( isSports(genreStr) && times > 2 ) {
					continue;
				}
			}
			var tickets = rec['sales'];
			if ( !empty(tickets) ) {
				var public = tickets['public'];
				if ( !empty(public) ) {
					var dt = public['startDateTime'];
					if ( empty(dt) || dt.includes("1900-") ) {	// bad data
						ticketStr += "Click for ticket availability";
					} else {
						ticketStr += "Tickets go on sale <span class='accent'>";
						ticketStr += jdate ( dt, day_time );
						ticketStr += "</span>";
					}
				}
				var presales = tickets['presales'];
				if ( !empty(presales) ) {
				}
			}
			var dates = rec['dates'];
			if ( !empty(dates) ) {
				var start = dates['start'];
				if ( !empty(start) ) {
					when = start['dateTime'];
					if ( empty(when) ) when = start['localTime'];
				}
			}
			
			tickList[idx]['shown'] = sShownGeneration;
			gLinksShown.push ( link );
			gLinksShown.push ( imageURL );
			
			title = "<span class='accent'>" + intro + " </span>" + title;
			if ( !empty(ticketStr) ) {
				desc = ticketStr;
			} else {
				desc += "<a href='" + link + "'>"
				desc += "<span class='accent'>Get Tickets!</span>";
				desc += "</a>";
			}
			if ( !empty(genreStr) ) {
				var emoji = "";
				if ( genreStr.includes("Basketball") ) emoji += "🏀 ";
				if ( genreStr.includes("Baseball") ) emoji += "⚾️ ";
				if ( genreStr.includes("Football") ) emoji += "🏈 ";
				if ( genreStr.includes("Hockey") ) emoji += "🏒 ";
				if ( genreStr.includes("Country") ) emoji += "🪕 ";
				if ( genreStr.includes("Rock") ) emoji += "🎸 ";
				if ( genreStr.includes("Jazz") ) emoji += "🎺 ";
				if ( genreStr.includes("R&B") ) emoji += "🎷 ";
				if ( genreStr.includes("HipHop") ) emoji += "🎤 ";
				if ( genreStr.includes("Comedy") ) emoji += "🎤 ";
				if ( genreStr.includes("Motorsports") ) emoji += "🏎 ";
				//subtitle += "&nbsp;&nbsp;&nbsp;"
				subtitle += emoji;
				subtitle += "<span class='accent'>";
				subtitle += genreStr;
				subtitle += "</span>";
			}
			if ( !empty(when) ) {
				//var jDate = new Date(when);
				//var dateStr = day_time ( jDate );
				if ( !empty(subtitle) ) subtitle += " - ";
				subtitle += jdate ( when, day_time );
			}
			if ( !empty(venueStr) ) {
				subtitle += " @ " + venueStr;
			}
			result += make_card ( cPostType.TICKETS, null, title, subtitle, desc, link, imageURL );
			break;
		} else break;
 	}
 	return result;
}

function localBusiness()
{
	var result = "";
	if ( empty(gData.biz) ) return "-missing business data-";
	var bizList = gData.biz.businesses;
	if ( empty(bizList) ) return "-bad business list-";
	for ( var idx = 0; idx < bizList.length; idx++ ) {
		var rec = bizList[idx];
		if ( !empty(rec) ) {
			var title = rec['name'];
			var imageURL = rec['image_url'];
			var link = rec['url'];
			var mapLink = link;
			var location = rec['location'];
			var genres = rec['categories'];
			var rating = parseFloat ( rec['rating'] );
			var rateStr = "<b>Rating: ";
			var subtitle = "";
			var catStr = "";
			if ( gSkip.includes(rec['alias']) ) {
				if ( sShowSkips ) console.log ( "Skipping " + title );
				continue;
			}
			if ( !empty(rec['shown']) && rec['shown'] >= sShownGeneration ) {
				//console.log ( "Skipping " + title );
				continue;
			}
			if ( gLinksShown.includes(link) ) {
				//console.log ( "Duplicate: " + title );
				continue;
			}
			//console.log ( "Adding Business " + title );
			bizList[idx]['shown'] = sShownGeneration;
			gLinksShown.push ( link );
			if ( rating >= 4.0 ) {
				rateStr += "<span style='color:darkgreen'>";
			} else if ( rating > 2.5 ) {
				rateStr += "<span style='color:#070d0f'>";
			} else {
				rateStr += "<span class='accent'>";
			}
			rateStr += rating + "</span></b>";
			subtitle += rateStr;
			if ( !empty(genres) ) {
				for ( var idx = 0; idx < genres.length; idx++ ) {
					var cat = genres[idx];
					if ( !empty(cat) ) {
						//if ( empty(catStr) ) {
						//	catStr += "<span style='font-size:-2;'>";
						//}
						if ( !empty(catStr) ) {
							catStr += "&nbsp;&nbsp;|&nbsp;&nbsp;";
						}
						catStr += cat.title;
					}
				}
				if ( !empty(catStr) ) {
					catStr += "<br/>";
					subtitle += "<br/>" + catStr;
				}
			}
			if ( !empty(location) ) {
				/*
				address += location.address1;
				address += " " + location.city + ", " + location.state;
				address += "  " + location.
				*/
				if ( !empty(catStr) ) {
					//subtitle += "<br/>";
				}
				if ( !empty(location.display_address) ) {
					var addr = location.display_address;
					var addy = encodeURIComponent ( addr );
					mapLink = `https://maps.google.com?q=${addy}`;
					subtitle += `<span class='accent' onclick='gotoURL("${mapLink}","_map");'>${addr}</span>`;
				}
			}
			title = "<span class='accent'>🌮 Local Biz: </span>" + title;
			var postRec = {
				'postID': 0,
				'parentID': 0,
				'title': title,
				'subtitle': subtitle,
				'body': null,
				'link': rec.url,
				'mapLink': link,
				'caption': null,
				'source': null,
				'imageURL': imageURL,
				'imageDataIdx': null,
			}
			result += make_full_card ( cPostType.BIZ, null, postRec, STANDARD );
			//result += make_card ( cPostType.BIZ, null, title, subtitle, null, link, imageURL );
			break;
		} else break;
 	}

 	return result;
}

function randomJoke()
{
	var result = "";
	if ( empty(gData.jokes) ) return "-missing ticket event data-";
	var jokeList = gData.jokes.results;
	if ( empty(jokeList) ) return "-bad ticket list-";
	for ( var idx = 0; idx < jokeList.length; idx++ ) {
		var rec = jokeList[idx];
		if ( !empty(rec) ) {
			var title = "🤪 Here's a Joke...";
			var subtitle = rec['title'] + "....<br/>";
			if ( !empty(rec['shown']) && rec['shown'] >= sShownGeneration ) {
				//console.log ( "Skipping " + title );
				continue;
			}
			jokeList[idx]['shown'] = sShownGeneration;
			subtitle += "&nbsp;&nbsp;&nbsp;&nbsp;..." + rec['body'];
			
			result += make_card ( cPostType.JOKE, null, title, subtitle, "<br/><br/>", null, null );
			break;
		} else break;
	}
	return result;
}


/*

fun, but not mission-critical

Make this a "feed" which fetches all 2300 of them,
gets the meta tags, and caches the url's in the DB


<meta property="og:title" content="Wish Interpretation">
<meta property="og:url" content="https://xkcd.com/2741/">
<meta property="og:image" content="https://imgs.xkcd.com/comics/wish_interpretation_2x.png">
<meta name="twitter:card" content="summary_large_image">

function randomXKCD()
{
	var result = "";
	var rnd = Math.floor(Math.random() * 2300);
	var title = "🤪 XKCD...";
	var subtitle = rec['title'] + "....<br/>";
			if ( !empty(rec['shown']) && rec['shown'] >= sShownGeneration ) {
				//console.log ( "Skipping " + title );
				continue;
			}
			jokeList[idx]['shown'] = sShownGeneration;
			subtitle += "&nbsp;&nbsp;&nbsp;&nbsp;..." + rec['body'];
			
			result += make_card ( cPostType.JOKE, null, title, subtitle, "<br/><br/>", null, null );
			break;
		} else break;
	}
	return result;
}
*/

