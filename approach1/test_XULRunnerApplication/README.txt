Using a symbolic link
application.ini > ../src_XULRunnerApplication/application.ini
does not work for some unknown reason. (I believe that XULRunner then
looks for the other files in ../src_XULRunnerApplication instead of
where the link is located.) So the file application.ini in this
directory is a copy of the one in ../src_XULRunnerApplication.
