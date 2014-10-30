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
    "<div>\n" +
    "  <h3>Weight Record</h3>\n" +
    "</div>\n" +
    "<div ng-repeat=\"entry in observations.entry | orderBy:'content.appliesDateTime':false\" class=\"small\">\n" +
    "  <div class=\"col-xs-3\">Recorded: {{entry.content.appliesDateTime | date:'MM/dd/yyyy @ h:mma'}}</div>\n" +
    "  <div class=\"col-xs-9\">\n" +
    "    <span>Weight: </span><span>{{entry.content.valueQuantity.value+\" \"+entry.content.valueQuantity.units}}</span>\n" +
    "  </div>\n" +
    "</div>\n" +
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
