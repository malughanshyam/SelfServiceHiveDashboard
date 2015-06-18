//Get all URL param
function getAllURLParameters() {
    var params = window.location.search.substr(1).split('&');
    var allURLParams = {}
    for (var i = 0; i < params.length; i++) {
        var p=params[i].split('=');
        allURLParams[p[0]] = decodeURIComponent(p[1]);
    }
    return allURLParams;
}

var displayAlertAndRedirect = function(titleStr,messageStr){
        bootbox.alert({
           title: titleStr,
           message: messageStr,
           callback: function(){
              window.location = "/";
            }
    });
}

var allURLParams = getAllURLParameters();

angular.module('dashboardApp')

    .controller('jobResultsCtrl', function($scope, $compile, $http, dashboardAungularService, $rootScope) {

    $scope.jobObj = {};
    $scope.jobObj.jobType=allURLParams['jobType'];
    $scope.jobObj.jobID=allURLParams['jobID'];

    console.log("$scope.jobType "+$scope.jobObj.jobType)
    console.log("$scope.jobID "+$scope.jobObj.jobID)

    
    if ($scope.jobObj.jobType != "ADHOC" && $scope.jobObj.jobType != "SCHED") {
        displayAlertAndRedirect('Invalid URL','Redirecting to Home Page!');
    }

    


    $scope.getJobDetails = function(){
        
        if ($scope.jobObj.jobType=="ADHOC"){
            var getJobDetailsURL = '/adHocJob/' + $scope.jobObj.jobID;
        } else {
            var getJobDetailsURL = '/schedJob/' + $scope.jobObj.jobID;
        }

        $http.get(getJobDetailsURL)
            .success(function(data) {
                if (!data){
                    console.log(data);
                    displayAlertAndRedirect('Invalid JobID', 'Redirecting to Home Page!');
                    return;
                } else{
                    $scope.jobObj.jobName = data.JobName;
                    $scope.jobObj.jobRunStatus = data.JobRunStatus;
                    $scope.jobObj.hiveQuery = data.SQLQuery;
                    $scope.jobObj.updatedTimeStamp = data.UpdatedTimeStamp;
                }
            })
            .error(function(err) {
                $scope.jobObj.jobRunStatus = "JOB_FAILED"
                $scope.output = err;
                console.log(err)
                displayAlertAndRedirect('Error Retrieving Details', 'Redirecting to Home Page!');
            });        
    }


    // Get the Job Log
    $scope.populateJobLog = function() {

        if ($scope.jobObj.jobType=="ADHOC"){
            var getJobLogURL = '/adHocJobLog/' + $scope.jobObj.jobID;
        } else {
            var getJobLogURL = '/adHocJobLog/' + $scope.jobObj.jobID;
        }

        console.log(getJobLogURL);
        $http.get(getJobLogURL)
            .success(function(data) {
                $scope.jobObj.jobLog = data;
            })
            .error(function(err) {
                $scope.jobObj.jobLog = "Fetching Log Failed" + err
            });
    
    }
    

    // Function to convert the ISO Datestring to Readable Format for displaying in the Recent Jobs Table
    $scope.parseIsoDatetime = function(dateStr){
        return dashboardAungularService.parseIsoDatetime(dateStr); 
    }

    $scope.visitDashboard = function(){
        window.location = "/views/dashboard.html";
    }

    $scope.getJobDetails();

});