
/*
 * 8/29/2023
 *
 * advertising.js
 *
 * Advertising functions for ZIPit
 */

// --------------------------------- functions ------------------------------

function generateAd ( personOfInterest=0, groupOfInterest=0 )
{
	var result = "";
	if ( empty(gData.ads) ) return missingDataCard ( "Ads" );
	var adList = gData.ads.list;
	//if ( empty(adList) ) return missingDataCard ( "Ads" );

	for ( var idx = 0; idx < adList.length; idx++ ) {
		var rec = adList[idx];
		if ( !empty(rec) ) {
			var when = rec['creation'];
			var posterID = rec['authorID'];
			var posterName = rec['authorName'];
			var posterZip = rec['authorZip'];
			var posterHeadline = rec['authorHeadline'];
			var poster = { 'posterID':posterID, 'name':posterName, 'zip':posterZip, 'headline':posterHeadline };

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
				var dateStr = "";
				var jDate = new Date(when);
				if ( empty(jDate) ) {
					when = when.replace ( ' ', 'T' );	// try ISO date
					jDate = new Date(when);
				}
				if ( !empty(jDate) ) {
					dateStr = day_time ( jDate );
				}
				subtitle = dateStr;
			}
			adList[idx]['shown'] = sShownGeneration;

			result += make_full_card ( cPostType.AD, poster, rec /*postRec*/, STANDARD );

			break;

		}
 	}
 	return result;
}

function gptPost ( existingPost=0 )
{
	var result = "";
	if ( empty(gData.gpt) ) return missingDataCard ( "GPT" );
	var genList = gData.gpt;
	if ( empty(genList) ) return missingDataCard ( "GPT" );

	for ( var idx = 0; idx < genList.length; idx++ ) {
		var rec = genList[idx];
		if ( !empty(rec) ) {
			var when = rec['creation'];
			var posterID = rec['authorID'];
			var posterName = rec['authorName'];
			var poster = { 'posterID':posterID, 'name': posterName };

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
				var dateStr = "";
				var jDate = new Date(when);
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

function sampleSmallCardGenerator ( title="", subtitle="" )
{
	var result = "";
	var postTitle = `${title}`;
	var postSubtitle = null;
	var when = null;
	var link = `/`; // `https://${gServer}`;
	
	//if ( empty(postTitle) ) postTitle = `Back to Main Feed`;
	if ( !empty(subtitle) ) postSubtitle = `<span class='darkred'>${subtitle}</span>`;
	var postRec = {
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

