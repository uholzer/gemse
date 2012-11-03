#!/bin/sh

# The first argument must be the version number of the release you
# want to package.
# Packages are created in parent directory.

cd ..

rm -f gemse_src-$1.tar.gz
rm -f gemseFirefoxExtension-$1.xpi
rm -f gemseXULRunnerApplication-$1.zip

tar -czf gemse_src-$1.tar.gz -C ../ gemse/approach1

cd approach1
cd src_common
zip -r ../../gemseFirefoxExtension-$1.xpi *
zip -r ../../gemseXULRunnerApplication-$1.zip *

cd ../src_FirefoxExtension
zip -r ../../gemseFirefoxExtension-$1.xpi *

cd ../src_XULRunnerApplication
zip -r ../../gemseXULRunnerApplication-$1.zip *

