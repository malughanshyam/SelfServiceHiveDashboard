var app = angular.module('myApp', []);

app.controller('formCtrl', function($scope, $http) {

    // disable tab
    $("#navLinkStatus").addClass('disabled');
    $("#navLinkStatus").find('a').removeAttr("data-toggle");

    $("#navLinkResult").addClass('disabled');
    $("#navLinkResult").find('a').removeAttr("data-toggle");
    
    $("#navChart1").addClass('disabled');
    $("#navChart1").find('a').removeAttr("data-toggle");

    $("#navChart2").addClass('disabled');
    $("#navChart2").find('a').removeAttr("data-toggle");


    function activaTab(tab){
        $('.nav-tabs a[href="#' + tab + '"]').tab('show');
    };

    

        $("#navLinkResult").removeClass('disabled');
        $("#navLinkResult").find('a').attr("data-toggle","tab");
        $("#navLinkResult").click();

        activaTab('jobResult');


    




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


       $scope.checkResultURL = '/jobResultFile?jobID='+$scope.formData.jobID

        $http.get($scope.checkResultURL,$scope.formData)
            .success(function(data) {
                $scope.jobResult=data;
                $scope.createResultTable();
                $scope.createCharts(enableChartTabs);

                function enableChartTabs(){
                    /*enable tab*/
                    $("#navChart1").removeClass('disabled');
                    $("#navChart1").find('a').attr("data-toggle","tab");

                    $("#navChart2").removeClass('disabled');
                    $("#navChart2").find('a').attr("data-toggle","tab");
                }

            })
            .error(function(err){
                // $scope.submittedJobStatus='FAILED'
                $scope.jobResult='Fetching Result Failed :'+err;
                console.log(err)
                
            });

    }

    $scope.createHTMLTable = function(divId, data) {

        $(function() {
                
                $('#'+divId).CSVToTable(data,{

                    // class name to apply to the <table> tag
                    tableClass: "resultTable table table-hover table-condensed",

                    // class name to apply to the <thead> tag
                    theadClass: "",

                    // class name to apply to the <th> tag
                    thClass: "",

                    // class name to apply to the <tbody> tag
                    tbodyClass: "",

                    // class name to apply to the <tr> tag
                    trClass: "",

                    // class name to apply to the <td> tag
                    tdClass: "",

                    // path to an image to display while CSV/TSV data is loading
                    loadingImage: "",

                    // text to display while CSV/TSV is loading
                    loadingText: "Loading Results...",

                    // separator to use when parsing CSV/TSV data
                    separator: "\t",

                    startLine: 0

                });
            });
    }

    $scope.createResultTable = function(){
        console.log($scope.jobResult);
        $scope.createHTMLTable ('jobResultTable', $scope.jobResult);
        
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

    $scope.createCharts = function generateChart(callbackFunction){

        // Parse the TSV Result file into Array of Data 
        var x = $scope.jobResult.split('\n');
        for (var i=0; i<x.length; i++) {
            y = x[i].split('\t');
            x[i] = y;
        }

        $scope.chartData = x
        console.log(x)

        // $scope.chartDataHeader = x[0]
        // $scope.chartDataSplit = x.slice(1);

        // console.log("Header: ")
        // console.log($scope.chartDataHeader)
        
        // console.log("Data: ")
        // console.log($scope.chartDataSplit)

        // Generate Bar Chart
        var chartBar = c3.generate({
            bindto: '#chartBar',
            data: {
                x: $scope.chartData[0][0],
                rows: $scope.chartData,
                type: 'bar'
            },
            axis: {
                x: {
                    type: 'category',
                    tick: {
                        rotate: 75,
                        multiline: false
                    },
                    height: 130
                }
            }
                        

        });

        // Generate Line Chart
        var chartBar = c3.generate({
            bindto: '#chartLine',
            data: {
                x: $scope.chartData[0][0],
                rows: $scope.chartData,
                type: 'line'
            },
            axis: {
                x: {
                    type: 'category',
                    tick: {
                        rotate: 75,
                        multiline: false
                    },
                    height: 130
                }
            }
                        

        });

        callbackFunction();

    }


    $scope.createChart = function(){

//        $scope.checkResultURL = '/jobResultFile?jobID='+$scope.formData.jobID
    $scope.checkResultURL = '/jobResultFile?jobID='+'nyse'

    $http.get($scope.checkResultURL,$scope.formData)
        .success(function(data) {
            $scope.chartData=data.trim();
            console.log("Data retrieved: ")
            console.log($scope.chartData)
            generateChart()
        })
        .error(function(err){
            // $scope.submittedJobStatus='FAILED'
            console.log(err)
            
        });

        function generateChart(){

            // Parse the TSV Result file into Array of Data 
            var x = $scope.chartData.split('\n');
            for (var i=0; i<x.length; i++) {
                y = x[i].split('\t');
                x[i] = y;
            }

            $scope.chartData = x
            console.log(x)

            // $scope.chartDataHeader = x[0]
            // $scope.chartDataSplit = x.slice(1);

            // console.log("Header: ")
            // console.log($scope.chartDataHeader)
            
            // console.log("Data: ")
            // console.log($scope.chartDataSplit)

            // Generate Bar Chart
            var chartBar = c3.generate({
                bindto: '#chartBar',
                data: {
                    x: $scope.chartData[0][0],
                    rows: $scope.chartData,
                    type: 'bar'
                },
                axis: {
                    x: {
                        type: 'category',
                        tick: {
                            rotate: 75,
                            multiline: false
                        },
                        height: 130
                    }
                }
                            

            });

            // Generate Line Chart
            var chartBar = c3.generate({
                bindto: '#chartLine',
                data: {
                    x: $scope.chartData[0][0],
                    rows: $scope.chartData,
                    type: 'line'
                },
                axis: {
                    x: {
                        type: 'category',
                        tick: {
                            rotate: 75,
                            multiline: false
                        },
                        height: 130
                    }
                }
                            

            });

        }
    
    }


});