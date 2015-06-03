var app = angular.module('myApp', []);

app.controller('formCtrl', function($scope, $http) {

    // disable tab
    $("#navLinkStatus").addClass('disabled');
    $("#navLinkStatus").find('a').removeAttr("data-toggle");

    $("#navLinkResult").addClass('disabled');
    $("#navLinkResult").find('a').removeAttr("data-toggle");
    
    function activaTab(tab){
        $('.nav-tabs a[href="#' + tab + '"]').tab('show');
    };

    /*

        $("#navLinkStatus").removeClass('disabled');
        $("#navLinkStatus").find('a').attr("data-toggle","tab");
        $("#navLinkStatus").click();

        activaTab('jobStatus');


    */




    $scope.refreshInterval;

    $scope.formData = {}
    $scope.output=''

    $scope.formData.hiveQuery = ''
    $scope.formData.jobName = ''
    $scope.formData.jobID = ''
    $scope.submittedJobStatus = 'JOB_NOT_STARTED'
    $scope.showJobLog=false
    $scope.jobResult=''
    
    $scope.submitJob = function(){

       console.log("SubmitJob Clicked");

        $http.post('/submitJob',$scope.formData)
            .success(function(data) {
                $scope.refreshInterval = setInterval(function () {refreshTimer()}, 1000);
                function refreshTimer() {
                    $scope.refreshJobStatus();
                }      

            })
            .error(function(err){
                $scope.submittedJobStatus='FAILED';
            });


        /*enable tab*/
        $("#navLinkStatus").removeClass('disabled');
        $("#navLinkStatus").find('a').attr("data-toggle","tab");
        $("#navLinkStatus").click();

        activaTab('jobStatus');

        // Disable Create New Job 
        $("#navLinkNewJob").addClass('disabled');
        $("#navLinkNewJob").find('a').removeAttr("data-toggle");


        console.log("Clicked Execute")
    }


    $scope.refreshJobStatus = function(){

       console.log("Refreshing Job Status");
       $scope.checkStatusURL = '/jobStatus?jobID='+$scope.formData.jobID

        $http.get($scope.checkStatusURL,$scope.formData)
            .success(function(data) {
                 $scope.submittedJobStatus=data.trim();
                
            })
            .error(function(err){
                // $scope.submittedJobStatus='FAILED'
                $scope.submittedJobStatus='FAILED';
                $scope.output=err
                console.log(err)
                
            });


        /*enable tab*/
        $("#navLinkStatus").removeClass('disabled');
        $("#navLinkStatus").find('a').attr("data-toggle","tab");
        $("#navLinkStatus").click();

        activaTab('jobStatus');

        // Disable Create New Job 
        $("#navLinkNewJob").addClass('disabled');
        $("#navLinkNewJob").find('a').removeAttr("data-toggle");


        if($scope.submittedJobStatus == 'JOB_SUCCESSFUL' || $scope.submittedJobStatus == 'JOB_FAILED'){
            clearInterval($scope.refreshInterval)
        }

       
       /* if($scope.submittedJobStatus == 'JOB_SUCCESSFUL' )
          $scope.viewJogResult();
*/
    }

    $scope.viewJobLog = function(){
       $scope.showJobLog = true
       console.log("View Job Log");
       $scope.checkLogURL = '/jobLog?jobID='+$scope.formData.jobID

        $http.get($scope.checkLogURL,$scope.formData)
            .success(function(data) {
                
                $scope.jobLog=data;
                
            })
            .error(function(err){
                // $scope.submittedJobStatus='FAILED'
                $scope.jobLog='Fetching Log Failed :'+err;
                console.log(err)
                
            });

    }


    $scope.viewJobResult = function(){

        if ($scope.submittedJobStatus != 'JOB_SUCCESSFUL'){
            return false;
        }

        /*enable tab*/
        $("#navLinkResult").removeClass('disabled');
        $("#navLinkResult").find('a').attr("data-toggle","tab");
        $("#navLinkResult").click();

        activaTab('jobResult');

        // Disable Create New Job 
        $("#navLinkStatus").addClass('disabled');
        $("#navLinkStatus").find('a').removeAttr("data-toggle");


       $scope.showJobLog = true
       console.log("View Job Log");
       $scope.checkResultURL = '/jobResult?jobID='+$scope.formData.jobID

        $http.get($scope.checkResultURL,$scope.formData)
            .success(function(data) {
                $scope.jobResult=data;
            })
            .error(function(err){
                // $scope.submittedJobStatus='FAILED'
                $scope.jobResult='Fetching Result Failed :'+err;
                console.log(err)
                
            });

    }



    $scope.execute = function(){



        $http.post('/execute',$scope.formData)
            .success(function(data) {
                $scope.formData = {}
                // $scope.hiveQuery = ''
                alert("Executing query..: " + data)

            })
            .error(function(err){
                alert("Error" + err)
            });

        console.log("Clicked Execute")
    }

    $scope.reset = function() {
        $scope.user = angular.copy($scope.master);
    };
    
    $scope.reset();


});