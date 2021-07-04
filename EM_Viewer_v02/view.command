#!/bin/bash

MY_DIRNAME=$(dirname $0)
cd $MY_DIRNAME

open -a "Google Chrome" --args --allow-file-access-from-files file:///$MY_DIRNAME/index.html

exit

