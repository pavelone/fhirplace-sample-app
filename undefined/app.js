(function() {
  'use strict';
  var BASE_URL, MRN_SYSTEM, addressUses, age, app, baseMrn, baseUrl, commonForm, dataUrl, dataUrlToBase64, defaultMenu, formatAddress, gendersVS, humanName, identity, mapResources, medicalRecordNumber, menu, mkFilter, telecomSystems, telecomUses,
    __slice = [].slice;

  BASE_URL = 'http://try-fhirplace.hospital-systems.com';

  baseUrl = function() {
    return BASE_URL || ("" + window.location.protocol + "//" + window.location.host);
  };

  app = angular.module('regi', ['ngCookies', 'ngAnimate', 'ngSanitize', 'formstamp', 'ngRoute', 'ngFileReader', 'ng-fhir', 'highcharts-ng'], function($routeProvider) {
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
    }).when('/patients/:id/observations', {
      templateUrl: '/views/patients/observations.html',
      controller: 'PatientObservationsCtrl'
    }).otherwise({
      redirectTo: '/'
    });
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

  app.filter('urlFor', function() {
    return function(pt) {
      var id, parts;
      parts = pt._id.split(/\//);
      id = parts[parts.length - 1];
      return "#/patients/" + id;
    };
  });

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

  app.config(function($fhirProvider) {
    return $fhirProvider.baseUrl = baseUrl();
  });

  app.run(function($rootScope, $location) {
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
      return $rootScope.progress = $fhir.search('Patient', params).success(function(data) {
        console.log(data);
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
    $rootScope.menu.push({
      icon: 'fa-th-list',
      url: "/patients/" + $routeParams.id + "/observations",
      label: 'observations',
      guess: true
    });
    url = baseUrl() + ("/Patient/" + $routeParams.id + "?_format=application/json");
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
    ptUrl = baseUrl() + ("/Patient/" + ptId + "?_format=application/json");
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

  app.controller('PatientObservationsCtrl', function($rootScope, $location, $scope, $routeParams, $fhir) {
    var menuItem, url;
    $rootScope.menu = angular.copy(defaultMenu);
    menuItem = $rootScope.menu[1];
    menuItem.label = $routeParams.id;
    menuItem.icon = null;
    menuItem.url = "/patients/" + $routeParams.id;
    $rootScope.menu.push({
      active: true,
      icon: 'fa-th-list',
      url: "/patients/" + $routeParams.id + "/observations",
      label: 'observations'
    });
    $scope.chartConfig = {
      options: {
        chart: {
          type: 'line',
          zoomType: 'x'
        }
      },
      series: [
        {
          data: []
        }
      ],
      title: {
        text: 'Weight chart'
      },
      xAxis: {
        currentMin: 0,
        currentMax: 10,
        minRange: 1
      },
      loading: false
    };
    url = baseUrl() + ("/Patient/" + $routeParams.id + "?_format=application/json");
    $rootScope.progress = $fhir.read(url, function(data) {
      return $scope.patient = data.content;
    });
    url = BASE_URL + ("/Observation/_search?subject=" + $routeParams.id);
    return $rootScope.progress = $fhir.read(url, function(data) {
      var compare, entry, item, items, _i, _j, _len, _len1, _ref, _results;
      $scope.observations = data.content;
      items = [];
      compare = function(a, b) {
        if (a.time > b.time) {
          return 1;
        }
        if (a.time < b.time) {
          return -1;
        }
        return 0;
      };
      _ref = $scope.observations.entry;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        entry = _ref[_i];
        items.push({
          time: entry.content.appliesDateTime,
          weight: entry.content.valueQuantity.value
        });
        items.sort(compare);
      }
      _results = [];
      for (_j = 0, _len1 = items.length; _j < _len1; _j++) {
        item = items[_j];
        _results.push($scope.chartConfig.series[0].data.push(item.weight));
      }
      return _results;
    });
  });

}).call(this);

angular.module('regi').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('/views/patients/edit.html',
    "<div ng-include=\"'/views/patients/form.html'\"></div>\n" +
    "<h3>FHIR resource</h3>\n" +
    "<pre>{{entity | json}}</pre>\n" +
    "\n" +
    "<div class=\"btns\">\n" +
    "  <a class=\"btn btn-success\" ng-click=\"update()\">Update</a>\n" +
    "  <a class=\"btn btn-default\" href=\"#/patients/{{ptId}}\">cancel</a>\n" +
    "</div>\n"
  );


  $templateCache.put('/views/patients/form.html',
    "<div class=\"row\">\n" +
    "  <div class=\"col-xs-5\">\n" +
    "    <fs-form-for model=\"entity\">\n" +
    "    <fieldset>\n" +
    "      <legend>Patient Info</legend>\n" +
    "      <fs-input as=\"text\"\n" +
    "      name=\"identifier[0].value\"\n" +
    "      label=\"MRN\"></fs-input>\n" +
    "\n" +
    "      <fs-input as=\"fs-select\"\n" +
    "      name=\"gender\"\n" +
    "      items=\"genders\"\n" +
    "      freetext=\"true\"\n" +
    "      label=\"Gender\">{{ item.text }}</fs-input>\n" +
    "\n" +
    "      <div class=\"form-group\">\n" +
    "        <label class=\"col-sm-2 control-label\">Photo</label>\n" +
    "        <div class=\"col-sm-10\">\n" +
    "          <img ng-src=\"{{entity.photo | dataUrl}}\" alt=\"\" style=\"width: 100px;\" />\n" +
    "          <div ng-file-reader on-readed=\"onPhotoReaded(event,file)\"\n" +
    "            read-method=\"readMethod\"\n" +
    "            filereader=\"swf/filereader.swf\"\n" +
    "            multiple debug-mode=\"true\"></div>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "      <fs-input as=\"text\" name=\"birthDate\" label=\"Birth Date\"></fs-input>\n" +
    "    </fieldset>\n" +
    "    </fs-form-for>\n" +
    "\n" +
    "  </div>\n" +
    "  <div class=\"col-xs-5 col-xs-offset-1\">\n" +
    "    <fieldset class=\"form-horizontal first-level\">\n" +
    "      <legend>Names </legend>\n" +
    "      <div  ng-repeat=\"nm in entity.name\">\n" +
    "        <fs-form-for model=\"nm\">\n" +
    "\n" +
    "        <fs-input as=\"fs-select\" name=\"use\" items=\"nameUses\" freetext=\"true\" label=\"Use\">~{{item}}</fs-input>\n" +
    "\n" +
    "        <fs-input as=\"fs-multiselect\"\n" +
    "        name=\"family\"\n" +
    "        items=\"names\"\n" +
    "        freetext=\"true\"\n" +
    "        label=\"Family\">{{ item }}</fs-input>\n" +
    "\n" +
    "        <fs-input as=\"fs-multiselect\"\n" +
    "        name=\"given\"\n" +
    "        items=\"names\"\n" +
    "        freetext=\"true\"\n" +
    "        label=\"Given\">{{ item }}</fs-input>\n" +
    "        <div class=\"row\">\n" +
    "          <div class=\"btn-group pull-right\">\n" +
    "            <a class=\"btn btn-default\" ng-click=\"removeMultiAttr('name', nm, true)\">Remove name</a>\n" +
    "            <a class=\"btn btn-default\" ng-click=\"addMultiAttr('name')\">Add name</a>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "        <hr/>\n" +
    "        </fs-form-for>\n" +
    "      </div>\n" +
    "    </fieldset>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "  <div class=\"col-xs-5\">\n" +
    "    <fieldset class=\"form-horizontal first-level\">\n" +
    "      <legend>Telecom</legend>\n" +
    "      <div class=\"row\">\n" +
    "        <div class=\"btn-group pull-right\">\n" +
    "          <a class=\"btn btn-default\" ng-show=\"entity.telecom.length < 1\"  ng-click=\"addMultiAttr('telecom')\">Add telecom</a>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <div  ng-repeat=\"tl in entity.telecom\">\n" +
    "        <fs-form-for model=\"tl\">\n" +
    "\n" +
    "        <fs-input as=\"fs-select\"\n" +
    "        name=\"system\"\n" +
    "        items=\"telecomSystems\"\n" +
    "        label=\"System\">{{ item }}</fs-input>\n" +
    "\n" +
    "        <fs-input as=\"fs-select\"\n" +
    "        name=\"use\"\n" +
    "        items=\"telecomUses\"\n" +
    "        label=\"System\">{{ item }}</fs-input>\n" +
    "\n" +
    "        <fs-input as=\"text\" name=\"value\" freetext=\"true\" label=\"Telecom\"></fs-input>\n" +
    "\n" +
    "        <div class=\"row\">\n" +
    "          <div class=\"btn-group pull-right\">\n" +
    "            <a class=\"btn btn-default\" ng-click=\"removeMultiAttr('telecom', tl)\">Remove telecom</a>\n" +
    "            <a class=\"btn btn-default\" ng-click=\"addMultiAttr('telecom')\">Add telecom</a>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "        <hr/>\n" +
    "        </fs-form-for>\n" +
    "      </div>\n" +
    "    </fieldset>\n" +
    "  </div>\n" +
    "  <div class=\"col-xs-5 col-xs-offset-1\">\n" +
    "\n" +
    "    <fieldset class=\"form-horizontal first-level\">\n" +
    "      <legend>Address</legend>\n" +
    "      <div class=\"row\">\n" +
    "        <div class=\"btn-group pull-right\">\n" +
    "          <a class=\"btn btn-default\" ng-show=\"entity.address.length < 1\"  ng-click=\"addMultiAttr('address')\">Add address</a>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <div  ng-repeat=\"ad in entity.address\">\n" +
    "        <fs-form-for model=\"ad\">\n" +
    "\n" +
    "        <fs-input as=\"fs-select\"\n" +
    "        name=\"use\"\n" +
    "        items=\"addressUses\"\n" +
    "        label=\"System\">{{ item }}</fs-input>\n" +
    "\n" +
    "        <fs-input as=\"fs-multiselect\" freetext=\"true\" items=\"emptyItems\" name=\"line\"  label=\"Line\"></fs-input>\n" +
    "        <fs-input as=\"text\" name=\"city\"  label=\"City\"></fs-input>\n" +
    "        <fs-input as=\"text\" name=\"state\" label=\"State\"></fs-input>\n" +
    "        <fs-input as=\"text\" name=\"zip\"   label=\"ZIP\"></fs-input>\n" +
    "        <fs-input as=\"text\" name=\"country\" label=\"Country\"></fs-input>\n" +
    "\n" +
    "        <div class=\"row\">\n" +
    "          <div class=\"btn-group pull-right\">\n" +
    "            <a class=\"btn btn-default\" ng-click=\"removeMultiAttr('address', ad)\">Remove address</a>\n" +
    "            <a class=\"btn btn-default\" ng-click=\"addMultiAttr('address')\">Add address</a>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "        <hr/>\n" +
    "        </fs-form-for>\n" +
    "      </div>\n" +
    "    </fieldset>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n"
  );


  $templateCache.put('/views/patients/index.html',
    "<div class=\"well\">\n" +
    "  <form ng-submit=\"search()\">\n" +
    "    <input class=\"form-control search\" ng-model=\"query\" placeholder=\"Search by name or mrn\"/>\n" +
    "  </form>\n" +
    "</div>\n" +
    "<table class=\"table table-compact\">\n" +
    "  <thead>\n" +
    "    <tr>\n" +
    "      <th>Name</th>\n" +
    "      <th>Gender</th>\n" +
    "      <th>Age/Bith Date</th>\n" +
    "      <th>MRN</th>\n" +
    "    </tr>\n" +
    "  </thead>\n" +
    "  <tr ng-repeat=\"pt in patients\">\n" +
    "    <td>\n" +
    "      <img alt=\"photo\" ng-src=\"{{pt.photo | dataUrl}}\" class=\"person-photo small\"/>\n" +
    "      <a href=\"{{pt | urlFor}}\"> {{pt.name | humanName }}</a>\n" +
    "    </td>\n" +
    "    <td> {{pt.gender.coding[0].display }} </td>\n" +
    "    <td> {{pt.birthDate | age}} / {{pt.birthDate}}</td>\n" +
    "    <td> {{pt.identifier | mrn}}</td>\n" +
    "  </tr>\n" +
    "</table>\n"
  );


  $templateCache.put('/views/patients/new.html',
    "<div ng-include=\"'/views/patients/form.html'\"></div>\n" +
    "<h3>FHIR resource</h3>\n" +
    "<pre>{{entity | json}}</pre>\n" +
    "\n" +
    "<div class=\"btns\">\n" +
    "  <a class=\"btn btn-success\" ng-click=\"register()\">Register</a>\n" +
    "  <a class=\"btn btn-default\" href=\"#/patients\">cancel</a>\n" +
    "</div>\n"
  );


  $templateCache.put('/views/patients/observations.html',
    "<div class=\"row\">\n" +
    "  <div clas=\"col-md-3\">\n" +
    "    <img ng-src=\"{{patient.photo | dataUrl}}\" class=\"person-photo large\"/>\n" +
    "  </div>\n" +
    "  <div clas=\"col-md-9\">\n" +
    "    <h1> {{ patient.name[0] | humanName }}\n" +
    "      <br/>\n" +
    "      {{patient.gender.coding[0].code || '~'}}/{{ patient.birthDate | age}}</h1>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "  <div>\n" +
    "    <h3>Weight Record</h3>\n" +
    "  </div>\n" +
    "  <div ng-repeat=\"entry in observations.entry | orderBy:'content.appliesDateTime':false\" class=\"small\">\n" +
    "    <div class=\"col-xs-3\">Recorded: {{entry.content.appliesDateTime | date:'MM/dd/yyyy @ h:mma'}}</div>\n" +
    "    <div class=\"col-xs-9\">\n" +
    "      <span>Weight: </span><span>{{entry.content.valueQuantity.value+\" \"+entry.content.valueQuantity.units}}</span>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "<highchart id=\"chart1\" config=\"chartConfig\" class=\"span10\"></highchart>\n" +
    "\n" +
    "<br><br>\n" +
    "\n" +
    "<h3>FHIR resource</h3>\n" +
    "<pre>{{observations | json}}</pre>"
  );


  $templateCache.put('/views/patients/show.html',
    "<div class=\"row\">\n" +
    "  <div clas=\"col-md-3\">\n" +
    "    <img ng-src=\"{{patient.photo | dataUrl}}\" class=\"person-photo large\"/>\n" +
    "  </div>\n" +
    "  <div clas=\"col-md-9\">\n" +
    "    <h1> {{ patient.name[0] | humanName }}\n" +
    "      <br/>\n" +
    "      {{patient.gender.coding[0].code || '~'}}/{{ patient.birthDate | age}}</h1>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<h3> Names </h3>\n" +
    "<hr/>\n" +
    "<div ng-repeat=\"nm in patient.name\">\n" +
    "  <span class=\"muted-text\">{{nm.use}}</span> :\n" +
    "  <span>{{nm.prefix}}</span>\n" +
    "  <span>{{nm.given.join(' ')}}</span>\n" +
    "  <b>{{nm.family.join(' ')}}</b>\n" +
    "  <span>{{nm.sufix}}</span>\n" +
    "</div>\n" +
    "\n" +
    "<h3> Address </h3>\n" +
    "<hr/>\n" +
    "\n" +
    "<div ng-repeat=\"ad in patient.address\">\n" +
    "  <span class=\"muted-text\">{{ad.use}}</span> :\n" +
    "  <span>{{ad.line.join(' ')}}</span>,\n" +
    "  <span>{{ad.city}}</span>,\n" +
    "  <span>{{ad.state}}</span>,\n" +
    "  <span>{{ad.zip}}</span>\n" +
    "</div>\n" +
    "\n" +
    "<h3> Telecom </h3>\n" +
    "<hr/>\n" +
    "\n" +
    "<div ng-repeat=\"ad in patient.telecom\">\n" +
    "  <span class=\"muted-text\">{{ad.use}}</span>\n" +
    "  <span>{{ad.system}}</span>:\n" +
    "  <span>{{ad.value}}</span>\n" +
    "</div>\n" +
    "\n" +
    "<h3> Contacts </h3>\n" +
    "<hr/>\n" +
    "\n" +
    "<div ng-repeat=\"ad in patient.contact\">\n" +
    "  <span class=\"muted-text\">{{ad.relationship[0].coding[0].code}}</span> :\n" +
    "  <span>{{ad.name | humanName}}</span>,\n" +
    "  <span ng-repeat=\"tel in ad.telecom\">\n" +
    "    <span class=\"muted-text\">{{tel.use}}</span>\n" +
    "    <span>{{tel.system}}</span>:\n" +
    "    <span>{{tel.value}}</span>\n" +
    "  </span>\n" +
    "</div>\n" +
    "\n" +
    "<!-- <code><pre> {{ patient | json}} </pre></code> -->\n"
  );


  $templateCache.put('/views/welcome.html',
    "<div class=\"container\">\n" +
    "  <h1>FHIR Registration Demo</h1>\n" +
    "  <p>\n" +
    "    This is demonstration of simple client application\n" +
    "  </p>\n" +
    "</div>\n"
  );

}]);
