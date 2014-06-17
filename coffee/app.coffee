'use strict'

app = angular.module 'regi', [
  'ngCookies',
  'ngAnimate',
  'ngSanitize',
  'formstamp',
  'ngRoute',
  'ngFileReader'
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

mkFilter = (fn)->
  ()->
    (inp)->
      if angular.isArray(inp)
        inp.map(fn).join('; ')
      else if inp
        fn(inp)
      else
        ''

humanName = (nm)->
  [nm.family && nm.family.join(' '), nm.given && nm.given.join(' ')]
    .filter(identity)
    .join(', ')

app.filter 'humanName', mkFilter(humanName)

MRN_SYSTEM = 'urn:oid:1.2.36.146.595.217.0.1'

medicalRecordNumber = (identifiers)->
  mrn = identifiers.filter((i)-> i.system == MRN_SYSTEM)[0]
  mrn.value

app.filter 'mrn', ()-> medicalRecordNumber

formatAddress = (ad)->
  [ad.use,
  ad.line.join(' '),
  ad.city,
  ad.state,
  ad.zip].filter(identity).join('; ')

app.filter 'address', mkFilter(formatAddress)


age = (date)->
  ms = new Date() - new Date(date)
  "#{Math.round(ms/(1000*60*60*24*365))} y"

app.filter 'age', mkFilter(age)

dataUrl = (attach)->
  return unless attach
  "data:#{attach.contentType};base64,#{attach.data}"

app.filter 'dataUrl', mkFilter(dataUrl)

app.run ($rootScope)->
  $rootScope.menu = menu()
  $rootScope.$watch 'progress', (v)->
    return unless v && v.success
    $rootScope.loading = 'Loading'
    v.success (vv, status, _, req)->
       delete $rootScope.loading
     .error (vv, status, _, req)->
       delete $rootScope.loading

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

gendersVS = [
     {system: "http://hl7.org/fhir/v3/AdministrativeGender", code: "M", display: "Male" },
     {system: "http://hl7.org/fhir/v3/AdministrativeGender", code: "F", display: "Female" }]
       .map (i)-> {coding: [i], text: i.display}

telecomSystems = [ 'phone', 'fax', 'email', 'url']
telecomUses = ['home','work','temp','old','mobile']


dataUrlToBase64 = (str)->
  str.split(';base64,')[1]


app.controller 'PatientNewCtrl', ($rootScope, $scope, $routeParams, $http, $location) ->
  $scope.names = []
  $scope.nameUses = ["official", "usual"]
  $scope.genders = gendersVS

  $scope.telecomSystems = telecomSystems
  $scope.telecomUses = telecomUses

  $scope.entity = {
    resourceType: "Patient",
    birthDate: '1974-01-01',
    active: true,
    telecom: [],
    address: [],
    name: [{use: 'official', given: ['Doctor'], family: ['Ajbolit']}],
    identifier: [angular.copy(baseMrn)]}

  $scope.addMultiAttr = (prop)-> ($scope.entity[prop] ||= []).push({})

  $scope.removeMultiAttr = (prop, item, oneRequired)->
    ptitem = $scope.entity[prop]
    return if oneRequired && ptitem.length < 2
    $scope.entity[prop] = ptitem.filter((i)-> i != item )

  $scope.register = ()->
    $rootScope.progress = $http.post('/Patient/', $scope.entity)
      .success (data, status, headers, config) ->
        $location.path("/patients/")

  $scope.readMethod = "readAsDataURL"

  $scope.onPhotoReaded = (e, file)->
    console.log(e.target)
    console.log(file)
    $scope.photo = e.target.result
    $scope.entity.photo = [{
      contentType: file.type,
      data: dataUrlToBase64(e.target.result)
    }]
