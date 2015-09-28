module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: ['js/app.js', 'js/directives.js'],
                dest: 'js/<%= pkg.name %>.min.js'
            }
        },
        ngdocs: {
            options: {
                dest: 'docs',
                html5Mode: false,
                scripts: [
                    'bower_components/angular/angular.js',
                    'bower_components/angular-animate/angular-animate.js'
                ]
            },
            api: {
                src: ['js/*.js'],
                title: 'Docs'
            }
        },
        clean: ['docs'],
        shell: {
            options: {
                stderr: false
            },
            target: {
                command: 'python siteindex.py'
            }
        },
        shell: {        // Not a default task!
            options: {
                stderr: false
            },
            target: {
                command: 'webkit-assign ./bower_components/angular/angular.js'
            }
        },
        jshint: {
            // You get to make the name
            // The paths tell JSHint which files to validate
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            myFiles: ['js/app.js', 'js/directives.js']
        },
        ngAnnotate: {
            options: {
                singleQuotes: true,
            },
            src: {
                files: {
                    'js/app.js': ['js/app.js'],
                    'js/directives.js': ['js/directives.js']
                },
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-ngdocs');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-ng-annotate');

    // Default task(s).
    grunt.registerTask('default', ['clean', 'ngdocs', 'shell', 'jshint:myFiles', 'ngAnnotate:src', 'uglify']);
    grunt.registerTask('webkit-assign', ['shell']);
};