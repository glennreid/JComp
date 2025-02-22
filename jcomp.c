//
//  main.c
//  JComp
//
//  Created by Glenn Reid on 2/21/25.
//

#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include <stdlib.h>
#include <unistd.h>
#define _XOPEN_SOURCE 500
#define _XOPEN_SOURCE_EXTENDED 1
#define _LARGE_TIME_API
#define __USE_XOPEN_EXTENDED 1
#include <ftw.h>

char *g_funcs[1024];
char *g_idents[4096];
int idx_f = 0, idx_i = 0;

short commentPlan = 1;		// 0 = keep, 1 = elide, 2 = drop
short lineNumbers = 0;

#define DIRECTORY FTW_D
typedef struct FTW *sftwptr;
typedef int IterateProcPtr (const char *filename, const struct stat *statptr, int fileflags, struct FTW *pfwt);

// function prototypes
short is_reserved ( char *word );
int find_functions_and_globals ( const char *infile, FILE *fd_in );
int process_js ( const char *infile, FILE *fd_in, FILE *fd_out );
int process_html ( const char *infile, FILE *fd_in, FILE *fd_out );
unsigned long MMDoForAllFilesIn ( const char *directory, IterateProcPtr apply_proc );
short MMFilePathExists ( const char *path );
short MMCopyFile ( const char *source, const char *dest );
char *MMFileExtension ( const char *path );
short exclude_file ( char *fpath, struct FTW *ftwbuf );
int get_globals_in_file ( const char *infile, const struct stat *sb, int tflag, struct FTW *ftwbuf );
int process_file ( const char *infile, const struct stat *sb, int tflag, struct FTW *ftwbuf );

char *gSkipFiles[] = {
	"jcomp.c", "jquery", "jQueryRotate", "validate.js", "image-resize",
	NULL
};
char *gReserved[] = {
	"function", "if", "else", "for", "while", "return", "switch", "case", "break", "continue", "in", "of",
	"var", "let", "const", "true", "false",
	"isNaN", "Object", "Date", "Math", "atob", "btoa", "parseInt", "parseFloat", "encodeURI", "JSON",
	"window", "document", "self", "this",
	"typeof", "undefined", "null", "NULL",
	"script", "/script", "<script>", "</script>", "type", "src", "ref",
	"<?php", "empty", "foreach", "echo", "include",
	"n", "nvar",
	NULL
};

int main ( int argc, const char * argv[] ) {
	int result = 0;
	//char *infile = (char *)argv[1];
	//char *ext = "";
    char cwd[1024];

    getcwd(cwd, sizeof(cwd));
    if ( !strcmp(cwd, "/Users/glenn/CODE/JComp/Build/Products/Debug") ) {
		chdir ( "../../../JComp" );
	}
	getcwd(cwd, sizeof(cwd));
	printf("Working dir: %s\n", cwd);
	// two-pass algorithm:
	MMDoForAllFilesIn ( ".", get_globals_in_file );
	printf ( "%d functions\n", idx_f );
	MMDoForAllFilesIn ( ".", process_file );
	printf ( "%d identifiers\n", idx_i );

	return result;
}

short is_reserved ( char *word )
{
	short res = 0;
	int idx = 0;
	for ( idx = 0; ; idx++ ) {
		char *cand = gReserved[idx];
		if ( cand == NULL ) break;
		if ( !strcmp(word, cand) ) {
			res = 1; break;
		}
	}
	return res;
}

int known_func ( char *name )
{
	int idx = 0, found = -1;

	for ( idx = 0; idx < idx_f; idx++ ) {
		if ( !strcmp(g_funcs[idx], name) ) {
			found = idx; break;
		}
	}
	return found;
}

int register_func ( char *name )
{
	int idx = 0, found = known_func ( name );
	int len = 0;

	if ( found == -1 && name ) {
		len = (int)strlen ( name );
		if ( len < 100 ) {
			char *save = (char *)malloc ( len + 1 );
			strcpy ( save, name );
			g_funcs[idx_f] = save;
			found = idx_f++;
		} else {
			fprintf ( stderr, "MALLOC > 100 error\n" );
			exit ( -1 );
		}
	} else {
		short bp = 1;
	}
	return found;
}

