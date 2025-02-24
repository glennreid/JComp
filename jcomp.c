//
//  main.c
//  JComp
//
//  Created by Glenn Reid on 2/21/25.
//
//  Compile: gcc -o jcomp jcomp.c'
//  Usage:   jcomp [-v] [-n]numerlines [-t]ight [-l]oose [-w]arn [-q]uiet [-d]ata [-c]omments
//
//  jcomp -c 0		// comments are preserved
//  jcomp -c 1		// comments are elided but visible
//  jcomp -c 2		// comments are removed
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

#define EXCLUDE 0
#define ALLOW   1
#define MAX_FUNCTIONS 1024
#define MAX_IDENTS (4096 * 2)
#define MAX_LINE 2048

char *g_funcs[MAX_FUNCTIONS];
char *g_idents[MAX_IDENTS];
int idx_f = 0, idx_i = 0;
char *g_currfile = NULL;

// g_pref
struct {
	short lineNums;		// emit line numbers at the beginning of every line (mostly for debugging)
	short commentPlan;	// 0 = keep, 1 = elide, 2 = eliminate [default 1]
	short parseTicks;	// not even sure what this does anymore
	short verbose;		// tempted to write a really long comment here to describe what verbose means
	short tight;		// make identifiers and function names 1 char vs full original identigier
	short warn;			// emit warnings on stderr [default 1]
	short data;			// write out identifiers.txt and functions.txt
} g_pref = { 0, 1, 0, 0, 1, 1, 0 };

// g_count
struct { int js; int html; int php; int skip; } g_count = { 0, 0, 0, 0 };

#define DIRECTORY FTW_D
typedef struct FTW *sftwptr;
typedef int IterateProcPtr (const char *filename, const struct stat *statptr, int fileflags, struct FTW *pfwt);

// function prototypes
void save_data ( char **list, int count, char *filename );
short is_reserved ( char *word );
int known_func ( char *name );
int register_func ( char *name );
int known_ident ( char *name );
int register_ident ( char *name );
int find_functions ( const char *infile, FILE *fd_in );
int rewrite_file ( const char *infile, FILE *fd_in, FILE *fd_out );
unsigned long MMDoForAllFilesIn ( const char *directory, IterateProcPtr apply_proc );
short MMFilePathExists ( const char *path );
short MMCopyFile ( const char *source, const char *dest );
char *MMFileExtension ( const char *path );
short good_file ( const char *fpath, struct FTW *ftwbuf );
int get_globals_in_file ( const char *infile, const struct stat *sb, int tflag, struct FTW *ftwbuf );
int process_file ( const char *infile, const struct stat *sb, int tflag, struct FTW *ftwbuf );

char *g_skip_files[] = {
	"jcomp.c", "jquery", "jQueryRotate", "validate.js", "image-resize",
	NULL
};
char *g_allow_files[] = {
	"main_setup.php",
	NULL
};
char *g_reserved[] = { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
	"function", "if", "else", "for", "while", "return", "switch", "case", "break", "continue", "in", "of",
	"var", "let", "const", "true", "false", "new", "typeof", "undefined", "null", "NULL", "NaN",
	"eval", "decodeURI", "decodeURIComponent", "encodeURI", "encodeURIComponent", "escape", "unescape",
	"isNaN", "Object", "Date", "Number", "BigInt", "Math", "Temporal", "String", "RegExp",
	"Array", "Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array", "Int32Array",
	"Uint32Array", "BigInt64Array", "BigUint64Array", "Float16Array", "Float32Array", "Float64Array",
	"Map", "Set", "WeakMap", "WeakSet", "ArrayBuffer", "SharedArrayBuffer", "DataView", "Atomics", "JSON",
	"WeakRef", "FinalizationRegistry", "Iterator", "AsyncIterator", "Promise", "GeneratorFunction",
	"AsyncGeneratorFunction", "Generator", "AsyncGenerator", "AsyncFunction", "Reflect", "Proxy",
	"Intl", "Intl.Collator", "Intl.DateTimeFormat", "Intl.DisplayNames", "Intl.DurationFormat", "Intl.ListFormat",
	"Intl.Locale", "Intl.NumberFormat", "Intl.PluralRules", "Intl.RelativeTimeFormat", "Intl.Segmenter",
	"Function", "Boolean", "Symbol", "Error", "AggregateError", "EvalError", "RangeError", "ReferenceError",
	"SyntaxError", "TypeError", "URIError", "InternalError",
	"window", "document", "self", "this", "success", "error", "console",
	"setTimeout", "clearTimeout", "atob", "btoa", "parseInt", "parseFloat", "encodeURI", "JSON",
	"<", "script", "/script", "<script", "<script>", "</script>", "type", "src", "ref",
	"<?php", "?>", "empty", "foreach", "echo", "include", "PARAM",
	"\n", "n", ";\n", "g", "nvar", "Location", "http", "https",
	"google", "center", "zoom", "disableDefaultUI", "mapTypeId", "AdvancedMarkerElement", "mapInsert",
	"dataType", "url", "textStatus", "errorThrown", "encodeURIComponent",
	"jQuery", "$",
	"cPage", "is_mobile",
	NULL
};

