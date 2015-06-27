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

rm HiveExecutor*.class

# Adding JARS to CLASSPATH
HIVE_JARS=./HiveJDBCjars 
for i in ${HIVE_JARS}/*.jar ; do
    CLASSPATH=$CLASSPATH:$i
done

javac -cp $CLASSPATH HiveExecutor.java 