int known_ident ( char *name )
{
	int idx = 0, found = -1;
	int len = 0;
	if ( name ) {
		len = (int)strlen ( name );
		for ( idx = 0; idx < idx_i; idx++ ) {
			if ( !strcmp(g_idents[idx], name) ) {
				found = idx; break;
			}
		}
	}
	return found;
}

int register_ident ( char *name )
{
	int idx = 0, found = known_ident ( name );
	int len = 0;
	if ( name ) {
		len = (int)strlen ( name );
		for ( idx = 0; idx < idx_i; idx++ ) {
			if ( !strcmp(g_idents[idx], name) ) {
				found = idx; break;
			}
		}
	}
	if ( found == -1 ) {
		if ( len < 100 ) {
			char *save = (char *)malloc ( len + 1 );
			strcpy ( save, name );
			g_idents[idx_i] = save;
			found = idx_i++;
		} else {
			short bp = 1;
			fprintf ( stderr, "MALLOC > 100 error\n" );
			exit ( -1 );
		}
	}
	return found;
}

short legal ( char ch )			// other chars allowed in identifiers, like _ and -
{
	short okay = 0;
	switch ( ch ) {
		case '_': case '-':
			okay = 1; break;
		default: break;
	}
	return okay;
}

short check_alpha ( int idx, char ch, char last, short in_str, short in_js, short in_php )
{
	short alpha = 0;
	if ( idx == 0 ) {
		if ( isalpha(ch) ) alpha = 1;	// first char must be pure alpha
		if ( ch == '<' ) // && !in_js )
			alpha = 1;
		if ( ch == '$' && in_php ) // php $vars
			alpha = 1;
	} else {
		if ( ch == '>' )
			alpha = 1;
		if ( last == '<' && ch == '/' && in_js )	// </script>
			alpha = 1;
		if ( last == '<' && ch == '?' )				// <?php
			alpha = 1;
		if ( last == '<' && ch == '!' )				// <!
			alpha = 1;
		if ( isalnum(ch) || legal(ch) ) alpha = 1;	// subsequent chars can be alphanumeric
	}
	return alpha;
}

