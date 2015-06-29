// var app = angular.module('dashboardApp', []);
angular.module('dashboardApp', ['ui.bootstrap', 'smart-table', 'ngAnimate']);

$('[data-toggle=tooltip]').tooltip();

$("#adHocTile").click(function() {
    $("#adHocTabNavLink").click();
});

$("#schedulerTile").click(function() {
    $("#scheduledTabNavLink").click();
});

$('#adHocTabNavLink').click(function() {
    window.scrollTo(0, 0);

});

$('#scheduledTabNavLink').click(function() {
    window.scrollTo(0, 0);
});