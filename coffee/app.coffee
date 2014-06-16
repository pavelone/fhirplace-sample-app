'use strict'

app = angular.module 'regi', [
  'ngCookies',
  'ngAnimate',
  'ngSanitize',
  'formstamp',
  'ngRoute'
], ($routeProvider) ->
    $routeProvider
      .when '/',
        templateUrl: '/views/welcome.html'
      .when '/patients',
        templateUrl: '/views/patients/index.html'
        controller: 'PatientsIndexCtrl'
      .when '/patients/new',
        templateUrl: '/views/patients/new.html'
        controller: 'PatientNewCtrl'
      .when '/patients/:id',
        templateUrl: '/views/patients/show.html'
        controller: 'PatientShowCtrl'
      .otherwise
        redirectTo: '/'

defaultMenu = [{url: '/patients', label: 'Patient'}]
menu = (args...)->
  defaultMenu.slice(0).concat(args)


mapResources = (atom)->
  atom.entry.map (i)->
   res = i.content
   res._id = i.id
   res

identity = (i)-> i

humanName = (nm)->
  if angular.isArray(nm)
    nm.map(humanName).join('; ')
  else
    [nm.family && nm.family.join(' '), nm.given && nm.given.join(' ')]
      .filter(identity)
      .join(', ')

app.filter 'humanName', ()-> humanName

MRN_SYSTEM = 'urn:oid:1.2.36.146.595.217.0.1'

medicalRecordNumber = (identifiers)->
  mrn = identifiers.filter((i)-> i.system == MRN_SYSTEM)[0]
  mrn.value

app.filter 'mrn', ()-> medicalRecordNumber

formatAddress = (ad)->
  if angular.isArray(nm)
    nm.map(formatAddress).join('; ')
  else
    [ad.use,
    ad.line.join(' '),
    ad.city,
    ad.state,
    ad.zip].filter(identity).join('; ')

app.filter 'address', ()-> formatAddress


age = (date)->
  ms = new Date() - new Date(date)
  "#{Math.round(ms/(1000*60*60*24*365))} y"

app.filter 'age', ()-> age

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

app.controller 'PatientsIndexCtrl', ($rootScope, $scope, $routeParams, $http) ->
  $rootScope.progress = $http.get("/Patient/_search?_format=application/json")
    .success (data, status, headers, config)->
      $scope.patients = mapResources(data)

app.controller 'PatientShowCtrl', ($rootScope, $scope, $routeParams, $http) ->
  url = "/Patient/#{$routeParams.id}?_format=application/json"
  $rootScope.progress = $http.get(url)
    .success (data, status, headers, config)->
      $scope.patient = data

baseMrn = {
  "use": "usual",
  "label": "MRN",
  "system": "urn:oid:1.2.36.146.595.217.0.1",
  "value": null,
  "period": { "start": new Date() },
  "assigner": { "display": "FHIRPlace" }
}

app.controller 'PatientNewCtrl', ($rootScope, $scope, $routeParams, $http, $location) ->
  $scope.names = []
  $scope.nameUses = ["official", "usual"]
  $scope.genders = [
     {system: "http://hl7.org/fhir/v3/AdministrativeGender", code: "M", display: "Male" },
     {system: "http://hl7.org/fhir/v3/AdministrativeGender", code: "F", display: "Female" }]
       .map (i)-> {coding: [i], text: i.display}


  $scope.entity = {
    resourceType: "Patient",
    birthDate: '1974-01-01',
    name: [{use: 'official', given: ['Doctor'], family: ['Ajbolit']}],
    identifier: [angular.copy(baseMrn)]}

  $scope.addName = ()->
    $scope.entity.name.push({})

  $scope.removeName = (name)->
    return if $scope.entity.names.length < 2
    $scope.entity.names = $scope.entity.names.filter((i)-> i != name )

  $scope.register = ()->
    $rootScope.progress = $http.post('/Patient/', $scope.entity)
      .success (data, status, headers, config) ->
        $location.path("/patients/")