int find_functions_and_globals ( const char *infile, FILE *fd_in )
{
	int result = 0;
	char ch = '\0', last = '\0';
	FILE *fd = NULL;
	char token[1024], line[1024];
	int count_ch=0, count_lines=1, count_com=0;
	int func_idx=0;
	int idx=0, cdx=0, lineCount = 1;
    short verbose = 0;
	short in_js=0, in_php=0, in_com=0, ctype=0, in_str=0, stype=0, ftoke=0, slash=0, saw_dot=0;
	short trigger = 0;

	char *ext = MMFileExtension(infile);
	if ( !strcmp(ext, "shtml") ) {
		verbose = 0;
		printf ( "%s\n", infile );
	}
	while ( (ch = fgetc(fd_in)) != EOF ) {
		short alpha = 0, end_com = 0, end_str = 0;
		count_ch++;
		if ( cdx <= 1022 ) {
			line[cdx++] = ch; line[cdx] = '\0';
		} else {
			short bp = 1;
		}
		/* if ( !strcmp(infile,"./js/youtube.js") && ((lineCount == 88 || lineCount == 90) && ch == '(') ) {
			debug if ( ftoke ) { char *last = g_funcs[idx_f-1]; short bp = 1; }
		} */
		switch ( ch ) {
			case '\r': case '\n': 										count_lines++; cdx = 0; break;
			case '{': case '}': case '(': case ')': case '[': case ']':
			case ';': case ':':
				if ( idx == 0 ) ftoke = 0;
				break;
		}
		if ( !in_php ) {
			if ( !strncmp(token, "<?php", 5) ) {
				in_php = 1;
			}
		} else {
			if ( !strncmp(token, "?>", 2) ) {
				in_php = 0;
			}
		}
		if ( !in_js ) {
			if ( !strncmp(token, "<script", 7) ) {
				in_js = 1;
			}
		} else {
			if ( !strncmp(token, "</script", 8) ) {
				in_js = 0;
			}
		}
		if ( in_js ) {
			if ( in_com ) {
				if ( ch == '/' && last == '*' && ctype == 2 ) { in_com = 0; end_com = 1; } /* end */
				if ( ch == '\n' && ctype == 1 ) { in_com = 0; end_com = 1; } // end
			} else {
				if ( ch == '/' ) {
					if ( slash ) {
						in_com = 1; ctype = 1; count_com = 0;
						//if ( commentPlan < 2 ) printf ( "/%c", ch );
						slash = 0;
					} else { slash = 1; }
				} else if ( ch == '*' && slash ) {
					in_com = 1; ctype = 2; count_com = 0;
					//if ( commentPlan < 2 ) printf ( "/%c", ch );
					slash = 0;
				} else { slash = 0; }
			}
			if ( in_str ) {
				if ( ch == '"' && stype == 1 && last != '\\' ) { in_str = 0; end_str = 1; } // end "
				if ( ch == '\'' && stype == 2 && last != '\\' ) { in_str = 0; end_str = 1; } // end '
				if ( ch == '`' && stype == 3 && last != '\\' ) { in_str = 0; end_str = 1; } // end `
			} else {
				if ( ch == '"' && !in_com ) { in_str = 1; stype = 1; } 	// begin "
				if ( ch == '\'' && !in_com ) { in_str = 1; stype = 2; } // begin '
				if ( ch == '`' && !in_com ) { in_str = 1; stype = 3; }  // begin `
			}
			if ( in_com || in_str ) {
				last = ch;
				if ( in_com && commentPlan > 0 ) count_com++;
				continue;
			}
			if ( end_com || end_str ) {
				last = ch;
				if ( end_com ) {
					if ( commentPlan == 1 ) {
						//printf ( " %d elided", count_com );
						//if ( ctype == 2 ) printf ( " *" );
					}
					if ( commentPlan < 2 ) {
						//printf ( "%c", ch );
					}
				}
				if ( end_str ) {
					//printf ( "%c", ch );
				}
				continue;
			}
		}
		alpha = check_alpha ( idx, ch, last, in_str, in_js, in_php );
		if ( alpha && last == '.' ) {	// special case for things like str.length
			saw_dot = 1;
		}
		if ( ch == '\n' ) { lineCount++; }
		if ( alpha ) {
			token[idx++] = ch;
		} else if ( idx > 0 ) {				// end of token
			//short reserved = 0;
			token[idx] = '\0';
			if ( !strcmp(token, "function") ) {
				ftoke = 1;
			} else {
				if ( ftoke && strlen(token) > 0 ) {
					func_idx = register_func ( token );
					if ( verbose ) printf ( "\tfunction %d: %s\n", func_idx, token );
				}
				ftoke = 0;
			}
			idx = 0;
			token[0] = '\0';	// clear token
		}
		last = ch;
	}

	return result;
}

