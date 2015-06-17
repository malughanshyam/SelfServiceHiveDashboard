#!/bin/bash

# echo "Subject: Test Mail

# BEGINING

# Check out the Self Service Dashboard at 

# http://localhost:8080/dashboard.html.

# " | /usr/sbin/sendmail gmalu@ebay.com



jobName="TopTrends"
jobStatus=`echo "JOB_SUCCESFUL"`
jobResultURL=`echo "http://localhost:8080/dashboard.html"`

mailSubject="Subject: Job - "$jobName" ["$jobStatus"] "$'\n'

mailBody=`echo -e "\nThe Job - JobName has completed with the status\t:  "`
mailBody=$mailBody$jobStatus$'\n'
mailBody=$mailBody`echo -e "\nCheck out more at : "`
mailBody=$mailBody$jobResultURL$'\n'

mailSignature=$'\n'$'\n'"--"$'\n'
mailSignature=$mailSignature"Self Service Hive Dashboard"$'\n'

mailComplete=$mailSubject$mailBody$mailSignature

echo "$mailComplete" | /usr/sbin/sendmail gmalu@ebay.com -f"SelfServiceHiveDashboard"

