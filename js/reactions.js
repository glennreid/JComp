
/*
 * 2/12/2023
 *
 * reactions.js
 *
 * Support functions for ZIPit cards
 */

function reaction_state ( post, type )
{
	var reactions = post.reactions;
	var state = 0;
	var field = '';
	if ( empty(reactions) ) {
		post.reactions = reactions = [ ];
	}
	switch ( type ) {
		case cReactions.LIKED:		field = 'likedByMe';	break;
		case cReactions.DISLIKED:	field = 'likedByMe';	break;
		case cReactions.LOVED:		field = 'lovedByMe';	break;
		case cReactions.UNLOVED:	field = 'lovedByMe';	break;
		case cReactions.LOATHED:	field = 'loathedByMe';	break;
		case cReactions.UNLOATHED:	field = 'loathedByMe';	break;
	}

	if ( !empty(reactions[field]) ) {
		state = reactions[field];
	}
	return state;
}

function toggle ( post, type )
{
	var reactions = post.reactions;
	var state = 0;
	var field = '';

	if ( empty(reactions) ) {
		post.reactions = reactions = [ ];
	}

	switch ( type ) {
		case cReactions.LIKED:		field = 'likedByMe';	break;
		case cReactions.DISLIKED:	field = 'likedByMe';	break;
		case cReactions.LOVED:		field = 'lovedByMe';	break;
		case cReactions.UNLOVED:	field = 'lovedByMe';	break;
		case cReactions.LOATHED:	field = 'loathedByMe';	break;
		case cReactions.UNLOATHED:	field = 'loathedByMe';	break;
	}

	state = reactions[field];
	if ( empty(state) ) state = -1;
	state *= -1;	// flip it
	post.reactions[field] = state;
	
	return state;
}

function updateScore ( post, type )
{
	var postID = post.postID
	var scoreJQ = $("#score-" + postID);
	var votesJQ = $("#votes-" + postID);
	var voteStr = votesJQ.html();		// " (14 votes)" or ""
	var score = parseFloat ( scoreJQ.html() );
	var votes = extractNum ( voteStr );
	var delta = 0;
	var voteLimit = 1;
	var plural = "s";
	var reactions = post.reactions;

	if ( empty(reactions) ) { post.reactions = reactions = [ ]; }

	if ( empty(score) ) score = 0;
	if ( empty(votes) ) votes = 0;
	
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
	score += delta;
	scoreJQ.html ( "" + score );

	votes++;
	if ( votes == 1 ) plural = "";
	voteStr = ` (${votes} vote${plural})`;
	votesJQ.html ( voteStr );
	// update Reactors
	var html = buildReactors ( postID, reactions );
	$(`#reactors-${postID}`).html ( html );
}

function clickReaction ( type, postID )
{
	var authorID = 0;
	var post = findPost ( postID );
	var okay = 1;

	if ( !empty(post) ) {
		var reactions = post.reactions;
		if ( empty(reactions) ) { post.reactions = reactions = [ ]; }
		authorID = post.authorID;

		if ( type == cReactions.LIKED || type == cReactions.LOVED ) {
			if ( reactions.likedByMe == "1" )		okay = 0;	// already liked
			post.reactions.likedByMe = 1;
		}
		if ( type == cReactions.DISLIKED || type == cReactions.LOATHED ) {
			if ( reactions.likedByMe == "-1" )		okay = 0;	// already disliked
			post.reactions.likedByMe = -1;
		}
		if ( type == cReactions.UNLOVED || type == cReactions.LOVED ) {
			var state = toggle ( post, type );
			if ( state > 0 ) {
				$(`#b_love-${postID}`).html ( cEmoji[cReactions.LOVED] );
			} else {
				$(`#b_love-${postID}`).html ( cEmoji[cReactions.UNLOVED] );
			}
		}
		if ( type == cReactions.UNLOATHED || type == cReactions.LOATHED ) {
			var state = toggle ( post, type );
			if ( state > 0 ) {
				$(`#b_loathe-${postID}`).html ( cEmoji[cReactions.LOATHED] );
			} else {
				$(`#b_loathe-${postID}`).html ( cEmoji[cReactions.UNLOATHED] );
			}
		}
		if ( okay ) {
			var rec = {	// quick-and-dirty rec inserted locally into the list for immediate feedback
				'postID':postID, 'userID':gUID, 'reactID':999, 'title':"", 'type':type, 'ip':0,
			}
			post.reactions.push ( rec );
			updateScore ( post, type );
			sendReactionToServer ( postID, authorID, type );
			updateSocialUI ( gPageType, type, postID );
		} else {
			$("#votes-" + postID).html ( "vote 🤡" );
		}
	}
}
