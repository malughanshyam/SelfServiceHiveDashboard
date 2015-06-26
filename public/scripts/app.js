// var app = angular.module('dashboardApp', []);
angular.module('dashboardApp', ['ui.bootstrap', 'smart-table', 'ngAnimate']);

$( "#adHocTile" ).click(function() {
  $( "#adHocTabNavLink" ).click();
});

$( "#schedulerTile" ).click(function() {
  $( "#scheduledTabNavLink" ).click();
});

$('#adHocTabNavLink').click(function(){
	console.log("cliecked aa")
	window.scrollTo(0, 0);

});

$('#scheduledTabNavLink').click(function(){
	console.log("cliecked ss")
	window.scrollTo(0, 0);
});