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
}

# Update Status and Log Files in case failure
updateStatusFile () {
    jobStatus=$1
    outputDataDir=$2
    statusFile=$3
    echo "$jobStatus" > $outputDataDir/$statusFile
}

# Update Status and Log Files in case failure
updateLogFile () {
    jobID=$1
    outputDataDir=$2
    logFileName=$3
    logMsgType=$4
    logMsg=$5
    echo "`date +"%F %T"` $logMsgType HiveLauncherScript - $logMsg" >> $outputDataDir/$logFileName
}

# Update Job Status in MongoDB
updateStatusInMongoDB () {
    MONGO_PATH=$1
    mongoDBhost=$2
    mongoDBport=$3
    mongoDashboardDBColl=$4
    jobID=$5
    jobStatus=$6
    $MONGO_PATH/mongo --host $mongoDBhost --port $mongoDBport SelfServiceHiveDashboard --eval 'db.'$mongoDashboardDBColl'.update({JobID: "'$jobID'"},{$set: {JobRunStatus : "'$jobStatus'" } })'   
}

# Validations of Arguments
if [ "$1" != "ADHOC" -a "$1" != "SCHED" ]; then
  usage
  exit 1
fi

if [ "$1" == "ADHOC" -a "$#" -ne 5 ]; then
  usage
  exit 1
fi

