$(function(d, s, id) {
  'use strict';

  var js, fjs = d.getElementsByTagName(s)[0];
  js = d.createElement(s);
  js.onload = function() {
    console.log('forge loaded');
    loadPage();
  };
  js.src = "https://cdnjs.cloudflare.com/ajax/libs/forge/0.10.0/forge.min.js";
  js.integrity = "sha384-YdlvGjpaANY2l5LLtTjrO60cpMIPWnYxQFXMcp7l6lQuQEFdAHNO+yxI9ysch1k6";
  js.setAttribute("crossorigin", "anonymous");
  fjs.parentNode.insertBefore(js, fjs);

}(document, 'script', 'forge'));
