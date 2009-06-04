#!/bin/sh
rm -f gemseFirefoxExtension.xpi
rm -f gemseXULRunnerApplication.xpi

cd src_common
zip -r ../gemseFirefoxExtension.xpi *
zip -r ../gemseXULRunnerApplication.xpi *

cd ../src_FirefoxExtension
zip -r ../gemseFirefoxExtension.xpi *

cd ../src_XULRunnerApplication
zip -r ../gemseXULRunnerApplication.xpi *

