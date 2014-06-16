'use strict'

app = angular.module 'regi', [
  'ngCookies',
  'ngAnimate',
  'ngSanitize',
  'ngRoute',
  "ui.codemirror"
], ($routeProvider) ->
    $routeProvider
      .when '/',
        templateUrl: '/views/welcome.html'
      .when '/patients',
        templateUrl: '/views/patients/index.html'
        controller: 'PatientsCtrl'
      .otherwise
        redirectTo: '/'

defaultMenu = [{url: '/patients', label: 'Patient'}]
menu = (args...)->
  defaultMenu.slice(0).concat(args)

app.run ($rootScope)->
  $rootScope.menu = menu()
  $rootScope.$watch 'progress', (v)->
    return unless v && v.success
    delete $rootScope.error
    $rootScope.loading = 'Loading'
    $rootScope.progressCls = 'prgrss'
    v.success (vv, status, _, req)->
       $rootScope.loading = null
       $rootScope.success = "#{new Date()} - #{req.method} #{req.url}"
       delete $rootScope.progressCls
       console.log('progress success', req)
     .error (vv, status, _, req)->
       $rootScope.loading = null
       $rootScope.error = vv || "Server error #{status} while loading:  #{req.url}"
       console.log('progress error', arguments)
       delete $rootScope.progressCls

app.controller 'PatientsCtrl', ($rootScope, $scope, $routeParams, $http) ->

