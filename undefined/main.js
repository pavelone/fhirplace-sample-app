(function() {
  'use strict';
  var BASE_URL, MRN_SYSTEM, addressUses, age, app, baseMrn, commonForm, dataUrl, dataUrlToBase64, defaultMenu, formatAddress, gendersVS, humanName, identity, mapResources, medicalRecordNumber, menu, mkFilter, telecomSystems, telecomUses,
    __slice = [].slice;

  app = angular.module('regi', ['ngCookies', 'ngAnimate', 'ngSanitize', 'formstamp', 'ngRoute', 'ngFileReader', 'ng-fhir'], function($routeProvider) {
    return $routeProvider.when('/', {
      templateUrl: '/views/patients/index.html',
      controller: 'PatientsIndexCtrl'
    }).when('/patients', {
      templateUrl: '/views/patients/index.html',
      controller: 'PatientsIndexCtrl'
    }).when('/patients/new', {
      templateUrl: '/views/patients/new.html',
      controller: 'PatientNewCtrl'
    }).when('/patients/:id', {
      templateUrl: '/views/patients/show.html',
      controller: 'PatientShowCtrl'
    }).when('/patients/:id/edit', {
      templateUrl: '/views/patients/edit.html',
      controller: 'PatientEditCtrl'
    }).otherwise({
      redirectTo: '/'
    });
  });

  BASE_URL = 'http://try-fhirplace.hospital-systems.com';

  app.config(function($fhirProvider) {
    return $fhirProvider.baseUrl = BASE_URL;
  });

  defaultMenu = [
    {
      url: '/patients',
      label: 'Patients'
    }, {
      url: "/patients/new",
      label: "Register",
      icon: "fa-plus"
    }
  ];

  menu = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return defaultMenu.slice(0).concat(args);
  };

  mapResources = function(atom) {
    return (atom.entry || []).map(function(i) {
      var res;
      res = i.content;
      res._id = i.id;
      return res;
    });
  };

  identity = function(i) {
    return i;
  };

  mkFilter = function(fn) {
    return function() {
      return function(inp) {
        if (angular.isArray(inp)) {
          return inp.map(fn).join('; ');
        } else if (inp) {
          return fn(inp);
        } else {
          return '';
        }
      };
    };
  };

  humanName = function(nm) {
    return [nm.family && nm.family.join(' '), nm.given && nm.given.join(' ')].filter(identity).join(', ');
  };

  app.filter('humanName', mkFilter(humanName));

  MRN_SYSTEM = 'urn:oid:1.2.36.146.595.217.0.1';

  medicalRecordNumber = function(identifiers) {
    var mrn;
    mrn = identifiers.filter(function(i) {
      return i.system === MRN_SYSTEM;
    })[0];
    return mrn && mrn.value;
  };

  app.filter('mrn', function() {
    return medicalRecordNumber;
  });

  formatAddress = function(ad) {
    return [ad.use, ad.line.join(' '), ad.city, ad.state, ad.zip].filter(identity).join('; ');
  };

  app.filter('address', mkFilter(formatAddress));

  age = function(date) {
    var ms;
    ms = new Date() - new Date(date);
    return "" + (Math.round(ms / (1000 * 60 * 60 * 24 * 365))) + " y";
  };

  app.filter('age', mkFilter(age));

  dataUrl = function(attach) {
    if (!attach) {
      return;
    }
    return "data:" + attach.contentType + ";base64," + attach.data;
  };

  app.filter('dataUrl', mkFilter(dataUrl));

  gendersVS = [
    {
      system: "http://hl7.org/fhir/v3/AdministrativeGender",
      code: "M",
      display: "Male"
    }, {
      system: "http://hl7.org/fhir/v3/AdministrativeGender",
      code: "F",
      display: "Female"
    }
  ].map(function(i) {
    return {
      coding: [i],
      text: i.display
    };
  });

  telecomSystems = ['phone', 'fax', 'email', 'url'];

  telecomUses = ['home', 'work', 'temp', 'old', 'mobile'];

  addressUses = ['home', 'work', 'temp', 'old'];

  app.run(function($rootScope) {
    $rootScope.menu = menu();
    $rootScope.$watch('progress', function(v) {
      if (!(v && v.success)) {
        return;
      }
      $rootScope.loading = 'Loading';
      delete $rootScope.error;
      return v.success(function(vv, status, _, req) {
        return delete $rootScope.loading;
      }).error(function(vv, status, _, req) {
        console.error(arguments);
        $rootScope.error = vv || ("Server error " + status + " while loading:  " + req.url);
        return delete $rootScope.loading;
      });
    });
    $rootScope.names = [];
    $rootScope.emptyItems = [];
    $rootScope.nameUses = ["official", "usual"];
    $rootScope.genders = gendersVS;
    $rootScope.telecomSystems = telecomSystems;
    $rootScope.telecomUses = telecomUses;
    return $rootScope.addressUses = addressUses;
  });

  app.controller('PatientsIndexCtrl', function($rootScope, $scope, $routeParams, $fhir) {
    var search;
    $rootScope.menu = angular.copy(defaultMenu);
    $rootScope.menu[0].active = true;
    search = function(inp) {
      var params;
      params = {};
      if (inp != null) {
        params.name = inp;
      }
      return $rootScope.progress = $fhir.search('Patient', params, function(data) {
        return $scope.patients = mapResources(data);
      });
    };
    $scope.search = function() {
      if ($scope.query != null) {
        return search($scope.query);
      }
    };
    return search();
  });

  app.controller('PatientShowCtrl', function($rootScope, $scope, $routeParams, $fhir) {
    var menuItem, url;
    $rootScope.menu = angular.copy(defaultMenu);
    menuItem = $rootScope.menu[1];
    menuItem.label = $routeParams.id;
    menuItem.icon = null;
    menuItem.url = "/patients/" + $routeParams.id;
    $rootScope.menu.push({
      icon: 'fa-edit',
      url: "/patients/" + $routeParams.id + "/edit",
      label: 'edit'
    });
    url = BASE_URL + ("/Patient/" + $routeParams.id + "?_format=application/json");
    return $rootScope.progress = $fhir.read(url, function(data) {
      return $scope.patient = data.content;
    });
  });

  baseMrn = {
    "use": "usual",
    "label": "MRN",
    "system": "urn:oid:1.2.36.146.595.217.0.1",
    "value": null,
    "period": {
      "start": new Date()
    },
    "assigner": {
      "display": "FHIRPlace"
    }
  };

  dataUrlToBase64 = function(str) {
    return str.split(';base64,')[1];
  };

  commonForm = function($scope) {
    $scope.addMultiAttr = function(prop) {
      var _base;
      return ((_base = $scope.entity)[prop] || (_base[prop] = [])).push({});
    };
    $scope.removeMultiAttr = function(prop, item, oneRequired) {
      var ptitem;
      ptitem = $scope.entity[prop];
      if (oneRequired && ptitem.length < 2) {
        return;
      }
      return $scope.entity[prop] = ptitem.filter(function(i) {
        return i !== item;
      });
    };
    $scope.readMethod = "readAsDataURL";
    return $scope.onPhotoReaded = function(e, file) {
      $scope.photo = e.target.result;
      return $scope.entity.photo = [
        {
          contentType: file.type,
          data: dataUrlToBase64(e.target.result)
        }
      ];
    };
  };

  app.controller('PatientNewCtrl', function($rootScope, $scope, $routeParams, $fhir, $location) {
    $rootScope.menu = angular.copy(defaultMenu);
    $rootScope.menu[1].active = true;
    $scope.entity = {
      resourceType: "Patient",
      birthDate: '1974-01-01',
      active: true,
      telecom: [],
      address: [],
      name: [
        {
          use: 'official',
          given: [],
          family: []
        }
      ],
      identifier: [angular.copy(baseMrn)]
    };
    commonForm($scope);
    return $scope.register = function() {
      var content;
      content = {
        content: $scope.entity
      };
      return $rootScope.progress = $fhir.create(content, function(data) {
        return $location.path("/patients/");
      });
    };
  });

  app.controller('PatientEditCtrl', function($rootScope, $location, $scope, $routeParams, $fhir) {
    var menuItem, ptId, ptUrl;
    $rootScope.menu = angular.copy(defaultMenu);
    menuItem = $rootScope.menu[1];
    ptId = $routeParams.id;
    menuItem.label = ptId;
    menuItem.icon = null;
    menuItem.url = "/patients/" + ptId;
    $scope.ptId = ptId;
    $rootScope.menu.push({
      active: true,
      icon: 'fa-edit',
      url: "/patients/" + ptId + "/edit",
      label: 'edit'
    });
    ptUrl = BASE_URL + ("/Patient/" + ptId + "?_format=application/json");
    $rootScope.progress = $fhir.read(ptUrl, function(data) {
      var _base, _base1;
      $scope.ptVersion = data.id;
      (_base = data.content).telecom || (_base.telecom = []);
      (_base1 = data.content).address || (_base1.address = []);
      return $scope.entity = data.content;
    });
    commonForm($scope);
    return $scope.update = function() {
      var content;
      content = {
        content: $scope.entity,
        id: $scope.ptVersion
      };
      return $rootScope.progress = $fhir.update(content, function(data) {
        return $location.path("/patients/" + ptId);
      });
    };
  });

}).call(this);