if [ "$1" == "SCHED" ]; then
  
  if [ $# -lt 5 -o $# -gt 6 ]; then
    usage
    exit 1
  fi
  
  if [ "$6" != "Y" -a "$6" != "N" ]; then
    echo "Error: Invalid Notify Flag. Provide Y/N"
    echo 
    usage
    exit 1
  fi

  if [ "$6" == "Y" ]; then
    if [ -z "$7" ]; then
      echo
      echo "Error: Invalid EmailID!"
      echo
      usage
      exit 1
    fi
  fi
fi

# Initialize the parameters
jobType=$1
jobID=$2
jobName=$3
sqlQueryFile=$4
outputDataDir=$5
notifyFlag=$6
notifyEmail=$7

# Output File Names
statusFile='status.txt'
logFile='log.log'
debugLogFile='debug.log'
resultFile='result.txt'

MONGO_PATH=../lib/mongodb/bin/
# Hive Server Parameters
hiveHost="172.16.226.129:10000";
#hiveHost="vqctd-hadoopas1.phx01.ebayadvertising.com:10000"
hiveDBName="default"
hiveUser="hive"

# Mongo Server Parameters
mongoDBhost="localhost"
mongoDBport="8097"

# MongoDB Database
mongoDashboardDB="SelfServiceHiveDashboard"

# Log into Debug Log File
logMsg="******** Beginning Execution of Hive Launcher Script ********"
updateLogFile $jobID $outputDataDir $logFile "INFO " "$logMsg" 
updateLogFile $jobID $outputDataDir $debugLogFile "INFO " "$logMsg" 

# Validate if Query file exists
if [ ! -f $sqlQueryFile ]; then
      
   logMsg="File $sqlQueryFile doesn't exist! \nHive Executor Script Failed! "
   updateLogFile $jobID $outputDataDir $logFile "ERROR" "$logMsg" 
   updateLogFile $jobID $outputDataDir $debugLogFile "ERROR" "$logMsg"
   
   jobStatus="JOB_FAILED"
   updateStatusFile $jobStatus $outputDataDir $statusFile

   updateStatusInMongoDB $MONGO_PATH $mongoDBhost $mongoDBport $mongoDashboardDBColl $jobID $jobStatus
   exit 1
fi

# Validate if Query file is readable
if [ ! -r $sqlQueryFile ]; then
   
   logMsg="$sqlQueryFile is not readable \nHive Executor Script Failed! "
   updateLogFile $jobID $outputDataDir $logFile "ERROR" "$logMsg" 
   updateLogFile $jobID $outputDataDir $debugLogFile "ERROR" "$logMsg" 

   jobStatus="JOB_FAILED"
   updateStatusFile $jobStatus $outputDataDir $statusFile

   updateStatusInMongoDB $MONGO_PATH $mongoDBhost $mongoDBport $mongoDashboardDBColl $jobID $jobStatus
   exit 1
fi 

###### Clean Up ######
# Initialize Status file
jobStatus="JOB_NOT_STARTED"
updateStatusFile $jobStatus $outputDataDir $statusFile


# Remove Log file if exists
if [ -f $outputDataDir/$logFile ]; then
  rm $outputDataDir/$logFile

  # Log into High Level Log File
  logMsg="******** Beginning Execution of Hive Launcher Script ********"
  updateLogFile $jobID $outputDataDir $logFile "INFO " "$logMsg" 

  logMsg="Cleaned up old Log file: $outputDataDir/$logFile"
  updateLogFile $jobID $outputDataDir $logFile "INFO " "$logMsg" 
  updateLogFile $jobID $outputDataDir $debugLogFile "INFO " "$logMsg" 
fi


# Remove Result file if exists
if [ -f $outputDataDir/$resultFile ]; then
  rm $outputDataDir/$resultFile
  logMsg="Cleaned up old Result file: $outputDataDir/$resultFile"
  updateLogFile $jobID $outputDataDir $logFile "INFO " "$logMsg" 
  updateLogFile $jobID $outputDataDir $debugLogFile "INFO " "$logMsg" 
fi


# Change the Current Directory to Hive Script Directory
#cd /Users/gmalu/Documents/Project/SelfServiceHiveDashboard/backendScripts


# Adding JARS to CLASSPATH
HIVE_JARS=./HiveJDBCjars 
for i in ${HIVE_JARS}/*.jar ; do
    CLASSPATH=$CLASSPATH:$i
done


# MongoDB Collection
if [ $jobType == "ADHOC" ]; then
  mongoDashboardDBColl="AdHocJob"
else
  mongoDashboardDBColl="ScheduledJob"
fi

# Setting up the Log4J Log Files
logFilePath=$outputDataDir"\/"$logFile
debugLogFilePath=$outputDataDir"\/"$debugLogFile

# Create a new JobID specific log4j.properties file using the log4j_template.properties template file
sed -e "s|\${reportLogFile}|$logFilePath|g" -e "s|\${debugLogFile}|$debugLogFilePath|g" log4j_template.properties > log4j.properties

# Updating Status to JOB_IN_PROGRESS
logMsg="Initiating execution of Hive Executor Script"
updateLogFile $jobID $outputDataDir $logFile "DEBUG" "$logMsg" 
updateLogFile $jobID $outputDataDir $debugLogFile "DEBUG" "$logMsg" 
jobStatus="JOB_IN_PROGRESS"
updateStatusFile $jobStatus $outputDataDir $statusFile
updateStatusInMongoDB $MONGO_PATH $mongoDBhost $mongoDBport $mongoDashboardDBColl $jobID $jobStatus


# Launch the HiveExecutor Java program with the appropriate parameters
java -cp $CLASSPATH HiveExecutor $jobID $jobName $outputDataDir $hiveUser $hiveHost $hiveDBName $sqlQueryFile

# Check the exitStatus
exitStatus=$?
logMsg="Exiting HiveExecutor with status code:"$exitStatus
updateLogFile $jobID $outputDataDir $logFile "DEBUG" "$logMsg" 
updateLogFile $jobID $outputDataDir $debugLogFile "DEBUG" "$logMsg" 

if [ $exitStatus -ne 0 ]; then
  logMsg="Hive Executor Script Failed! "
  updateLogFile $jobID $outputDataDir $logFile "ERROR" "$logMsg" 
  updateLogFile $jobID $outputDataDir $debugLogFile "ERROR" "$logMsg" 

  jobStatus="JOB_FAILED"
  updateStatusFile $jobStatus $outputDataDir $statusFile

  updateStatusInMongoDB $MONGO_PATH $mongoDBhost $mongoDBport $mongoDashboardDBColl $jobID $jobStatus

else

  logMsg="Hive Executor Script Completed Successfully! "
  updateLogFile $jobID $outputDataDir $logFile "INFO " "$logMsg" 
  updateLogFile $jobID $outputDataDir $debugLogFile "INFO " "$logMsg" 

  jobStatus="JOB_SUCCESSFUL"
  updateStatusFile $jobStatus $outputDataDir $statusFile

  updateStatusInMongoDB $MONGO_PATH $mongoDBhost $mongoDBport $mongoDashboardDBColl $jobID $jobStatus
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

# Log into Debug Log File
logMsg="******** Ending Execution of Hive Launcher Script ********"
updateLogFile $jobID $outputDataDir $logFile "INFO " "$logMsg" 
updateLogFile $jobID $outputDataDir $debugLogFile "INFO " "$logMsg" 
