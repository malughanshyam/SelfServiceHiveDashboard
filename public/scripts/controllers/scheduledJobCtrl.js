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

        $scope.schedJob.schedJobName = "";
        $scope.schedJob.schedQuery = "";
        
        $scope.schedJob.jobSchedTime.hours = $scope.schedJob.jobSchedTime.completeTime.getHours();
        $scope.schedJob.jobSchedTime.minutes = $scope.schedJob.jobSchedTime.completeTime.getMinutes();
        console.log($scope.schedJob.jobSchedTime.hours + ":" + $scope.schedJob.jobSchedTime.minutes);

        console.log("SubmitJob Clicked");

        $http.post('/submitSchedJob', $scope.schedJob)
            .success(function(data) {
                $scope.schedJob.jobID = data.JobID;
                console.log("schedJob.jobID: "+ $scope.schedJob.jobID);
                console.log();
//                $scope.activateScheduleJobStatusTab()

            })
            .error(function(err) {
                console.log("Failed")
                console.log(err)
                $scope.formData.jobID = err.JobID;
                $scope.submittedJobStatus = 'FAILED';
                //$scope.activateScheduleJobStatusTab()
            });

        //$scope.showCreateNewJobBtn = true


    }


      $scope.schedReset = function() {
        $scope.schedJob = {};
        $scope.initializeScheduleNewJob();
        $scope.schedJob = angular.copy($scope.schedJob);
      };

    $scope.schedReset();

    $scope.initializeScheduleNewJob();

});