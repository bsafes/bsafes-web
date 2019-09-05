    // Extends EditorUi to update I/O action states based on availability of backend
    (function()
    {
      var editorUiInit = EditorUi.prototype.init;
 
      EditorUi.prototype.init = function()
      {
        editorUiInit.apply(this, arguments);
      };
 
      // Adds required resources (disables loading of fallback properties, this can only
      // be used if we know that all keys are defined in the language specific file)
      mxResources.loadDefaultBundle = false;
      var bundle = mxResources.getDefaultBundle(RESOURCE_BASE, mxLanguage) ||
        mxResources.getSpecialBundle(RESOURCE_BASE, mxLanguage);

      // Fixes possible asynchronous requests
      mxUtils.getAll([bundle, STYLE_PATH + '/default.xml'], function(xhr)
      {
        // Adds bundle text to resources
        mxResources.parse(xhr[0].getText());

        // Configures the default graph theme
        var themes = new Object();
        themes[Graph.prototype.defaultThemeName] = xhr[1].getDocumentElement();

        // Main
        mxGraphUI = new EditorUi(new Editor(urlParams['chrome'] == '0', themes), document.getElementById("editor-ui-container"));
      }, function()
      {
        document.body.innerHTML = '<center style="margin-top:10%;">Error loading resource files. Please check browser console.</center>';
      });
    })();
