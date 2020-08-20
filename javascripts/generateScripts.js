var fs = require('fs');
const {
  exec
} = require('child_process');

var path = '.';
var scriptsFile = './scripts.ejs';
var conditionFile = './condition.ejs';

var debug = false;
var openbsafes = false;
var version = '?v0.B1.20200720';

if (process.argv.length > 2) {
  if (process.argv[2] === 'debug') {
    debug = true;
    console.log(process.argv[2]);
  }
  if (process.argv[2] === 'openbsafes') {
    openbsafes = true;
    console.log(process.argv[2]);
  }
}

if (fs.existsSync(scriptsFile)) {
  fs.unlinkSync(scriptsFile);
}

if (fs.existsSync(conditionFile)) {
  fs.unlinkSync(conditionFile);
}

var common3rdParties = [{
    file: "./common3rdPartiesJS/jquery.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.3/jquery.min.js"
  },
  {
    file: "./common3rdPartiesJS/jquery-ui.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"
  },
  {
    file: "./common3rdPartiesJS/bootstrap.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min.js"
  },
  {
    file: "./common3rdPartiesJS/loadingoverlay.min.js",
    url: "https://cdn.jsdelivr.net/npm/gasparesganga-jquery-loading-overlay@2.1.5/dist/loadingoverlay.min.js"
  },
  {
    file: "./common3rdPartiesJS/purify.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/dompurify/1.0.8/purify.min.js"
  }
];

var commonBSafes = [{
    file: "./bSafesCommon.js",
    url: "/javascripts/bSafesCommon.js"
  },
  {
    file: "./bSafesCommonUI.js",
    url: "/javascripts/bSafesCommonUI.js"
  }
];

var forgeJS = [{
  file: "./forgeJS/forge.min.js",
  url: "https://cdnjs.cloudflare.com/ajax/libs/forge/0.7.6/forge.min.js"
}];

var loadForgeJS = [{
  file: "./loadForge.js",
  url: "/javascripts/loadForge.js"
}];

var signedOutState = [{
  file: "./signedOutState.js",
  url: "/javascripts/signedOutState.js"
}];

var signedInState = [{
  file: "./signedInState.js",
  url: "/javascripts/signedInState.js"
}];

var keyVerifiedState = [{
  file: "./keyVerifiedState.js",
  url: "/javascripts/keyVerifiedState.js"
}];

var signedInOrKeyVerifiedState = [{
  file: "./signedInOrKeyVerifiedState.js",
  url: "/javascripts/signedInOrKeyVerifiedState.js"
}];

var indexJS = [{
  file: "./index.js",
  url: "/javascripts/index.js"
}];

var signInJS = [{
  file: "./signIn.js",
  url: "/javascripts/signIn.js"
}];

var emailSignUpJS = [{
  file: "./emailSignUp.js",
  url: "/javascripts/emailSignUp.js"
}];

var resetEmailPasswordJS = [{
  file: "./resetEmailPassword.js",
  url: "/javascripts/resetEmailPassword.js"
}];

var setupEMailJS = [{
  file: "./setupEMail.js",
  url: "/javascripts/setupEMail.js"
}];

var dashboardJS = [{
  file: "./dashboard.js",
  url: "/javascripts/dashboard.js"
}];

var backupJS = [{
  file: "./backup.js",
  url: "/javascripts/backup.js"
}];

var securityJS = [{
  file: "./security.js",
  url: "/javascripts/security.js"
}];

var extraMFAJS = [{
  file: "./extraMFA.js",
  url: "/javascripts/extraMFA.js"
}];

var resetAccountMFAJS = [{
  file: "./resetAccountMFA.js",
  url: "/javascripts/resetAccountMFA.js"
}];

var managedMembersJS = [{
  file: "./managedMembers.js",
  url: "/javascripts/managedMembers.js"
}];

var managedMemberSignInJS = [{
  file: "./managedMemberSignIn.js",
  url: "/javascripts/managedMemberSignIn.js"
}];

var trialMembersJS = [{
  file: "./trialMembers.js",
  url: "/javascripts/trialMembers.js"
}];

var keySetupJS = [{
    file: "./argon2Calc.js",
    url: "/javascripts/argon2Calc.js"
  },
  {
    file: "./keySetup.js",
    url: "/javascripts/keySetup.js"
  }
];

