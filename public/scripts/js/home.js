var app = angular.module('myApp', []);

app.controller('formCtrl', function($scope, $http) {
    
    $scope.formData = {}

    $scope.formData.hiveQuery = ''

    // $scope.hiveQuery = ''
    // $scope.jobID = ''
    

    $scope.createJob = function(){

        $http.post('/query',$scope.formData)
            .success(function(data) {
                $scope.formData = {}
                // $scope.hiveQuery = ''
                alert("File written : " + data)

            })
            .error(function(err){
                alert("Error" + err)
            });

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