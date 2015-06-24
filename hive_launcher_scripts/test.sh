#!/bin/bash
# Send Email
# Check Notify Flag to proceed. If "N", then exit gracefully

jobType="SCHED"
jobID="55826c6395c8393709756ff6"
outputDir="../data/ScheduledJobs/5580d9bffce9da2b65a7ca5f"
statusFile="status.txt"
jobName="TopTrends" #$jobName
jobStatus=`cat $outputDir/$statusFile`
notifyEmail="gmalu@ebay.com"

jobResultURL="http://localhost:8080/views/jobresults.html?jobType="
jobResultURL=$jobResultURL$jobType
jobResultURL=$jobResultURL"&jobID="$jobID
#jobResultURL=`echo "http://localhost:8080/views/jobresults.html?jobType=SCHED&jobID=55826c6395c8393709756ff6"`

mailSubject="Subject: Job - "$jobName" ["$jobStatus"] "$'\n'

mailBody=`echo -e "\nThe Job - $jobName has completed with the status\t:  "`
mailBody=$mailBody$jobStatus$'\n'
mailBody=$mailBody`echo -e "\nCheck out more details at : "`
mailBody=$mailBody$jobResultURL$'\n'

mailSignature=$'\n'$'\n'"--"$'\n'
mailSignature=$mailSignature"Self Service Hive Dashboard"$'\n'

mailComplete=$mailSubject$mailBody$mailSignature

# echo "$mailComplete" | /usr/sbin/sendmail gmalu@ebay.com -f"SelfServiceHiveDashboard"
echo "$mailComplete" > "mail_$notifyEmail.txt"