int main ( int argc, const char * argv[] ) {
	int result = 0;
	int idx = 0;
    char cwd[1024];

	// look for command line switches:
	for ( idx = 1; idx < argc; idx++ ) {
		if ( !strcmp(argv[idx], "-v") ) g_pref.verbose = 1;
		if ( !strcmp(argv[idx], "-n") ) g_pref.lineNums = 1;
		if ( !strcmp(argv[idx], "-t") ) g_pref.tight = 1;
		if ( !strcmp(argv[idx], "-l") ) g_pref.tight = 0;
		if ( !strcmp(argv[idx], "-w") ) g_pref.warn = 1;
		if ( !strcmp(argv[idx], "-q") ) g_pref.warn = 0;
		if ( !strcmp(argv[idx], "-d") ) g_pref.data = 1;
		if ( !strcmp(argv[idx], "-c") ) if ( idx+1 < argc ) { sscanf(argv[idx+1], "%hd", &g_pref.commentPlan); }
	}
	// figure out where we are
    getcwd(cwd, sizeof(cwd));
    if ( !strcmp(cwd, "/Users/glenn/CODE/JComp/Build/Products/Debug") ) {
		chdir ( "../../../JComp" );
	}
	getcwd(cwd, sizeof(cwd));
	printf("Working dir: %s\n", cwd);

	// two-pass algorithm:
	MMDoForAllFilesIn ( ".", get_globals_in_file );
	MMDoForAllFilesIn ( ".", process_file );

	// statistics
	if ( g_pref.warn ) {
		printf ( "%d functions\n", idx_f );
		printf ( "%d identifiers\n", idx_i );
		printf ( "%d JS files\n", g_count.js );
		printf ( "%d HTML files\n", g_count.html );
		printf ( "%d PHP files\n", g_count.php );
		printf ( "%d Skipped files\n", g_count.skip );
	}
	//if ( known_ident("cPage") ) printf ("known cPage\n" );
	if ( g_pref.data ) save_data ( g_funcs, idx_f, "functions.txt" );
	if ( g_pref.data ) save_data ( g_idents, idx_i, "identifiers.txt" );

	return result;
}

void save_data ( char **list, int count, char *filename )
{
	int idx = 0;
	char path[1025];
	sprintf ( path, "./%s", filename );
	FILE *fd = fopen ( path, "w" );
	if ( fd ) {
		for ( idx = 0; idx < idx_f; idx++ ) {
			fprintf ( fd, "%s\n", list[idx] );
		}
		fclose ( fd );
	} else {
		fprintf ( stderr, "Can't open %s", path );
	}
}

