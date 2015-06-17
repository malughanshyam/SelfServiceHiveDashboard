angular.module('dashboardApp')

    .controller('adHocJobCtrl', function($scope, $compile, $http, dashboardAungularService, $rootScope) {

    // ---------------------------------
    // Controller For Scheduled Job
    // ---------------------------------

    // Collection for Recent Jobs Table
    $scope.recentAdHocJobs = [];
    $scope.displayedCollection = [];

    activateTab = function(tab) {
        $('.nav-tabs a[href="#' + tab + '"]').tab('show');
    };

    // Clone the New AdHoc Tab to use when Create New Job Button is clicked.
    var newAdHocTabClone = $("#newAdHocTab").clone();

    $scope.initializeNewJobTab = function() {
        // Variables to store the data for Bar and Line charts to prevent recomputing the already populated charts
        $scope.barChartComputedData ='';
        $scope.lineChartComputedData= '';

/*        // disable Status tab
        $("#navLinkStatus").addClass('disabled');
        $("#navLinkStatus").find('a').removeAttr("data-toggle");

        // disable Result tab
        $("#navLinkResult").addClass('disabled');
        $("#navLinkResult").find('a').removeAttr("data-toggle");
*/
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
        $scope.showCreateNewJobBtn = false

        // compile the element
        $compile($('#modelViewResults'))($scope);

        console.log("AdHoc Tab Initialized")


/*        $("#jobStatusTab").removeClass('active');
        $("#jobResultTab").removeClass('active');
        $("#newJobTab").addClass('active');
        $('#newAdHocTab').addClass('active');   
        activateTab("#newJobTab");
*/

    }


    $scope.resetNewJobTab = function() {

        $scope.initializeNewJobTab();

        $("#newAdHocTab").replaceWith(newAdHocTabClone.clone());

        $compile($('#newAdHocTab'))($scope);
        //activateTab("newAdHocTab");
        $('#newAdHocTab').addClass('active');
        //$scope.flashAlertCheckRecentJobs(); -- Now, directly called from HTML on clicking New Job Button
        console.log("AdHoc Tab Reset");

    }

    /*    $("#navLinkResult").removeClass('disabled');
        $("#navLinkResult").find('a').attr("data-toggle", "tab");
        $("#navLinkResult").click();

        activateTab('jobResult');*/



    $scope.submitJob = function() {

        console.log("SubmitJob Clicked");

        $http.post('/submitNewAdHocJob', $scope.formData)
            .success(function(data) {
                $scope.formData.jobID = data.JobID;
                console.log("FormData.jobID: ");
                console.log($scope.formData.jobID);
                $scope.activateCurrentJobStatusTab()

            })
            .error(function(err) {
                console.log("Failed")
                console.log(err)
                $scope.formData.jobID = err.JobID;
                $scope.submittedJobStatus = 'FAILED';
                $scope.activateCurrentJobStatusTab()
            });

        $scope.showCreateNewJobBtn = true

    }

    $scope.flashAlertCheckRecentJobs = function() {
        type = 'info';
        message = "You can check the status of the submitted job under Recent Jobs";
        // alertLink = '#recentAdHocTab';
        // alertLinkTitle = "Recent Jobs";
        $scope.flashImpAlert(type, message, 4000);
    }

    $scope.flashImpAlert = function(type, message, displayTime, alertLink, alertLinkTitle) {
        if (['success', 'info', 'warning', 'danger'].indexOf(type) < 0) {
            type = 'info'
        }

        if (alertLink == null || alertLinkTitle == null) {
            alertLink = '';
            alertLinkTitle = '';
        }

        alertHtml = ' <div class="row"> <div class="alert alert-' + type;
        alertHtml += ' alert-dismissible alignTextCenter" role="alert"> <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button> ';
        alertHtml += message + ' <a href="' + alertLink + '" class="alert-link">' + alertLinkTitle + '</a> </div> </div> </br>';

        $('#impAlertPlaceholder').html(alertHtml);

        setTimeout(function() {
            $('#impAlertPlaceholder .alert').remove()
        }, displayTime);
    }


    $scope.flashAlertAndResetNewJobTab = function(){
        $scope.resetNewJobTab();
        $scope.flashAlertCheckRecentJobs();
    }

    $scope.activateCurrentJobStatusTab = function() {

        // 1 second = 1000 milliseconds
        $scope.refreshInterval = setInterval(function() {
            refreshTimer()
        }, 2000); // milliseconds

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

    $scope.refreshJobStatus = function() {

        console.log("Refreshing Job Status");
        $scope.checkStatusURL = '/jobStatus/' + $scope.formData.jobID

        $http.get($scope.checkStatusURL, $scope.formData)
            .success(function(data) {
                var newStatus = data.trim()
                    /* if ($scope.submittedJobStatus != newStatus){
                         $scope.updateJobStatus($scope.formData.jobID, newStatus);
                     }*/
                $scope.submittedJobStatus = newStatus;

            })
            .error(function(err) {
                // $scope.submittedJobStatus='FAILED'
                $scope.submittedJobStatus = 'FAILED';
                $scope.output = err
                console.log(err)

            });

        /*
        //
        $("#navLinkStatus").removeClass('disabled');
        $("#navLinkStatus").find('a').attr("data-toggle", "tab");
        $("#navLinkStatus").click();

        activateTab('jobStatusTab');

        // Disable Create New Job 
        $("#navLinkNewJob").addClass('disabled');
        $("#navLinkNewJob").find('a').removeAttr("data-toggle");*/


        if ($scope.submittedJobStatus == 'JOB_SUCCESSFUL' || $scope.submittedJobStatus == 'JOB_FAILED') {
            clearInterval($scope.refreshInterval)
            $("#flowStepStatus").removeClass('disabled');
            $("#flowStepStatus").addClass('complete');
            $("#flowStepResult").find('i').css({
                "opacity": "1"
            });

        }

        /*// Update the JobID with the new Status
        $scope.updateJobStatus = function(jobID, newJobStatus){

            console.log("Refreshing Job Status");
            var updateStatusURL = '/jobStatus/' + jobID

            var reqBody = {
                'Status' : newJobStatus
            } 

            $http.put(updateStatusURL, reqBody)
                .success(function(data) {
                    console.log("New Job Status Updated")
                })
                .error(function(err) {
                    // $scope.submittedJobStatus='FAILED'
                    console.log("New Job Status Failed")
                    console.log(err)
                });


        }*/

    }

    $scope.populateRecentAdHocJobTable = function() {
        var getRecentAdHocJobs = '/adHocJob'

        $http.get(getRecentAdHocJobs)
            .success(function(data) {
                $scope.recentAdHocJobs = '';
                $scope.displayedCollection = '';
                $scope.recentAdHocJobs = data;
                $scope.displayedCollection = [].concat($scope.recentAdHocJobs);
            })
            .error(function(err) {
                // $scope.submittedJobStatus='FAILED'
                $scope.jobLog = 'Fetching RecentAdHocJobs Failed :' + err;
                console.log(err)

            });
        
    }

    // Model - View Job Log
    $scope.viewAdHocJobLogModal = function(adHocJob) {
        console.log("Clicked viewLogModal");
        $('#modalViewAdHocLog').modal('show')

        $("#modalViewAdHocLog").find('#JobName').text(adHocJob.JobName);
        $("#modalViewAdHocLog").find('#JobStatus').text("(" + adHocJob.JobRunStatus + ")");

        $scope.getJobLog(adHocJob.JobID, function() {
            console.log("In callback");
            $scope.jobLogSelected = $scope.jobLogRetrieved;
            $("#modalViewAdHocLog").find('#jobLogPre').text($scope.jobLogRetrieved);

        })

    }

    $scope.viewAdHocJobResultsModal = function(adHocJob) {

        $scope.resetNewJobTab();

        $('#modalViewAdHocResults').modal('show')

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

        $('#modalViewAdHocResults').on('hidden.bs.modal', function() {
            $scope.barChartComputedData = null;
            $scope.lineChartComputedData = null;
            $("#modalViewAdHocResults").find('.modal-body').html(" ");
            $scope.resetNewJobTab();
        })

    }

    $scope.viewCurrentJobLog = function() {
        $scope.showJobLog = true
        console.log("View Job Log");
        $scope.getJobLog($scope.formData.jobID, function() {
            $scope.jobLog = $scope.jobLogRetrieved;
        })

    }

    $scope.getJobLog = function(jobID, callBack) {

        $scope.checkLogURL = '/adHocJobLog/' + jobID
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

    $scope.viewJobResult = function() {

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

    $scope.computeJobResults = function(jobID) {

        $scope.checkResultURL = '/adHocJobResultFile/' + jobID

        $http.get($scope.checkResultURL)
            .success(function(data) {
                $scope.jobResult = data;
                dashboardAungularService.createResultTable('#jobResultTable', $scope.jobResult);
            })

        .error(function(err) {
            // $scope.submittedJobStatus='FAILED'
            $scope.jobResult = 'Fetching Result Failed :' + err;
            console.log(err)
        });
    }


    $scope.createBarChart = function() {
        console.log("creating bar")
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
        $scope.barChartComputedData = $scope.jobResult

    }

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
        $scope.lineChartComputedData = $scope.jobResult

    }

    $scope.saveDivAsPicture = function() {
        dashboardAungularService.saveAsPicture($("#resultPanel"))
    }

    $scope.editAndResubmitJob = function(adHocJob) {
        $('#recentAdHocTab').removeClass('active');
        $('#navRecentAdHoc').removeClass('active');
        $('#navNewAdHoc').addClass('active');
        $scope.resetNewJobTab();
        $scope.formData.hiveQuery = adHocJob.SQLQuery;
        $scope.formData.jobName = adHocJob.JobName;

    }

    $scope.resubmitJob = function(adHocJob) {
        $scope.resetNewJobTab();
        $scope.formData.hiveQuery = adHocJob.SQLQuery;
        $scope.formData.jobName = adHocJob.JobName;
        $scope.submitJob();
        console.log("Job Resubmitted")
        setTimeout(function() {
            $scope.populateRecentAdHocJobTable()
        }, 1000);
    }

    $scope.downloadAdHocJobResultFile = function() {

        var downloadAdHocJobResultFile = '/downloadAdHocJobResultFile/' + $scope.formData.jobID;
        //window.open(downloadAdHocJobResultFile);
        dashboardAungularService.downloadFile(downloadAdHocJobResultFile);
        console.log("Downloaded Result File for JobID: " + $scope.formData.jobID);
    }

    $scope.showPopupFlag = function(text, limit){
        if (text.length > limit)
            return true;
        return false;
    }

    $scope.parseIsoDatetime = function(dateStr){
        return dashboardAungularService.parseIsoDatetime(dateStr); 
    }


    $scope.reset = function() {
        $scope.formData = {}
        $scope.user = angular.copy($scope.master);
    };


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
        
        //$('#copyDetailsFromAdHocJobBtn').trigger("click");

        // $('#createSchedJobTab').find('#schedJobName').val(adHocJob.JobName);
        // $('#createSchedJobTab').find('#schedhiveQuery').val(adHocJob.SQLQuery);

        $rootScope.$broadcast('copyDetailsFromAdHocJob', adHocJob);
        console.log("Send adHocJobDetails to Scheduler Tab");

    }

    $scope.reset();


});
