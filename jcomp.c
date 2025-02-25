//
//  main.c
//  JComp
//
//  Created by Glenn Reid on 2/21/25.
//
//  Compile: gcc -o jcomp jcomp.c'
//  Usage:   jcomp [-v] [-t]ight [-l]oose [-w]arn [-q]uiet [-d]ata [-c]omments [-n]numberlines [-o]rig [-undo]
//
//  commentPlans:
//    jcomp -c 0		// comments are preserved
//    jcomp -c 1		// comments are elided but visible
//    jcomp -c 2		// comments are removed
//  tightness:
//    jcomp -t 0		// no rewrite at all
//    jcomp -t 1		// leave original identifiers in generated _i321 idents
//    jcomp -t 2		// leave first char of original identifier, like m_i321
//    jcomp -t 3		// absolute minimal identifier, like _321
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
#define MAX_IDENTS (4096 * 4)
#define MAX_LINE 2048
// comment types:
#define C_LINE  1	// style
#define C_BLOCK 2	/* style */
// string delimiters:
#define Q_DUBL 1
#define Q_SING 2
#define Q_BACK 3
#define Q_REGX 4
// tightness:
#define T_NONE 0
#define T_LONG  1
#define T_SHORT 2
#define T_MIN   3

char *g_funcs[MAX_FUNCTIONS];
char *g_idents[MAX_IDENTS];
int idx_f = 0, idx_i = 0;
char *g_currfile = NULL;
char g_token[MAX_LINE], g_line[MAX_LINE], g_string[MAX_LINE];

// g_pref
struct {
	short commentPlan;	// 0 = keep, 1 = elide, 2 = eliminate [default=1]
	short verbose;		// tempted to write a really long comment here to describe what verbose means
	short tight;		// make identifiers and function names 1 char vs full original identifier
	short warn;			// emit warnings on stderr [default=1]
	short data;			// write out identifiers.txt and functions.txt
	short lineNums;		// emit line numbers at the beginning of every line (mostly for debugging)
	short origLines;	// emit line numbers that match the original source
} g_pref = { 1, 0, 1, 1, 0, 0, 1 };
//           ^c ^v ^t ^w ^d ^n ^o

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
int undo_file ( const char *infile, const struct stat *sb, int tflag, struct FTW *ftwbuf );
void undo_everything ( void );

#define EQU(X,Y)   !strcmp(X,Y)
#define LINE(X)    count_lines==X
#define FILE(X)    strstr(infile,X)
#define FLINE(X,Y) count_lines==X && strstr(infile,Y)
#define TOKE(X)    !strcmp(token,X)

char *g_skip_files[] = {
	"jcomp.c", "jquery", "jQueryRotate", "validate.js", "image-resize",
	NULL
};
char *g_allow_files[] = {
	"main_setup.php",
	NULL
};
// https://www.w3schools.com/Js/js_reserved.asp
char *g_reserved[] = {
	"abstract", "arguments", "await", "boolean", "break", "byte", "case", "catch", "char", "class",
	"const", "continue", "debugger", "default", "delete", "do", "double", "else", "enum", "eval",
	"export", "extends", "false", "final", "finally", "float", "for", "function", "goto", "if",
	"implements", "import", "in", "instanceof", "int", "interface", "let", "long", "native", "new",
	"null", "package", "private", "protected", "public", "return", "short", "static", "super", "switch",
	"synchronized", "this", "throw", "throws", "transient", "true", "try", "typeof", "var", "void",
	"volatile", "while", "with", "yield",
	"eval", "decodeURI", "decodeURIComponent", "encodeURI", "encodeURIComponent", "escape", "unescape",
	"Date", "Number", "BigInt", "Math", "Temporal", "String", "RegExp",
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
	"jQuery", "$", "Quill", "theme", "modules", "toolbar", "imageResize", "displaySize",
	"hasOwnProperty", "Infinity", "isFinite", "isNaN", "isPrototypeOf", "length", "Math", "NaN",
	"name", "Number", "Object", "prototype", "String", "toString", "undefined", "valueOf",
	"NULL", "Set", "Map", "of", "alert",
	"cPage", "is_mobile",
	"xhr",
	NULL
};
char *g_attributes[] = { // https://www.w3schools.com/TAGs/ref_attributes.asp
	"onclick", "onkeydown", "onkeyup", "onabort", "onafterprint", "onbeforeprint", "onbeforeunload", "onblur",
	"oncanplay", "oncanplaythrough", "onchange", "onclick", "oncontextmenu", "oncopy", "oncuechange", "oncut",
	"ondblclick", "ondrag", "ondragend", "ondragenter", "ondragleave", "ondragover", "ondragstart", "ondrop",
	"ondurationchange", "onemptied", "onended", "onerror", "onfocus", "onhashchange", "oninput", "oninvalid",
	"onkeydown", "onkeypress", "onkeyup", "onload", "onloadeddata", "onloadedmetadata", "onloadstart",
	"onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onmousewheel", "onoffline",
	"ononline", "onpagehide", "onpageshow", "onpaste", "onpause", "onplay", "onplaying", "onpopstate",
	"onprogress", "onratechange", "onreset", "onresize", "onscroll", "onsearch", "onseeked", "onseeking",
	"onselect", "onstalled", "onstorage", "onsubmit", "onsuspend", "ontimeupdate", "ontoggle", "onunload",
	"onvolumechange", "onwaiting", "onwheel",
	NULL
};
short g_help = 0;
short g_undo_mode = 0;