short is_reserved ( char *word )
{
	short res = 0;
	int idx = 0;
	for ( idx = 0; ; idx++ ) {
		char *cand = g_reserved[idx];
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
		if ( idx_f >= MAX_FUNCTIONS ) {
			fprintf ( stderr, "MAX_FUNCTIONS[%d], ignoring %s in %s\n", idx_f, name, g_currfile );
			exit ( -1 );
		}
		len = (int)strlen ( name );
		if ( len < 100 ) {
			char *save = (char *)malloc ( len + 1 );
			strcpy ( save, name );
			g_funcs[idx_f] = save;
			found = idx_f++;
		} else {
			fprintf ( stderr, "FUNC MALLOC > 100 error\nfile:%s\n%s", g_currfile, name );
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
		if ( idx_i >= MAX_IDENTS ) {
			fprintf ( stderr, "MAX_IDENTS[%d], ignoring %s in %s\n", idx_i, name, g_currfile );
			exit ( -1 );
		}
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
			fprintf ( stderr, "IDENT MALLOC > 100 error\nfile:%s\n%s", g_currfile, name );
			exit ( -1 );
		}
	}
	return found;
}

short legal ( char ch )			// other chars allowed in identifiers, like _ and -
{
	short okay = 0;
	switch ( ch ) {
		case '_':
			okay = 1; break;
		default: break;
	}
	return okay;
}

short valid_ident ( char *token )
{
	char first = '\0', second = '\0';
	short valid = 1;
	if ( strstr(token, "0-9") ) {
		short bp = 1;
	}
	if ( !token ) 							return EXCLUDE;
	first = token[0];
	second = token[1];
	if ( !isalpha(first) ) 					valid = 0;
	if ( first == '$' ) 					valid = 1;
	if ( first == '<' && second == '\0' )	valid = 1;
	if ( strstr(token, "A-Z") )	// regular expressions pass through
			valid = 0;
	return valid;
}

short regex ( char *token )
{
	short is_regex = 0;
	if ( !strncmp(token, "match", 5) ) is_regex = 1;
	if ( !strncmp(token, "replace", 7) ) is_regex = 1;
	return is_regex;
}