int process_js ( const char *infile, FILE *fd_in, FILE *fd_out )
{
	int result = 0;
	int count_ch=0, count_lines=1, count_com=0;
	char ch = '\0', last = '\0';
	char token[1024], line[1024];
	int func_idx=0, ident_idx=0;
	int idx=0, cdx=0;
	short verbose=1, in_com=0, ctype=0, in_str=0, stype=0, ftoke=0, slash=0, saw_dot=0;
	//short idb=0, cdb=0;		// debug flags

	token[0] = '\0';

	while ( (ch = fgetc(fd_in)) != EOF ) {
		short alpha = 0, end_com = 0, end_str = 0;
		count_ch++;
		if ( cdx <= 1022 ) {
			line[cdx++] = ch; line[cdx] = '\0';
		} else {
			short bp = 1;
		}
		if ( cdx == 0 && !in_com && lineNumbers ) { fprintf ( fd_out, "%03d: ", count_lines ); }
		cdx++;
		switch ( ch ) {
			case '\r': case '\n': 										count_lines++; cdx = 0; break;
			case '{': case '}': case '(': case ')': case '[': case ']':
			case ';': case ':':
				if ( idx == 0 ) ftoke = 0;
				break;
		}
		if ( in_com ) {
			if ( ch == '/' && last == '*' && ctype == 2 ) { in_com = 0; end_com = 1; } /* end */
			if ( ch == '\n' && ctype == 1 ) { in_com = 0; end_com = 1; } // end
		} else {
			if ( ch == '/' ) {
				if ( slash ) {
					in_com = 1; ctype = 1; count_com = 0;
					if ( commentPlan < 2 ) fprintf ( fd_out, "/%c", ch );		// out
					slash = 0;
				} else { slash = 1; }
			} else if ( ch == '*' && slash ) {
				in_com = 1; ctype = 2; count_com = 0;
				if ( commentPlan < 2 ) fprintf ( fd_out, "/%c", ch );			// out
				slash = 0;
			} else { slash = 0; }
		}
		if ( in_str ) {
			if ( ch == '"' && stype == 1 && last != '\\' ) { in_str = 0; end_str = 1; } // end "
			if ( ch == '\'' && stype == 2 && last != '\\' ) { in_str = 0; end_str = 1; } // end '
			if ( ch == '`' && stype == 3 && last != '\\' ) { in_str = 0; end_str = 1; } // end `
		} else {
			if ( ch == '"' && !in_com ) { in_str = 1; stype = 1; } 	// begin "
			if ( ch == '\'' && !in_com ) { in_str = 1; stype = 2; } // begin '
			if ( ch == '`' && !in_com ) { in_str = 1; stype = 3; }  // begin `
		}
		if ( in_com || in_str ) {
			last = ch;
			if ( in_com ) {
				if ( commentPlan > 0 ) {
					count_com++; continue;
				}
				if ( commentPlan < 2 )	fprintf ( fd_out, "%c", ch );
			}
			if ( in_str ) fprintf ( fd_out, "%c", ch );
			continue;
		}
		if ( end_com || end_str ) {
			last = ch;
			if ( end_com ) {
				if ( commentPlan == 1 ) {
					fprintf ( fd_out, " %d elided", count_com );
					if ( ctype == 2 ) fprintf ( fd_out, " *" );
				}
				if ( commentPlan < 2 ) {
					fprintf ( fd_out, "%c", ch );
				}
			}
			if ( end_str ) {
				fprintf ( fd_out, "%c", ch );
			}
			continue;
		}
		alpha = check_alpha ( idx, ch, last, in_str, 0, 0 );
		if ( alpha && last == '.' ) {	// special case for things like str.length
			saw_dot = 1;
		}
		if ( alpha ) {
			token[idx++] = ch;
		} else if ( idx > 0 ) {				// end of token
			short reserved = 0;
			token[idx] = '\0';				// null-terminate
			reserved = is_reserved ( token );
			if ( reserved || saw_dot ) {
				fprintf ( fd_out, "%s", token );
				if ( !strcmp(token, "function") ) ftoke = 1;
			} else {
				if ( strlen(token) > 0 ) {
					if ( ftoke ) {
						//strcpy ( func, token );		// is a function name
						func_idx = register_func ( token );
						//fprintf ( fd_out, "%s[f%d]", token, func_idx );
						fprintf ( fd_out, "%s", token );
					} else {
						//strcpy ( ident, token );	// is an identifier
						func_idx = known_func ( token );
						if ( func_idx >= 0 ) {		// don't rewrite this function name
							fprintf ( fd_out, "%s", token );
						} else {
							ident_idx = register_ident ( token );
							fprintf ( fd_out, "%s_i%d", token, ident_idx );
						}
					}
					//if ( ident_idx > 29 ) break;
				}
				ftoke = 0;
			}
			idx = 0;
		}
		if ( isspace(ch) || !isalnum(ch) ) saw_dot = 0;

		if ( !alpha ) {
			if ( !slash ) fprintf ( fd_out, "%c", ch );
		} else {
			if ( slash ) {
				if ( !in_com && commentPlan < 2 ) fprintf ( fd_out, "/" );
				slash = 0;
			}
		}
		last = ch;
	}

	return result;
}

