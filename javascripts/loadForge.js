$(function (d, s, id) {
    'use strict';

    var js, fjs = d.getElementsByTagName(s)[0];
    js = d.createElement(s);
    js.onload = function() {
      console.log('forge loaded');
      loadPage();
    };
    js.src = "https://cdnjs.cloudflare.com/ajax/libs/forge/0.7.6/forge.min.js";
		js.integrity = "sha384-F1L9GRsA4NrH87gLI5LQu110sQ1OHQDI62gGfUwIEldZLJCC03v/z9v5YLus6yM3";
		js.setAttribute("crossorigin", "anonymous");
    fjs.parentNode.insertBefore(js, fjs);

}(document, 'script', 'forge'));
