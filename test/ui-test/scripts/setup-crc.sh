#!/bin/sh

# inject env. variables from env properties file
set -a
cd ${WORKSPACE}
. ./local_env.properties
set +a
# Download and setup CRC and pull secret
cd ${WORKSPACE2}
mkdir -p crc
cd crc
if [ -f ./crc ]; then
  ls 
  echo "crc binary exists, skipping"
else
  wget ${URL}
  tar xvf ${FILE_ENDING}
  mv */crc* .
  chmod +x crc*
fi

./crc setup

./${BASEFILE_NAME} status || true
./${BASEFILE_NAME} version || true