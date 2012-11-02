/*
 * This file is part of Gemse.
 *
 * Copyright 2009, 2010 Urs Holzer
 *
 * Gemse is licenced under the GNU Public Licence v3 (GPL3), 
 * or (at your option) any later version.
 */

JavaLink = {
    ready: false,
    broken: false,
    init: function() {
        if (JavaLink.broken || JavaLink.ready) {
            return;
        }

        // Be pesimistic. Will be set to false later on.
        JavaLink.broken = true;

        //Get extension folder installation path...  
        var extensionPath = editor.installationDirectory;
        if (!extensionPath) { throw "Unable to determine the directory where Gemse is installed" }

        // Get the path where the java libraries reside. It is the
        // subdirectory called "java" of extensionPath.
        var libraryPath = extensionPath.clone();
        libraryPath.append("java");
       
        // Compute the URIs of all library files we want to load
        var jars = [];
        //Remember the directories we want to check: The libraryPath and
        //all its subdirectories.
        var directoriesToProcess = [libraryPath];
        var libraryFiles = libraryPath.directoryEntries;
        while (libraryFiles.hasMoreElements()) {
            var libraryFile = libraryFiles.getNext().QueryInterface(Components.interfaces.nsIFile);
            if (libraryFile.isDirectory()) {
                directoriesToProcess.push(libraryFile);
            }
        }
        //Process the directories
        directoriesToProcess.forEach(function(dir) {
            //The directory itself
            jars.push("file:///" + dir.path.replace(/\\/g,"/") + "/");
            //All jar files the directory contains
            var libraryFiles = dir.directoryEntries;
            while (libraryFiles.hasMoreElements()) {
                var libraryFile = libraryFiles.getNext().QueryInterface(Components.interfaces.nsIFile);
                if (/\.jar$/.test(libraryFile.path)) {
                    jars.push("file:///" + libraryFile.path.replace(/\\/g,"/"));
                }
            }
        });

        // Make java URI objects out of the Strings
        var urlArray = jars.map(function (path) { 
            return new java.net.URL(path);
        });

        // We construct a Java array manually. IcedTea doesn't seem to
        // like the JavaScript array.
        var urlArrayJava = java.lang.reflect.Array.newInstance(java.lang.Class.forName("java.net.URL"),urlArray.length);
        urlArray.forEach(function(value, index) {
            java.lang.reflect.Array.set(urlArrayJava, index, value);
        });

        // Problem. See: http://icedtea.classpath.org/bugzilla/show_bug.cgi?id=626
        // https://bugzilla.redhat.com/show_bug.cgi?id=598519
        // https://bugs.launchpad.net/ubuntu/+source/openjdk-6/+bug/596688

        // Obtain a class loader
        //XXX: Do we have to indicate the parental class loader or could
        //we use the constructor that only takes the urlArray?
        var classLoader = new java.net.URLClassLoader(
            urlArrayJava,
            java.lang.Thread.currentThread().getContextClassLoader()
        );  
        JavaLink.classLoader = classLoader;

        // Set up permissions by using our own policy
        var policyClass = classLoader.loadClass('com.andonyar.gemse.security.URLSetPolicy');
        var policy = policyClass.newInstance();
        policy.setOuterPolicy(java.security.Policy.getPolicy());
        policy.addPermission(new java.security.AllPermission());
        urlArray.forEach(function (u) { policy.addURL(u) });
        java.security.Policy.setPolicy(policy);
    },
    getClass: function(className) {
        return JavaLink.classLoader.loadClass(className);
    },
};

