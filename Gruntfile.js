module.exports = function(grunt) {
	grunt.initConfig({
		stylus: {
			dev: {
				files: {
					'public/css/main.css': 'public/stylus/main.styl',
					'public/css/admin.css': 'public/stylus/admin.styl',
				}
			}
		},

		concat: {
			dev: {
				files: {
					'public/js/vendors.js': [
						'bower_components/jquery/dist/jquery.js',
						'bower_components/bootstrap/dist/js/bootstrap.js',
					],
					'public/css/vendors.css': [
						'bower_components/bootstrap/dist/css/bootstrap.css',
						'bower_components/font-awesome/css/font-awesome.css'
					],
				}
			}
		},

		uglify: {
			dev: {
				files: {}
			}
		},

		watch: {
			options: {
				livereload: true
			},
			stylus: {
				files: ['public/stylus/**/*.styl'],
				tasks: ['stylus:dev']
			}
		}
	});
	grunt.loadNpmTasks('grunt-contrib-stylus');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');

	grunt.registerTask('styles', ['stylus:dev', 'watch']);
};
