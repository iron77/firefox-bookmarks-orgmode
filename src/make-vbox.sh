#!/bin/bash
TARGET=~/Documents/bookmarks-orgmode
if [[ ! -d $TARGET ]]; then mkdir $TARGET; fi
cd ..
cp --no-preserve=all -rf . $TARGET
cd $TARGET/src
make