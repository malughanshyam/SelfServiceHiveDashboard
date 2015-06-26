// var app = angular.module('dashboardApp', []);
angular.module('dashboardApp', ['ui.bootstrap', 'smart-table', 'ngAnimate']);

$( "#adHocTile" ).click(function() {
  $( "#adHocTabNavLink" ).click();
});

$( "#schedulerTile" ).click(function() {
  $( "#scheduledTabNavLink" ).click();
});
