#!/bin/bash
##############################################################################################
## 
## HiveLauncher.sh
##
## Usage    :  
##            Scheduled Job :-->
##            HiveLauncher.sh SCHED <JobID> <SQLQueryFile> <OutputDir> <NotifyFlag-Y/N> [NotifyEmail]
##            
##            AdHocJob Job :-->"
##            HiveLauncher.sh ADHOC <JobID> <SQLQueryFile> <OutputDir>
##
## Purpose  : Launches the Hive Executor Java Client to execute the given Query File
##            Maintains the Job Status and Job Log files
##            Sends email alerts based on the NotifyFlag  
##
##  Author  : Ghanshhyam Malu
##            gmalu@ebay.com
##
##  Created : June 17, 2015
##
##  Modified : 
##  
##############################################################################################

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
    jobID=$1
    outputDataDir=$2
    statusFile=$3
    logFile=$4
    additionallogMsg=$5
    mongoDBhost=$6
    mongoDBport=$7
    mongoDashboardDBColl=$8
    MONGO_PATH=$9
    
    echo "JOB_FAILED" > $outputDataDir/$statusFile
    echo "Hive Launcher Script Failed! " "$additionallogMsg" >> $outputDataDir/$logFile

    # Update Job Status in MongoDB
    $MONGO_PATH/mongo --host $mongoDBhost --port $mongoDBport SelfServiceHiveDashboard --eval 'db.'"$mongoDashboardDBColl"'.update({JobID: "'$jobID'"},{$set: {JobRunStatus : "JOB_FAILED" } })'
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

# Initialize the parameters
jobType=$1
jobID=$2
jobName=$3
sqlQueryFile=$4
outputDir=$5
notifyFlag=$6
notifyEmail=$7

# Output File Names
statusFile='status.txt'
logFile='log.log'
debugLogFile='debug.log'

MONGO_PATH=../lib/mongodb/bin/

# Validate if Query file exists
if [ ! -f $sqlQueryFile ]
then
   additionallogMsg="File $sqlQueryFile doesn't exist!"
   updateStatusLogFileOnFailure $outputDir $statusFile  $logFile "$additionallogMsg" $mongoDBhost $mongoDBport $mongoDashboardDBColl $MONGO_PATH
   exit 1
fi

# Validate if Query file is readable
if [ ! -r $sqlQueryFile ]
then
   additionallogMsg="$sqlQueryFile is not readable"
   updateStatusLogFileOnFailure $outputDir $statusFile  $logFile "$additionallogMsg" $mongoDBhost $mongoDBport $mongoDashboardDBColl $MONGO_PATH
   exit 1
fi 

# Change the Current Directory to Hive Script Directory
#cd /Users/gmalu/Documents/Project/SelfServiceHiveDashboard/backendScripts

# Hive Server Parameters
hiveHost="172.16.226.129:10000";
#hiveHost="vqctd-hadoopas1.phx01.ebayadvertising.com:10000"
hiveDBName="default"
hiveUser="hive"

# Adding JARS to CLASSPATH
HIVE_JARS=./HiveJDBCjars 
for i in ${HIVE_JARS}/*.jar ; do
    CLASSPATH=$CLASSPATH:$i
done

# Mongo Server Parameters
mongoDBhost="localhost"
mongoDBport="8097"

# MongoDB Database
mongoDashboardDB="SelfServiceHiveDashboard"

# MongoDB Collection
if [ $jobType == "ADHOC" ]; then
  mongoDashboardDBColl="AdHocJob"
else
  mongoDashboardDBColl="ScheduledJob"
fi

# Setting up the Log4J Log Files
logFilePath=$outputDir"\/"$logFile
debugLogFilePath=$outputDir"\/"$debugLogFile

# Create a new JobID specific log4j.properties file using the log4j_template.properties template file
sed -e "s|\${reportLogFile}|$logFilePath|g" -e "s|\${debugLogFile}|$debugLogFilePath|g" log4j_template.properties > log4j.properties

# Launch the HiveExecutor Java program with the appropriate parameters
java -cp $CLASSPATH HiveExecutor $jobID $jobName $outputDir $hiveUser $hiveHost $hiveDBName $sqlQueryFile $mongoDBhost $mongoDBport $mongoDashboardDB $mongoDashboardDBColl

# Check the exitStatus
exitStatus=$?
echo "Exiting with status code:"$exitStatus

# If not 0, update the Status and Log file of the JobIDs
# if [ $exitStatus -ne 0 ]; then
#   additionallogMsg="Check if Hive server is up."
#   updateStatusLogFileOnFailure $outputDir $statusFile  $logFile "$additionallogMsg"
# fi

if [ $exitStatus -ne 0 ]; then
  additionallogMsg="."
  updateStatusLogFileOnFailure $jobID $outputDir $statusFile  $logFile $additionallogMsg $mongoDBhost $mongoDBport $mongoDashboardDBColl $MONGO_PATH
fi



## Send Email
## Check Notify Flag to proceed. If "N", then exit gracefully
#if [ $notifyFlag == 'N']; then
#  exit 0

#
## jobType="SCHED"
## jobID="55826c6395c8393709756ff6"
## outputDir="../data/ScheduledJobs/5580d9bffce9da2b65a7ca5f"
## statusFile="status.txt"
## jobName="TopTrends" #$jobName
## notifyEmail="gmalu@ebay.com"
#
#jobStatus=`cat $outputDir/$statusFile`
#
#jobResultURL="http://localhost:8080/views/jobresults.html?jobType="
#jobResultURL=$jobResultURL$jobType
#jobResultURL=$jobResultURL"&jobID="$jobID
##jobResultURL=`echo "http://localhost:8080/views/jobresults.html?jobType=SCHED&jobID=55826c6395c8393709756ff6"`
#
#mailSubject="Subject: Job - "$jobName" ["$jobStatus"] "$'\n'
#
#mailBody=`echo -e "\nThe Job - $jobName has completed with the status\t:  "`
#mailBody=$mailBody$jobStatus$'\n'
#mailBody=$mailBody`echo -e "\nCheck out more details at : "`
#mailBody=$mailBody$jobResultURL$'\n'
#
#mailSignature=$'\n'$'\n'"--"$'\n'
#mailSignature=$mailSignature"Self Service Hive Dashboard"$'\n'
#
#mailComplete=$mailSubject$mailBody$mailSignature
#
#echo "$mailComplete" | /usr/sbin/sendmail gmalu@ebay.com -f"SelfServiceHiveDashboard"
##echo "$mailComplete" > "mail_$notifyEmail.txt"
