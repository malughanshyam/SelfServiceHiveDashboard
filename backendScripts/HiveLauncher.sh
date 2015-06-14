#!/bin/bash
##!/bin/sh - Use it based on system
##
## Usage    : 
##      
##   Scheduled Job :-->
##   HiveLauncher.sh SCHED <JobID> <SQLQueryFile> <OutputDir> <NotifyFlag-Y/N> [NotifyEmail]
##   
##   AdHocJob Job :-->"
##   HiveLauncher.sh ADHOC <JobID> <SQLQueryFile> <OutputDir>
##
## Purpose  : 
##
##

# Usage
usage (){
    echo "-------------------------------------------"
    echo -e "\tUsage"
    echo "-------------------------------------------"
    echo "Scheduled Job :-->"
    echo "$0 SCHED <JobID> <SQLQueryFile> <OutputDir> <NotifyFlag-Y/N> [NotifyEmail]"
    echo 
    echo "AdHocJob Job :-->"
    echo "$0 ADHOC <JobID> <SQLQueryFile> <OutputDir>"
    echo
    exit 1
}

# Update Status and Log Files in case failure
updateStatusLogFileOnFailure () {
    outputDataDir=$1
    statusFile=$2
    logFile=$3
    additionallogMsg=$4
    echo "JOB_FAILED" > $outputDataDir/$statusFile
    echo "Hive Launcher Script Failed! $4 " > $outputDataDir/$logFile
}

# Validations of Arguments
if [ "$1" != "ADHOC" -a "$1" != "SCHED" ]; then
  usage
fi

if [ "$1" == "ADHOC" -a "$#" -ne 4 ]; then
  usage
fi

if [ "$1" == "SCHED" ]; then
  
  if [ $# -lt 5 -o $# -gt 6 ]; then
    usage
  fi
  
  if [ "$5" != "Y" -a "$5" != "N" ]; then
    echo "Error: Invalid Notify Flag. Provide Y/N"
    echo 
    usage
  fi

  if [ "$5" == "Y" ]; then
    if [ -z "$6" ]; then
      echo
      echo "Error: Invalid EmailID!"
      echo
      usage
    fi
  fi
fi

jobType=$1
jobID=$2
sqlQueryFile=$3
outputDir=$4
notifyFlag=$5
notifyEmail=$6

# Output File Names
statusFile='status.txt'
logFile='log.txt'


if [ ! -f $3 ]
then
   additionallogMsg="File $3 doesn't exist!"
   updateStatusLogFileOnFailure $outputDir $statusFile  $logFile $additionallogMsg
   exit 1
fi

if [ ! -r $3 ]
then
   additionallogMsg="$3 is not readable"
   updateStatusLogFileOnFailure $outputDir $statusFile  $logFile $additionallogMsg
   exit 1
fi 


# Change the Current Directory to Hive Script Directory
cd /Users/gmalu/Documents/Project/SelfServiceHiveDashboard/backendScripts

# Hive Server Parameters
hiveHost="172.16.226.129:10000";
hiveDBName="default";
hiveUser="hive";

# Adding JARS to CLASSPATH
HIVE_JARS=./HiveJDBCjars 
for i in ${HIVE_JARS}/*.jar ; do
    CLASSPATH=$CLASSPATH:$i
done

# Mongo Server Parameters
mongoDBhost="localhost"
mongoDBport="27017"

mongoDashboardDB="SelfServiceHiveDashboard"

if [ $jobType == "ADHOC" ]; then
  mongoDashboardDBColl="AdHocJob"
else
  mongoDashboardDBColl="ScheduledJob"
fi

#java -cp $CLASSPATH HiveExecutor $jobID $outputDataDir $hiveUser $hiveHost $dbName $inputQueryFile $mongoDBhost $mongoDBport $dashboardDB $dashboardDBCollection
java -cp $CLASSPATH HiveExecutor $jobID $outputDir $hiveUser $hiveHost $hiveDBName $sqlQueryFile $mongoDBhost $mongoDBport $mongoDashboardDB $mongoDashboardDBColl

# Check the exitStatus
exitStatus=$?

# If not 0, update the status file of the JobID
if [ $exitStatus -ne 0 ]; then
  additionallogMsg="Check if Hive server is up."  
  updateStatusLogFileOnFailure $outputDir $statusFile  $logFile $additionallogMsg
fi
