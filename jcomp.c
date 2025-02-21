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
  #include <ftw.h>

char outfile[128];
char *g_funcs[1024];
char *g_idents[4096];
int idx_f = 0, idx_i = 0;

short commentPlan = 1;		// 0 = keep, 1 = elide, 2 = drop
short lineNumbers = 1;

typedef struct FTW *sftwptr;
typedef int (IterateProcPtr) (int (*p1)(const char *p2, const struct stat *p3, int p4, /*struct FTW *p5*/sftwptr p5), int p6, int p7);

// function prototypes
short is_reserved ( char *word );
int find_functions_and_globals ( char *infile, char *outfile );
int process_file ( char *infile, char *outfile );
unsigned long MMDoForAllFilesIn ( char *directory, IterateProcPtr apply_proc );
short MMFilePathExists ( char *path );
int process_js ( const char *fpath, const struct stat *sb, int tflag, sftwptr ftwbuf );

int main ( int argc, const char * argv[] ) {
	int idx = 0, len = 0, result = 0;
	char *infile = (char *)argv[1];
	char *ext = "";
    char cwd[1024];

    getcwd(cwd, sizeof(cwd));
    if ( !strcmp(cwd, "/Users/glenn/CODE/JComp/Build/Products/Debug") ) {
		chdir ( "../../../JComp" );
		getcwd(cwd, sizeof(cwd));
		printf("Set working dir: %s\n", cwd);
	}
	MMDoForAllFilesIn ( "./js", (IterateProcPtr*)process_js );

	return result;
}

