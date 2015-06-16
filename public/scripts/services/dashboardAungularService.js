angular.module('dashboardApp')
  .service('dashboardAungularService', function() {
  
  var barChartComputedData;
  var lineChartComputedData;

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
                loadingImage: "",

                // text to display while CSV/TSV is loading
                loadingText: "Loading Results...",

                // separator to use when parsing CSV/TSV data
                separator: "\t",

                startLine: 0

            });
        });
    }

  var createBarChart = function(chartData, chartDivID, chartWidth) {

      // Check against the locally stored chart data to prevent duplicate computation/drawing of the charts
      if (barChartComputedData == chartData) {
          return true;
      }

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

      // Variable to store the data for chart to prevent duplicate computation/drawing of the charts
      barChartComputedData = chartData

  }

  var createLineChart = function(chartData, chartDivID, chartWidth) {

        // Check against the locally stored chart data to prevent duplicate computation/drawing of the charts
      if (lineChartComputedData == chartData) {
          return true;
      }


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

      // Variable to store the data for chart to prevent duplicate computation/drawing of the charts
      lineChartComputedData = chartData
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

  var parseIsoDatetime = function(dtstr){
  
      MM = {Jan:"January", Feb:"February", Mar:"March", Apr:"April", May:"May", Jun:"June", Jul:"July", Aug:"August", Sep:"September", Oct:"October", Nov:"November", Dec:"December"}

      return String(new Date(dtstr)).replace(
          /\w{3} (\w{3}) (\d{2}) (\d{4}) (\d{2}):(\d{2}):[^(]+\(([A-Z]{3})\)/,
          function($0,$1,$2,$3,$4,$5,$6){
              return MM[$1]+" "+$2+", "+$3+" - "+$4%12+":"+$5+(+$4>12?" PM":" AM")+" "+$6 
          }
      )

  }


  var populateResultsModal = function(jobDetails) {

//      $('#commonModalViewResults').modal('show')

      jobResultTabContent = $("#jobResultTab").html();

      $("#commonModalViewResults").find('#JobName').text(jobDetails.JobName);
      $("#commonModalViewResults").find('.modal-body').html(jobResultTabContent);
      // $("#modalViewResults").find('#JobID').text("(" + adHocJob.JobID + ")");

      $("#commonModalViewResults").find('#submittedHiveQuery').text(jobDetails.SQLQuery);
      $("#commonModalViewResults").find('#resultPanelTitle').text(jobDetails.JobName);


      $('#downloadBarChartBtnId').addClass('disabled');
      $('#downloadLineChartBtnId').addClass('disabled');

      $('#commonModalViewResults').on('hidden.bs.modal', function() {
          barChartComputedData = null;
          lineChartComputedData = null;
      });

  }

  var viewJobLog = function(jobDetails, logData){

    $('#commonModalViewLog').modal('show')
    $("#commonModalViewLog").find('#JobName').text(jobDetails.JobName);
    $("#commonModalViewLog").find('#JobStatus').text("(" + jobDetails.JobRunStatus + ")");
    $("#commonModalViewLog").find('#jobLogPre').text(logData);
  }

/*  var populateResultsModal = function(jobDetails) {

      $('#modalViewResults').modal('show')

      jobResultTabContent = $("#jobResultTab").html();

      $("#modalViewResults").find('#JobName').text(jobDetails.JobName);
      $("#modalViewResults").find('.modal-body').html(jobResultTabContent);
      // $("#modalViewResults").find('#JobID').text("(" + adHocJob.JobID + ")");

      $("#modalViewResults").find('#submittedHiveQuery').text(jobDetails.SQLQuery);
      $("#modalViewResults").find('#resultPanelTitle').text(jobDetails.JobName);


      $('#downloadBarChartBtnId').addClass('disabled');
      $('#downloadLineChartBtnId').addClass('disabled');

      $('#modalViewResults').on('hidden.bs.modal', function() {
          barChartComputedData = null;
          lineChartComputedData = null;
      })

  }*/



/*  var productList = [];

  var addProduct = function(newObj) {
      productList.push(newObj);
  };

  var getProducts = function(){
      return productList;
  };
*/


  return {
    createResultTable : createResultTable,
    createBarChart    : createBarChart,
    createLineChart   : createLineChart,
    saveAsPicture     : saveAsPicture,
    parseIsoDatetime  : parseIsoDatetime,
    populateResultsModal : populateResultsModal,
    viewJobLog        : viewJobLog
  };

});