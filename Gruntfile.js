module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-angular-templates');
  //grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-connect');

  var app_name = 'regi'
  var app_prefix = '../fhirplace/resources/public/' + app_name + '/';

  var main_js = app_prefix + 'main.js';

  var files  = {};
  files[main_js] = 'coffee/**/*.coffee';

  grunt.initConfig({
    clean: {
      options: { force: true },
      main: [app_prefix + '**/*']
    },
    coffee: {
      app: {
        options: { join: true },
        files: files
      }
    },
   ngtemplates: {
      app: {
        src: 'views/**/*.html',
        dest: app_prefix + 'views.js',
        options: {
          module: app_name,
          prefix: '/'
        }
      }
    },
    less: {
      dist: {
        files: [{
          expand: true,
          cwd: 'less',
          src: ['*.less', '!.*#.less'],
          dest: app_prefix + 'css/',
          ext: '.css'
        }]
      }
    },
    concat: {
      lib_js: {
        src: [
          "lib/jquery/dist/jquery.min.js",
          "lib/angular/angular.js",
          "lib/angular-formstamp/build/formstamp.js",
          "lib/angular-route/angular-route.js",
          "lib/angular-animate/angular-animate.js",
          "lib/angular-cookies/angular-cookies.js",
          "lib/angular-sanitize/angular-sanitize.js",
          "lib/codemirror/lib/codemirror.js",
          "lib/codemirror/mode/sql/sql.js",
          "lib/codemirror/mode/javascript/javascript.js",
          "lib/angular-ui-codemirror/ui-codemirror.js"
        ],
        dest: app_prefix + 'lib.js'
      },
      app_js: {
        src: [ app_prefix + 'main.js', app_prefix + 'views.js' ],
        dest: app_prefix + 'app.js'
      },
      lib_css: {
        src: ['lib/components-font-awesome/css/font-awesome.min.css',
        'lib/codemirror/lib/codemirror.css',
        'lib/bootstrap/dist/css/bootstrap.min.css',
        "lib/angular-formstamp/build/formstamp.css",
        ],
        dest: app_prefix + 'css/lib.css'
      }
    },
    copy: {
      bs_fonts: {
        cwd: 'lib/bootstrap/dist/fonts/',
        expand: true,
        src: '*',
        dest: app_prefix + 'fonts/'
      },
      fa_fonts: {
        cwd: 'lib/components-font-awesome/fonts/',
        expand: true,
        src: '*',
        dest: app_prefix + 'fonts/'
      },
      hs_fonts: {
        cwd: 'fonts/',
        expand: true,
        src: '*',
        dest: app_prefix + 'fonts/'
     },
     index: {
       src: 'index.html',
       dest: app_prefix + 'index.html'
     }
    },
    watch: {
      main: {
        files: ['views/**/*', 'index.html','coffee/**/*.coffee', 'less/**/*.less'],
        tasks: ['build'],
        options: {
          events: ['changed', 'added'],
          nospawn: true
        }
      }
    }
  });

  grunt.registerTask('build', ['clean', 'coffee', 'less', 'ngtemplates', 'concat', 'copy']);
};
