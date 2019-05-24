#!/bin/bash
version=$1
scp -P 934 ./wl-v${version}.tar.gz bruce@wl.warptome.net:~/ && \
ssh -t -p934 bruce@wl.warptome.net "sudo ./do-wl-update.sh \"${version}\""
