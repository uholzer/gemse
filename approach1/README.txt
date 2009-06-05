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
packages gemseFirefoxExtension.xpi and gemseXULRunnerApplication.xpi
using zip. For gemseFirefoxExtension.xpi, it merges src_common and
src_FirefoxExtension. For gemseXULRunnerApplication.xpi it merges
src_common and src_XULRunnerApplication.

Be aware that there is no automatic mechanism to update the version
numbers in the various files. You have to do that by hand.

In src_common/chrome/content/doc/dev/ you find documentation useful
for developers. It describes the basic concepts behind Gemse. More
detailed documentation is in the sourcecode and can be extracted using
the JsDoc toolkit.

Which license to use has not yet been decided. If you want to
modify or distribute Gemse, please contact the author. (Most likely,
Gemse will be under the GPL 2 or 3. It may also be available under
other, less restrictive licenses.)

