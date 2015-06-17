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
    echo "$0 SCHED <JobID> <JobName> <SQLQueryFile> <OutputDir> <NotifyFlag-Y/N> [NotifyEmail]"
    echo 
    echo "AdHocJob Job :-->"
    echo "$0 ADHOC <JobID> <JobName> <SQLQueryFile> <OutputDir>"
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
    echo "Hive Launcher Script Failed! " "$additionallogMsg" >> $outputDataDir/$logFile
}

# Validations of Arguments
if [ "$1" != "ADHOC" -a "$1" != "SCHED" ]; then
  usage
fi

if [ "$1" == "ADHOC" -a "$#" -ne 5 ]; then
  usage
fi

if [ "$1" == "SCHED" ]; then
  
  if [ $# -lt 5 -o $# -gt 6 ]; then
    usage
  fi
  
  if [ "$6" != "Y" -a "$6" != "N" ]; then
    echo "Error: Invalid Notify Flag. Provide Y/N"
    echo 
    usage
  fi

  if [ "$6" == "Y" ]; then
    if [ -z "$7" ]; then
      echo
      echo "Error: Invalid EmailID!"
      echo
      usage
    fi
  fi
fi

jobType=$1
jobID=$2
jobName=$3
sqlQueryFile=$4
outputDir=$5
notifyFlag=$6
notifyEmail=$7

# Output File Names
statusFile='status.txt'
logFile='log.txt'


if [ ! -f $sqlQueryFile ]
then
   additionallogMsg="File $sqlQueryFile doesn't exist!"
   updateStatusLogFileOnFailure $outputDir $statusFile  $logFile "$additionallogMsg"
   exit 1
fi

if [ ! -r $sqlQueryFile ]
then
   additionallogMsg="$sqlQueryFile is not readable"
   updateStatusLogFileOnFailure $outputDir $statusFile  $logFile "$additionallogMsg"
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


# Setting up the Log4J Log Files
logFilePath=$outputDir"\/log.txt"
debugLogFilePath=$outputDir"\/debugLog.txt"

sed -e "s|\${reportLogFile}|$logFilePath|g" -e "s|\${debugLogFile}|$debugLogFilePath|g" log4j_template.properties > log4j.properties

#java -cp $CLASSPATH HiveExecutor $jobID $outputDataDir $hiveUser $hiveHost $dbName $inputQueryFile $mongoDBhost $mongoDBport $dashboardDB $dashboardDBCollection
java -cp $CLASSPATH HiveExecutor $jobID $jobName $outputDir $hiveUser $hiveHost $hiveDBName $sqlQueryFile $mongoDBhost $mongoDBport $mongoDashboardDB $mongoDashboardDBColl

# Check the exitStatus
exitStatus=$?

# If not 0, update the status file of the JobID
if [ $exitStatus -ne 0 ]; then
  additionallogMsg="Check if Hive server is up."  
  updateStatusLogFileOnFailure $outputDir $statusFile  $logFile "$additionallogMsg"
fi

# # Email Alert
# if [ $notifyFlag == 'N']; then
#   exit 0

# outputDir="../data/ScheduledJobs/5580d9bffce9da2b65a7ca5f"
# statusFile="status.txt"
# jobName="TopTrends" #$jobName
# jobStatus=`cat $outputDir/$statusFile`
# jobResultURL=`echo "http://localhost:8080/dashboard.html"`

# mailSubject="Subject: Job - "$jobName" ["$jobStatus"] "$'\n'

# mailBody=`echo -e "\nThe Job - $jobName has completed with the status\t:  "`
# mailBody=$mailBody$jobStatus$'\n'
# mailBody=$mailBody`echo -e "\nCheck out more details at : "`
# mailBody=$mailBody$jobResultURL$'\n'

# mailSignature=$'\n'$'\n'"--"$'\n'
# mailSignature=$mailSignature"Self Service Hive Dashboard"$'\n'

# mailComplete=$mailSubject$mailBody$mailSignature

# echo "$mailComplete" | /usr/sbin/sendmail gmalu@ebay.com -f"SelfServiceHiveDashboard"
