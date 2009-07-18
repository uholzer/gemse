#!/bin/sh
rm -f gemse_src.tar.gz
rm -f gemseFirefoxExtension.xpi
rm -f gemseXULRunnerApplication.zip
rm -f gemseMinimal.zip

cd ../..
tar -czf gemse/approach1/gemse_src.tar.gz gemse/approach1/*
cd gemse/approach1/

cd src_common
zip -r ../gemseFirefoxExtension.xpi *
zip -r ../gemseXULRunnerApplication.zip *

cd ../src_FirefoxExtension
zip -r ../gemseFirefoxExtension.xpi *

cd ../src_XULRunnerApplication
zip -r ../gemseXULRunnerApplication.zip *

cd ../src_common/chrome/content/
zip -r ../../../gemseMinimal.zip *