short check_alpha ( int idx_tok, char ch, char last, short in_str, short in_js, short in_php )
{
	short alpha = 0;
	if ( idx_tok == 0 ) {
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
	if ( in_php ) {
		if ( ch == '?' ) alpha = 1;					// allow for ?> in PHP
	}
	return alpha;
}

int find_functions ( const char *infile, FILE *fd_in )
{
	int result = 0;
	char ch = '\0', last = '\0';
	char token[1024], line[MAX_LINE];
	int count_ch=0, count_lines=1, count_com=0;
	int func_idx=0;
	int idx=0, cdx=0;
    short verbose = g_pref.verbose;
	short in_js=0, in_php=0, in_com=0, in_str=0;
	short ctype=0, stype=0, ftoke=0, slash=0;

	while ( (ch = fgetc(fd_in)) != EOF ) {
		short alpha = 0, end_com = 0, end_str = 0;
		count_ch++;
		if ( cdx <= 1022 ) { line[cdx] = ch; line[cdx+1] = '\0'; }
		cdx++;
		switch ( ch ) {
			case '\r': case '\n': count_lines++; cdx = 0; break;
			case '{': case '}': case '(': case ')': case '[': case ']':
			case ';': case ':':
				if ( idx == 0 ) ftoke = 0;
				break;
		}
		if ( !in_js ) {
			if ( !strncmp(token, "<script", 7) ) { in_js = 1; }
		} else {
			if ( !strncmp(token, "</script", 8) ) { in_js = 0; }
		}
		if ( !in_php ) {
			if ( !strncmp(token, "<?php", 5) ) { in_php = 1; }
		} else {
			if ( !strncmp(token, "?>", 2) ) { in_php = 0; }
		}
		if ( in_js ) {
			if ( in_com ) {
				if ( ch == '/' && last == '*' && ctype == 2 ) { in_com = 0; end_com = 1; } /* end */
				if ( ch == '\n' && ctype == 1 ) { in_com = 0; end_com = 1; } // end
			} else if ( !in_str ) {							// ignore slashes inside string bodies
				if ( ch == '/' ) {
					if ( slash ) {
						in_com = 1; ctype = 1; count_com = 0;
						slash = 0;
					} else { slash = 1; }
				} else if ( ch == '*' && slash ) {
					in_com = 1; ctype = 2; count_com = 0;
					slash = 0;
				} else { slash = 0; }
			}
			if ( !in_str ) {
				if ( ch == '"' && !in_com ) { in_str = 1; stype = 1; } 							// begin "
				if ( ch == '\'' && !in_com ) { in_str = 1; stype = 2; } 						// begin '
				if ( ch == '`' && !in_com ) { in_str = 1; stype = 3; }  						// begin `
			} else {
				if ( ch == '"' && stype == 1 && last != '\\' ) { in_str = 0; end_str = 1; } 	// end "
				if ( ch == '\'' && stype == 2 && last != '\\' ) { in_str = 0; end_str = 1; }	// end '
				if ( ch == '`' && stype == 3 && last != '\\' ) { in_str = 0; end_str = 1; } 	// end `
			}
			if ( in_com || in_str ) {
				last = ch;
				if ( in_com && g_pref.commentPlan > 0 ) count_com++;
				continue;
			}
			if ( end_com || end_str ) {
				last = ch;
				continue;
			}
		}
		alpha = check_alpha ( idx, ch, last, in_str, in_js, in_php );
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

int rewrite_file ( const char *infile, FILE *fd_in, FILE *fd_out )
{
	int result = 0;
	int count_ch=0, count_lines=1, count_com=0;
	char ch = '\0', last = '\0';
	char token[MAX_LINE], line[MAX_LINE], string[MAX_LINE];
	int func_idx=0, ident_idx=0;
	int idx=0, cdx=0, sdx=0;
	short in_js=0, in_php=0, in_com=0, in_str=0, in_jvar=0, in_style=0;
	short ctype=0, stype=0, ftoke=0, slash=0, saw_dot=0, suppress=0;
	short debug = 0;

	token[0] = '\0';
	if ( strstr(infile, "setup") ) {	// debug hook for specific file
		debug = 1;
	}
	char *ext = MMFileExtension ( infile );
	if ( !strcmp(ext, "js") ) in_js = 1;

	while ( (ch = fgetc(fd_in)) != EOF ) {
		short alpha = 0, end_com = 0, end_str = 0, end_jvar = 0;
		count_ch++;
		if ( cdx <= MAX_LINE - 2 ) {
			line[cdx] = ch; line[cdx+1] = '\0';
		} else {
			if ( g_pref.warn ) fprintf ( stderr, "WARNING: %s line %d longer than %d chars\n", infile, count_lines, MAX_LINE );
			short bp = 1;
		}
		if ( cdx == 0 && !in_com && g_pref.lineNums ) { fprintf ( fd_out, "%03d: ", count_lines ); }
		cdx++;
		switch ( ch ) {
			case '\r': case '\n':
				count_lines++; cdx = 0;
				if ( stype != 1 ) { in_str = 0; stype = 0; }	// line end terminates string(?)
				in_jvar = 0;
				break;
			case '{': case '}': case '(': case ')': case '[': case ']':
			case ';': case ':':
				if ( idx == 0 ) ftoke = 0;
				break;
		}
		if ( !in_php ) {
			if ( !strncmp(token, "<?php", 5) ) 	in_php = 1;
		} else {
			if ( !strncmp(token, "?>", 2) ) 	in_php = 0;
		}
		if ( !in_js ) {
			if ( !strncmp(token, "<script", 7) ) 	in_js = 1;
		} else {
			if ( !strncmp(token, "</script", 8) ) 	in_js = 0;
		}
		if ( !in_style ) {
			if ( !strncmp(token, "<style", 6) ) 	in_style = 1;
		} else {
			if ( !strncmp(token, "</style>", 7) ) 	in_style = 0;
		}
		if ( in_js ) {
			if ( in_com ) {
				if ( ch == '/' && last == '*' && ctype == 2 ) { in_com = 0; end_com = 1; } /* end */
				if ( ch == '\n' && ctype == 1 ) { in_com = 0; end_com = 1; } 			   // end
			} else if ( !in_str ) { // ignore slashes inside string bodies
				if ( ch == '/' && last != '<' ) {
					if ( slash ) {
						in_com = 1; ctype = 1; count_com = 0;
						if ( g_pref.commentPlan < 2 ) fprintf ( fd_out, "%c", ch );		// out
						slash = 0;
						suppress = 1;
					} else { slash = 1; }
				} else if ( ch == '*' && slash ) {
					in_com = 1; ctype = 2; count_com = 0;
					if ( g_pref.commentPlan < 2 ) fprintf ( fd_out, "%c", ch );			// out
					slash = 0; // suppress = 1;
				} else { slash = 0; }
			}
			if ( !in_str ) {
				if ( ch == '"' && !in_com ) { in_str = 1; stype = 1; } 							// begin "
				if ( ch == '\'' && !in_com ) { in_str = 1; stype = 2; } 						// begin '
				if ( ch == '`' && !in_com ) { in_str = 1; stype = 3; }  						// begin `
				if ( ch == '/' && regex(token) ) { in_str = 1; stype = 4; }						// begin /regex/
			} else {
				if ( ch == '"' && stype == 1 && last != '\\' ) { in_str = 0; end_str = 1; } 	// end "
				if ( ch == '\'' && stype == 2 && last != '\\' ) { in_str = 0; end_str = 1; }	// end '
				if ( ch == '`' && stype == 3 && last != '\\' ) { in_str = 0; end_str = 1; } 	// end `
				if ( ch == '/' && stype == 4 && last != '\\' ) { in_str = 0; end_str = 1; } 	// end /regex/
				if ( !end_str ) {	// collect the body of the string, for debugging
					if ( sdx <= MAX_LINE - 2 ) {
						string[sdx] = ch; string[sdx+1] = '\0';
					}
				} else { sdx = 0; }
			}
			if ( !in_jvar ) {
				if ( last == '$' && ch == '{' ) { in_jvar = 1; } 	// ${
			} else {
				if ( ch == '}' ) { end_jvar = 1; } 					// ${
			}
			if ( in_com ) {
				if ( g_pref.commentPlan > 0 ) {
					count_com++; suppress = 0;
					last = ch;
					continue;
				}
				if ( g_pref.commentPlan < 2 )	fprintf ( fd_out, "%c", ch );
			}
			if ( in_str ) {
				if ( stype != 3 || !in_jvar ) {
					fprintf ( fd_out, "%c", ch );
					last = ch;
					continue;
				}
				if ( end_jvar ) in_jvar = 0;
				// keep going to parse the inside of `${js strings}`;
			}
			if ( end_com ) {
				last = ch;
				if ( g_pref.commentPlan == 1 ) {
					fprintf ( fd_out, " %d elided", count_com );
					if ( ctype == 2 ) fprintf ( fd_out, " *" );
				}
				if ( g_pref.commentPlan < 2 ) fprintf ( fd_out, "%c", ch );
				continue;
			}
			if ( end_str ) {
				last = ch;
				fprintf ( fd_out, "%c", ch );
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
			if ( strstr(token, "gCurrSection") ) {		// debug on particular token
				char *l = line;
				short bp = 1;
			}
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
						char min[128];
						if ( g_pref.tight ) {
							sprintf ( min, "%c", token[0] );
						} else {
							strcpy ( min, token );
						}
						if ( ftoke ) {
							func_idx = register_func ( token );
							fprintf ( fd_out, "%s_f%d", min, func_idx );
						} else {
							short rewriteIdent = 1;
							short valid = valid_ident ( token );
							func_idx = known_func ( token );
							if ( in_php ) {
								if ( token[0] == '$' ) {	// turn off identifier rewrite in PHP vars
									rewriteIdent = 0;
								}
							}
							if ( func_idx >= 0 ) {
								fprintf ( fd_out, "%s_f%d", min, func_idx );
							} else if ( rewriteIdent ) {
								ident_idx = register_ident ( token );
								fprintf ( fd_out, "%s_i%d", min, ident_idx );
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
			if ( ch == '<' ) {			// The < character is part of tokens in HTML
				token[idx++] = ch;
			}
		}
		if ( isspace(ch) || !isalnum(ch) ) saw_dot = 0;

		if ( !alpha ) {
			if ( !slash && idx == 1 && ch == '<' ) suppress = 1;
			if ( !suppress ) fprintf ( fd_out, "%c", ch );
		} else {
			if ( slash ) {
				if ( !suppress && !in_com && g_pref.commentPlan < 2 ) fprintf ( fd_out, "/" );
				slash = 0;
			}
		}
		suppress = 0;
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
	int flags = FTW_PHYS | FTW_DEPTH;	// do not follow symbolic links; depth-first traversal

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

void MMDeleteFile ( char *filePath )
{
	if ( MMFilePathExists(filePath) ) {
		unlink ( filePath );
	}
}

#define PATH_SEP '/'

char *_nextslash ( char *path )
{
	char *result = path + 1;
	while ( result && *result && *result != PATH_SEP ) {
		result++;
	}
	return result;
}

int MMMakeDir ( char *path, mode_t mode )
{
	int err = 0;
	struct stat statbuff;
	char buffer[4096];
	char *partial = NULL, *end = NULL;
	short last = 0, verbose = g_pref.verbose;

	if ( !path) return -1;
	strcpy ( buffer, path );
	partial = buffer;
	end = _nextslash(partial);
	while ( partial && end ) {
		if ( *end != '/' ) {
			last = 1;
		} else {
			*end = '\0';	// temporarily terminate path at slashes to make intermediate dirs
		}
		if ( stat(buffer, &statbuff) ) {        // does not exist
			err = mkdir(partial, mode);
			if ( stat(partial, &statbuff) ) {
				if ( err < 0 ) {
					fprintf ( stderr, "Can't create %s\n", partial);
					break;
				}
			}
			chmod(partial, mode);
			if ( verbose ) fprintf ( stderr, "MAKE: %s\n", partial);
		} else {
			// if ( verbose ) fprintf ( stderr, "EXISTS: %s\n", partial);
		}
		if ( last ) break;
		*end = PATH_SEP;
		end = _nextslash(end);

	}
	return err;
}


short MMCopyFile ( const char *source, const char *dest )
{
	struct stat file_stat;
	short exists = 0;
	int result = stat ( source, &file_stat );

	if ( result == 0 ) {
		char cmd[MAX_LINE];
		sprintf ( cmd, "cp -p '%s' '%s'", source, dest );
		result = system ( cmd );
		if ( result ) {
			printf ( "FAILED MMCopyFile %s %s\n", source, dest );
		}
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

short good_file ( const char *fpath, struct FTW *ftwbuf )
{
	char *filename = (char *)fpath + ftwbuf->base;
	char *ext = NULL;
	short result = ALLOW;
	int idx = 0;

	if ( strstr(fpath,"php") ) {
		short bp = 1;
	}
	if ( strstr(fpath,"BAK") ) {
		short bp = 1;
	}
	// ignore certain directories (.git), BAK files, look for html and js only:
	ext = MMFileExtension ( fpath );
	if ( !ext || strlen(ext) == 0 )						result = EXCLUDE;
	if ( filename[0] == '.' ) 							result = EXCLUDE;
	if ( strstr(fpath, "php") ) 						result = EXCLUDE;
	if ( !strcmp(ext,"html") || !strcmp(ext,"shtml") )	result = ALLOW;
	if ( !strcmp(ext,"js") ) 							result = ALLOW;
	if ( !strcmp(ext,"jpg") ) 							result = EXCLUDE;
	if ( !strcmp(ext,"png") ) 							result = EXCLUDE;
	if ( !strcmp(ext,"css") ) 							result = EXCLUDE;
	if ( !strcmp(ext,"pdf") ) 							result = EXCLUDE;
	if ( !strcmp(ext,"sh") ) 							result = EXCLUDE;
	if ( strstr(fpath, ".git") )		 				result = EXCLUDE;
	if ( strstr(fpath, "BAK") ) 						result = EXCLUDE;
	if ( strstr(fpath, "/img") ) 						result = EXCLUDE;
	if ( strstr(fpath, "/images") ) 					result = EXCLUDE;
	if ( strstr(fpath, "/upload") ) 					result = EXCLUDE;

	// but check for a match list of files to exclude:
	for ( idx = 0; ; idx++ ) {
		char *cand = g_skip_files[idx];
		if ( cand == NULL ) break;
		if ( !strncmp(filename, cand, strlen(cand)) ) {
			result = EXCLUDE; break;
		}
	}
	// and a match list of files explicitly to allow
	if ( !strstr(fpath,"BAK") ) {
		for ( idx = 0; ; idx++ ) {
			char *cand = g_allow_files[idx];
			if ( cand == NULL ) break;
			if ( !strncmp(filename, cand, strlen(cand)) ) {
				result = ALLOW; break;
			}
		}
	}
	return result;
}

static char s_bakfile[1024];

char *ensure_bakfile ( const char *fpath, struct FTW *ftwbuf )
{
	char *filename = (char *)fpath + ftwbuf->base;
	if ( fpath ) {
		strncpy ( s_bakfile, fpath, ftwbuf->base );
		s_bakfile[ftwbuf->base] = '\0';
		strcat ( s_bakfile, "BAK/" );
		if ( !MMFilePathExists(s_bakfile) ) {
			MMMakeDir ( s_bakfile, 0755 );
		}
		strcat ( s_bakfile, filename );
		if ( !MMFilePathExists(s_bakfile) ) {
			MMCopyFile( fpath, s_bakfile );
		}
	}
	return s_bakfile;
}

// First-pass function to collect globals. Does not modify anything
int get_globals_in_file ( const char *fpath, const struct stat *sb, int tflag, struct FTW *ftwbuf )
{
    #pragma unused ( sb )
	FILE *fd_in = NULL, *fd_out = NULL;
	char *infile = NULL, *bakfile = NULL, *ext = NULL;
	short verbose = g_pref.verbose;

	if ( tflag == DIRECTORY )  return 0;

	if ( !good_file(fpath, ftwbuf) ) {
		if ( verbose ) printf ( "EXCLUDE %s\n", fpath );
		return 0;
	}
	bakfile = ensure_bakfile ( fpath, ftwbuf );
	ext = MMFileExtension ( fpath );
	infile = bakfile;
	g_currfile = bakfile;
	if ( verbose ) printf ( "GLOBALS: %s\n", infile );

	fd_in = fopen ( infile, "r" );
	if ( !fd_in ) { printf ( "Cannot read %s\n", infile ); return -1; }

	find_functions ( infile, fd_in );

	if ( fd_in  && fd_in  != stdin )  fclose ( fd_in );

	return 0;           /* To tell nftw() to continue */
}

int process_file ( const char *fpath, const struct stat *sb, int tflag, struct FTW *ftwbuf )
{
    #pragma unused ( sb )
	//char *filename = fpath + ftwbuf->base;

	FILE *fd_in = NULL, *fd_out = NULL;
	char *infile = NULL, *outfile = NULL, *bakfile = NULL;
	char *ext = NULL;
	int len = 0;
	short verbose = g_pref.verbose, use_stdout = 0;

	if ( tflag == DIRECTORY )  return 0;

	if ( !good_file(fpath, ftwbuf) ) {
		if ( verbose ) printf ( "EXCLUDE %s\n", fpath );
		g_count.skip++;
		return 0;
	}
	bakfile = ensure_bakfile ( fpath, ftwbuf );
	ext = MMFileExtension ( fpath );
	infile = bakfile;
	g_currfile = bakfile;
	outfile = (char *)fpath;
	fd_in = fopen ( infile, "r" );
	if ( !fd_in ) {
		printf ( "Cannot read %s\n", infile ); return -1; }

	if ( use_stdout ) {
		fd_out = stdout;
	} else {
		fd_out = fopen ( outfile, "w" );
		if ( !fd_out ) { printf ( "Cannot write %s\n", outfile ); return -1; }
	}

	if ( verbose ) printf ( "%s FILE: %s\n", ext, infile );
	rewrite_file ( infile, fd_in, fd_out );

	if ( fd_in  && fd_in  != stdin )  fclose ( fd_in );
	if ( fd_out && fd_out != stdout ) fclose ( fd_out );

	if ( !strcmp(ext,"html") || !strcmp(ext,"shtml") ) g_count.html++;
	if ( !strcmp(ext,"php") ) g_count.php++;
	if ( !strcmp(ext,"js") ) g_count.js++;

	return 0;           /* To tell nftw() to continue */
}

