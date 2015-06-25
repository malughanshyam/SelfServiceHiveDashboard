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

    $scope.enableSchedJobTableAutoRefresh = function(){
        // Create a Timer
        $scope.refreshSchedJobTableInterval = setInterval(function() {
            $scope.populateScheduledJobsTable();
        }, 4000); // 1 second = 1000 milliseconds

    }

    $scope.disableSchedJobTableAutoRefresh = function(){
        // Clear Timer
        clearInterval($scope.refreshSchedJobTableInterval);
    }

    $scope.toggleSchedJobTableAutoRefreshBtn = function(){
        if ($scope.schedJobTableAutoRefreshFlag == false){
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

    $scope.jobSchedTimePickerValidate = function (){
        console.log("ngChange: " +  $scope.schedJob.jobSchedTime.completeTime);
        if (!$scope.schedJob.jobSchedTime.completeTime){
            $scope.jobSchedSetDefaultTime();
            $scope.invalidTimeAlert = true
            return;
        }
        $scope.invalidTimeAlert = false;
        console.log($scope.invalidTimeAlert)
    }

    $scope.scheduleJob = function() {

        // Replace Non Alpha Numeric Characters with underscore(_)
        $scope.schedJob.schedJobName = dashboardAungularService.cleanUpStr($scope.schedJob.schedJobName);

        $('#createSchedJobTab').removeClass('active');
        $('#createSchedJobStatusTab').addClass('active');

        $('#createSchedJobStatusPlaceholderDiv').html('<h3 align="center"> <i class="fa fa-spinner fa-pulse fa-3x "></i> <br><br> Scheduling Job... </h3>');

        $scope.schedJob.jobSchedTime.hours = $scope.schedJob.jobSchedTime.completeTime.getHours();
        $scope.schedJob.jobSchedTime.minutes = $scope.schedJob.jobSchedTime.completeTime.getMinutes();

        console.log($scope.schedJob.jobSchedTime.hours + ":" + $scope.schedJob.jobSchedTime.minutes);

        console.log("SubmitJob Clicked");

        $http.post('/submitSchedJob', $scope.schedJob)
            .success(function(data) {
                console.log("Job Scheduled Successfully");
                $scope.schedJob.jobID = data.JobID;
                console.log("schedJob.jobID: "+ $scope.schedJob.jobID);
                $('#createSchedJobStatusPlaceholderDiv').html('<h3 align="center"> <i id="success" class="fa fa-check-square-o fa-3x "></i> <br>Job Scheduled </h3>');

            })
            .error(function(err) {
                console.log("Job Scheduling Failed")
                console.log(err)
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
        console.log("Clicked viewLogModal");
        $('#modalViewSchedLog').modal('show')

        $("#modalViewSchedLog").find('#JobName').text(schedJob.JobName);
        $("#modalViewSchedLog").find('#JobStatus').text("(" + schedJob.JobRunStatus + ")");

        $scope.getJobLog(schedJob.JobID, function() {
            console.log("In callback");
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
            console.log("Successfully retrieved JobLog");
            callBack();

        })
        .error(function(err) {
            $scope.jobLogRetrieved = "Fetching Log Failed" + err
            console.log("Fetching Log Failed");
            callBack();
        });


    }



   /* $scope.viewSchedJobResultsModal = function(schedJob) {

        $scope.initializeScheduleNewJob();

        $('#modelViewSchedResultsDiv').html(' <div class="modal fade" id="modalViewSchedResults" tabindex="-1" role="dialog" aria-labelledby="View Results" aria-hidden="true">' +
                             '<div class="modal-dialog modal-lg" id="modalDialogViewResult">' +
                                '<div class="modal-content">' +
                                    '<div class="modal-header">' +
                                        '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                                        '<h4 class="modal-title" id="myModalLabel">  ' +
                                            '<span id="JobName">JobName</span>' +
                                            '<!-- <small id="JobID">JobID</small> -->'+
                                            '<small>Results</small>'+
                                        '</h4>'+
                                    '</div>'+
                                    '<div class="modal-body">'+
                                        '<br> <div><dl><dt>Submitted Hive Query</dt><dd><pre class="pre-scrollable"><samp id="submittedHiveQuery"> </samp></pre></dd></dl></div>'+
                                        '<!-- Results Display Type Tab Begins -->'+
                                        '<ul class="nav nav-pills right-to-left" id="schedResultTypeTabs">'+
                                            '<li id="navChart1">'+
                                                '<div class="btn-group" role="group" aria-label="...">'+
                                                    '<button type="button" id="createLineChartBtn" class="btn btn-default btn-xs" data-toggle="tab" href="#sJobchart2Tab" ng-click="createLineChart()" data-tooltip="Plot Line Chart" data-loading-text="Loading..." autocomplete="off"> Line Chart</button>'+
                                                    '<button type="button" class="btn btn-success btn-xs disabled" ng-click="saveDivAsPicture()" id="downloadLineChartBtnId" data-tooltip="Save As Image"><span class="glyphicon glyphicon-download-alt" aria-hidden="true"></span></button>'+
                                                '</div></li>'+
                                            '<li id="navChart2">'+
                                                '<div class="btn-group" role="group" aria-label="...">'+
                                                    '<button type="button" id="createBarChartBtn" class="btn btn-default btn-xs" data-toggle="tab" href="#sJobchart1Tab" ng-click="createBarChart()" data-tooltip="Plot Bar Chart" data-loading-text="Loading..." autocomplete="off"> Bar Chart</button>'+
                                                    '<button type="button" class="btn btn-success btn-xs disabled" ng-click="saveDivAsPicture()" id="downloadBarChartBtnId" data-tooltip="Save As Image"><span class="glyphicon glyphicon-download-alt" aria-hidden="true"></span></button>'+
                                                '</div>'+
                                            '</li>'+
                                            '<li class="active" id="navTabular">'+
                                                '<div class="btn-group" role="group" aria-label="...">'+
                                                    '<button type="button" class="btn btn-default btn-xs" data-toggle="tab" href="#sJobTabularTab" data-tooltip="Show Raw Data"> Tabular</button>'+
                                                    '<button type="button" class="btn btn-success btn-xs" ng-click="downloadSchedJobResultFile()" id="downloadTSVBtnId" data-tooltip="Save As TSV"><span class="glyphicon glyphicon-download-alt" aria-hidden="true"></span>'+
                                                    '</button>'+
                                                '</div></li></ul>'+
                                        '<!-- Results Display Type Tab Ends -->'+
                                        '<br>'+
                                        '<!-- Panel for Display Results Begins-->'+
                                        '<div class="panel panel-info" id="resultPanel">'+
                                            '<div class="panel-heading">'+
                                                '<h3 class="panel-title" id="resultPanelTitle"><!-- {{formData.jobID}} --> {{formData.jobName}}</h3>'+
                                            '</div>'+
                                            '<div class="panel-body">'+
                                                '<div class="tab-content" id="jobResultPanelBodyContent">'+
                                                    '<div id="sJobTabularTab" class="tab-pane fade in active">'+
                                                        '<div id="sJobTabular"> </div>'+
                                                    '</div>'+
                                                    '<div id="sJobchart1Tab" class="tab-pane fade in ">'+
                                                        '<div id="sJobchart1" class="chartResult"> </div>'+
                                                    '</div>'+
                                                    '<div id="sJobchart2Tab" class="tab-pane fade in ">'+
                                                        '<div id="sJobchart2" class="chartResult"> </div>'+
                                                    '</div>'+
                                                '</div>'+
                                            '</div>'+
                                        '</div>'+
                                        '<!-- Panel for Display Results Ends-->'+
                                    '</div>'+
                                    '<div class="modal-footer">'+
                                        '<!-- test -->'+
                                        '<button type="button" ng-click="testme()" class="btn btn-sm btn-success"> Test </button>'+
                                        '<!-- test -->'+
                                        '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'+
                                    '</div>'+
                                '</div>'+
                            '</div>'+
                        '</div>')

        $('#modalViewSchedResults').modal('show')


        $("#modalViewSchedResults").find('#JobName').text(schedJob.JobName);
        // $("#modelViewResults").find('#JobID').text("(" + adHocJob.JobID + ")");


        // compile the element
        $compile($('#modalViewSchedResults'))($scope);

        $("#modalViewSchedResults").find('#submittedHiveQuery').text(schedJob.SQLQuery);
        $("#modalViewSchedResults").find('#resultPanelTitle').text(schedJob.JobName);

        $scope.schedJob.jobID = schedJob.JobID
        $scope.computeJobResults(schedJob.JobID);

        $('#modalViewSchedResults').on('hidden.bs.modal', function() {
            $scope.barChartComputedData = null;
            $scope.lineChartComputedData = null;
            $(this).data('bs.modal', null);
        })

    }
*/



    $scope.viewSchedJobResultsModal = function(schedJob) {

        $scope.initializeScheduleNewJob();

        $('#modalViewSchedResults').modal('show')

        $("#modalViewSchedResults").find('#JobName').text(schedJob.JobName);
        // $("#modelViewResults").find('#JobID').text("(" + adHocJob.JobID + ")");

        // compile the element
        //$compile($('#modalViewSchedResults'))($scope);

        $("#modalViewSchedResults").find('#submittedHiveQuery').text(schedJob.SQLQuery);
        $("#modalViewSchedResults").find('#resultPanelTitle').text(schedJob.JobName);

        $scope.schedJob.jobID = schedJob.JobID
        $scope.computeJobResults(schedJob.JobID);

        $('#modalViewSchedResults').on('hidden.bs.modal', function() {
            $scope.barChartComputedData = null;
            $scope.lineChartComputedData = null;
            //$(this).data('bs.modal', null);
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

        $('#createBarChartBtn').button('loading');

        // Compute the Width for the Charts
        var chartWidth = $("#jobResultPanelBodyContent").width();
        var chartDivID = '#sJobchart1'

        console.log("calling dashboard service")
        dashboardAungularService.createBarChart($scope.jobResult, chartDivID, chartWidth); 

        $('#downloadBarChartBtnId').removeClass('disabled');
        $('#createBarChartBtn').button('reset');

        // Store Locally to avoid Recomputing the same chart
        $scope.barChartComputedData = $scope.jobResult

    }


    $scope.createLineChart = function() {

        // Check against the locally stored chart data to prevent duplicate computation/drawing of the charts
        if ($scope.lineChartComputedData == $scope.jobResult) {
            return true;
        } 

        $('#createLineChartBtn').button('loading');

        // Compute the Width for the Charts
        var chartWidth = $("#jobResultPanelBodyContent").width();
        var chartDivID = '#sJobchart2'

        dashboardAungularService.createLineChart($scope.jobResult, chartDivID, chartWidth); 

        $('#downloadLineChartBtnId').removeClass('disabled');
        $('#createLineChartBtn').button('reset');

        // Store Locally to avoid Recomputing the same chart
        $scope.lineChartComputedData = $scope.jobResult

    }

    $scope.activateNewScheduleJobTab = function(){
        $scope.initializeScheduleNewJob();
        $scope.schedReset();
        $('#createSchedJobStatusTab').removeClass('active');
        $('#createSchedJobTab').addClass('active');
    }

    $scope.deleteSchedJob = function(row){
        
        var removeScheduledJobURL = '/removeSchedJob/' + row.JobID

        bootbox.confirm("Are you sure you want to delete the Job - "+row.JobName+" ?", function(userResponse) {
            if (userResponse==true){
                $http.put(removeScheduledJobURL)
                    .success(function(data) {
                        console.log("Job Deleted");
                        $scope.populateScheduledJobsTable();
                        var type = 'info';
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

    $scope.saveDivAsPicture = function() {
        dashboardAungularService.saveAsPicture($("#resultPanel"))
    }

    $scope.showPopupFlag = function(text, limit){
        if (text.length > limit)
            return true;
        return false;
    }

    $scope.parseIsoDatetime = function(dateStr){
        return dashboardAungularService.parseIsoDatetime(dateStr); 
    }


    $scope.downloadSchedJobResultFile = function() {
        var downloadSchedJobResultFile = '/downloadSchedJobResultFile/' + $scope.schedJob.jobID;
        window.open(downloadSchedJobResultFile);
    }

    $scope.$on('copyDetailsFromAdHocJob', function(event, adHocJobDetails) {
        console.log("Received adHocJobDetails from AdHoc Tab");
        $scope.schedJob.schedJobName = adHocJobDetails.JobName;
        $scope.schedJob.schedQuery = adHocJobDetails.SQLQuery;
        var type = 'info';
        var message = "Fill in the details to Schedule the Job";
        dashboardAungularService.flashImpAlert(type, message, 4000);
    });


    $scope.activateNewScheduleJobTab();
 
    // delete these lines... only for testing
    // $('#createSchedJobTab').removeClass('active');
    // $('#createSchedJobStatusTab').addClass('active');
    //$scope.scheduleJob();
    

});