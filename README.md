# JComp - Javascript Compressor

JComp processes a tree of Javascript source files to rewrite variables and functions to reduce size and (importantly) obfuscate the code. 

# Rationale
Most available "minifiers" or "obfuscators" or "uglifiers" don't actually rewrite the variable names, they just remove white space,
which is put back automatically in browsers with "pretty printers". If you really want to obfuscate your code, you have to rewrite
all the identifiers.

It is difficult to change variable names when they are referenced across many files and sometimes other scripts that generate JS (like PHP echo statements).
This was the genesis of JComp -- to solve this problem. It does the gnarly work to find all the references to functions and variables
to make them consistent across a whole project, not just within a single file. It's harder than it sounds -- you basically have to
write a Javascript compiler, although JComp is a clever, minimal first approximation which scans for relevant tokens and decides
how to rewrite them, carefully considering comment blocks and string bodies and multi-language stuff like PHP code that emits
fragments of Javascript, and HTML files that contain `<script>` blocks, or all three, like an HTML file with something like this:

`<span><?php echo "var myVar = $serverVal;\n" ?></span>`.

# How it works
If you declare a `function` in one Javascript file, and use it in another (which everyone does all the time), and you want to change
the name of the function, you have to find and edit every occurence of the name. That's exactly what JComp does. Not just for function
names, but for variable names (identifiers) as well. In order to do this, it must parse *all the files* that are used in the project,
and potentially rewrite some of them (notably just Javascript **`.js`** files and HTML files (including **`.shtml`**).

JComp recursively processes all the directories from *current working directory* where it is invoked, looking for JS and HTML
files. If it finds some, it makes a backup of the file and rewrites it. It strips comments, rewrites identifiers, and tries not to
break anything. The longer and more readable your identifier names are, the more dramatic the effect of JComp.

## Example
### Input
```
function encode_params ( uid, pid, gid, type="" )
{
	var code = btoa ( `${uid} ${pid} ${gid} ${type}` );
	code = code.replaceAll ( "=", "" );
	return code;
}
```
### Output
```
function e_110 ( u_916, p_923, g_917, type="" )
{
	var c_1033 = btoa ( `${u_916} ${p_923} ${g_917} ${type}` );
	c_1033 = c_1033.replaceAll ( "=", "" );
	return c_1033;
}
```

### Reserved words
There are quite a few *reserved words* in Javascript that can't be rewritten, like `if` and `function` and
`decodeURI` and lots of others. JComp won't rewrite them. 
In the example above, `function`, `type`, `btoa`, and `return` are reserved words.
`replaceAll` is after a dot `.` so it is not rewritten either (it also is a reserved word, but if it were
your own object and attribute name, it would leave it alone too. I got the list from here:

[www.w3schools.com/Js/js_reserved.asp](https://www.w3schools.com/Js/js_reserved.asp)

## Identifiers within HTML
There are a few places where normal HTML file has javascript references that aren't inside `<script>` tags.
The most notable (and the only ones handled currently by JComp) are attributes like `onclick` that
attach functions to DOM objects. JComp has a list of those attributes, and will parse for and replace
Javascript identifiers inside the handler for the attribute (like `onclick='myFunction(myArgs);'`).
The list of attributes comes from here:

[www.w3schools.com/TAGs/ref_attributes.asp](https://www.w3schools.com/TAGs/ref_attributes.asp)

I only use a few of these, like `onclick` and `onkeyup` and a few others, so it isn't tested yet for things
like the video playback attributes. Hey, it's free open-source software, right?

### Caveats
If you use external libraries with identifiers that shouldn't be changed (like JQuery), there's no way JComp currently
can know that, so it will mess up your sources unless you add all of the relevant identifiers to the list of reserved
words. Since I use JQuery and Quill and Google Maps, I've added a handful of those identifiers. If you like JComp
and want to use it and run into this problem, you can edit the source to easily add reserved words. The list is
right at the top of the file and really obvious how it works.

### Backup files
When JComp sees a **`.js`** or **`.html`** file, it creates a backup folder in that directory called **BAK**, and makes a copy of
the source file in there. It then processes that original `BAK/myFile.js` file, writing the results back to the original filename `myFile.js`.
If you re-run JComp, it will always process the original BAK file

# C Source code
JComp is a C language source file that comples to a Unix/Linux command line tool called "jcomp".

The source is provided as a single C file, for ultimate simplicity. I could have provided a makefile but it's just single command to compile it, and if you don't know how to use gcc, you probably shouldn't be using JComp anyway.
I'm kind of proud that it's just a single C file, and less than 1200 lines of clean code with no external dependencies.
I was brought up right.

## How to build it
`gcc -o jcomp jcomp.c`

# How to use it: running `jcomp`
`jcomp` or `./jcomp`

JComp runs through all the folders in the current directory, and is somewhat aggressive about finding and rewriting files,
so make sure you have a backup or a least understand how it works (it makes its own backups, but be careful).

## Command line options
Usage:   `jcomp [-t]ight [-l]oose [-w]arn [-q]uiet [-d]ata [-c]omments [-n]numberlines [-o]rig [-undo] [-v]erbose [-h]elp `

## Option details
**-v** : verbose\
I'm tempted to put a really long explanation here about what a verbose option might mean

**-t** : tightness\
When identifiers are rewritten, this option controls how tightly to rewrite them. By default it uses tightness 2
> **0** - no rewrite at all\
> **1** - leave original identifiers in generated, like `myName_i321`. This makes the file bigger, and is mostly useful for debugging\
> **2** - rewrite longer identifiers with just first letter and unique ident, so `myLongName` --> `m_321`\
> **3** - absolute minimail identifier; so `myLongName` --> `_321`\

**-l** : loose\
equivalent to `jcomp -t 1`

**-w** : warn\
doesn't do much

**-q** : quiet\
prevents any sort of spew on stderr or stdout

**-d** : data\
writes files in local directory with identifiers found. File is `identifiers.txt` and maybe `functions.txt`

**-c** - commentPlan\
rewrites Javascript comments (both // and /* */) according to three options:
> **0** - comments are preserved intact\
> **1** - comments are *elided*, so `/* my longish comment */` becomes `/* 19 elided */`\
> **2** - comments are completely removed, including the `//` and `/* */` characters\

**-n** : number lines\
Adds line numbers before each line of output. Only for debugging

This adds **`001: `** style line numbers before each line of output, which makes the output not legal Javascript anymore, but if JComp doesn't work,
this can be helpful in tracking down which lines of code are confusing it.

**-o** : orig\
This is only meaningful in the context of **-n** line numbering.

When comments are removed during rewrite, or if (in the future) whitespace is reduced, the line numbers in the
output will not match the line numbers from the original JS source. using **-o** will emit the original line numbers,
so you can correlate the output back to the input source. Also useful only in debugging.

**-undo** : undo\
Reverses the entire process, finding all the BAK files and putting them back in the original files.

This is designed to clean up any mess that JComp might have made of your source code, by restoring the
original BAK files (and removing the BAK directory). If you want to update your JS code, run this first,
copy your new JS files into their position, then re-run JComp to process the new tree.

Note that this is somewhat destructive. Or less destructive. You decide. But it does make a lot of changes to the source tree.

**-h** : help\
Emits this when invoked from the command line
```
`Usage:   jcomp [-t]ight [-l]oose [-w]arn [-q]uiet [-d]ata [-c]omments [-n]numberlines [-o]rig [-undo] [-v]erbose [-h]elp `
  commentPlans:
    jcomp -c 0		// comments are preserved
    jcomp -c 1		// comments are elided but visible
    jcomp -c 2		// comments are removed
  tightness:
    jcomp -t 0		// no rewrite at all
    jcomp -t 1		// leave original identifiers in generated _i321 idents
    jcomp -t 2		// leave first char of original identifier, like m_i321
    jcomp -t 3		// absolute minimal identifier, like _321
```

