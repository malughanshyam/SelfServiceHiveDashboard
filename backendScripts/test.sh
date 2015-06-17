#!/bin/bash
if [ -f log4j.properties ]; then
	rm log4j.properties
fi

cp log4j_template.properties log4j.properties

dataDir="../data/AdHocJobs/55810c3042ef06f713115d36/"
logFilePath=$dataDir"log.txt"
debugLogFilePath=$dataDir"debugLog.txt"

#sed -e "s|\${reportLogFile}|$logFilePath|g" -e "s|\${debugLogFile}|$debugLogFilePath|g" log4j_template.properties > log4j.properties
sed "s|\${reportLogFile}|$logFilePath|g" -e "s|\${debugLogFile}|$debugLogFilePath|g" log4j.properties