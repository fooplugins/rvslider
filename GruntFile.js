'use strict';

module.exports = function (grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			compiled: ['compiled'],
			releases: [
				'releases/*.v<%= pkg.version %>.zip',
				'releases/latest.zip'
			]
		},
		concat: {
			options: {
				banner: '/*!\n' +
				'* <%= pkg.title %> - <%= pkg.description %>\n' +
				'* @version <%= pkg.version %>\n' +
				'* @link <%= pkg.homepage %>\n' +
				'* @copyright Steven Usher & Brad Vincent 2015\n' +
				'* @license Released under the GPLv3 license.\n' +
				'*/\n'
			},
			js: {
				src: [
					"src/js/rvslider.js",
					"src/js/rvslider.items.js",
					"src/js/rvslider.nav.js",
					"src/js/rvslider.url.js",
					"src/js/rvslider.player.js"
				],
				dest: "compiled/rvslider.js"
			},
			css: {
				src: [
					"src/css/rvslider.css",
					"src/css/items.css",
					"src/css/player.css",
					"src/css/nav.css",
					"src/css/transitions.css",
					"src/css/responsive.css",
					"src/css/horizontal.css",
					"src/css/icons/default.css",
					"src/css/themes/default.css",
					"src/css/themes/light.css",
					"src/css/highlight/default.css",
					"src/css/highlight/green.css",
					"src/css/highlight/blue.css",
					"src/css/highlight/orange.css",
					"src/css/highlight/red.css"
				],
				dest: "compiled/rvslider.css"
			}
		},
		uglify: {
			prod: {
				options: {
					preserveComments: /(?:^!|@(?:license|preserve|cc_on))/,
					mangle: {
						except: [ "undefined" ]
					}
				},
				files: {
					'compiled/rvslider.min.js': [ "compiled/rvslider.js" ]
				}
			}
		},
		cssmin: {
			minify: {
				options: {
					keepSpecialComments: 1
				},
				files: {
					'compiled/rvslider.min.css': [ "compiled/rvslider.css" ]
				}
			}
		},
		copy: {
			template: {
				files: [{
					expand: true,
					cwd: 'src/',
					src: ['starter-template.html'],
					dest: 'compiled/'
				}]
			},
			latest: {
				files: [{
					expand: true,
					cwd: 'releases/',
					src: ['rvslider.v<%= pkg.version %>.zip'],
					dest: 'releases/',
					rename: function(dest, src){
						return dest + src.replace('v'+grunt.config('pkg.version'), 'latest');
					}
				}]
			}
		},
		compress: {
			version: {
				options: {
					archive: 'releases/rvslider.v<%= pkg.version %>.zip'
				},
				files: [{
					expand: true,
					cwd: 'compiled/',
					src: [
						'rvslider.css',
						'rvslider.min.css'
					],
					dest: 'css/'
				},{
					expand: true,
					cwd: 'compiled/',
					src: [
						'rvslider.js',
						'rvslider.min.js'
					],
					dest: 'js/'
				},{
					expand: true,
					cwd: 'compiled/',
					src: [
						'starter-template.html'
					]
				}]
			}
		}
	});

	// Load grunt tasks
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.registerTask('default', ['clean:compiled', 'concat', 'uglify', 'cssmin', 'copy:template']);
	grunt.registerTask('package', ['default', 'clean:releases', 'compress', 'copy:latest']);
};