var keyEnterJS = [{
    file: "./argon2Calc.js",
    url: "/javascripts/argon2Calc.js"
  },
  {
    file: "./keyEnter.js",
    url: "/javascripts/keyEnter.js"
  }
];

var teamsJS = [{
  file: "./teams.js",
  url: "/javascripts/teams.js"
}];

var teamMembersJS = [{
  file: "./teamMembers.js",
  url: "/javascripts/teamMembers.js"
}];

var safeJS = [{
  file: "./safe.js",
  url: "/javascripts/safe.js"
}];

var subscribeJS = [{
    file: "./braintree/dropin.min.js",
    url: "https://js.braintreegateway.com/web/dropin/1.19.0/js/dropin.min.js"
  },
  {
    file: "./braintree/checkout.js",
    url: "https://www.paypalobjects.com/api/checkout.js"
  },
  {
    file: "./braintree/client.min.js",
    url: "https://js.braintreegateway.com/web/3.57.0/js/client.min.js"
  },
  {
    file: "./braintree/paypal-checkout.min.js",
    url: "https://js.braintreegateway.com/web/3.57.0/js/paypal-checkout.min.js"
  },
  {
    file: "./subscribe.js",
    url: "/javascripts/subscribe.js"
  }
];

var buyQuotasJS = [{
  file: "./buyQuotas.js",
  url: "/javascripts/buyQuotas.js"
}];

var activitiesJS = [{
  file: "./activities.js",
  url: "/javascripts/activities.js"
}];

var tagsJS = [{
    file: "./tagsJS/bootstrap-tokenfield.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-tokenfield/0.12.0/bootstrap-tokenfield.min.js"
  },
  {
    file: "./docs-assets/js/scrollspy.js",
    url: "/javascripts/docs-assets/js/scrollspy.js"
  },
  {
    file: "./docs-assets/js/affix.js",
    url: "/javascripts/docs-assets/js/affix.js"
  },
  {
    file: "./docs-assets/js/docs.min.js",
    url: "/javascripts/docs-assets/js/docs.min.js"
  },
  {
    file: "./tagsJS/typeahead.bundle.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/corejs-typeahead/1.2.1/typeahead.bundle.min.js"
  }
];

var pageControlJS = [{
  file: "./pageControls.js",
  url: "/javascripts/pageControls.js"
}];

var froalaEditorJS = [{
    file: "./froalaEditorJS/froala_editor.js",
    url: "/javascripts/froalaEditorJS/froala_editor.js",
    licensed: "true"
  },
  {
    file: "./froalaEditorJS/codemirror.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.3.0/codemirror.min.js"
  },
  {
    file: "./froalaEditorJS/xml.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.3.0/mode/xml/xml.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/align.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/align.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/char_counter.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/char_counter.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/code_beautifier.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/code_beautifier.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/code_view.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/code_view.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/colors.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/colors.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/emoticons.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/emoticons.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/entities.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/entities.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/file.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/file.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/font_family.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/font_family.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/font_size.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/font_size.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/fullscreen.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/fullscreen.min.js"
  },
  {
    file: "./froalaEditorJS/froalaEncryptImage.js",
    url: "/javascripts/froalaEditorJS/froalaEncryptImage.js",
    licensed: "true"
  },
  {
    file: "./froala/js/plugins/cdnjs/image_manager.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/image_manager.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/inline_style.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/inline_style.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/line_breaker.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/line_breaker.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/link.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/link.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/lists.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/lists.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/paragraph_format.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/paragraph_format.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/paragraph_style.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/paragraph_style.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/quick_insert.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/quick_insert.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/quote.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/quote.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/save.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/save.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/table.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/table.min.js"
  },
  {
    file: "./froala/js/plugins/cdnjs/url.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/plugins/url.min.js"
  },
  {
    file: "./froalaEditorJS/froalaEncryptVideo.js",
    url: "/javascripts/froalaEditorJS/froalaEncryptVideo.js",
    licensed: "true"
  },
  {
    file: "./froala/js/languages/ro.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/froala-editor/2.6.5/js/languages/ro.js"
  }
];

