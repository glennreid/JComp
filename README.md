# JComp - Javascript Compressor

JComp processes a tree of Javascript sources to rewrite variables and functions to reduce size and (importantly) obfuscate the code. 

### Rationale
It is difficult to change variable names when they are referenced across many files and sometimes other scripts that generate JS (like PHP echo statements).

### C Source code
JComp is a C language source file that comples to a Unix/Linux command line tool called "jcomp".

The source is provided as a single C file, for ultimate simplicity. I could have provided a makefile but it's just command to compile it, and if you don't know how to use gcc, you probably shouldn't be using JComp anyway.

## How to build it
`gcc -o jcomp jcomp.c`

## How to use it
`jcomp` or `./jcomp`

## Command line options
`jcomp -h`
Usage:   jcomp [-v] [-t]ight [-l]oose [-w]arn [-q]uiet [-d]ata [-c]omments [-n]numberlines [-o]rig [-undo]
  commentPlans:
    jcomp -c 0		// comments are preserved
    jcomp -c 1		// comments are elided but visible
    jcomp -c 2		// comments are removed
  tightness:
    jcomp -t 0		// no rewrite at all
    jcomp -t 1		// leave original identifiers in generated _i321 idents
    jcomp -t 2		// leave first char of original identifier, like m_i321
    jcomp -t 3		// absolute minimal identifier, like _321

## Option details
**-v** - verbose
: I'm tempted to put a really long explanation here about what a verbose option might mean

**-t** - tightness
: When identifiers are rewritten, this option controls how tightly to rewrite them. By default it uses tightness 2
: 0 - no rewrite at all
: 1 - leave original identifiers in generated, like `myName_i321`. This makes the file bigger, and is mostly useful for debugging
: 2 - rewrite longer identifiers with just first letter and unique ident, so `myLongName` --> `m_321`
: 3 - absolute minimail identifier; so `myLongName` --> `_321`

**-l** - loose
: Equivalent to `jcomp -t 1`

**-w** - warn
: Doesn't do much

**-q** - quiet
: Prevents any sort of spew on stderr or stdout

**-d** - data
: Writes files in local directory with identifiers found. File is `identifiers.txt` and maybe `functions.txt`

**-c** - commentPlan
Javascript comments (both // and /* */) are rewritten according to three options:
: *0* - comments are preserved intact
: *1* - comments are *elided*, so `/* my longish comment */` becomes `/* 19 elided */`
: *2* - comments are completely removed, including the `//` and `/* */` characters
