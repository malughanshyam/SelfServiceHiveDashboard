angular.module('dashboardApp')

.controller('scheduledJobCtrl', function($scope, $compile, $http, dashboardAungularService) {


    // ---------------------------------
    // Controller For Scheduled Job
    // ---------------------------------


    // Collection for Recent Jobs Table
    $scope.displayedSchedJobsCollection = [];
    $scope.allSchedJobs = [];

    // Automatic Refresh of Recent Sched Job Table
    $scope.schedJobTableAutoRefreshFlag = false

    $scope.enableSchedJobTableAutoRefresh = function() {
        // Create a Timer
        $scope.refreshSchedJobTableInterval = setInterval(function() {
            $scope.populateScheduledJobsTable();
        }, 4000); // 1 second = 1000 milliseconds

    }

    $scope.disableSchedJobTableAutoRefresh = function() {
        // Clear Timer
        clearInterval($scope.refreshSchedJobTableInterval);
    }

    $scope.toggleSchedJobTableAutoRefreshBtn = function() {
        if ($scope.schedJobTableAutoRefreshFlag == false) {
            $scope.schedJobTableAutoRefreshFlag = true
            $('#autoRefreshSchedJobTableBtn').addClass('active');
            $('#autoRefreshSchedJobTableBtn').prop('aria-pressed', true);
            $('#autoRefreshSchedJobTableBtn').html('<i class="fa fa-refresh"> </i> Auto Refresh On');
            $scope.enableSchedJobTableAutoRefresh();
        } else {
            $scope.schedJobTableAutoRefreshFlag = false
            $('#autoRefreshSchedJobTableBtn').removeClass('active');
            $('#autoRefreshSchedJobTableBtn').prop('aria-pressed', false);
            $('#autoRefreshSchedJobTableBtn').html('Auto Refresh Off')
            $scope.disableSchedJobTableAutoRefresh();
        }
    }

    // Initialize Schedule New Job
    $scope.initializeScheduleNewJob = function() {
        $scope.schedJob = {};

        $scope.barChartComputedData;
        $scope.lineChartComputedData;
        $scope.pieChartComputedData;

        $scope.schedJob.schedJobName = "";
        $scope.schedJob.schedQuery = "";

        // Scheduled Job Execution Time
        $scope.schedJob.jobSchedTime = {};
        $scope.jobSchedSetDefaultTime();

        $scope.schedJob.days = {
            "sun": true,
            "mon": false,
            "tue": false,
            "wed": false,
            "thu": false,
            "fri": false,
            "sat": false
        };

        $scope.schedJob.jobSchedTime.hours = $scope.schedJob.jobSchedTime.completeTime.getHours();
        $scope.schedJob.jobSchedTime.minutes = $scope.schedJob.jobSchedTime.completeTime.getMinutes();

        $scope.schedJob.notifyEmailFlag = 'false';
        $scope.schedJob.notifyEmailID = '';
    }

    // Scheduled Job Default Time
    $scope.jobSchedSetDefaultTime = function() {

        var defaultSchedTime = new Date();
        defaultSchedTime.setHours(22);
        defaultSchedTime.setMinutes(0);
        $scope.schedJob.jobSchedTime.completeTime = defaultSchedTime;

    }

    $scope.jobSchedTimePickerValidate = function() {
        if (!$scope.schedJob.jobSchedTime.completeTime) {
            $scope.jobSchedSetDefaultTime();
            $scope.invalidTimeAlert = true
            return;
        }
        $scope.invalidTimeAlert = false;
    }

    $scope.scheduleJob = function() {

        // Replace Non Alpha Numeric Characters with underscore(_)
        $scope.schedJob.schedJobName = dashboardAungularService.cleanUpStr($scope.schedJob.schedJobName);

        $('#createSchedJobTab').removeClass('active');
        $('#createSchedJobStatusTab').addClass('active');

        $('#createSchedJobStatusPlaceholderDiv').html('<h3 align="center"> <i class="fa fa-spinner fa-pulse fa-3x "></i> <br><br> Scheduling Job... </h3>');

        $scope.schedJob.jobSchedTime.hours = $scope.schedJob.jobSchedTime.completeTime.getHours();
        $scope.schedJob.jobSchedTime.minutes = $scope.schedJob.jobSchedTime.completeTime.getMinutes();

        $http.post('/submitSchedJob', $scope.schedJob)
            .success(function(data) {
                $scope.schedJob.jobID = data.JobID;
                $('#createSchedJobStatusPlaceholderDiv').html('<h3 align="center"> <i id="success" class="fa fa-check-square-o fa-3x "></i> <br>Job Scheduled </h3>');

            })
            .error(function(err) {
                $('#createSchedJobStatusPlaceholderDiv').html('<h3 align="center"> <i id="failed" class="fa fa-exclamation-triangle fa-3x "></i> <br>Scheduling Failed </h3>');
                $('#createSchedJobStatusPlaceholderDiv').append('<pre> <h3>Error</h3><br>' + err + '</pre')
            });

    }


    $scope.schedReset = function() {
        $scope.schedJob = {};
        $scope.initializeScheduleNewJob();
        $scope.schedJob = angular.copy($scope.schedJob);
    };




    $scope.populateScheduledJobsTable = function() {
        var getScheduledJobs = '/schedJob'

        $http.get(getScheduledJobs)
            .success(function(data) {
                $scope.allSchedJobs = data;
                $scope.displayedSchedJobsCollection = [].concat($scope.allSchedJobs);
            })
            .error(function(err) {
                // $scope.submittedJobStatus='FAILED'
                $scope.jobLog = 'Fetching RecentAdHocJobs Failed :' + err;
                console.log(err)

            });
    }

    $scope.viewSchedJobLogModal = function(schedJob) {
        $('#modalViewSchedLog').modal('show')

        $("#modalViewSchedLog").find('#JobName').text(schedJob.JobName);
        $("#modalViewSchedLog").find('#JobStatus').text("(" + schedJob.JobRunStatus + ")");

        $scope.getJobLog(schedJob.JobID, function() {
            $scope.jobLogSelected = $scope.jobLogRetrieved;
            $("#modalViewSchedLog").find('#jobLogPre').text($scope.jobLogRetrieved);

        })
    }

    $scope.getJobLog = function(jobID, callBack) {

        $scope.checkLogURL = '/schedJobLog/' + jobID
        $scope.jobLogRetrieved;
        $http.get($scope.checkLogURL, $scope.formData)
            .success(function(data) {
                $scope.jobLogRetrieved = data;
                callBack();

            })
            .error(function(err) {
                $scope.jobLogRetrieved = "Fetching Log Failed" + err
                callBack();
            });


    }

    $scope.viewSchedJobResultsModal = function(schedJob) {

        $scope.initializeScheduleNewJob();

        $('#modalViewSchedResults').modal('show')

        $("#modalViewSchedResults").find('#JobName').text(schedJob.JobName);
        // $("#modelViewResults").find('#JobID').text("(" + adHocJob.JobID + ")");

        // compile the element
        //$compile($('#modalViewSchedResults'))($scope);

        $("#modalViewSchedResults").find('#submittedHiveQuery').text(schedJob.SQLQuery);
        $("#modalViewSchedResults").find('#resultPanelTitle').text(schedJob.JobName);

        $('#createTabularResultBtn').click();

        $scope.schedJob.jobID = schedJob.JobID
        $scope.computeJobResults(schedJob.JobID);

        $('#modalViewSchedResults').on('hidden.bs.modal', function() {
            $scope.barChartComputedData = null;
            $scope.lineChartComputedData = null;
            $('#modalViewSchedResults').unbind();
            
        })

    }




    $scope.computeJobResults = function(jobID) {

        $scope.checkResultURL = '/schedJobResultFile/' + jobID
        var jobResultTableDivId = $('#modalViewSchedResults').find('#sJobTabular');

        $http.get($scope.checkResultURL)
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


    $scope.createBarChart = function() {

        // Check against the locally stored chart data to prevent duplicate computation/drawing of the charts
        if ($scope.barChartComputedData == $scope.jobResult) {
            return true;
        }

        $('#schedResultTypeTabs').find('#createBarChartBtn').button('loading');

        // Compute the Width for the Charts
        var chartWidth = $("#jobResultPanelBodyContent").width();
        var chartDivID = '#sJobchartBar'

        dashboardAungularService.createBarChart($scope.jobResult, chartDivID, chartWidth);

        $('#schedResultTypeTabs').find('#downloadBarChartBtnId').removeClass('disabled');
        $('#schedResultTypeTabs').find('#createBarChartBtn').button('reset');

        // Store Locally to avoid Recomputing the same chart
        $scope.barChartComputedData = $scope.jobResult

    }


    $scope.createLineChart = function() {

        // Check against the locally stored chart data to prevent duplicate computation/drawing of the charts
        if ($scope.lineChartComputedData == $scope.jobResult) {
            return true;
        }

        $('#schedResultTypeTabs').find('#createLineChartBtn').button('loading');

        // Compute the Width for the Charts
        var chartWidth = $("#jobResultPanelBodyContent").width();
        var chartDivID = '#sJobchartLine'

        dashboardAungularService.createLineChart($scope.jobResult, chartDivID, chartWidth);

        $('#schedResultTypeTabs').find('#downloadLineChartBtnId').removeClass('disabled');
        $('#schedResultTypeTabs').find('#createLineChartBtn').button('reset');

        // Store Locally to avoid Recomputing the same chart
        $scope.lineChartComputedData = $scope.jobResult

    }

    $scope.createPieChart = function() {

        // Check against the locally stored chart data to prevent duplicate computation/drawing of the charts
        if ($scope.pieChartComputedData == $scope.jobResult) {
            return true;
        }

        $('#schedResultTypeTabs').find('#createPieChartBtn').button('loading');

        // Compute the Width for the Charts
        var chartWidth = $("#jobResultPanelBodyContent").width();
        var chartDivID = '#sJobchartPie'

        dashboardAungularService.createPieChart($scope.jobResult, chartDivID, chartWidth);

        $('#schedResultTypeTabs').find('#downloadPieChartBtnId').removeClass('disabled');
        $('#schedResultTypeTabs').find('#createPieChartBtn').button('reset');

        // Store Locally to avoid Recomputing the same chart
        $scope.pieChartComputedData = $scope.jobResult

    }

    $scope.activateNewScheduleJobTab = function() {
        $scope.initializeScheduleNewJob();
        $scope.schedReset();
        $('#createSchedJobStatusTab').removeClass('active');
        $('#createSchedJobTab').addClass('active');
    }

    $scope.deleteSchedJob = function(row) {

        var removeScheduledJobURL = '/removeSchedJob/' + row.JobID

        bootbox.confirm("Are you sure you want to delete the Job - " + row.JobName + " ?", function(userResponse) {
            if (userResponse == true) {
                $http.put(removeScheduledJobURL)
                    .success(function(data) {
                        $scope.populateScheduledJobsTable();
                        var type = 'danger';
                        var message = "The Job - " + row.JobName + " has been deleted";
                        dashboardAungularService.flashImpAlert(type, message, 4000);
                    })
                    .error(function(err) {
                        // $scope.submittedJobStatus='FAILED'
                        console.log("Job Deletion Failed");
                        console.log(err);

                    });

            }

        });

    }

    // Diabled Scheduled Job
    $scope.disableSchedJob = function(row) {

        var disableScheduledJobURL = '/disableSchedJob/' + row.JobID

        bootbox.confirm("Are you sure you want to disable the Job - " + row.JobName + " ?", function(userResponse) {
            if (userResponse == true) {
                $http.put(disableScheduledJobURL)
                    .success(function(data) {
                        $scope.populateScheduledJobsTable();
                        var type = 'warning';
                        var message = "The Job - " + row.JobName + " has been disabled";
                        dashboardAungularService.flashImpAlert(type, message, 4000);
                    })
                    .error(function(err) {
                        // $scope.submittedJobStatus='FAILED'
                        console.log("Job Disable Failed");
                        console.log(err);

                    });

            }

        });

    }

    // Enable Scheduled Job
    $scope.enableSchedJob = function(row) {

        var enableScheduledJobURL = '/enableSchedJob/' + row.JobID

        bootbox.confirm("Are you sure you want to enable the Job - " + row.JobName + " ?", function(userResponse) {
            if (userResponse == true) {
                $http.put(enableScheduledJobURL)
                    .success(function(data) {
                        $scope.populateScheduledJobsTable();
                        var type = 'success';
                        var message = "The Job - " + row.JobName + " has been enabled";
                        dashboardAungularService.flashImpAlert(type, message, 4000);
                    })
                    .error(function(err) {
                        // $scope.submittedJobStatus='FAILED'
                        console.log("Job Enable Failed");
                        console.log(err);

                    });

            }

        });

    }


    $scope.saveDivAsPicture = function() {
        dashboardAungularService.saveAsPicture($('#modalViewSchedResults').find('#resultPanel'))
    }

    $scope.showPopupFlag = function(text, limit) {
        if (text.length > limit)
            return true;
        return false;
    }

    $scope.parseIsoDatetime = function(dateStr) {
        return dashboardAungularService.parseIsoDatetime(dateStr);
    }

    $scope.convertTime24Hto12H = function(timeStr) {
        return dashboardAungularService.convertTime24Hto12H(timeStr);
    }


    $scope.downloadSchedJobResultFile = function() {
        var downloadSchedJobResultFile = '/downloadSchedJobResultFile/' + $scope.schedJob.jobID;
        window.open(downloadSchedJobResultFile);
    }

    $scope.$on('copyDetailsFromAdHocJob', function(event, adHocJobDetails) {
        $scope.schedJob.schedJobName = adHocJobDetails.JobName;
        $scope.schedJob.schedQuery = adHocJobDetails.SQLQuery;
        var type = 'info';
        var message = "Fill in the details to Schedule the Job";
        dashboardAungularService.flashImpAlert(type, message, 4000);
    });


    $scope.activateNewScheduleJobTab();

});