var imageJS = [{
    file: "./WN-downscaleImage.js",
    url: "/javascripts/WN-downscaleImage.js"
  },
  {
    file: "./imageJS/load-image.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/blueimp-load-image/2.19.0/load-image.min.js"
  },
  {
    file: "./imageJS/canvas-to-blob.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/javascript-canvas-to-blob/3.14.0/js/canvas-to-blob.min.js"
  },
  {
    file: "./imageJS/photoswipe.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/photoswipe/4.1.2/photoswipe.min.js"
  },
  {
    file: "./imageJS/photoswipe-ui-default.min.js",
    url: "https://cdnjs.cloudflare.com/ajax/libs/photoswipe/4.1.2/photoswipe-ui-default.min.js"
  }
];

var containerJS = [{
  file: "./container.js",
  url: "/javascripts/container.js"
}];

var pageJS = [{
  file: "./page.js",
  url: "/javascripts/page.js"
}];

var folderPageJS = [{
  file: "./folderPage.js",
  url: "/javascripts/folderPage.js"
}];

var notebookPageJS = [{
  file: "./notebookPage.js",
  url: "/javascripts/notebookPage.js"
}];

var diaryPageJS = [{
  file: "./diaryPage.js",
  url: "/javascripts/diaryPage.js"
}];

var trashBoxJS = [{
  file: "./trashBox.js",
  url: "/javascripts/trashBox.js"
}];

var allScripts = [{
    condition: "forgeJS",
    scripts: forgeJS
  },
  {
    scripts: common3rdParties
  },
  {
    scripts: commonBSafes
  },
  {
    condition: "indexJS",
    scripts: indexJS
  },
  {
    condition: "signInJS",
    scripts: signInJS
  },
  {
    condition: "emailSignUpJS",
    scripts: emailSignUpJS
  },
  {
    condition: "resetEmailPasswordJS",
    scripts: resetEmailPasswordJS
  },
  {
    condition: "setupEMailJS",
    scripts: setupEMailJS
  },
  {
    condition: "dashboardJS",
    scripts: dashboardJS
  },
  {
    condition: "backupJS",
    scripts: backupJS
  },
  {
    condition: "securityJS",
    scripts: securityJS
  },
  {
    condition: "extraMFAJS",
    scripts: extraMFAJS
  },
  {
    condition: "resetAccountMFAJS",
    scripts: resetAccountMFAJS
  },
  {
    condition: "managedMembersJS",
    scripts: managedMembersJS
  },
  {
    condition: "managedMemberSignInJS",
    scripts: managedMemberSignInJS
  },
  {
    condition: "trialMembersJS",
    scripts: trialMembersJS
  },
  {
    condition: "keySetupJS",
    scripts: keySetupJS
  },
  {
    condition: "keyEnterJS",
    scripts: keyEnterJS
  },
  {
    condition: "signedOutState",
    scripts: signedOutState
  },
  {
    condition: "signedInState",
    scripts: signedInState
  },
  {
    condition: "keyVerifiedState",
    scripts: keyVerifiedState
  },
  {
    condition: "signedInOrKeyVerifiedState",
    scripts: signedInOrKeyVerifiedState
  },
  {
    condition: "teamsJS",
    scripts: teamsJS
  },
  {
    condition: "teamMembersJS",
    scripts: teamMembersJS
  },
  {
    condition: "safeJS",
    scripts: safeJS
  },
  {
    condition: "activitiesJS",
    scripts: activitiesJS
  },
  {
    condition: "containerJS",
    scripts: containerJS
  },
  {
    condition: "pageJS",
    scripts: pageJS
  },
  {
    condition: "folderPageJS",
    scripts: folderPageJS
  },
  {
    condition: "notebookPageJS",
    scripts: notebookPageJS
  },
  {
    condition: "diaryPageJS",
    scripts: diaryPageJS
  },
  {
    condition: "subscribeJS",
    scripts: subscribeJS
  },
  {
    condition: "buyQuotasJS",
    scripts: buyQuotasJS
  },
  {
    condition: "trashBoxJS",
    scripts: trashBoxJS
  },
  {
    condition: "tagsJS",
    scripts: tagsJS
  },
  {
    condition: "editorJS",
    scripts: froalaEditorJS
  },
  {
    condition: "editorJS",
    scripts: imageJS
  },
  {
    condition: "pageControlJS",
    scripts: pageControlJS
  },
  {
    condition: "loadForgeJS",
    scripts: loadForgeJS
  }
];

