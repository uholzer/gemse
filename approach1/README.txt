Welcome to Gemse Approach 1
Website: <http://www.andonyar.com/rec/2008-12/gemse/>
Author: Urs Holzer <urs@andonyar.com>

This folder is structured into three source directories and two test
directories:

src_common
  Contains all source code and documentation
src_FirefoxExtension
  Contains files that are only needed by the Firefox extension
src_XULRunnerApplication
  Contains files that are only needed by the XULRunner application
test_FirefoxExtension
  Collection of all files needed for the Firefox extension using
  links to src_common and src_FirefoxExtension. You can link this
  directory from your Firefox profile by putting a text file into the
  extension folder of you profile, which is called Gemse@andonyar.com
  and contains the absolute path of this directory. Like this, you can
  test your changes to the source directly in firefox, without
  repackaging and reinstalling Gemse.
test_XULRunnerApplication
  Collects all files needed for the XULRunner application, using
  symbolic links to src_common and src_XULRunnerApplication. In this
  directory you can run
    xulrunner-1.9 application.ini
  to run Gemse as a XULRunner application. Be aware that the file
  test_XULRunnerApplication/application.ini is a copy of
  src_XULRunnerApplication/application.ini instead of a symbolic link
  because XULRunner does not like it to be a symbolic link. This is
  the only exception thoguh.

The file makepackages.sh is a small shell script that creates the
packages gemseFirefoxExtension.xpi, gemseXULRunnerApplication.xpi,
gemseMinimal.zip using zip and gemse_src.tar.gz using tar.
For gemseFirefoxExtension.xpi, it merges src_common and
src_FirefoxExtension. For gemseXULRunnerApplication.xpi it merges
src_common and src_XULRunnerApplication. gemseMinimal.zip contains the
content of the folder src_common/chrome/content, it is intended to be
used as unprivileged (that is not in chrome) application in Firefox.
It is the same as the demo on the website. gemse_src.tar.gz contains the
whole development directory gemse/approach1.

Be aware that there is no automatic mechanism to update the version
numbers in the various files. You have to do that by hand.

In src_common/chrome/content/doc/dev/ you find documentation useful
for developers. It describes the basic concepts behind Gemse. More
detailed documentation is in the sourcecode and can be extracted using
the JsDoc toolkit.

License:
    Gemse free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

You can find a copy of the license in the file COPYING.

