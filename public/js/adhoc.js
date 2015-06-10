// var app = angular.module('dashboardApp', []);

var app = angular.module('dashboardApp', ['ui.bootstrap','smart-table', 'ngAnimate']);

app.controller('adHocController', function($scope, $compile, $http) {

    // experiment with smart table
    $scope.recentAdHocJobs = [];
    $scope.displayedCollection = [];
    
    // Variables to store the data for Bar and Line charts to prevent recomputing the already populated charts
    $scope.barChartComputedData;
    $scope.lineChartComputedData;

    // disable tab
    $("#navLinkStatus").addClass('disabled');
    $("#navLinkStatus").find('a').removeAttr("data-toggle");

    $("#navLinkResult").addClass('disabled');
    $("#navLinkResult").find('a').removeAttr("data-toggle");

    $("#flowStepCreate").find('i').css({"opacity": "1"});    

    $("#flowStepStatus").find('i').css({"opacity": "0.3"});
    $("#flowStepStatus").addClass('disabled');

    $("#flowStepResult").find('i').css({"opacity": "0.3"});
    $("#flowStepResult").addClass('disabled');        


    function activaTab(tab) {
        $('.nav-tabs a[href="#' + tab + '"]').tab('show');
    };



/*    $("#navLinkResult").removeClass('disabled');
    $("#navLinkResult").find('a').attr("data-toggle", "tab");
    $("#navLinkResult").click();

    activaTab('jobResult');*/


    $scope.refreshInterval;

    $scope.formData = {}
    $scope.output = ''

    $scope.formData.hiveQuery = ''
    
    $scope.formData.jobID = ''
    $scope.formData.jobName = ''
    $scope.submittedJobStatus = 'JOB_NOT_STARTED'
    $scope.showJobLog = false
    $scope.jobResult = ''

    $scope.submitJob = function() {

        console.log("SubmitJob Clicked");

        $http.post('/submitNewAdHocJob', $scope.formData)
            .success(function(data) {
                $scope.formData.jobID = data.JobID;
                console.log("FormData.jobID: " );
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

        console.log("Outside")



        console.log("Clicked Execute")
    }

    $scope.activateCurrentJobStatusTab = function(){

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

        activaTab('jobStatusTab');

        // Disable Create New Job 
        $("#navLinkNewJob").addClass('disabled');
        $("#navLinkNewJob").find('a').removeAttr("data-toggle");

        $("#flowStepCreate").removeClass('disabled');
        $("#flowStepCreate").addClass('complete');
    
        $("#flowStepStatus").find('i').css({"opacity": "1"});
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

        activaTab('jobStatusTab');

        // Disable Create New Job 
        $("#navLinkNewJob").addClass('disabled');
        $("#navLinkNewJob").find('a').removeAttr("data-toggle");*/


        if ($scope.submittedJobStatus == 'JOB_SUCCESSFUL' || $scope.submittedJobStatus == 'JOB_FAILED') {
            clearInterval($scope.refreshInterval)
            $("#flowStepStatus").removeClass('disabled');
            $("#flowStepStatus").addClass('complete');
            $("#flowStepResult").find('i').css({"opacity": "1"});
            
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


    $scope.populateRecentAdHocJobTable = function(){
        var getRecentAdHocJobs = '/adHocJob'

        $http.get(getRecentAdHocJobs, $scope.formData)
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
    $scope.viewLog = function(adHocJob){
        $('#modelViewLog').modal('show')

        $("#modelViewLog").find('#JobName').text(adHocJob.JobName);
        $("#modelViewLog").find('#JobStatus').text("(" + adHocJob.Status + ")");

        $scope.getJobLog(adHocJob.JobID, function(){
            console.log("In callback");
            $scope.jobLogSelected = $scope.jobLogRetrieved;
            $("#modelViewLog").find('#jobLogPre').text($scope.jobLogRetrieved);

        })

    }

    $scope.viewResults = function(adHocJob){

        $('#modelViewResults').modal('show')

        jobResultTabContent = $("#jobResultTab").html();

        $("#modelViewResults").find('#JobName').text(adHocJob.JobName);
        $("#modelViewResults").find('.modal-body').html(jobResultTabContent);
        // $("#modelViewResults").find('#JobID').text("(" + adHocJob.JobID + ")");

        $("#modelViewResults").find('.modal-body').html(jobResultTabContent);

        // compile the element
        $compile($('#modelViewResults'))($scope);

        $("#modelViewResults").find('#submittedHiveQuery').text(adHocJob.SQLQuery);
        $("#modelViewResults").find('#resultPanelTitle').text(adHocJob.JobName);

        $scope.computeJobResults(adHocJob.JobID);

        $('#modelViewResults').on('hidden.bs.modal', function () {
            $scope.barChartComputedData  = null;
            $scope.lineChartComputedData = null;
        })

    }

    $scope.viewCurrentJobLog = function() {
        $scope.showJobLog = true
        console.log("View Job Log");
        $scope.getJobLog($scope.formData.jobID, function(){
            $scope.jobLog = $scope.jobLogRetrieved;            
        })

    }

    $scope.getJobLog = function(jobID, callBack) {
        
        $scope.checkLogURL = '/jobLog/' + jobID
        $scope. jobLogRetrieved;
        $http.get($scope.checkLogURL, $scope.formData)
            .success(function(data) {
                $scope.jobLogRetrieved =  data;
                console.log("Successfully retrieved JobLog");  
                callBack();
                
            })
            .error(function(err) {
                $scope.jobLogRetrieved =  "Fetching Log Failed" + err
                console.log("Fetching Log Failed");
                callBack();
            });


    }


    $scope.viewJobResult_BackUp = function() {

        if ($scope.submittedJobStatus != 'JOB_SUCCESSFUL') {
            return false;
        }

        /*enable tab*/
        $("#navLinkResult").removeClass('disabled');
        $("#navLinkResult").find('a').attr("data-toggle", "tab");
        $("#navLinkResult").click();

        activaTab('jobResultTab');

        // Disable Create New Job 
        $("#navLinkStatus").addClass('disabled');
        $("#navLinkStatus").find('a').removeAttr("data-toggle");


        $scope.checkResultURL = '/jobResultFile?jobID=' + $scope.formData.jobID

        $http.get($scope.checkResultURL, $scope.formData)
            .success(function(data) {
                $scope.jobResult = data;
                $scope.createResultTable();
                $scope.createCharts(enableChartTabs);

                function enableChartTabs() {
                    /*enable tab*/
                    $("#navChart1").removeClass('disabled');
                    $("#navChart1").find('a').attr("data-toggle", "tab");

                    $("#navChart2").removeClass('disabled');
                    $("#navChart2").find('a').attr("data-toggle", "tab");

                    $("#flowStepResult").removeClass('disabled');
                    $("#flowStepResult").addClass('complete');  
                }

            })
            .error(function(err) {
                // $scope.submittedJobStatus='FAILED'
                $scope.jobResult = 'Fetching Result Failed :' + err;
                console.log(err)

            });

    }

    // Refactor View Results Begins
    $scope.viewJobResult = function() {

        if ($scope.submittedJobStatus != 'JOB_SUCCESSFUL') {
            return false;
        }

        /*enable tab*/
        $("#navLinkResult").removeClass('disabled');
        $("#navLinkResult").find('a').attr("data-toggle", "tab");
        $("#navLinkResult").click();

        activaTab('jobResultTab');

        // Disable Create New Job 
        $("#navLinkStatus").addClass('disabled');
        $("#navLinkStatus").find('a').removeAttr("data-toggle");

        $scope.computeJobResults($scope.formData.jobID)
        $("#flowStepResult").removeClass('disabled');
        $("#flowStepResult").addClass('complete'); 
    }

    $scope.computeJobResults = function(jobID){

        $scope.checkResultURL = '/jobResultFile/' + jobID

        $http.get($scope.checkResultURL)
            .success(function(data) {
                $scope.jobResult = data;
                $scope.createResultTable();          
            })
                
            .error(function(err) {
                // $scope.submittedJobStatus='FAILED'
                $scope.jobResult = 'Fetching Result Failed :' + err;
                console.log(err)
            });
    }
    // Refactor View Results Ends

    $scope.createHTMLTable = function(divId, data) {

        $(function() {

            $('#' + divId).CSVToTable(data, {

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

    $scope.createResultTable = function() {
        $scope.createHTMLTable('jobResultTable', $scope.jobResult);
    }



    $scope.reset = function() {
        $scope.user = angular.copy($scope.master);
    };

    $scope.reset();


    $scope.createBarChart = function() {

           // Compute the Width for the Charts
        var chartWidth = $("#jobResultPanelBodyContent").width()

        // Check against the locally stored chart data to prevent duplicate computation/drawing of the charts
        if ($scope.barChartComputedData == $scope.jobResult){
            return true;
        }
        
        // Parse the TSV Result file into Array of Data 
        var x = $scope.jobResult.split('\n');
        for (var i = 0; i < x.length; i++) {
            y = x[i].split('\t');
            x[i] = y;
        }

        $scope.chartData = x

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
            },
            size: {
                width: chartWidth
            }

        });    

        // Variable to store the data for chart to prevent duplicate computation/drawing of the charts
        $scope.barChartComputedData = $scope.jobResult   
        $('#downloadBarChartBtnId').removeClass('disabled');     

    }


    $scope.createLineChart = function() {

        // Compute the Width for the Charts
        var chartWidth = $("#jobResultPanelBodyContent").width()
        
        // Check against the locally stored chart data to prevent duplicate computation/drawing of the charts
        if ($scope.lineChartComputedData == $scope.jobResult){
            return true;
        }

        // Parse the TSV Result file into Array of Data 
        var x = $scope.jobResult.split('\n');
        for (var i = 0; i < x.length; i++) {
            y = x[i].split('\t');
            x[i] = y;
        }

        $scope.chartData = x

        // $scope.chartDataHeader = x[0]
        // $scope.chartDataSplit = x.slice(1);

        // console.log("Header: ")
        // console.log($scope.chartDataHeader)

        // console.log("Data: ")
        // console.log($scope.chartDataSplit)

        // Generate Line Chart
        var chartLine = c3.generate({
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
            },
            size: {
                width: chartWidth
            }
        });

        // Variable to store the data for chart to prevent duplicate computation/drawing of the charts
        $scope.lineChartComputedData = $scope.jobResult   
        $('#downloadLineChartBtnId').removeClass('disabled');

    }


    

    $scope.createCharts = function (callbackFunction) {

        // Compute the Width for the Charts
        var chartWidth = $("#jobResultTab").width()
        console.log($("#jobResultPanelBodyContent").width());
        console.log($('#jobResultTab').width());
        console.log($('#tabular').width());

        // Parse the TSV Result file into Array of Data 
        var x = $scope.jobResult.split('\n');
        for (var i = 0; i < x.length; i++) {
            y = x[i].split('\t');
            x[i] = y;
        }

        $scope.chartData = x

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
            },
            size: {
                width: chartWidth
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
            },
            size: {
                width: chartWidth
            }


        });
        callbackFunction();

    }


    $scope.createChart_backup = function() {

        //        $scope.checkResultURL = '/jobResultFile?jobID='+$scope.formData.jobID
        $scope.checkResultURL = '/jobResultFile?jobID=' + 'nyse'

        $http.get($scope.checkResultURL, $scope.formData)
            .success(function(data) {
                $scope.chartData = data.trim();
                console.log("Data retrieved: ")
                console.log($scope.chartData)
                generateChart()
            })
            .error(function(err) {
                // $scope.submittedJobStatus='FAILED'
                console.log(err)

            });

        function generateChart() {

            // Parse the TSV Result file into Array of Data 
            var x = $scope.chartData.split('\n');
            for (var i = 0; i < x.length; i++) {
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

    $scope.saveDivAsPicture = function (){
        console.log("clicked me")
        $scope.saveAsPicture ($("#resultPanel"))
    }

    $scope.saveAsPicture = function (element){
        
        html2canvas(element, {
            allowTaint:true,
            useCORS: true,
            onrendered: function(canvas) {
                document.body.appendChild(canvas);
                canvas.toBlob(function(blob) {
                    //document.body.appendChild(canvas);
                    saveAs(blob, "dashboard.png"); 
                });

            }
        });

       
    }


});