function generateSRI(file, done) {
  if (!fs.existsSync(file)) {
    console.log(file + " doesn't exist");
    return;
  }

  var command = 'cat ' + file + ' | openssl dgst -sha384 -binary | openssl base64 -A';
  exec(command, function(err, stdout, stderr) {
    if (err) {
      done(err, null);
      return;
    }
    var integrity = "sha384-" + stdout;
    done(null, integrity);
  });
}

function generateScript() {
  var i = 0;
  var j = 0;

  function generateNextCollection() {
    var collection = allScripts[i];
    var scripts = collection.scripts;
    var condition = collection.condition;
    if (condition) {
      var line = '<% if(typeof(' + condition + ') !== "undefined" && ' + condition + ')  {%>' + '\n';
      fs.appendFileSync(scriptsFile, line);
      var line = '<% var ' + condition + ' = false; %>' + '\n';
      fs.appendFileSync(conditionFile, line);
    }

    function generateNext() {
      var item = scripts[j];
      var file = item.file;

      generateSRI(file, function(err, integrity) {
        if (err) {
          console.log(err);
          done(err);
        } else {
          if (debug) {
            var line = '    <script src="' + item.url + version + '"></script>' + "\n";
            fs.appendFileSync(scriptsFile, line);
          } else {
            if (openbsafes) {
              if (item.url.startsWith('/javascripts') && typeof(item.licensed) === "undefined") {
                var line = '<% if(typeof(developer) !== "undefined" && developer) {%>' + '\n';
                fs.appendFileSync(scriptsFile, line);
                var line = '    <script src="' + 'http://localhost:8000' + item.url + version + '"></script>' + "\n";
                fs.appendFileSync(scriptsFile, line);
                var line = '<%} else if(typeof(mobile) !== "undefined" && mobile){%>' + "\n";
                fs.appendFileSync(scriptsFile, line);
                var line = '    <script src="' + 'https://s3.amazonaws.com/com.openbsafes.code' + item.url + version + '"></script>' + "\n";
                fs.appendFileSync(scriptsFile, line);
                var line = '<%} else if(typeof(hp5aocbj) !== "undefined" && hp5aocbj){%>' + "\n";
                fs.appendFileSync(scriptsFile, line);
                var line = '    <script src="' + 'https://aposta90.com/bsafes-web' + item.url + version + '"></script>' + "\n";
                fs.appendFileSync(scriptsFile, line);
                var line = '<%} else {%>' + "\n";
                fs.appendFileSync(scriptsFile, line);
                var line = '    <script src="' + item.url + version + '" integrity="' + integrity + '" crossorigin="anonymous"></script>' + "\n";
                fs.appendFileSync(scriptsFile, line);
                var line = '<%}%>' + "\n";
                fs.appendFileSync(scriptsFile, line);
              } else {
                var line = '    <script src="' + item.url + version + '" integrity="' + integrity + '" crossorigin="anonymous"></script>' + "\n";
                fs.appendFileSync(scriptsFile, line);
              }
            } else {
              var line = '    <script src="' + item.url + version + '" integrity="' + integrity + '" crossorigin="anonymous"></script>' + "\n";
              fs.appendFileSync(scriptsFile, line);
            }
          }
          j++;
          if (j < scripts.length) {
            generateNext();
          } else {
            if (condition) {
              var line = '<% } %>' + '\n';
              fs.appendFileSync(scriptsFile, line);
            }
            i++;
            if (i < allScripts.length) {
              j = 0;
              generateNextCollection();
            } else {
              var command = 'cp ./scripts.ejs ../../views/.';
              exec(command, function(err, stdout, stderr) {
                if (err) {
                  console.log(err);
                  return;
                }
                console.log("scripts.js has been copied to views folder");
              });
            }
          }
        }
      });
    }
    if (scripts.length) {
      generateNext();
    }
  }

  if (allScripts.length) {
    generateNextCollection();
  }
}

setTimeout(function() {
  generateScript();
}, 000);