int process_html ( const char *infile, FILE *fd_in, FILE *fd_out )
{
	int result = 0;
	int count_ch=0, count_lines=1, count_com=0;
	char ch = '\0', last = '\0';
	char token[1024], line[1024];
	int func_idx=0, ident_idx=0;
	int idx=0, cdx=0;
	short in_js=0, in_php=0, in_com=0, ctype=0, in_str=0, stype=0, ftoke=0, slash=0, saw_dot=0;
	short trigger = 0;
	//short idb=0, cdb=0;		// debug flags

	token[0] = '\0';

	while ( (ch = fgetc(fd_in)) != EOF ) {
		short alpha = 0, end_com = 0, end_str = 0;
		count_ch++;
		if ( cdx <= 1022 ) {
			line[cdx++] = ch; line[cdx] = '\0';
		} else {
			short bp = 1;
		}
		if ( cdx == 0 && !in_com && lineNumbers ) { fprintf ( fd_out, "%03d: ", count_lines ); }
		cdx++;
		switch ( ch ) {
			case '\r': case '\n': 										count_lines++; cdx = 0; break;
			case '{': case '}': case '(': case ')': case '[': case ']':
			case ';': case ':':
				if ( idx == 0 ) ftoke = 0;
				break;
		}
		if ( !in_php ) {
			if ( !strncmp(token, "<?php", 5) ) {
				in_php = 1;
			}
		} else {
			if ( !strncmp(token, "?>", 2) ) {
				in_php = 0;
			}
		}
		if ( !in_js ) {
			if ( !strncmp(token, "<script", 7) ) {
				in_js = 1;
			}
		} else {
			if ( !strncmp(token, "</script", 8) ) {
				in_js = 0;
			}
		}
		if ( in_js ) {
			if ( in_com ) {
				if ( ch == '/' && last == '*' && ctype == 2 ) { in_com = 0; end_com = 1; } /* end */
				if ( ch == '\n' && ctype == 1 ) { in_com = 0; end_com = 1; } // end
			} else if ( !in_str ) {
				if ( ch == '/' && last != '<' ) {
					if ( slash ) {
						in_com = 1; ctype = 1; count_com = 0;
						if ( commentPlan < 2 ) fprintf ( fd_out, "/%c", ch );		// out
						slash = 0;
					} else { slash = 1; }
				} else if ( ch == '*' && slash ) {
					in_com = 1; ctype = 2; count_com = 0;
					if ( commentPlan < 2 ) fprintf ( fd_out, "/%c", ch );			// out
					slash = 0;
				} else { slash = 0; }
			}
			if ( in_str ) {
				if ( ch == '"' && stype == 1 && last != '\\' ) { in_str = 0; end_str = 1; } // end "
				if ( ch == '\'' && stype == 2 && last != '\\' ) { in_str = 0; end_str = 1; } // end '
				if ( ch == '`' && stype == 3 && last != '\\' ) { in_str = 0; end_str = 1; } // end `
			} else {
				if ( ch == '"' && !in_com ) { in_str = 1; stype = 1; } 	// begin "
				if ( ch == '\'' && !in_com ) { in_str = 1; stype = 2; } // begin '
				if ( ch == '`' && !in_com ) { in_str = 1; stype = 3; }  // begin `
			}
			if ( in_com || in_str ) {
				last = ch;
				if ( in_com ) {
					if ( commentPlan > 0 ) {
						count_com++; continue;
					}
					if ( commentPlan < 2 )	fprintf ( fd_out, "%c", ch );
				}
				if ( in_str ) fprintf ( fd_out, "%c", ch );
				continue;
			}
			if ( end_com || end_str ) {
				last = ch;
				if ( end_com ) {
					if ( commentPlan == 1 ) {
						fprintf ( fd_out, " %d elided", count_com );
						if ( ctype == 2 ) fprintf ( fd_out, " *" );
					}
					if ( commentPlan < 2 ) {
						fprintf ( fd_out, "%c", ch );
					}
				}
				if ( end_str ) {
					fprintf ( fd_out, "%c", ch );
				}
				continue;
			}
		}
		alpha = check_alpha ( idx, ch, last, in_str, in_js, in_php );
		if ( alpha && last == '.' ) {	// special case for things like str.length
			saw_dot = 1;
		}
		if ( alpha ) {
			token[idx++] = ch;
		} else if ( idx > 0 ) {				// end of token
			short reserved = 0;
			token[idx] = '\0';				// null-terminate
			if ( in_js ) {
				reserved = is_reserved ( token );
				if ( reserved || saw_dot ) {
					fprintf ( fd_out, "%s", token );
					if ( !strcmp(token, "function") ) ftoke = 1;
					if ( !strcmp(token, "<script") ) {
						short bp = 1;		// should never get here, if in_js is true
					}
				} else {
					if ( strlen(token) > 0 ) {
						if ( ftoke ) {
							//strcpy ( func, token );		// is a function name
							func_idx = register_func ( token );
							//fprintf ( fd_out, "%s[f%d]", token, func_idx );
							fprintf ( fd_out, "%s", token );
						} else {
							short rewriteIdent = 1;
							if ( in_php ) {
								if ( token[0] == '$' ) {	// turn off identifier rewrite in PHP vars
									rewriteIdent = 0;
								}
							}
							if ( known_func(token) >= 0 ) {
								rewriteIdent = 0;
							}
							if ( rewriteIdent ) {
								ident_idx = register_ident ( token );
								fprintf ( fd_out, "%s_i%d", token, ident_idx );
							} else {
								fprintf ( fd_out, "%s", token );
							}
						}
						//if ( ident_idx > 29 ) break;
					}
					ftoke = 0;
				}
			} else {
				fprintf ( fd_out, "%s", token );
			}
			idx = 0;
			//if ( !isspace(ch) ) {		// end of one token is not a space, likely <
			if ( ch == '<' ) {			// end of one token is not a space, likely <
				token[idx++] = ch;
			}
		}
		if ( isspace(ch) || !isalnum(ch) ) saw_dot = 0;

		if ( !alpha ) {
			if ( !slash ) {
				if ( idx == 1 && ch == '<' ) {
					// fprintf ( fd_out, "\n%c\n", ch );
				} else {
					fprintf ( fd_out, "%c", ch );
				}
			}
		} else {
			if ( slash ) {
				if ( !in_com && commentPlan < 2 ) fprintf ( fd_out, "/" );
				slash = 0;
			}
		}
		last = ch;
	}
	return result;
}

