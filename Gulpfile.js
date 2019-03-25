const gulp = require('gulp');
const jshint = require('gulp-jshint');
const clean = require('gulp-clean');
const runSequence = require('run-sequence');
const rmplugin = require('gulp-cordova-plugin-remove');
const addplugin = require('gulp-cordova-plugin');
const android = require('gulp-cordova-build-android');
const ignore = require('gulp-ignore');
const moment = require('moment');
const exec = require('gulp-exec');
const map = require('map-stream');
const pkg = require('./package.json');
const fs = require('fs');
const rename = require('gulp-rename');

var release = false;

var caminhoWinRar = '"C:\\Program Files (x86)\\WinRAR\\rar.exe"';
gulp.task('lint', function () {
    return gulp.src('www/assets/js/**/*.js')
	.pipe(jshint())
	.pipe(jshint.reporter('default'));
});

gulp.task('build', function () {
    return gulp.src('.')
	.pipe(android({ release: process.argv.indexOf('--release') >= 0 ? true : false }))
	.pipe(ignore.exclude('*unaligned*'))
    .pipe(ignore.exclude('*debug*'))
	.pipe(rename(function (path) {
	    if (path.basename.indexOf("arm") >= 0) {
	        path.basename = 'ta-arm';
	    }

	    if (path.basename.indexOf("x86") >= 0) {
	        path.basename = 'ta-x86';
	    }
	}))
	.pipe(gulp.dest('Pacote/release/android'));
});

gulp.task('cleanDistFolders', function () {
    gulp.src('Pacote/release/*')
	.pipe(clean());

    return gulp.src('Pacote/debug/*')
    .pipe(clean());
});

gulp.task('copyModelFiles', function () {
    return gulp.src('Pacote/modelo/*')
    .pipe(gulp.dest('Pacote/release'));
});

gulp.task('changeVersion', function () {
    fs.writeFileSync('Pacote/release/versaoapp.app', pkg.version);
});


gulp.task('addFilesToReleasePack', function () {
    var comando = caminhoWinRar + ' a -ep1 ta.exe -r Pacote\\release\\';
   
});

gulp.task('makePack', function (cb) {
    return gulp.src('tools/**/*')
	.pipe(exec('copy /b tools\\7ZSD.sfx + tools\\config.txt + apk\\apk.7z apk\\ta-v' + pkg.version + '.exe', function (err, stdout, stderr) {
	    console.log(stdout);
	    console.log(stderr);

	    cb(err);

	}));
});

gulp.task('installPlugins', function () {
    return gulp.src('.')
	.pipe(addplugin([
		"https://github.com/florentvaldelievre/virtualartifacts-webIntent.git",//utilizado no projeto : 1.0.1
		"cordova-plugin-barcodescanner@0.7.0",
		"cordova-plugin-device@1.1.0",
		"cordova-plugin-file@3.0.0",
		"cordova-plugin-file-transfer@1.5.0",
		"cordova-plugin-fullscreen@1.1.0",
		"cordova-plugin-network-information@1.2.0",
		"cordova-plugin-networkinterface@1.0.8",
		"cordova-plugin-splashscreen@3.0.0",
		"cordova-plugin-statusbar@2.1.1",
		"cordova-plugin-whitelist@1.2.0",
		"https://github.com/46cl/cordova-android-focus-plugin", //utilizado no projeto : 0.1.3
		"cordova-plugin-app-version",
		"https://github.com/samurodrigo/samurodrigo-cordova-plugin-devicereport.git",
		"https://github.com/jorgecis/ShortcutPlugin.git",
		"cordova-plugin-serial@0.0.3",
		"cordova-plugin-crosswalk-webview@2.2.0"
	]));
});

gulp.task('dist', function () {
    runSequence('cleanDistFolders',
		'build',
        'copyModelFiles',
        'changeVersion',
        'addFilesToReleasePack');
});







