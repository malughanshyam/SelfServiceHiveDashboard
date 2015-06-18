// Get all URL param
var getAllURLParameters = function() {
    var params = window.location.search.substr(1).split('&');
    var allURLParams = {}
    for (var i = 0; i < params.length; i++) {
        var p = params[i].split('=');
        allURLParams[p[0]] = decodeURIComponent(p[1]);
    }
    return allURLParams;
}

// Display Alerts
var displayAlertAndRedirect = function(titleStr, messageStr) {
    bootbox.alert({
        title: titleStr,
        message: messageStr,
        callback: function() {
            window.location = "/";
        }
    });
}

var allURLParams = getAllURLParameters();

angular.module('dashboardApp')

.controller('jobResultsCtrl', function($scope, $compile, $http, dashboardAungularService, $rootScope) {

    // Initialize variables
    $scope.jobObj = {};

    // Retrieve the given JobType and JobID
    $scope.jobObj.jobType = allURLParams['jobType'];
    $scope.jobObj.jobID = allURLParams['jobID'];

    // Validate the JobID. If failed, redirect to Home Page with a alert
    if ($scope.jobObj.jobType != "ADHOC" && $scope.jobObj.jobType != "SCHED") {
        displayAlertAndRedirect('Invalid URL', 'Redirecting to Home Page!');
    }

    // Retrieve all the Job Details
    $scope.getJobDetails = function() {

        // Classify the JobType to create URL
        if ($scope.jobObj.jobType == "ADHOC") {
            var getJobDetailsURL = '/adHocJob/' + $scope.jobObj.jobID;
        } else {
            var getJobDetailsURL = '/schedJob/' + $scope.jobObj.jobID;
        }

        $http.get(getJobDetailsURL)
            .success(function(data) {
                if (!data) {
                    console.log(data);
                    displayAlertAndRedirect('Invalid JobID', 'Redirecting to Home Page!');
                    return;
                } else {
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

        // Classify the JobType to create URL
        if ($scope.jobObj.jobType == "ADHOC") {
            var getJobLogURL = '/adHocJobLog/' + $scope.jobObj.jobID;
        } else {
            var getJobLogURL = '/schedJobLog/' + $scope.jobObj.jobID;
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


    // Convert the ISO Datestring to Readable Format for displaying in the Recent Jobs Table
    $scope.parseIsoDatetime = function(dateStr) {
        return dashboardAungularService.parseIsoDatetime(dateStr);
    }

    // Redirect to Dashboard Home Page
    $scope.visitDashboard = function() {
        window.location = "/views/dashboard.html";
    }

    // Populate the Results Tab
    $scope.populateResults = function() {

        // Classify the JobType to create URL
        if ($scope.jobObj.jobType == "ADHOC") {
            var getJobResultURL = '/adHocJobResultFile/' + $scope.jobObj.jobID;
        } else {
            var getJobResultURL = '/schedJobResultFile/' + $scope.jobObj.jobID;
        }

        var jobResultTableDivId = '#jobResultTable';


        $http.get(getJobResultURL)
            .success(function(data) {
                $scope.jobResult = data;
                dashboardAungularService.createResultTable(jobResultTableDivId, data);
            })

        .error(function(err) {
            // $scope.submittedJobStatus='FAILED'
            $scope.jobResult = 'Fetching Result Failed :' + err;
            console.log(err)
        });
    }

    // Create Bar Chart
    $scope.createBarChart = function() {

        // Check against the locally stored chart data to prevent duplicate computation/drawing of the charts
        if ($scope.barChartComputedData == $scope.jobResult) {
            return true;
        }

        $('#createBarChartBtn').button('loading');

        // Compute the Width for the Charts
        var chartWidth = $("#jobResultPanelBodyContent").width();
        // var chartDivID = $('#resultPanel').find('#chartLine');

        var chartDivID = '#chartBar'

        console.log("calling dashboard service")
        console.log(chartWidth)
        console.log(chartDivID)
        dashboardAungularService.createBarChart($scope.jobResult, chartDivID, chartWidth);

        $('#downloadBarChartBtnId').removeClass('disabled');
        $('#createBarChartBtn').button('reset');

        // Store Locally to avoid Recomputing the same chart
        $scope.barChartComputedData = $scope.jobResult

    }

    // Create Line Chart
    $scope.createLineChart = function() {

        // Check against the locally stored chart data to prevent duplicate computation/drawing of the charts
        if ($scope.lineChartComputedData == $scope.jobResult) {
            return true;
        }

        $('#createLineChartBtn').button('loading');

        // Compute the Width for the Charts
        var chartWidth = $("#jobResultPanelBodyContent").width();

        var chartDivID = '#chartLine'

        dashboardAungularService.createLineChart($scope.jobResult, chartDivID, chartWidth);

        $('#downloadLineChartBtnId').removeClass('disabled');
        $('#createLineChartBtn').button('reset');

        // Store Locally to avoid Recomputing the same chart
        $scope.lineChartComputedData = $scope.jobResult

    }

    // Save DIV as picture
    $scope.saveDivAsPicture = function() {
        dashboardAungularService.saveAsPicture($("#resultPanel"))
    }

    // Download the result file
    $scope.downloadJobResultFile = function() {
        if ($scope.jobObj.jobType == "ADHOC") {
            var downloadJobResultsURL = '/downloadAdHocJobResultFile/' + $scope.jobObj.jobID;
        } else {
            var downloadJobResultsURL = '/downloadSchedJobResultFile/' + $scope.jobObj.jobID;
        }
        window.open(downloadJobResultsURL);
    }

    $scope.getJobDetails();

});