#define MAX_DEPTH 32

typedef int (*NFTWProcPtr)(const char *, const struct stat *, int, struct FTW *);

unsigned long MMDoForAllFilesIn ( const char *directory, IterateProcPtr apply_proc )
{
	int result = 0;
	//short reallyDelete = 0;
	short viewFiles = 1;
	int flags = FTW_PHYS | FTW_DEPTH;		// do not follow symbolic links; depth-first traversal

	if ( MMFilePathExists(directory) ) {
		// traverse the file tree and call apply_proc
		if ( viewFiles ) {
			result = nftw ( directory, (NFTWProcPtr)apply_proc, 1, flags );
			if ( result == -1) {
				perror("nftw");
				return 0;
			}
		}
		result = 0;
	} else {
		fprintf ( stderr, "MMDoForAllFilesIn: can't find %s", directory );
	}

	return result;
}

short MMFilePathExists ( const char *path )
{
	struct stat file_stat;
	short exists = 0;
	int result = stat ( path, &file_stat );

	if ( result == 0 ) {
		exists = 1;
		if ( file_stat.st_size > 0 ) {
			// and it has non-zero length, which we don't care about in this app
		}
	}
	return exists;
}

short MMCopyFile ( const char *source, const char *dest )
{
	struct stat file_stat;
	short exists = 0;
	int result = stat ( source, &file_stat );

	if ( result == 0 ) {
		char cmd[1024];
		sprintf ( cmd, "cp -p %s %s", source, dest );
		system ( cmd );
	}
	return exists;
}

char *MMFileExtension ( const char *path )
{
	char *start = (char *)path, *end = NULL, *dot = NULL;
	if ( !path ) return (char *)path;
	// start at the end and look backward, don't go past the beginning of the path!
	end = (char *)path + strlen(path) - 1;
	dot = end;
	start = (char *)path;
	while ( dot && dot >= start ) {
		if ( *dot == '/' ) { start = end + 1; break; }
		if ( *dot == '.' ) { start = dot + 1; break; }
		dot--;
	}
	return start;
}

char *ext_pointer ( char *tmpfile )
{
	int len = (int)strlen ( tmpfile );
	char *dot = tmpfile + len - 1;
	while ( dot >= tmpfile ) {
		if ( *dot == '.' ) break;
		dot--;
	}
	if ( dot <= tmpfile ) dot = NULL;
	return dot;
}

void ensure_bakfile ( const char *fpath, char *ext, char *bakfile )
{
	if ( bakfile ) {
		strcpy ( bakfile, fpath );
		char *dot = ext_pointer ( bakfile );
		if ( dot ) {
			*dot = '\0';	// chop extension
			strcat ( bakfile, ".BAK." );
			strcat ( bakfile, ext );
		}
		if ( !MMFilePathExists(bakfile) ) {
			MMCopyFile( fpath, bakfile );
		}
	}
}


