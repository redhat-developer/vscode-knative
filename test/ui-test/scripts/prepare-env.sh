#!/bin/sh

# Test slave's virtualization
${WORKSPACE}/cdk-scripts/scripts/cdk3-virt.sh

# export workspace location that is os dependent - due to cygwin on windows
cd ${WORKSPACE}
export WORKSPACE2=$(pwd)
CONTENT="WORKSPACE2=${WORKSPACE2}"
echo "$CONTENT" > ${WORKSPACE2}/local_env.properties

# Set os - dependent values
HYPERVISOR=
BASEFILE_NAME="crc"
if [[ $(uname) == *Darwin* ]]; then
    HYPERVISOR="xhyve"
elif [[ $(uname) == *Linux* ]]; then
    HYPERVISOR="kvm"
elif [[ $(uname) == *CYGWIN* ]]; then
    HYPERVISOR="virtualbox"
    BASEFILE_NAME="crc.exe"
fi
echo "HYPERVISOR=$HYPERVISOR" >> ${WORKSPACE2}/local_env.properties
echo "BASEFILE_NAME=$BASEFILE_NAME" >> ${WORKSPACE2}/local_env.properties

URL="URL="

FILE_ENDING=
OS=
if [[ $(uname) == *Darwin* ]]; then
  OS="macos"
  FILE_ENDING="crc-$OS-amd64.tar.xz"
elif [[ $(uname) == *Linux* ]]; then
  OS="linux"
  FILE_ENDING="crc-$OS-amd64.tar.xz"
elif [[ $(uname) == *CYGWIN* ]]; then
  OS="windows"
  FILE_ENDING="crc-$OS-amd64.zip"
fi
URL="${URL}${CRC_URL}/${FILE_ENDING}"

echo "${URL}" >> ${WORKSPACE2}/local_env.properties
echo "OS=${OS}" >> ${WORKSPACE2}/local_env.properties
echo "FILE_ENDING=${FILE_ENDING}" >> ${WORKSPACE2}/local_env.properties