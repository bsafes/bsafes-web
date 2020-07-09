var fs = require('fs');
const { exec } = require('child_process');

var path = '.';
var stylesheetFile = './stylesheets.ejs';

var debug = false;
var openbsafes = false;
var version = '?v0.B1.20200707';

if(process.argv.length > 2) {
	if(process.argv[2] === 'debug')
	{
		debug = true;
		console.log(process.argv[2]);
	}

	if(process.argv[2] === 'openbsafes')
  {
    openbsafes = true;
		console.log(process.argv[2]);
  }
}

if(fs.existsSync(stylesheetFile)) {
	fs.unlinkSync(stylesheetFile);
}

var common3rdParties = [
	{file: "./bootstrap.min.css", url: "/stylesheets/bootstrap.min.css"},
	{file: "./common3rdPartiesCSS/jquery-ui.min.css", url: "https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.css"}
];

var commonBSafes = [
	{file: "./bsafes.css", url: "/stylesheets/bsafes.css"}
];

var frontPages = [
	{file: "./style.css", url: "/stylesheets/style.css"},
	{file: "./responsive.css", url: "/stylesheets/responsive.css"}
];

var fonts = [
	{file: "./fonts/googleFonts.css", url: "https://fonts.googleapis.com/css?family=Open+Sans:400,600,700,800,300"}
];

