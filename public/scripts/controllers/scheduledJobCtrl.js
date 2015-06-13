angular.module('dashboardApp')

    .controller('scheduledJobCtrl', function($scope, $http) {


    // ---------------------------------
    // Scheduled Job Section
    // ---------------------------------


    // Initialize Schedule New Job
    $scope.initializeScheduleNewJob = function() {
        $scope.schedJob = {};

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
                $scope.displayedSchedJobsCollection = '';
                $scope.allSchedJobs = data;
                $scope.displayedSchedJobsCollection = [].concat($scope.allSchedJobs);
            })
            .error(function(err) {
                // $scope.submittedJobStatus='FAILED'
                $scope.jobLog = 'Fetching RecentAdHocJobs Failed :' + err;
                console.log(err)

            });
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
                    })
                    .error(function(err) {
                        // $scope.submittedJobStatus='FAILED'
                        console.log("Job Deletion Failed");
                        console.log(err);

                });

            }



        }); 

        
    }


    $scope.activateNewScheduleJobTab();
 
    // delete these lines... only for testing
    // $('#createSchedJobTab').removeClass('active');
    // $('#createSchedJobStatusTab').addClass('active');
    //$scope.scheduleJob();

    $scope.isShowPopup = function(text, limit){
        if (text.length > limit)
            return true;
        return false;
    }

    $scope.parseIsoDatetime = function(dtstr){
    
        MM = {Jan:"January", Feb:"February", Mar:"March", Apr:"April", May:"May", Jun:"June", Jul:"July", Aug:"August", Sep:"September", Oct:"October", Nov:"November", Dec:"December"}

        return String(new Date(dtstr)).replace(
            /\w{3} (\w{3}) (\d{2}) (\d{4}) (\d{2}):(\d{2}):[^(]+\(([A-Z]{3})\)/,
            function($0,$1,$2,$3,$4,$5,$6){
                return MM[$1]+" "+$2+", "+$3+" - "+$4%12+":"+$5+(+$4>12?" PM":" AM")+" "+$6 
            }
        )

    }




});