int main ( int argc, const char * argv[] ) {
	int result = 0;
	int idx = 0;
    char cwd[1024];

	// look for command line switches:
	for ( idx = 1; idx < argc; idx++ ) {
		if ( EQU(argv[idx], "-v") ) g_pref.verbose = 1;
		if ( EQU(argv[idx], "-l") ) g_pref.tight = 0;
		if ( EQU(argv[idx], "-w") ) g_pref.warn = 1;
		if ( EQU(argv[idx], "-q") ) g_pref.warn = 0;
		if ( EQU(argv[idx], "-d") ) g_pref.data = 1 - g_pref.data;
		if ( EQU(argv[idx], "-n") ) g_pref.lineNums = 1 - g_pref.lineNums;
		if ( EQU(argv[idx], "-o") ) g_pref.origLines = 1 - g_pref.origLines;
		if ( EQU(argv[idx], "-h") ) g_help = 1;
		if ( EQU(argv[idx], "-t") ) if ( idx+1 < argc ) { sscanf(argv[idx+1], "%hd", &g_pref.tight); }
		if ( EQU(argv[idx], "-c") ) if ( idx+1 < argc ) { sscanf(argv[idx+1], "%hd", &g_pref.commentPlan); }
		if ( EQU(argv[idx], "-undo") ) g_undo_mode = 1;
	}
	// figure out where we are
    getcwd(cwd, sizeof(cwd));
    if ( EQU(cwd, "/Users/glenn/CODE/JComp/Build/Products/Debug") ) {
		chdir ( "../../../JComp" );
	}
	getcwd(cwd, sizeof(cwd));
	printf("Working dir: %s\n", cwd);

	if ( g_help ) {
		printf ( "Usage:   jcomp [-v] [-t]ight [-l]oose [-w]arn [-q]uiet [-d]ata [-c]omments [-n]numberlines [-o]rig [-undo]\n" );
		printf ( "  commentPlans:\n" );
		printf ( "    jcomp -c 0		// comments are preserved\n" );
		printf ( "    jcomp -c 1		// comments are elided but visible\n" );
		printf ( "    jcomp -c 2		// comments are removed\n" );
		printf ( "  tightness:\n" );
		printf ( "    jcomp -t 0		// no rewrite at all\n" );
		printf ( "    jcomp -t 1		// leave original identifiers in generated _i321 idents\n" );
		printf ( "    jcomp -t 2		// leave first char of original identifier, like m_i321\n" );
		printf ( "    jcomp -t 3		// absolute minimal identifier, like _321\n" );
		exit ( 0 );
	}
	if ( g_undo_mode ) {
		short ask = 1;
		if ( ask ) {
			char key = 0, ch = 'Y';
			printf ( "Really undo the whole directory and files? [Yn]: " );
			while ( (key = getchar()) ) {
				short yes = 1;
				if ( key == '\n' ) {
					if ( ch == 'N' || ch == 'n' ) {
						printf ( "STOPPING...\n" );
						exit(0);
					}
					if ( ch == 'Y' || ch == 'y' ) {
						printf ( "OKAY, let's undo it all.\n" );
						break;
					}
					printf ( "%c - Please respond Y or N: ", ch );
				} else {
					ch = key;
				}
			}
		}
		printf ( "UNDO: here we go...\n" );
		undo_everything();
		exit(0);
    }

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
		if ( EQU(word, cand) ) {
			res = 1; break;
		}
	}
	return res;
}

