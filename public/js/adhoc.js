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

/*    $(document).ready(function() {
        $(".nav li.disabled a").click(function() {
        return false;
        });
    });*/

    $scope.formData = {}
    $scope.output=''

    $scope.formData.hiveQuery = ''
    $scope.formData.jobName = ''
    $scope.formData.jobID = ''

    // $scope.hiveQuery = ''
    // $scope.jobID = ''
    

    $scope.submitJob = function(){

       console.log("SubmitJob Clicked");

        $http.post('/submitJob',$scope.formData)
            .success(function(data) {
                //$scope.formData = {}
                // $scope.hiveQuery = ''
                $scope.submittedJobStatus='SUCCESS'
                console.log(data)
                $scope.output=data
                //alert("File written : " + data)

            })
            .error(function(err){
                $scope.submittedJobStatus='FAILED'
                $scope.output=err
                //alert("Error" + err)
            });


        /*enable tab*/
        $("#navLinkStatus").removeClass('disabled');
        $("#navLinkStatus").find('a').attr("data-toggle","tab");
        $("#navLinkStatus").click();

        activaTab('jobStatus');

        // Disable Create New Job 
        $("#navLinkNewJob").addClass('disabled');
        $("#navLinkNewJob").find('a').removeAttr("data-toggle");


        

/*        $('#navLinkResult').removeClass('disabled');
        $('#navLinkResult').find('a').attr("data-toggle","tab")
*/
        console.log("Clicked Execute")
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