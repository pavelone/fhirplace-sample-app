'use strict'

BASE_URL = null
baseUrl = ()->
  BASE_URL ||  "#{window.location.protocol}//#{window.location.host}"

app = angular.module 'regi', [
  'ngCookies',
  'ngAnimate',
  'ngSanitize',
  'formstamp',
  'ngRoute',
  'ngFileReader',
  'ng-fhir'
], ($routeProvider) ->
    $routeProvider
      .when '/',
        templateUrl: '/views/patients/index.html'
        controller: 'PatientsIndexCtrl'
      .when '/patients',
        templateUrl: '/views/patients/index.html'
        controller: 'PatientsIndexCtrl'
      .when '/patients/new',
        templateUrl: '/views/patients/new.html'
        controller: 'PatientNewCtrl'
      .when '/patients/:id',
        templateUrl: '/views/patients/show.html'
        controller: 'PatientShowCtrl'
      .when '/patients/:id/edit',
        templateUrl: '/views/patients/edit.html'
        controller: 'PatientEditCtrl'
      .otherwise
        redirectTo: '/'


defaultMenu = [{url: '/patients', label: 'Patients'},
               {url: "/patients/new", label: "Register", icon: "fa-plus"}]

menu = (args...)->
  defaultMenu.slice(0).concat(args)

mapResources = (atom)->
  (atom.entry || []).map (i)->
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
  mrn && mrn.value

app.filter 'mrn', ()-> medicalRecordNumber

formatAddress = (ad)->
  [ad.use,
  ad.line.join(' '),
  ad.city,
  ad.state,
  ad.zip].filter(identity).join('; ')

app.filter 'address', mkFilter(formatAddress)

app.filter 'urlFor', ()->
  (pt)->
    parts = pt._id.split(/\//)
    id = parts[parts.length - 1]
    "#/patients/#{id}"

age = (date)->
  ms = new Date() - new Date(date)
  "#{Math.round(ms/(1000*60*60*24*365))} y"

app.filter 'age', mkFilter(age)

dataUrl = (attach)->
  return unless attach
  "data:#{attach.contentType};base64,#{attach.data}"

app.filter 'dataUrl', mkFilter(dataUrl)

gendersVS = [
     {system: "http://hl7.org/fhir/v3/AdministrativeGender", code: "M", display: "Male" },
     {system: "http://hl7.org/fhir/v3/AdministrativeGender", code: "F", display: "Female" }]
       .map (i)-> {coding: [i], text: i.display}

telecomSystems = [ 'phone', 'fax', 'email', 'url']
telecomUses = ['home','work','temp','old','mobile']

addressUses = ['home','work','temp','old']


app.config ($fhirProvider)->
  $fhirProvider.baseUrl = baseUrl()

app.run ($rootScope, $location)->
  $rootScope.menu = menu()
  $rootScope.$watch 'progress', (v)->
    return unless v && v.success
    $rootScope.loading = 'Loading'
    delete $rootScope.error
    v.success (vv, status, _, req)->
       delete $rootScope.loading
     .error (vv, status, _, req)->
       console.error(arguments)
       $rootScope.error = vv || "Server error #{status} while loading:  #{req.url}"
       delete $rootScope.loading

  $rootScope.names = []
  $rootScope.emptyItems = []
  $rootScope.nameUses = ["official", "usual"]
  $rootScope.genders = gendersVS

  $rootScope.telecomSystems = telecomSystems
  $rootScope.telecomUses = telecomUses
  $rootScope.addressUses = addressUses

app.controller 'PatientsIndexCtrl', ($rootScope, $scope, $routeParams, $fhir) ->
  $rootScope.menu = angular.copy(defaultMenu)
  $rootScope.menu[0].active = true

  search = (inp)->
    params = {}
    params.name = inp if inp?
    $rootScope.progress = $fhir.search('Patient', params,)
      .success (data)->
        console.log(data)
        $scope.patients = mapResources(data)

  $scope.search = ()->
    if $scope.query?
      search($scope.query)

  search()

app.controller 'PatientShowCtrl', ($rootScope, $scope, $routeParams, $fhir) ->
  $rootScope.menu = angular.copy(defaultMenu)
  menuItem = $rootScope.menu[1]
  menuItem.label = $routeParams.id
  menuItem.icon = null
  menuItem.url = "/patients/#{$routeParams.id}"

  $rootScope.menu.push({icon: 'fa-edit', url:  "/patients/#{$routeParams.id}/edit", label: 'edit'})

  url = baseUrl() + "/Patient/#{$routeParams.id}?_format=application/json"
  $rootScope.progress = $fhir.read url , (data)->
    $scope.patient = data.content

baseMrn = {
  "use": "usual",
  "label": "MRN",
  "system": "urn:oid:1.2.36.146.595.217.0.1",
  "value": null,
  "period": { "start": new Date() },
  "assigner": { "display": "FHIRPlace" }
}

dataUrlToBase64 = (str)->
  str.split(';base64,')[1]

commonForm = ($scope)->
  $scope.addMultiAttr = (prop)-> ($scope.entity[prop] ||= []).push({})

  $scope.removeMultiAttr = (prop, item, oneRequired)->
    ptitem = $scope.entity[prop]
    return if oneRequired && ptitem.length < 2
    $scope.entity[prop] = ptitem.filter((i)-> i != item )

  $scope.readMethod = "readAsDataURL"

  $scope.onPhotoReaded = (e, file)->
    $scope.photo = e.target.result
    $scope.entity.photo = [{ contentType: file.type, data: dataUrlToBase64(e.target.result) }]

app.controller 'PatientNewCtrl', ($rootScope, $scope, $routeParams, $fhir, $location) ->
  $rootScope.menu = angular.copy(defaultMenu)
  $rootScope.menu[1].active = true

  $scope.entity = {
    resourceType: "Patient",
    birthDate: '1974-01-01',
    active: true,
    telecom: [],
    address: [],
    name: [{use: 'official', given: [], family: []}],
    identifier: [angular.copy(baseMrn)]}

  commonForm($scope)

  $scope.register = ()->
    content = {content: $scope.entity}
    $rootScope.progress = $fhir.create content, (data)->
      $location.path("/patients/")

app.controller 'PatientEditCtrl', ($rootScope, $location, $scope, $routeParams, $fhir) ->
  $rootScope.menu = angular.copy(defaultMenu)
  menuItem = $rootScope.menu[1]
  ptId = $routeParams.id
  menuItem.label = ptId
  menuItem.icon = null
  menuItem.url = "/patients/#{ptId}"

  $scope.ptId = ptId

  $rootScope.menu.push({active: true, icon: 'fa-edit', url:  "/patients/#{ptId}/edit", label: 'edit'})

  ptUrl = baseUrl() + "/Patient/#{ptId}?_format=application/json"

  $rootScope.progress = $fhir.read ptUrl, (data)->
    $scope.ptVersion = data.id
    data.content.telecom ||= []
    data.content.address ||= []
    $scope.entity = data.content

  commonForm($scope)

  $scope.update = ()->
    content = {content: $scope.entity, id: $scope.ptVersion}
    $rootScope.progress = $fhir.update content, (data)->
      $location.path("/patients/#{ptId}")
