angular.module('dashboardApp')

    .controller('adHocJobCtrl', function($scope, $compile, $http, dashboardAungularService, $rootScope) {

    // ---------------------------------
    // Controller For Scheduled Job
    // ---------------------------------

    // Collection for Recent Jobs Table
    $scope.recentAdHocJobs = [];
    $scope.displayedCollection = [];

    // Function to Activate a Tab
    activateTab = function(tab) {
        $('.nav-tabs a[href="#' + tab + '"]').tab('show');
    };

    // Clone the New AdHoc Tab to use when Create New Job Button is clicked.
    var newAdHocTabClone = $("#newAdHocTab").clone();

    // Initialize New Job Tab
    $scope.initializeNewJobTab = function() {
        // Variables to store the data for Bar and Line charts to prevent recomputing the already populated charts
        $scope.barChartComputedData ='';
        $scope.lineChartComputedData= '';

        // Cosmetic settings for the Steps - Flow
        $("#flowStepCreate").removeClass('complete');
        $("#flowStepCreate").addClass('disabled');
        $("#flowStepCreate").find('i').css({
            "opacity": "1"
        });

        $("#flowStepStatus").removeClass('complete');        
        $("#flowStepStatus").addClass('disabled');        
        $("#flowStepStatus").find('i').css({
            "opacity": "0.3"
        });

        $("#flowStepResult").removeClass('complete');        
        $("#flowStepResult").addClass('disabled');
        $("#flowStepResult").find('i').css({
            "opacity": "0.3"
        });

        // Clear the Status Checker if present
        clearInterval($scope.refreshInterval)
        $scope.refreshInterval = '';

        $scope.formData = {}
        $scope.output = ''

        $scope.formData.hiveQuery = ''
        $scope.formData.jobID = ''
        $scope.formData.jobName = ''
        $scope.submittedJobStatus = 'JOB_NOT_STARTED'
        $scope.showJobLog = false
        $scope.jobResult = ''

        // Flag to Show Create New Job Button
        $scope.showCreateNewJobBtn = false

        // compile the element
        $compile($('#modelViewResults'))($scope);

    }


    // Function to Reset New Job Tab
    $scope.resetNewJobTab = function() {

        $scope.initializeNewJobTab();
        
        // Replace the New AdHoc Tab with a clone of the backup created earlier
        $("#newAdHocTab").replaceWith(newAdHocTabClone.clone());
        $compile($('#newAdHocTab'))($scope);
        $('#newAdHocTab').addClass('active');
        
    }

    // Submit New AdHoc Job to server
    $scope.submitJob = function() {

        // Replace Non Alpha Numeric Characters with underscore(_)
        $scope.formData.jobName=dashboardAungularService.cleanUpStr($scope.formData.jobName);

        $http.post('/submitNewAdHocJob', $scope.formData)
            .success(function(data) {
                $scope.formData.jobID = data.JobID;
                console.log("FormData.jobID: ");
                console.log($scope.formData.jobID);
                $scope.activateCurrentJobStatusTab()
            })
            .error(function(err) {
                $scope.formData.jobID = err.JobID;
                $scope.submittedJobStatus = 'FAILED';
                $scope.activateCurrentJobStatusTab()
            });

        $scope.showCreateNewJobBtn = true

    }

    // Flash an Alert Message and Reset New Job Tab
    $scope.flashAlertAndResetNewJobTab = function(){
        $scope.resetNewJobTab();
        var type = 'info';
        var message = "You can check the status of the submitted job under Recent Jobs";
        dashboardAungularService.flashImpAlert(type, message, 4000);
    }

    // Activate Job Status Tab for the Current Job
    $scope.activateCurrentJobStatusTab = function() {
        // Create a Timer
        $scope.refreshInterval = setInterval(function() {
            refreshTimer()
        }, 2000); // 1 second = 1000 milliseconds

        function refreshTimer() {
            $scope.refreshJobStatus();
        }

        /*enable tab*/
        $("#navLinkStatus").removeClass('disabled');
        $("#navLinkStatus").find('a').attr("data-toggle", "tab");
        $("#navLinkStatus").click();

        activateTab('jobStatusTab');

        // Disable Create New Job 
        $("#navLinkNewJob").addClass('disabled');
        $("#navLinkNewJob").find('a').removeAttr("data-toggle");

        $("#flowStepCreate").removeClass('disabled');
        $("#flowStepCreate").addClass('complete');

        $("#flowStepStatus").find('i').css({
            "opacity": "1"
        });
    }

    // Refresh Job Status
    $scope.refreshJobStatus = function() {

        console.log("Refreshing Job Status");
        $scope.checkStatusURL = '/jobStatus/' + $scope.formData.jobID;

        $http.get($scope.checkStatusURL, $scope.formData)
            .success(function(data) {
                $scope.submittedJobStatus = data.trim();
            })
            .error(function(err) {
                $scope.submittedJobStatus = 'FAILED';
                $scope.output = err;
            });

        if ($scope.submittedJobStatus == 'JOB_SUCCESSFUL' || $scope.submittedJobStatus == 'JOB_FAILED') {
            clearInterval($scope.refreshInterval)
            $("#flowStepStatus").removeClass('disabled');
            $("#flowStepStatus").addClass('complete');
            $("#flowStepResult").find('i').css({
                "opacity": "1"
            });

        }

    }

    // Populate Recent AdHoc Jobs Table
    $scope.populateRecentAdHocJobTable = function() {
        var getRecentAdHocJobs = '/adHocJob';

        $http.get(getRecentAdHocJobs)
            .success(function(data) {
                $scope.recentAdHocJobs = '';
                $scope.displayedCollection = '';
                $scope.recentAdHocJobs = data;
                $scope.displayedCollection = [].concat($scope.recentAdHocJobs);
            })
            .error(function(err) {
                $scope.jobLog = 'Fetching RecentAdHocJobs Failed :' + err;
            });
    }

    // View Job Log Modal
    $scope.viewAdHocJobLogModal = function(adHocJob) {

        $('#modalViewAdHocLog').modal('show');
        $("#modalViewAdHocLog").find('#JobName').text(adHocJob.JobName);
        $("#modalViewAdHocLog").find('#JobStatus').text("(" + adHocJob.JobRunStatus + ")");

        $scope.getJobLog(adHocJob.JobID, function() {
            $scope.jobLogSelected = $scope.jobLogRetrieved;
            $("#modalViewAdHocLog").find('#jobLogPre').text($scope.jobLogRetrieved);

        })

    }

    // View Job Results Modal
    $scope.viewAdHocJobResultsModal = function(adHocJob) {

        $scope.resetNewJobTab();
        $('#newAdHocTab').removeClass('active');
        $('#modalViewAdHocResults').modal('show');

        jobResultTabContent = $("#jobResultTab").html();
        $("#modalViewAdHocResults").find('#JobName').text(adHocJob.JobName);
        $("#modalViewAdHocResults").find('.modal-body').html(jobResultTabContent);
        // $("#modelViewResults").find('#JobID').text("(" + adHocJob.JobID + ")");

        // compile the element
        $compile($('#modalViewAdHocResults'))($scope);

        $("#modalViewAdHocResults").find('#submittedHiveQuery').text(adHocJob.SQLQuery);
        $("#modalViewAdHocResults").find('#resultPanelTitle').text(adHocJob.JobName);

        $('#downloadBarChartBtnId').addClass('disabled');
        $('#downloadLineChartBtnId').addClass('disabled');

        $scope.formData.jobID = adHocJob.JobID;
        $scope.computeJobResults(adHocJob.JobID);
       
        // Trigger actions on the Modal Close/Hide Event
        $('#modalViewAdHocResults').on('hidden.bs.modal', function() {
            $scope.barChartComputedData = null;
            $scope.lineChartComputedData = null;
            $("#modalViewAdHocResults").find('.modal-body').html(" "); 
        });

    }

    // View the Current Job Log
    $scope.viewCurrentJobLog = function() {
        $scope.showJobLog = true
        $scope.getJobLog($scope.formData.jobID, function() {
            $scope.jobLog = $scope.jobLogRetrieved;
        });
    }

    // Get the Current Job Log
    $scope.getJobLog = function(jobID, callBack) {

        $scope.checkLogURL = '/adHocJobLog/' + jobID
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

    // View Job Result
    $scope.viewJobResult = function() {

        // If the Job Status is Not Successful, return
        if ($scope.submittedJobStatus != 'JOB_SUCCESSFUL') {
            return false;
        }

        /*enable tab*/
        $("#navLinkResult").removeClass('disabled');
        $("#navLinkResult").find('a').attr("data-toggle", "tab");
        $("#navLinkResult").click();

        activateTab('jobResultTab');

        // Disable Create New Job 
        $("#navLinkStatus").addClass('disabled');
        $("#navLinkStatus").find('a').removeAttr("data-toggle");

        $scope.computeJobResults($scope.formData.jobID)
        $("#flowStepResult").removeClass('disabled');
        $("#flowStepResult").addClass('complete');
    }

    // Compute the Job Results for the given JobID
    $scope.computeJobResults = function(jobID) {

        $scope.checkResultURL = '/adHocJobResultFile/' + jobID

        $http.get($scope.checkResultURL)
            .success(function(data) {
                $scope.jobResult = data;
                dashboardAungularService.createResultTable('#jobResultTable', $scope.jobResult);
            })
            .error(function(err) {
                $scope.jobResult = 'Fetching Result Failed :' + err;
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
        var chartDivID = '#chartBar';

        dashboardAungularService.createBarChart($scope.jobResult, chartDivID, chartWidth); 

        $('#downloadBarChartBtnId').removeClass('disabled');
        $('#createBarChartBtn').button('reset');

        // Store Locally to avoid Recomputing the same chart
        $scope.barChartComputedData = $scope.jobResult;

    }

    // Create Line Chart
    $scope.createLineChart = function() {

        // Check against the locally stored chart data to prevent duplicate computation/drawing of the charts
        if ($scope.lineChartComputedData == $scope.jobResult) {
            return true;
        } 

        $('#createLineChartBtn').button('loading');

        // Compute the Width for the Charts
        var chartWidth = $("#jobResultPanelBodyContent").width()
        var chartDivID = '#chartLine';

        dashboardAungularService.createLineChart($scope.jobResult, chartDivID, chartWidth); 

        $('#downloadLineChartBtnId').removeClass('disabled');
        $('#createLineChartBtn').button('reset');

        // Store Locally to avoid Recomputing the same chart
        $scope.lineChartComputedData = $scope.jobResult;

    }

    // Save DIV as Picture
    $scope.saveDivAsPicture = function() {
        dashboardAungularService.saveAsPicture($("#resultPanel"));
    }

    // Edit and Resubmit the AdHoc Job
    $scope.editAndResubmitJob = function(adHocJob) {
        $('#recentAdHocTab').removeClass('active');
        $('#navRecentAdHoc').removeClass('active');
        $('#navNewAdHoc').addClass('active');
        $scope.resetNewJobTab();
        $scope.formData.hiveQuery = adHocJob.SQLQuery;
        $scope.formData.jobName = adHocJob.JobName;
    }

    // Resubmit Job
    $scope.resubmitJob = function(adHocJob) {
        $scope.resetNewJobTab();
        $scope.formData.hiveQuery = adHocJob.SQLQuery;
        $scope.formData.jobName = adHocJob.JobName;
        $scope.submitJob();
        
        var type = 'info';
        var message = "Job Resubmitted! Hit the Refresh Button to check the execution progress";
        dashboardAungularService.flashImpAlert(type, message, 8000);

        setTimeout(function() {
            $scope.populateRecentAdHocJobTable()
        }, 1000);
    }

    // Download Result File
    $scope.downloadAdHocJobResultFile = function() {

        var downloadAdHocJobResultFile = '/downloadAdHocJobResultFile/' + $scope.formData.jobID;
        window.open(downloadAdHocJobResultFile);
    }

    // Flag for Show Popup while displaying substring of the Query in the Recent Jobs Table 
    $scope.showPopupFlag = function(text, limit){
        if (text.length > limit)
            return true;
        return false;
    }

    // Function to convert the ISO Datestring to Readable Format for displaying in the Recent Jobs Table
    $scope.parseIsoDatetime = function(dateStr){
        return dashboardAungularService.parseIsoDatetime(dateStr); 
    }

    // Reset the Form/Job Details
    $scope.reset = function() {
        $scope.formData = {}
        $scope.user = angular.copy($scope.master);
    };

    // Initiate Scheduling an AdHoc Job
    $scope.initiateScheduling = function(adHocJob){
        dashboardAungularService.initiateScheduling(adHocJob);
        $('#navRecentAdHoc').removeClass('active');
        $('#recentAdHocTab').removeClass('active');
        $('#navAdHoc').removeClass('active'); 
        $('#adHocTab').removeClass('active');      

        $('#navScheduled').addClass('active');
        $('#scheduledTab').addClass('active');
        $('#navSchedJobList').removeClass('active');
        $('#navSchedJobNew').addClass('active');
        $('#newSchedJobTab').addClass('active'); 
        $('#createSchedJobStatusTab').removeClass('active');
        $('#createSchedJobTab').addClass('active'); 
        
        // Broadcast an event with the adHocJob details
        $rootScope.$broadcast('copyDetailsFromAdHocJob', adHocJob);
        
    }

    $scope.reset();

});
