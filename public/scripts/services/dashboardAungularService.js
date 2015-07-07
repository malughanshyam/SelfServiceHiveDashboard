angular.module('dashboardApp')
    .service('dashboardAungularService', function($http) {

        var scheduleNewJobDetails;

        // Set up Server Clock on Navigation Bar
        var serverTime;
        var serverTimeTickInterval = 0;

        // Get Server Time
        var getServerTimeAndStartClock = function() {
            $http.get('/serverTime')
                .success(function(data) {
                    serverTime = moment(data);
                    var duration = moment.duration({
                        's': 1
                    });
                    tickClock(duration);
                })
                .error(function(err) {
                    console.log("Get Server Time Failed")
                    $('#serverClock').text("xx:xx:xx");
                });

        }

        // Tick the clock
        var tickClock = function(duration) {

            serverTimeTickInterval = setInterval(function() {
                serverTime.add(duration); // February 1
                $('#serverClock').text(serverTime.tz('America/New_York').format("ddd, MMMM D YYYY, hh:mm:ss A z"));
            }, 1000); // 1 second = 1000 milliseconds
        }


        // Refresh or Pause the Clock based on Focus / Blur of the Current Tab / Window respectively
        $(window).on("blur focus", function(e) {
            var prevType = $(this).data("prevType");

            if (prevType != e.type) {   //  reduce double fire issues
                switch (e.type) {
                    case "blur":
                        if(serverTimeTickInterval){
                            clearInterval(serverTimeTickInterval);
                        }
                        break;
                    case "focus":
                        if(serverTimeTickInterval){
                            clearInterval(serverTimeTickInterval);
                        }
                        getServerTimeAndStartClock();
                        break;
                }
            }

            $(this).data("prevType", e.type);
        })
        
        // Start the Server Clock Display
        getServerTimeAndStartClock();

        var createResultTable = function(resultTableDivID, data) {

            $(function() {

                $(resultTableDivID).CSVToTable(data, {

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
                    loadingImage: "/img/loading1.gif",

                    // text to display while CSV/TSV is loading
                    loadingText: "Loading Results...",

                    // separator to use when parsing CSV/TSV data
                    separator: "\t",

                    startLine: 0

                });
            });
        }

        var createBarChart = function(chartData, chartDivID, chartWidth) {

            // Parse the TSV Result file into Array of Data 
            var x = chartData.split('\n');
            for (var i = 0; i < x.length; i++) {
                y = x[i].split('\t');
                x[i] = y;
            }

            chartSplitData = x

            // $scope.chartDataHeader = x[0]
            // $scope.chartDataSplit = x.slice(1);

            // console.log("Header: ")
            // console.log($scope.chartDataHeader)

            // console.log("Data: ")
            // console.log($scope.chartDataSplit)

            // Generate Bar Chart
            var chartBar = c3.generate({
                bindto: chartDivID,
                data: {
                    x: chartSplitData[0][0],
                    rows: chartSplitData,
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

        }

        var createLineChart = function(chartData, chartDivID, chartWidth) {

            // Parse the TSV Result file into Array of Data 
            var x = chartData.split('\n');
            for (var i = 0; i < x.length; i++) {
                y = x[i].split('\t');
                x[i] = y;
            }

            var chartSplitData = x

            // $scope.chartDataHeader = x[0]
            // $scope.chartDataSplit = x.slice(1);

            // console.log("Header: ")
            // console.log($scope.chartDataHeader)

            // console.log("Data: ")
            // console.log($scope.chartDataSplit)

            // Generate Line Chart
            var chartLine = c3.generate({
                bindto: chartDivID,
                data: {
                    x: chartSplitData[0][0],
                    rows: chartSplitData,
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

        }

        var createPieChart = function(chartData, chartDivID, chartWidth) {

            // Parse the TSV Result file into Array of Data 
            var x = chartData.split('\n');
            for (var i = 0; i < x.length; i++) {
                y = x[i].split('\t');
                x[i] = y;
            }

            var chartSplitData = x

            console.log(chartSplitData);
            
            // Generate Line Chart
            var chartPie = c3.generate({
                bindto: chartDivID,
                data: {
                    rows: chartSplitData,
                    type: 'pie'
                },
                
                size: {
                    width: chartWidth
                }
            });

        }


        var createTimeSeriesChart = function(chartData, chartDivID, chartWidth) {

            // Parse the TSV Result file into Array of Data 
            var x = chartData.split('\n');
            for (var i = 0; i < x.length; i++) {
                y = x[i].split('\t');
                x[i] = y;
            }

            var chartSplitData = x

            // $scope.chartDataHeader = x[0]
            // $scope.chartDataSplit = x.slice(1);

            // console.log("Header: ")
            // console.log($scope.chartDataHeader)

            // console.log("Data: ")
            // console.log($scope.chartDataSplit)

            // Generate Line Chart
            var chartTimeSeries = c3.generate({
                bindto: chartDivID,
                data: {
                    x: chartSplitData[0][0],
                    rows: chartSplitData
                },
                axis: {
                    x: {
                        type: 'timeseries',
                        tick: {
                            format: '%Y-%m-%d'
                        },
                        height: 130
                    }
                },
                size: {
                    width: chartWidth
                }
            });

        }

        var saveAsPicture = function(element) {

            html2canvas(element, {
                allowTaint: true,
                useCORS: true,
                onrendered: function(canvas) {
                    //document.body.appendChild(canvas);
                    canvas.toBlob(function(blob) {
                        //document.body.appendChild(canvas);
                        saveAs(blob, "dashboard.png");
                    });

                }
            });

        }

        var parseIsoDatetime = function(dtstr) {

            return moment(dtstr).tz('America/New_York').format("ddd, MMMM D YYYY, hh:mm A z");

            /*MM = {Jan:"January", Feb:"February", Mar:"March", Apr:"April", May:"May", Jun:"June", Jul:"July", Aug:"August", Sep:"September", Oct:"October", Nov:"November", Dec:"December"}

            return String(new Date(dtstr)).replace(
                /\w{3} (\w{3}) (\d{2}) (\d{4}) (\d{2}):(\d{2}):[^(]+\(([A-Z]{3})\)/,
                function($0,$1,$2,$3,$4,$5,$6){
                    return MM[$1]+" "+$2+", "+$3+" - "+$4%12+":"+$5+(+$4>12?" PM":" AM")+" "+$6 
                }
            )*/

        }

        var initiateScheduling = function(details) {
            scheduleNewJobDetails = details;
        }

        var getJobDetailsForScheduling = function() {
            return scheduleNewJobDetails;
        }

        var flashImpAlert = function(type, message, displayTime, alertLink, alertLinkTitle) {
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

        var cleanUpStr = function(str) {
            return str.replace(/[^A-Z0-9]+/ig, "_");
        }

        var convertTime24Hto12H_bkp = function(timeStr) {
            var hours = timeStr.Hours;
            var minutes = timeStr.Minutes;
            var suffix = hours >= 12 ? "PM" : "AM";

            function checkTime(i) {
                if (i < 10) {
                    i = "0" + i
                }; // add zero in front of numbers < 10
                return i;
            }

            hours = ((hours + 11) % 12 + 1);

            hoursStr = checkTime(hours);
            minStr = checkTime(minutes);

            timeStr12H = hours + ":" + minutes + " " + suffix;
            console.log(timeStr.Hours + ":" + timeStr.Minutes + " converted to " + timeStr12H);

            return timeStr12H;
        }

        function convertTime24Hto12H(time24) {

            function normalizeDigit(i) {
                if (i < 10) {
                    i = "0" + i
                }; // add zero in front of numbers < 10
                return i;
            }

            var hours = time24.Hours;
            var minutes = time24.Minutes;
            var time12;
            if (hours == 12) {
                time12 = hours + ':' + minutes + ' PM';
            } else {
                if (hours == 00) {
                    time12 = '12:' + minutes + ' AM';
                } else {
                    if (hours > 12) {
                        hours = (hours - 12);
                        time12 = normalizeDigit(hours) + ':' + minutes + ' PM';
                    } else {
                        time12 = hours + ':' + minutes + ' AM';
                    }
                }
            }
            return time12;
        }

        return {
            createResultTable: createResultTable,
            createBarChart: createBarChart,
            createLineChart: createLineChart,
            createPieChart : createPieChart,
            createTimeSeriesChart: createTimeSeriesChart,
            saveAsPicture: saveAsPicture,
            parseIsoDatetime: parseIsoDatetime,
            initiateScheduling: initiateScheduling,
            getJobDetailsForScheduling: getJobDetailsForScheduling,
            flashImpAlert: flashImpAlert,
            cleanUpStr: cleanUpStr,
            convertTime24Hto12H: convertTime24Hto12H
        };

    });