var fontawesomeV4 = [
	{file: "./fonts/fontAwesomeV470.min.css", url: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"}
];

var fontawesomeV5 = [
	{file: "./fonts/fontAwesomeV5013.min.css", url: "https://use.fontawesome.com/releases/v5.0.13/css/all.css"}
];

var tagsCSS = [
	{file: "./tagsCSS/bootstrap-tokenfield.css", url: "/stylesheets/tagsCSS/bootstrap-tokenfield.css"},
	{file: "./tagsCSS/tokenfield-typeahead.min.css", url: "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-tokenfield/0.12.0/css/tokenfield-typeahead.min.css"}
];

var froalaCSS = [
	{file: "./froalaCSS/froala_editor.min.css", url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/css/froala_editor.min.css"},
	{file: "./froalaCSS/froala_style.min.css", url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/css/froala_style.min.css"},
	{file: "./froalaCSS/codemirror.min.css", url: "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.3.0/codemirror.min.css"},
	{file: "./froalaCSS/char_counter.min.css", url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/css/plugins/char_counter.min.css"},
	{file: "./froalaCSS/code_view.min.css", url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/css/plugins/code_view.min.css"},
	{file: "./froalaCSS/colors.min.css", url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/css/plugins/colors.min.css"},
	{file: "./froalaCSS/emoticons.min.css", url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/css/plugins/emoticons.min.css"},
	{file: "./froalaCSS/file.min.css", url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/css/plugins/file.min.css"},
	{file: "./froalaCSS/fullscreen.min.css", url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/css/plugins/fullscreen.min.css"},
	{file: "./froalaCSS/image.min.css", url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/css/plugins/image.min.css"},
	{file: "./froalaCSS/image_manager.min.css", url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/css/plugins/image_manager.min.css"},
	{file: "./froalaCSS/line_breaker.min.css", url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/css/plugins/line_breaker.min.css"},
	{file: "./froalaCSS/quick_insert.min.css", url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/css/plugins/quick_insert.min.css"},
	{file: "./froalaCSS/table.min.css", url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/css/plugins/table.min.css"},
	{file: "./froalaCSS/video.css", url: "/stylesheets/froalaCSS/video.css", licensed:"true"},
];

var imageCSS = [
	{file: "./imageCSS/photoswipe.min.css", url: "https://cdnjs.cloudflare.com/ajax/libs/photoswipe/4.1.2/photoswipe.min.css"},
	{file: "./imageCSS/default-skin.min.css", url: "https://cdnjs.cloudflare.com/ajax/libs/photoswipe/4.1.2/default-skin/default-skin.min.css"}
];

var allStylesheets = [
	{stylesheets: common3rdParties},
	{stylesheets: commonBSafes},
	{stylesheets: fonts},
	{condition: "frontPages", stylesheets: frontPages},
	{condition: "fontawesomeV4", stylesheets: fontawesomeV4},
	{condition: "fontawesomeV5", stylesheets: fontawesomeV5},
	{condition: "editableCSS", stylesheets: tagsCSS},
	{condition: "editableCSS", stylesheets: froalaCSS},
	{condition: "editableCSS", stylesheets: imageCSS}
];

function generateSRI(file, done) {
	if(!fs.existsSync(file)) {
		console.log(file + " doesn't exist");
		return;
	}

	var command = 'cat ' + file + ' | openssl dgst -sha384 -binary | openssl base64 -A';
	exec(command, function(err, stdout, stderr) {
		if(err) {
			done(err, null);
			return;
		}
		var integrity = "sha384-" + stdout;
		done(null, integrity);
	});
}

function generateStylesheet() {
	var i = 0;
	var j = 0;

	function generateNextCollection() {
		var collection = allStylesheets[i];
		var stylesheets = collection.stylesheets;
		var condition = collection.condition;
		if(condition) {
			var line = '<% if(typeof(' + condition + ') !== "undefined" && ' + condition +')  {%>' + '\n';
			fs.appendFileSync(stylesheetFile, line);
		}	
		function generateNext() {
			var item = stylesheets[j];
			var file = item.file;

			generateSRI(file, function(err, integrity) {
				if(err) {
					console.log(err);
					done(err);
				} else {
					if(debug) {
						var line = '    <link rel="stylesheet" href="' + item.url + version + '">' + "\n"; 
						fs.appendFileSync(stylesheetFile, line);
					} else {
						if(openbsafes) {
							if(item.url.startsWith('/stylesheets') && typeof(item.licensed) === "undefined"){
								var line = '<% if(typeof(developer) !== "undefined" && developer) {%>' + '\n';
								fs.appendFileSync(stylesheetFile, line);
								var line = '    <link rel="stylesheet" href="' + 'http://localhost:8000' + item.url + version + '">' + "\n";
								fs.appendFileSync(stylesheetFile, line);
                var line = '<%} else if(typeof(mobile) !== "undefined" && mobile){%>' + "\n";
                fs.appendFileSync(stylesheetFile, line);
								var line = '    <link rel="stylesheet" href="' + 'https://s3.amazonaws.com/com.openbsafes.code' + item.url + version + '">' + "\n";
                fs.appendFileSync(stylesheetFile, line);
								var line = '<%} else if(typeof(hp5aocbj) !== "undefined" && hp5aocbj){%>' + "\n";
                fs.appendFileSync(stylesheetFile, line);
                var line = '    <link rel="stylesheet" href="' + 'https://aposta90.com/bsafes-web' + item.url + version + '">' + "\n";
                fs.appendFileSync(stylesheetFile, line);
								var line = '<%} else {%>' + "\n";
								fs.appendFileSync(stylesheetFile, line);
								var line = '    <link rel="stylesheet" href="' + item.url + version + '" integrity="' + integrity + '" crossorigin="anonymous">' +  "\n";
								fs.appendFileSync(stylesheetFile, line);
								var line = '<%}%>' + "\n";
								fs.appendFileSync(stylesheetFile, line);
							} else {
								var line = '    <link rel="stylesheet" href="' + item.url + version + '" integrity="' + integrity + '" crossorigin="anonymous">' +  "\n";
								fs.appendFileSync(stylesheetFile, line);
							}
						} else {
							var line = '		<link rel="stylesheet" href="' + item.url + version + '" integrity="' + integrity + '" crossorigin="anonymous">' +  "\n";
							fs.appendFileSync(stylesheetFile, line);
						}
					}
					j++;
					if(j < stylesheets.length) {
						generateNext();
					} else {
						if(condition) {
							var line = '<% } %>' + '\n';
							fs.appendFileSync(stylesheetFile, line);
						}
						i++;
						if(i < allStylesheets.length) {
							j = 0;
							generateNextCollection();
						} else {
							var command = 'cp ./stylesheets.ejs ../../views/.';
  						exec(command, function(err, stdout, stderr) {
    						if(err) {
									console.log(err);
      						return;
    						}
								console.log("stylesheets.js has been copied to views folder");
  						});
						}
					}
				}
			});
		}
		if(stylesheets.length) {
			generateNext();
		} else {
			i++;
      if(i < allStylesheets.length) {
        j = 0;
        generateNextCollection();
      } else {
        var command = 'cp ./stylesheets.ejs ../../views/.';
        exec(command, function(err, stdout, stderr) {
        	if(err) {
          	console.log(err);
          	return;
        	}
        	console.log("stylesheets.js has been copied to views folder");
      	});
      }
		}		
	}

	if(allStylesheets.length) {
		generateNextCollection();		
	}
}

setTimeout(function() {
	generateStylesheet(); 
}, 000);