short is_reserved ( char *word )
{
	short res = 0;
	int idx = 0;
	char *reserved[] = {
		"function", "if", "else", "for", "while", "return", "break", "continue", "in", "of",
		"var", "let", "const", "true", "false",
		"isNaN", "Object", "Math", "atob", "btoa", "parseInt", "parseFloat",
		"typeof", "undefined", "null", "NULL",
		NULL
	};
	for ( idx = 0; ; idx++ ) {
		char *cand = reserved[idx];
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
	if ( found == -1 ) {
		char *save = (char *)malloc ( strlen(name) );
		strcpy ( save, name );
		g_funcs[idx_f] = save;
		found = idx_f++;
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
	if ( found == -1 ) {
		if ( len ) {
			char *save = (char *)malloc ( len );
			strcpy ( save, name );
			g_idents[idx_i] = save;
			found = idx_i++;
		} else {
			short bp = 1;
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

int find_functions_and_globals ( char *infile, char *outfile )
{
	int result = 0;
	int count_ch=0, count_lines=1, count_comm=0;
	char ch = '\0', last = '\0', dot = '\0';
	FILE *fd = NULL;
	char token[1024], func[1024], ident[1024]; // , comment[4096];
	int func_idx=0, ident_idx=0;
	int idx=0, cdx=0;
    short in_comment=0, ctype=0, in_string=0, stype=0, ftoke=0, saw_slash=0, saw_dot=0;
    short idb=0, cdb=0;		// debug flags

	fd = fopen ( infile, "r" );
	if ( !fd ) {
		printf ( "Cannot open %s\n", infile );
		return -1;
	}
	while ( (ch = fgetc(fd)) != EOF ) {
		short alpha = 0, end_comment = 0, end_string = 0;
		count_ch++;
		if ( cdx == 0 ) {
			if ( !in_comment ) {
				//printf ( "%00d: ", count_lines );
			}
		}
		cdx++;
		switch ( ch ) {
			case '\r': case '\n':
				count_lines++; cdx = 0;
				break;
			case '{': case '}': case '(': case ')': case '[': case ']' :
				break;
			case ';': case ':':
				break;
		}
		if ( in_comment ) {
			if ( ch == '/' && last == '*' && ctype == 2 ) { 	// end of block comment
				in_comment = 0; end_comment = 1;
			}
			if ( ch == '\n' && ctype == 1 ) { 					// end of line comment
				in_comment = 0; end_comment = 1;
			}
		} else {
			if ( ch == '/' ) {
				if ( saw_slash ) {
					in_comment = 1; ctype = 1; count_comm = 0;
					if ( commentPlan < 2 ) //printf ( "/%c", ch );
					saw_slash = 0;
				} else {
					saw_slash = 1;
				}
			} else {
				//saw_slash = 0;
			}
			if ( ch == '*' && saw_slash ) {
				in_comment = 1; ctype = 2; count_comm = 0;
				if ( commentPlan < 2 ) //printf ( "/%c", ch );
				saw_slash = 0;
			}
		}
		if ( in_string ) {
			if ( ch == '"' && stype == 1 && last != '\\' ) { 					// end of string
				in_string = 0; end_string = 1;
			}
			if ( ch == '\'' && stype == 2 && last != '\\' ) { 					// end of string
				in_string = 0; end_string = 1;
			}
			if ( ch == '`' && stype == 3 && last != '\\' ) { 					// end of string
				in_string = 0; end_string = 1;
			}
		} else {
			if ( ch == '"' && !in_comment ) {
				in_string = 1; stype = 1;
			}
			if ( ch == '\'' && !in_comment ) {
				in_string = 1; stype = 2;
			}
			if ( ch == '`' && !in_comment ) {
				in_string = 1; stype = 3;
			}
		}
		if ( in_comment || in_string ) {
			last = ch;
			if ( in_comment ) {
				if ( commentPlan > 0 ) {
					count_comm++; continue;
				}
				//if ( commentPlan < 2 )	printf ( "%c", ch );
			}
			//if ( in_string ) printf ( "%c", ch );
			continue;
		}
		if ( end_comment || end_string ) {
			last = ch;
			if ( end_comment ) {
				if ( commentPlan == 1 ) {
					//printf ( " %d elided", count_comm );
					//if ( ctype == 2 ) printf ( " *" );
				}
				if ( commentPlan < 2 ) {
					//printf ( "%c", ch );
				}
			}
			if ( end_string ) {
				//printf ( "%c", ch );
			}
			continue;
		}
		if ( idx == 0 ) {
			if ( isalpha(ch) ) alpha = 1;	// first char must be pure alpha
			if ( alpha && last == '.' ) {	// special case for things like str.length
				saw_dot = 1;
			}
		} else {
			if ( isalnum(ch) || legal(ch) ) alpha = 1;	// subsequent chars can be alphanumeric
		}
		if ( alpha ) {
			token[idx++] = ch;
		} else if ( idx > 0 ) {				// end of token
			short reserved = 0;
			token[idx] = '\0';
			reserved = is_reserved ( token );
			if ( reserved || saw_dot ) {
				//printf ( "%s", token );
				if ( !strcmp(token, "function") ) ftoke = 1;
			} else {
				if ( strlen(token) > 0 ) {
					if ( ftoke ) {
						//strcpy ( func, token );		// is a function name
						func_idx = known_func ( token );
						//printf ( "%s[f%d]", token, func_idx );
						printf ( "\tfunction %d: %s\n", func_idx, token );
					} else {
						//strcpy ( ident, token );	// is an identifier
						//ident_idx = known_ident ( token );
						//printf ( "%s_i%d", token, ident_idx );
					}
					//if ( ident_idx > 29 ) break;
				}
				ftoke = 0;
			}
			idx = 0;
		}
		if ( isspace(ch) || !isalnum(ch) ) saw_dot = 0;

		if ( !alpha ) {
			if ( !saw_slash ) {
				//if ( (!lineNumbers ) {
					//printf ( "%c", ch );
				//}
			} else {
				//if ( !in_comment )
				//	printf ( "/" );
			}
		} else {
			if ( saw_slash ) {
				//if ( !in_comment && commentPlan < 2 )
				//	printf ( "/" );
				saw_slash = 0;
			}
		}
		last = ch;
	}
	fclose ( fd );

	return result;
}

int process_file ( char *infile, char *outfile )
{
	int result = 0;
	int count_ch=0, count_lines=1, count_comm=0;
	char ch = '\0', last = '\0', dot = '\0';
	FILE *fd = NULL;
	char token[1024], func[1024], ident[1024]; // , comment[4096];
	int func_idx=0, ident_idx=0;
	int idx=0, cdx=0;
    short in_comment=0, ctype=0, in_string=0, stype=0, ftoke=0, saw_slash=0, saw_dot=0;
    short idb=0, cdb=0;		// debug flags

	printf ( "infile: %s\n", infile );
	printf ( "outfile: %s\n", outfile );

	fd = fopen ( infile, "r" );
	if ( !fd ) {
		printf ( "Cannot open %s\n", infile );
		return -1;
	}
	while ( (ch = fgetc(fd)) != EOF ) {
		short alpha = 0, end_comment = 0, end_string = 0;
		count_ch++;
		if ( cdx == 0 ) {
			if ( !in_comment ) {
				//printf ( "%c: ", ch );
				printf ( "%00d: ", count_lines );
			}
		}
		cdx++;
		switch ( ch ) {
			case '\r': case '\n':
				count_lines++; cdx = 0;
				break;
			case '{': case '}': case '(': case ')': case '[': case ']' :
				break;
			case ';': case ':':
				break;
		}
		if ( in_comment ) {
			if ( ch == '/' && last == '*' && ctype == 2 ) { 	// end of block comment
				in_comment = 0; end_comment = 1;
			}
			if ( ch == '\n' && ctype == 1 ) { 					// end of line comment
				in_comment = 0; end_comment = 1;
			}
		} else {
			if ( ch == '/' ) {
				if ( saw_slash ) {
					in_comment = 1; ctype = 1; count_comm = 0;
					if ( commentPlan < 2 ) printf ( "/%c", ch );
					saw_slash = 0;
				} else {
					saw_slash = 1;
				}
			} else {
				//saw_slash = 0;
			}
			if ( ch == '*' && saw_slash ) {
				in_comment = 1; ctype = 2; count_comm = 0;
				if ( commentPlan < 2 ) printf ( "/%c", ch );
				saw_slash = 0;
			}
		}
		if ( in_string ) {
			if ( ch == '"' && stype == 1 && last != '\\' ) { 					// end of string
				in_string = 0; end_string = 1;
			}
			if ( ch == '\'' && stype == 2 && last != '\\' ) { 					// end of string
				in_string = 0; end_string = 1;
			}
			if ( ch == '`' && stype == 3 && last != '\\' ) { 					// end of string
				in_string = 0; end_string = 1;
			}
		} else {
			if ( ch == '"' && !in_comment ) {
				in_string = 1; stype = 1;
			}
			if ( ch == '\'' && !in_comment ) {
				in_string = 1; stype = 2;
			}
			if ( ch == '`' && !in_comment ) {
				in_string = 1; stype = 3;
			}
		}
		if ( in_comment || in_string ) {
			last = ch;
			if ( in_comment ) {
				if ( commentPlan > 0 ) {
					count_comm++; continue;
				}
				if ( commentPlan < 2 )	printf ( "%c", ch );
			}
			if ( in_string ) printf ( "%c", ch );
			continue;
		}
		if ( end_comment || end_string ) {
			last = ch;
			if ( end_comment ) {
				if ( commentPlan == 1 ) {
					printf ( " %d elided", count_comm );
					if ( ctype == 2 ) printf ( " *" );
				}
				if ( commentPlan < 2 ) {
					printf ( "%c", ch );
				}
			}
			if ( end_string ) {
				printf ( "%c", ch );
			}
			continue;
		}
		if ( idx == 0 ) {
			if ( isalpha(ch) ) alpha = 1;	// first char must be pure alpha
			if ( alpha && last == '.' ) {	// special case for things like str.length
				saw_dot = 1;
			}
		} else {
			if ( isalnum(ch) || legal(ch) ) alpha = 1;	// subsequent chars can be alphanumeric
		}
		if ( alpha ) {
			token[idx++] = ch;
		} else if ( idx > 0 ) {				// end of token
			short reserved = 0;
			token[idx] = '\0';
			reserved = is_reserved ( token );
			if ( reserved || saw_dot ) {
				printf ( "%s", token );
				if ( !strcmp(token, "function") ) ftoke = 1;
			} else {
				if ( strlen(token) > 0 ) {
					if ( ftoke ) {
						//strcpy ( func, token );		// is a function name
						func_idx = known_func ( token );
						//printf ( "%s[f%d]", token, func_idx );
						printf ( "%s", token );
					} else {
						//strcpy ( ident, token );	// is an identifier
						ident_idx = known_ident ( token );
						printf ( "%s_i%d", token, ident_idx );
					}
					//if ( ident_idx > 29 ) break;
				}
				ftoke = 0;
			}
			idx = 0;
		}
		if ( isspace(ch) || !isalnum(ch) ) saw_dot = 0;

		if ( !alpha ) {
			if ( !saw_slash ) {
				//if ( (!lineNumbers ) {
					printf ( "%c", ch );
				//}
			} else {
				//if ( !in_comment )
				//	printf ( "/" );
			}
		} else {
			if ( saw_slash ) {
				if ( !in_comment && commentPlan < 2 )
					printf ( "/" );
				saw_slash = 0;
			}
		}
		last = ch;
	}
	fclose ( fd );

	return result;
}

#define MAX_DEPTH 32
/*
static char sApplyTopLevelDir[4096];
static char sApplyTraverseDir[4096];
static char sApplySysDirs[MAX_DEPTH][4096];
static char sApplyTargetDirs[MAX_DEPTH][4096];
static char sApplyTargetFile[4096];
static char sTmpFile[5100];
static int  sApplyBaseOffset = 0;
static int  sSpecialBaseOffset = 0;
static short sSpecialSysDirFlag = 0;
*/

#ifdef __ANDROID__
  #define FTW_PHYS 0
  #define FTW_DEPTH 0
#endif

typedef int (*NFTWProcPtr)(const char *, const struct stat *, int, struct FTW *);

unsigned long MMDoForAllFilesIn ( char *directory, IterateProcPtr apply_proc )
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
		/*
		// traverse the file tree: apply
		result = nftw ( directory, apply_proc, MAX_DEPTH, flags );
		if ( result == -1) {
			perror("nftw");
			return result;
		}

		// now delete the unpacked tree, file by file
		if ( reallyDelete ) {
			flags |= FTW_DEPTH;		// depth-first traversal for deleting the tree
			result = nftw ( directory, delete_file, MAX_DEPTH, flags );
			if ( result == -1) {
				perror("nftw");
				return result;
			}
		}
		*/
		result = 0;
	} else {
		fprintf ( stderr, "MMDoForAllFilesIn: can't find %s", directory );
	}

	return result;
}

short MMFilePathExists ( char *path )
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

int process_js ( const char *fpath, const struct stat *sb, int tflag, sftwptr ftwbuf )
{
    #pragma unused ( sb )
	int idx;
	int result;
	char type[12], buff[1024], indent[128];
	short reallyDelete = 1;
	int level = (int)ftwbuf->level;
	short shouldProcess = 1;

	indent[0] = '\0';
	for ( idx = 0; idx < level; idx++ ) {
		strcat ( indent, "." );
	}

	if ( tflag == FTW_D ) {
		if ( level < 1 ) {
			fprintf ( stderr, "IGNORE: %s", (char *)fpath + ftwbuf->base );
			return 0;
		}
		shouldProcess = 0;		// there shouldn't be any directories in here!
	} else {
		if ( level > 1 ) {
			//shouldProcess = 0;
		}
	}
	if ( shouldProcess ) {
		//char *filename = (char *)fpath + ftwbuf->base;
		char *filename = (char *)fpath;
		if ( strstr(filename,".js") ) {
			printf ( "FILE: %s\n", filename );
			char *infile = filename;
			strcpy ( outfile, infile );
			int len = (int)strlen ( outfile );
			char *ext = (outfile + (len-3));
			if ( strncmp(ext,".js",3) ) {
				printf ( "Usage: jcomp <filename>.js\n" );
				return -1;
			}
			*ext = '\0';	// chop extension
			strcat ( outfile, "-out.js" );

			result = find_functions_and_globals ( infile, outfile );

		} else {
			// printf ( "Not JS file: %s\n", filename );
		}
	}

	if ( !shouldProcess ) {
		sprintf ( buff, "PROCESS_JS DEEP FILE: %s | %s%s", type, indent, (char *)fpath + ftwbuf->base );
		fprintf ( stderr, buff );
		if ( reallyDelete ) {
			//if ( unlink(fpath) ) {		// if it's a file, unlink it, else
			//	rmdir(fpath);			// it's a directory, so rmdir it
			//}
		}
	}
	return 0;           /* To tell nftw() to continue */
}

