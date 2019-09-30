    ej.base.enableRipple(window.ripple)


    //Documenteditor control rendering starts
    var hostUrl = 'https://ej2services.syncfusion.com/production/web-services/';
    var container = new ej.documenteditor.DocumentEditorContainer();
    ej.documenteditor.DocumentEditorContainer.Inject(ej.documenteditor.Toolbar);
    container.serviceUrl = hostUrl + 'api/documenteditor/';
    container.appendTo('#syncfusion-container');

    var waitingPopUp = document.getElementById('waiting-popup');
    // TitleBar sample starts
    titleBarDiv = document.getElementById('documenteditor_titlebar');
    initializeTitleBar(true); 
    updateDocumentTitle();
    wireEventsInTitleBar();

    container.documentEditor.documentChange = function () {
        updateDocumentTitle();
    };

    var documentTitle;
    var documentTitleContentEditor;
    var titleBarDiv;
    var print;
    var openBtn;
    var download;
    var isPropertiesPaneEnabled;

    function initializeTitleBar(isShareNeeded) {
        documentTitle = ej.base.createElement('label', { id: 'documenteditor_title_name', styles: 'text-transform:capitalize;font-weight:400;text-overflow:ellipsis;white-space:pre;overflow:hidden;user-select:none;cursor:text' });
        documentTitleContentEditor = ej.base.createElement('div', { id: 'documenteditor_title_contentEditor', className: 'single-line' });
        documentTitleContentEditor.appendChild(documentTitle);
        titleBarDiv.appendChild(documentTitleContentEditor);
        documentTitleContentEditor.setAttribute('title', 'Document Name. Click or tap to rename this document.');
        var btnStyles = 'float:right;background: transparent;box-shadow:none; font-family: inherit;border-color: transparent;' +
        'border-radius: 2px;color:inherit;font-size:12px;text-transform:capitalize;margin-top:4px;height:28px;font-weight:400';
        print = addButton('e-de-icon-Print e-de-padding-right', 'Print', btnStyles, 'de-print', 'Print this document (Ctrl+P).', false);
        openBtn = addButton('e-de-icon-Open e-de-padding-right', 'open', btnStyles, 'de-open', 'Open', false);
        var items = [
            { text: 'Microsoft Word (.docx)', id: 'word' },
            { text: 'Syncfusion Document Text (.sfdt)', id: 'sfdt' },
        ];
        download = addButton('e-de-icon-Download e-de-padding-right', 'Download', btnStyles, 'documenteditor-share', 'Download this document.', true, items);
        if (!isShareNeeded) {
            download.element.style.display = 'none';
        }
        else {
            openBtn.element.style.display = 'none';
        }
    }
    function wireEventsInTitleBar() {
        print.element.addEventListener('click', onPrint);
        openBtn.element.addEventListener('click', function (e) {
            if (e.target.id === 'de-open') {
            var fileUpload = document.getElementById('uploadfileButton');
            fileUpload.value = '';
            fileUpload.click();
            }
        });
        documentTitleContentEditor.addEventListener('keydown', function (e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                documentTitleContentEditor.contentEditable = 'false';
                if (documentTitleContentEditor.textContent === '') {
                    documentTitleContentEditor.textContent = 'Document1';
                }
            }
        });
        documentTitleContentEditor.addEventListener('blur', function () {
            if (documentTitleContentEditor.textContent === '') {
                documentTitleContentEditor.textContent = 'Document1';
            }
            documentTitleContentEditor.contentEditable = 'false';
            container.documentEditor.documentName = documentTitle.textContent;
        });
        documentTitleContentEditor.addEventListener('click', function () {
            updateDocumentEditorTitle();
        });
    }
    function updateDocumentEditorTitle() {
        documentTitleContentEditor.contentEditable = 'true';
        documentTitleContentEditor.focus();
        window.getSelection().selectAllChildren(documentTitleContentEditor);
    }
    function updateDocumentTitle() {
        if (container.documentEditor.documentName === '') {
            container.documentEditor.documentName = 'Untitled';
        }
        documentTitle.textContent = container.documentEditor.documentName;
    }
    function onPrint() {
        container.documentEditor.print();
    }
    function onExportClick(args) {
        var value = args.item.id;
        switch (value) {
            case 'word':
                save('Docx');
                break;
            case 'sfdt':
                save('Sfdt');
                break;
        }
    }
    function save(format) {
        container.documentEditor.save(container.documentEditor.documentName === '' ? 'sample' : container.documentEditor.documentName, format);
    }
    function setTooltipForPopup() {
        document.getElementById('documenteditor-share-popup').querySelectorAll('li')[0].setAttribute('title', 'Download a copy of this document to your computer as a DOCX file.');
        document.getElementById('documenteditor-share-popup').querySelectorAll('li')[1].setAttribute('title', 'Download a copy of this document to your computer as an SFDT file.');
    }
    function addButton(iconClass, btnText, styles, id, tooltipText, isDropDown, items) {
        var button = ej.base.createElement('button', { id: id, styles: styles });
        titleBarDiv.appendChild(button);
        button.setAttribute('title', tooltipText);
        if (isDropDown) {
            var dropButton = new ej.splitbuttons.DropDownButton({ select: onExportClick, items: items, iconCss: iconClass, cssClass: 'e-caret-hide', content: btnText, open: function () { setTooltipForPopup(); } }, button);
            return dropButton;
        }
        else {
            var ejButton = new ej.buttons.Button({ iconCss: iconClass, content: btnText }, button);
            return ejButton;
        }
    } 


    function getSyncfusionWordContent()
    {
        container.documentEditor.saveAsBlob('Sfdt').then(function (sfdtBlob) { 
            var fileReader = new FileReader(); 
            fileReader.onload = function (e) { 
                // Get Json string here 
                var sfdtText = fileReader.result; 
                // This string can send to server for saving it in database 
                localStorage.setItem(syncfusionKey, sfdtText);
                //setTimeout(getSyncfusionWordContent, 500);                
            } 
            fileReader.readAsText(sfdtBlob); 
        }); 
    }

    function loadSyncfusionWordContent(jsonData)
    {
        $('#syncfusion-container').empty();
        container.appendTo('#syncfusion-container');
        $('#syncfusion-container').css('height', $(window).height() - 40);
        var right_space = screen.width - $('#documenteditor_title_contentEditor').width()
                            - $('#de-print').width() - $('#documenteditor-share').width();
        if (right_space < 200) right_space = 0;
        else right_space = 100;

        $('#documenteditor_titlebar').css('padding-right', right_space + 'px');

        $('.e-de-status-bar').css('padding-right', '100px');
        $('.e-dlg-container').css('z-index', '15000');
                    
        if (jsonData != null) {
            container.documentEditor.open(jsonData);
        }
        return container;
        //container.resize();

        //getSyncfusionWordContent();
    }


