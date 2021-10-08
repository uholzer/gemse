#!/usr/bin/perl

#This file is part of Gemse.
#
#Copyright 2009, 2010 Urs Holzer
#
#Gemse is licenced under the GNU Public Licence v3 (GPL3), 
#or (at your option) any later version.

# This script reads a DTD like w3centities-f.ent and writes a list of
# all entities to entity_table.txt. Every line contains one entity,
# first its name (not including & and ;), then seperated by tabulator, the
# decoded value.

open $dtd, '<', 'w3centities-f.ent';
open $table, '>', 'entity_table.txt';
binmode $table, ":encoding(UTF-8)";

while ($line = <$dtd>) {
    if($line =~ /\<!ENTITY\s+(\w+)\s+"([^"]+)"\s*\>/) {
        $name = $1;
        $encoded_value = $2;
        # Decode the entites. This has to be done twice!
        $value = &decode_entities(&decode_entities($encoded_value)); 
        # Write output
        print $table $name, "\t", $value, "\n";
    }
}

sub decode_entities() {
    my $string = shift;
    $string =~ s/\&\#(x?)([0-9A-Fa-f]+);/chr ($1 ? hex $2 : $2)/ge;
    return $string;
}