short exclude_file ( char *fpath, struct FTW *ftwbuf )
{
	char *filename = fpath + ftwbuf->base;
	char *ext = NULL;
	short exclude = 0;
	int idx = 0;
	short good_ext = 0;
	ext = MMFileExtension ( fpath );
	if ( strstr(fpath, ".BAK") ) return 1;
	if ( !strcmp(ext,"html") || !strcmp(ext,"shtml") ) good_ext = 1;
	if ( !strcmp(ext,"js") ) good_ext = 1;
	if ( !good_ext )
		exclude = 1;

	for ( idx = 0; ; idx++ ) {
		char *cand = gSkipFiles[idx];
		if ( cand == NULL ) break;
		if ( !strncmp(filename, cand, strlen(cand)) ) {
			exclude = 1; break;
		}
	}
	return exclude;
}


int get_globals_in_file ( const char *fpath, const struct stat *sb, int tflag, struct FTW *ftwbuf )
{
    #pragma unused ( sb )
	FILE *fd_in = NULL, *fd_out = NULL;
	char *infile = NULL, *ext = NULL;
	char bakfile[1024];
	short verbose = 0;

	if ( tflag == DIRECTORY )  return 0;

	if ( exclude_file(fpath, ftwbuf) ) {
		if ( verbose ) printf ( "EXCLUDE %s\n", fpath );
		return 0;
	}
	ext = MMFileExtension ( fpath );
		strcpy ( bakfile, fpath );
		char *dot = ext_pointer ( bakfile );
		if ( dot ) {
			*dot = '\0';	// chop extension
			strcat ( bakfile, ".BAK." );
			strcat ( bakfile, ext );
		}
		if ( !MMFilePathExists(bakfile) ) {
			MMCopyFile( fpath, bakfile );
		}
	infile = bakfile;

	fd_in = fopen ( fpath, "r" );
	if ( !fd_in ) { printf ( "Cannot read %s\n", fpath ); return -1; }

	find_functions_and_globals ( infile, fd_in );

	if ( fd_in  && fd_in  != stdin )  fclose ( fd_in );

	return 0;           /* To tell nftw() to continue */
}

int process_file ( const char *fpath, const struct stat *sb, int tflag, struct FTW *ftwbuf )
{
    #pragma unused ( sb )
	//char *filename = fpath + ftwbuf->base;

	FILE *fd_in = NULL, *fd_out = NULL;
	char bakfile[1024];
	char *infile = NULL, *outfile = NULL;
	char *ext = NULL;
	int len = 0;
	short verbose=1, use_stdout = 0;

	if ( tflag == DIRECTORY )  return 0;

	if ( exclude_file(fpath, ftwbuf) ) {
		if ( verbose ) printf ( "EXCLUDE %s\n", fpath );
		return 0;
	}
	ext = MMFileExtension ( fpath );
	if ( !ext || strlen(ext) == 0 ) {
		if ( verbose ) printf ( "EXCLUDE %s\n", fpath );
		return 0;
	}
		strcpy ( bakfile, fpath );
		char *dot = ext_pointer ( bakfile );
		if ( dot ) {
			*dot = '\0';	// chop extension
			strcat ( bakfile, ".BAK." );
			strcat ( bakfile, ext );
		}
		if ( !MMFilePathExists(bakfile) ) {
			MMCopyFile( fpath, bakfile );
		}
	infile = bakfile;
	outfile = fpath;
	fd_in = fopen ( infile, "r" );
	if ( !fd_in ) {
		printf ( "Cannot read %s\n", infile ); return -1; }

	//if ( !strcmp(ext,"html") || !strcmp(ext,"shtml") ) use_stdout = 1;

	if ( use_stdout ) {
		fd_out = stdout;
	} else {
		fd_out = fopen ( outfile, "w" );
		if ( !fd_out ) { printf ( "Cannot write %s\n", outfile ); return -1; }
	}

	if ( !strcmp(ext,"html") || !strcmp(ext,"shtml") ) {
		printf ( "HTML FILE: %s\n", infile );
		process_html ( infile, fd_in, fd_out );
	}
	if ( !strcmp(ext,"js") ) {
		if ( verbose ) printf ( "JS FILE: %s\n", infile );
		process_js ( infile, fd_in, fd_out );
	}
	if ( fd_in  && fd_in  != stdin )  fclose ( fd_in );
	if ( fd_out && fd_out != stdout ) fclose ( fd_out );

	return 0;           /* To tell nftw() to continue */
}

