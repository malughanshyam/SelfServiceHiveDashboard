#!/bin/bash
cd /Users/gmalu/Documents/Project/SelfServiceHiveDashboard/backendScripts
if [ $# != 3 ]
then
    echo "Incorrect number of arguments !"
    #echo "Usage : $0 hiveUserName hiveHost dbName hiveQueryFile"
    echo "Usage : $0 jobID hiveQueryFile outputDataDir"
    echo
    exit 1
fi

if [ ! -f $4 ]
then
   echo "File $4 doesn't exist!"
   exit 1
fi

if [ ! -r $4 ]
then
   echo "$4 is not readable"
   exit 1
fi 

# Parameters
hiveHost="172.16.226.129:10000";
dbName="default";
hiveUser="hive";

statusFile='status.txt'
logFile='log.txt'

#jobID="$hiveUser`date '+%Y%m%d%H%M%S'`" 	
jobID=$1 	

inputQueryFile=$2

#outputDataDir="/Users/gmalu/Documents/Project/HiveDashboard/data/"
outputDataDir=$3


HIVE_JARS=./HiveJDBCjars 
 
for i in ${HIVE_JARS}/*.jar ; do
    CLASSPATH=$CLASSPATH:$i
done

mongoDBhost="localhost"
mongoDBport="27017"
dashboardDB="SelfServiceHiveDashboard"
dashboardDBCollection="AdHocJob"

java -cp $CLASSPATH HiveExecutor $jobID $outputDataDir $hiveUser $hiveHost $dbName $inputQueryFile $mongoDBhost $mongoDBport $dashboardDB $dashboardDBCollection

# Check the exitStatus
exitStatus=$?

# If not 0, update the status file of the JobID
if [ $exitStatus -ne 0 ]; then
        echo "JOB_FAILED" > $outputDataDir/$statusFile
        echo "Hive Launcher Script Failed! Check if Hive server is up. " > $outputDataDir/$logFile
fi