int known_func ( char *name )
{
	int idx = 0, found = -1;

	if ( g_pref.tight == 3 ) return known_ident ( name );

	for ( idx = 0; idx < idx_f; idx++ ) {
		if ( EQU(g_funcs[idx], name) ) {
			found = idx; break;
		}
	}
	return found;
}

int register_func ( char *name )
{
	int idx = 0, found = known_func ( name );
	int len = 0;

	if ( g_pref.tight == 3 ) return register_ident ( name );

	if ( found == -1 && name ) {
		if ( idx_f >= MAX_FUNCTIONS ) {
			fprintf ( stderr, "MAX_FUNCTIONS[%d], can't register %s in %s\n", idx_f, name, g_currfile );
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
			if ( EQU(g_idents[idx], name) ) {
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
			fprintf ( stderr, "MAX_IDENTS[%d], can't register %s in %s\n", idx_i, name, g_currfile );
			exit ( -1 );
		}
		len = (int)strlen ( name );
		for ( idx = 0; idx < idx_i; idx++ ) {
			if ( EQU(g_idents[idx], name) ) {
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

short known_attribute ( char *word )
{
	short res = 0;
	int idx = 0;
	for ( idx = 0; ; idx++ ) {
		char *cand = g_attributes[idx];
		if ( cand == NULL ) break;
		if ( EQU(word, cand) ) {
			res = 1; break;
		}
	}
	return res;
}

int find_functions ( const char *infile, FILE *fd_in )
{
	int result = 0;
	char ch = '\0', last = '\0';
	char *token = g_token, *line = g_line;
	int count_ch=0, count_lines=1, count_com=0;
	int func_idx=0;
	int idx=0, cdx=0;
    short verbose = g_pref.verbose;
	short in_js=0, in_php=0, in_com=0, in_str=0;
	short ctype=0, stype=0, ftoke=0, slash=0;
	short debug = 1;

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
				if ( ch == '/' && last == '*' && ctype == C_BLOCK ) { in_com = 0; end_com = 1; } /* end */
				if ( ch == '\n' && ctype == C_LINE ) { in_com = 0; end_com = 1; } // end
			} else if ( !in_str ) {							// ignore slashes inside string bodies
				if ( ch == '/' ) {
					if ( slash ) {
						in_com = 1; ctype = C_LINE; count_com = 0;
						slash = 0;
					} else { slash = 1; }
				} else if ( ch == '*' && slash ) {
					in_com = 1; ctype = C_BLOCK; count_com = 0;
					slash = 0;
				} else { slash = 0; }
			}
			if ( !in_str ) {
				if ( ch == '"' && !in_com ) { in_str = 1; stype = Q_DUBL; } 							// begin "
				if ( ch == '\'' && !in_com ) { in_str = 1; stype = Q_SING; } 						// begin '
				if ( ch == '`' && !in_com ) { in_str = 1; stype = Q_BACK; }  						// begin `
			} else {
				if ( ch == '"' && stype == Q_DUBL && last != '\\' ) { in_str = 0; end_str = 1; } 		// end "
				if ( ch == '\'' && stype == Q_SING && last != '\\' ) { in_str = 0; end_str = 1; }		// end '
				if ( ch == '`' && stype == Q_BACK && last != '\\' ) { in_str = 0; end_str = 1; } 	// end `
			}
			if ( in_com || in_str ) {
				last = ch;
				if ( in_com && g_pref.commentPlan > 0 ) count_com++;
				continue;
			}
			if ( end_com || end_str ) {
				last = ch;
				continue;		// <-----------------------------
			}
		}
		alpha = check_alpha ( idx, ch, last, in_str, in_js, in_php );
		if ( alpha ) {
			token[idx++] = ch;
		} else if ( idx > 0 ) {				// end of token
			//short reserved = 0;
			token[idx] = '\0';
			if ( EQU(token, "function") ) {
				ftoke = 1;
			} else if ( known_attribute(token) ) { // in raw html, look for attributes like onclick=
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

#define FUNCTION 1
#define IDENTIFIER 2
void write_ident ( short type, FILE *fd_out, int f_idx, char *token )
{
	char min[32] = { '\0' };
	char prefix[16] = { '\0' };
	char code = 'i';
	char ident[128];

	//  tightness
	strcpy ( ident, token );		// unless rewritten
	if ( g_pref.tight == T_LONG ) strcpy ( min, token );
	if ( g_pref.tight == T_SHORT ) sprintf ( min, "%c", token[0] );

	if ( type == FUNCTION ) code = 'f';
	sprintf ( prefix, "%c", code );\
	if ( g_pref.tight == T_MIN ) strcpy ( prefix, "" );

	if ( g_pref.tight ) {
		sprintf ( ident, "%s_%s%d", min, prefix, f_idx );
	}
	fprintf ( fd_out, "%s", ident );
}

int rewrite_file ( const char *infile, FILE *fd_in, FILE *fd_out )
{
	int result = 0;
	int count_ch=0, count_lines=1, count_com=0;
	char ch = '\0', last = '\0';
	char *token = g_token, *line = g_line, *string = g_string;
	int func_idx=0, ident_idx=0;
	int idx=0, cdx=0, sdx=0;
	short in_js=0, in_php=0, in_com=0, in_str=0, in_jvar=0, in_style=0, in_attr=0, nest = 1;
	short ctype=0, stype=0, ftoke=0, slash=0, saw_dot=0, saw_attr=0, suppress=0;
	short debug = 0;

	token[0] = '\0';
	if ( strstr(infile, "home/BAK/index") ) {	// debug hook for specific file
		debug = 1;
	}
	char *ext = MMFileExtension ( infile );
	if ( EQU(ext, "js") ) in_js = nest++;

	while ( (ch = fgetc(fd_in)) != EOF ) {
		short alpha = 0, end_com = 0, end_str = 0, end_jvar = 0;
		count_ch++;
		if ( cdx <= MAX_LINE - 2 ) {
			line[cdx] = ch; line[cdx+1] = '\0';
		} else {
			if ( g_pref.warn ) fprintf ( stderr, "WARNING: %s line %d longer than %d chars\n", infile, count_lines, MAX_LINE );
		}
		if ( cdx == 0 && g_pref.lineNums ) {
			if ( !in_com || g_pref.commentPlan == 0 ) {
				fprintf ( fd_out, "%03d: ", count_lines );
			}
		}
		cdx++;
		switch ( ch ) {
			case '\r': case '\n':
				if ( g_pref.origLines || (!in_com || g_pref.commentPlan == 0 || ctype == C_LINE) ) {
					count_lines++;
				}
				cdx = 0;
				if ( stype != Q_DUBL ) { in_str = 0; stype = 0; }	// line end terminates string(?)
				in_jvar = 0;
				break;
			case '{': case '}': case '(': case ')': case '[': case ']':
			case ';': case ':':
				if ( idx == 0 ) ftoke = 0;
				break;
		}
		if ( in_com ) {
			if ( ch == '/'  && last == '*' && ctype == C_BLOCK ) { in_com = 0; end_com = 1; } /* end */
			if ( ch == '\n' && ctype == C_LINE ) { in_com = 0; end_com = 1; } 			   // end
		} else if ( !in_str ) { // ignore slashes inside string bodies
			if ( ch == '/'  && last != '<' ) {
				if ( slash ) {
					in_com = nest++; ctype = C_LINE; count_com = 0;
					if ( !in_php && g_pref.commentPlan < 2 ) fprintf ( fd_out, "%c", ch );		// out
					if ( !in_php ) suppress = 1;
					slash = 0;
				} else { slash = 1; }
			} else if ( ch == '*' && slash ) {
				in_com = nest++; ctype = C_BLOCK; count_com = 0;
				if ( !in_php && g_pref.commentPlan == 1 ) fprintf ( fd_out, "%c", ch );			// out
				slash = 0;
			} else { slash = 0; }
		}
		if ( !in_com && !end_com ) {
			if ( !in_php ) {
				if ( !strncmp(token, "<?php", 5) ) 		in_php = nest++;
			} else {
				if ( !strncmp(token, "?>", 2) ) 		in_php = 0;
			}
			if ( !in_js ) {
				if ( !strncmp(token, "<script", 7) ) 	in_js = nest++;
			} else {
				if ( !strncmp(token, "</script", 8) ) 	in_js = 0;
			}
			if ( !in_style ) {
				if ( !strncmp(token, "<style", 6) ) 	in_style = nest++;
			} else {
				if ( !strncmp(token, "</style>", 7) ) 	in_style = 0;
			}
			if ( !in_str ) {
				if ( ch == '"'  && !in_com ) { in_str = nest++; stype = Q_DUBL; } 					// begin "
				if ( ch == '\'' && !in_com ) { in_str = nest++; stype = Q_SING; } 					// begin '
				if ( ch == '`'  && !in_com ) { in_str = nest++; stype = Q_BACK; }  					// begin `
				if ( ch == '/'  && regex(token) ) { in_str = 1; stype = Q_REGX; }					// begin /regex/
			} else {
				if ( ch == '"'  && stype == Q_DUBL && last != '\\' ) { in_str = 0; end_str = 1; } 	// end "
				if ( ch == '\'' && stype == Q_SING && last != '\\' ) { in_str = 0; end_str = 1; }	// end '
				if ( ch == '`'  && stype == Q_BACK && last != '\\' ) { in_str = 0; end_str = 1; } 	// end `
				if ( ch == '/'  && stype == Q_REGX && last != '\\' ) { in_str = 0; end_str = 1; } 	// end /regex/
				if ( !end_str ) {	// collect the body of the string, for debugging
					if ( sdx <= MAX_LINE - 2 ) {
						string[sdx] = ch; string[sdx+1] = '\0';
					}
				} else { sdx = 0; }
			}
			if ( !in_jvar ) {
				if ( last == '$' && ch == '{' ) { in_jvar = nest++; } 	// ${
			} else {
				if ( ch == '}' ) { end_jvar = 1; } 					// ${
			}
		}
		if ( in_com || end_com ) {
			if ( in_php ) {
				count_com++;
				last = ch;
				fprintf ( fd_out, "%c", ch );
				continue;		// <-----------------------------
			}
			if ( g_pref.commentPlan > 0 ) {
				count_com++; suppress = 0;
				if ( in_com ) {
					last = ch;
					continue;	// <-----------------------------
				}
			}
			//if ( g_pref.commentPlan < 2 )	fprintf ( fd_out, "%c", ch );
		}
		if ( in_str ) {
			if ( stype == Q_BACK && in_jvar ) {
				// keep going to parse the inside of `${js strings}`;
			} else if ( in_php ) {
				// if ( in_str )
				// pass through things like <?php echo "var foo = bar" ?>
			} else if ( !saw_attr ) {
				fprintf ( fd_out, "%c", ch );
				last = ch;
				continue;		// <-----------------------------
			}
			if ( end_jvar ) in_jvar = 0;
		}
		if ( end_com ) {
			last = ch;
			if ( !in_php && g_pref.commentPlan == 1 ) {
				fprintf ( fd_out, " %d elided", count_com );
				if ( ctype == C_BLOCK ) fprintf ( fd_out, " *" );
			}
			if ( in_php || g_pref.commentPlan < 2 ) fprintf ( fd_out, "%c", ch );
			continue;			// <-----------------------------
		}
		if ( (in_str || end_str) && stype == Q_REGX ) {
			last = ch;
			fprintf ( fd_out, "%c", ch );
			continue;			// <-----------------------------
		}
		alpha = check_alpha ( idx, ch, last, in_str, in_js, in_php );
		if ( alpha && last == '.' ) {	// special case for things like str.length
			saw_dot = 1;
		}
		short in_token = alpha;
		//if ( in_str && stype == Q_REGX ) in_token = 0;
		if ( in_token ) {
			token[idx++] = ch;
		} else if ( idx > 0 ) {				// end of token
			short reserved = 0;
			short rewrite = 0;
			token[idx] = '\0';				// null-terminate
			if ( known_attribute(token) ) {
				in_attr = nest++; saw_attr = 1; rewrite = 1;
			}
			if ( in_js ) rewrite = 1;
			// only rewrite inside strings if we saw 'onclick' or similar (saw_attr):
			if ( (in_str || end_str) && !saw_attr )  rewrite = 0;
			if ( (in_str || end_str) && stype == Q_REGX ) rewrite = 0;		// don't rewrite regex's
			// or if we're inside a `javascript ${var}`
			if ( in_str && stype == Q_BACK && (in_jvar || end_jvar) ) rewrite = 1;
			if ( in_php && in_str && in_js )
				rewrite = 1;
			if ( saw_attr ) rewrite = 1;
			if ( in_com ) rewrite = 0;
			if ( rewrite ) {
				reserved = is_reserved ( token );
				if ( reserved || saw_dot || in_attr ) {
					fprintf ( fd_out, "%s", token );
					if ( EQU(token, "function") ) ftoke = 1;
					in_attr = 0;
				} else {
					if ( strlen(token) > 0 ) {
						if ( ftoke || saw_attr ) {
							func_idx = register_func ( token );
							write_ident ( FUNCTION, fd_out, func_idx, token );
							ftoke = 0;
							saw_attr = 0;
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
								write_ident ( FUNCTION, fd_out, func_idx, token );
							} else if ( rewriteIdent ) {
								ident_idx = register_ident ( token );
								write_ident ( IDENTIFIER, fd_out, ident_idx, token );
							} else {
								fprintf ( fd_out, "%s", token );
							}
						}
						//if ( ident_idx > 29 ) break;
					}
				}
			} else {
				fprintf ( fd_out, "%s", token );
			}
			idx = 0;
			if ( ch == '<' ) {			// The < character is part of tokens in HTML
				token[idx++] = ch;
			}
		}
		if ( !alpha ) {
			if ( ch != '.' ) saw_dot = 0;
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
	if ( !ext || strlen(ext) == 0 )				result = EXCLUDE;
	if ( filename[0] == '.' ) 					result = EXCLUDE;
	if ( strstr(fpath, "php") ) 				result = EXCLUDE;
	if ( EQU(ext,"html") || EQU(ext,"shtml") )	result = ALLOW;
	if ( EQU(ext,"js") ) 						result = ALLOW;
	if ( EQU(ext,"jpg") ) 						result = EXCLUDE;
	if ( EQU(ext,"png") ) 						result = EXCLUDE;
	if ( EQU(ext,"css") ) 						result = EXCLUDE;
	if ( EQU(ext,"pdf") ) 						result = EXCLUDE;
	if ( EQU(ext,"sh") ) 						result = EXCLUDE;
	if ( strstr(fpath, ".git") )		 		result = EXCLUDE;
	if ( strstr(fpath, "BAK") ) 				result = EXCLUDE;
	if ( strstr(fpath, "/img") ) 				result = EXCLUDE;
	if ( strstr(fpath, "/images") ) 			result = EXCLUDE;
	if ( strstr(fpath, "/upload") ) 			result = EXCLUDE;

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

char *bakfile_dir ( const char *fpath, struct FTW *ftwbuf )
{
	if ( fpath ) {
		strncpy ( s_bakfile, fpath, ftwbuf->base );
		s_bakfile[ftwbuf->base] = '\0';
		strcat ( s_bakfile, "BAK/" );
	}
	return s_bakfile;
}

char *bakfile_name ( const char *fpath, struct FTW *ftwbuf )
{
	char *filename = (char *)fpath + ftwbuf->base;
	char *dir = bakfile_dir ( fpath, ftwbuf );
	if ( dir ) {
		strcat ( dir, filename );
	}
	return s_bakfile;
}

char *ensure_bakfile ( const char *fpath, struct FTW *ftwbuf )
{
	char *dir = bakfile_dir ( fpath, ftwbuf );
	char *filename = NULL;
	if ( dir ) {
		if ( !MMFilePathExists(dir) ) {
			MMMakeDir ( dir, 0755 );
		}
		filename = bakfile_name ( fpath, ftwbuf );
		if ( !MMFilePathExists(filename) ) {
			MMCopyFile( fpath, filename );
		}
	}
	return filename;
}

// First-pass function to collect globals. Does not modify anything
int get_globals_in_file ( const char *fpath, const struct stat *sb, int tflag, struct FTW *ftwbuf )
{
    #pragma unused ( sb )
	FILE *fd_in = NULL, *fd_out = NULL;
	char *infile = NULL, *bakfile = NULL, *ext = NULL;
	short verbose = g_pref.verbose;

	if ( tflag != FTW_F )  return 0;

	if ( !good_file(fpath, ftwbuf) ) {
		if ( verbose ) printf ( "EXCLUDE %s\n", fpath ); return 0;
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

	if ( tflag != FTW_F )  return 0;

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

	if ( EQU(ext,"html") || EQU(ext,"shtml") ) g_count.html++;
	if ( EQU(ext,"php") ) g_count.php++;
	if ( EQU(ext,"js") ) g_count.js++;

	return 0;           /* To tell nftw() to continue */
}

int undo_file ( const char *fpath, const struct stat *sb, int tflag, struct FTW *ftwbuf )
{
    #pragma unused ( sb )
	char *filename = (char *)fpath + ftwbuf->base;
	FILE *fd_in = NULL, *fd_out = NULL;
	char *infile = NULL, *bakfile = NULL, *ext = NULL, *type = NULL;
	char rmpath[1024];
	short verbose = g_pref.verbose;
	short really = 1;

	type = "UNMATCHED/UNKNOWN type";
	switch ( tflag ) {
		case FTW_F: type = "File"; break;
		case FTW_D: type = "Directory."; break;
		case FTW_DNR: type = "Directory without read permission."; break;
		case FTW_DP: type = "Directory with subdirectories visited."; break;
		case FTW_NS: type = "Unknown type; stat() failed."; break;
		case FTW_SL: type = "Symbolic link."; break;
		case FTW_SLN: type = "Sym link that names a nonexistent file."; break;
	}
	if ( tflag == FTW_DP ) {
		if ( EQU(filename, "BAK") ) {
			printf ( "%s: %d %s\n", fpath, tflag, type );
			if ( really ) {
				strcpy ( rmpath, fpath ); // strcat ( rmpath, "/BAK" );
				int status = rmdir ( rmpath );
				if ( status ) {
					fprintf ( stderr, "Could not rmdir: %s\n", rmpath );
				}
			}
		} else {
			//printf ( "%s: %d %s\n", fpath, tflag, type );
		}
		return 0;
	}
	if ( tflag != FTW_F ) {
		printf ( "%s: %d %s\n", fpath, tflag, type );
		return 0;
	}
	if ( !good_file(fpath, ftwbuf) ) {
		//if ( verbose ) printf ( "EXCLUDE %s\n", fpath ); return 0;
		//return 0;
	}
	if ( strlen(filename) < 3 ) {
		printf ( "SHORT: %s\n", fpath );
		return 0;
	}
	bakfile = bakfile_name ( fpath, ftwbuf );
	if ( strstr(bakfile, "BAK") ) {
		if ( MMFilePathExists(bakfile) ) {
			if ( verbose ) printf ( "MMCopyFile ( %s, %s );\n", bakfile, fpath );
			if ( really ) MMCopyFile ( bakfile, fpath );
			if ( verbose ) printf ( "unlink ( %s );\n", bakfile );
			if ( really ) unlink ( bakfile );
		}
	} else {
		fprintf ( stderr, "ATTEMPT to restore non BAK file: %s\n", bakfile );
	}
	return 0;           /* To tell nftw() to continue */
}


void undo_everything ( void )
{
	MMDoForAllFilesIn ( ".", undo_file );
}

