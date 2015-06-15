angular.module('dashboardApp')
	.service('dashboardAungularService', function() {
  
	var createHTMLTable = function(divId, data) {

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


/*  var productList = [];

  var addProduct = function(newObj) {
      productList.push(newObj);
  };

  var getProducts = function(){
      return productList;
  };
*/
  return {
    createHTMLTable: createHTMLTable //,
  };

});