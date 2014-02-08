'use strict';
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var chalk = require('chalk');
var concat = require('concat-stream');
var packer = require('zip-stream');

module.exports = function (filename) {
	if (!filename) {
		throw new gutil.PluginError('gulp-zip', chalk.blue('filename') + ' required');
	}

	var firstFile;
	var archive = new packer();

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			this.push(file);
			return cb();
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-zip', 'Streaming not supported'));
			return cb();
		}

		if (!firstFile) {
			firstFile = file;
		}

		var relativePath = file.path.replace(file.cwd + path.sep, '');

		archive.entry(file.contents, { name: relativePath }, function (err) {
			if (err) {
				this.emit('error', err);
				return cb();
			}

			cb();
		});
	}, function (cb) {
		if (!firstFile) {
			return cb();
		}

		archive.pipe(concat(function (data) {
			this.push(new gutil.File({
				cwd: firstFile.cwd,
				base: firstFile.cwd,
				path: path.join(firstFile.cwd, filename),
				contents: data
			}));
			cb();
		}.bind(this)));

		archive.finalize();
	});
};
