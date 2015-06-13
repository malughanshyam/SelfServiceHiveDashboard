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

    $scope.schedReset();

    $scope.initializeScheduleNewJob();

    // delete these lines... only for testing
    // $('#createSchedJobTab').removeClass('active');
    // $('#createSchedJobStatusTab').addClass('active');
    // $scope.scheduleJob();

});