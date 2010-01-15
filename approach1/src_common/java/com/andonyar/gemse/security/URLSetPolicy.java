/*
 * This file is part of Gemse.
 *
 * Copyright 2009, 2010 Urs Holzer
 *
 * Gemse is licenced under the GNU Public Licence v3 (GPL3), 
 * or (at your option) any later version.
 */

package com.andonyar.gemse.security;

import java.net.URL;
import java.security.CodeSource;
import java.security.Permission;
import java.security.PermissionCollection;
import java.security.Permissions;
import java.security.Policy;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.Set;

/**
 * 
 */
public class URLSetPolicy extends Policy {
    private Permissions   permissions = new Permissions();
    private Policy        outerPolicy;
    private Set<String>   urls = new HashSet<String>(); // Or should we use HashSet<URL>?

    public PermissionCollection getPermissions(CodeSource codesource) {
        PermissionCollection pc = outerPolicy != null ?
                outerPolicy.getPermissions(codesource) :
                new Permissions();
        
        URL url = codesource.getLocation();
        if (url != null) {
            String s = url.toExternalForm();
            if (urls.contains(s) || "file:".equals(s)) {
                Enumeration<Permission> e = permissions.elements();
                while (e.hasMoreElements()) {
                    pc.add(e.nextElement());
                }
            }
        }
        
        return pc;
    }
    
    /**
     * Sets the outer policy so that we can defer to it for code sources that
     * we are not told about.
     * 
     * @param policy
     */
    public void setOuterPolicy(Policy policy) {
        outerPolicy = policy;
    }
    
    public void addPermission(Permission permission) {
        permissions.add(permission);
    }
    
    public void addURL(URL url) {
        urls.add(url.toExternalForm());
    }
}
