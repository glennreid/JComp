.PHONY: tests

CC:=gcc
DEBUG:=

help:
	@echo ""
	@echo "          .~ JComp ~."
	@echo ""
	@echo "make build           - build the binary"
	@echo "make clean           - remove the binary, etc"
	@echo "make tests           - run jcomp on the test folder"
	@echo "make undo            - undo the tests"
	@echo ""

build:
	gcc $(DEBUG) -std=c99 \
		-Wall \
		-Wextra \
		-g \
		-O3 \
		-mshstk \
		-o jcomp jcomp.c

clean:
	rm -f functions.txt
	rm -f identifiers.txt
	rm jcomp

tests:
	./jcomp -v -t 2

undo:
	./jcomp -undo
