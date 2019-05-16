# Welcome to BSafes
Hi, **BSafes** is Encrypted Note Taking and Office Filing Solution for You and Your Teams.
## Features
 - Privacy by design.
 - Team collaboration.
 - End-to-End Encryption.
 - Opening multiple notes at the same time.
 - Web app, no software installation.
 - Open source encryption reviewed by security experts.
 - Support attachments of all media files, up to 500MB per file. No limit on number of attachments.
 
Though there are a lot of note taking apps already, we found only few apps are designed for privacy with **End-to-End Encryption**, and even fewer for **teams**.

Further more, few apps allow you to open multiple notes at the same time, this really kills productivity. Imagine you want to reference different notes for a project, and you have to repeatedly close a note and open another note. **BSafes** takes advantages of **tabs** of modern browser, you could open as many notes as you want on all devices. 
## Privacy & Security
Most cloud services such as Evernote, Google, Dropbox, features **encryption-in-transit** and **encryption-at-rest**, but without **End-to-End Encryption**, they could still see your data. And with modern **A.I.**, you don't really know how they use your data.

Also, only End-to-End encryption allows you and security experts to openly review the **client side encryption** code, to make sure your data is encrypted before being sent to servers.

## bsafes-web
This repository gives you all the javascript and stylsheet files used in BSafes and developed by BSafes. Since the rich text editor, Froala editor, requires commercial license, we only publish patch files here. 

For developers and security experts, you could also contribute to this project. You are welcome to create a fork of this project, test your code with **BSafes test server**, and create a pull request. 
## Getting started with development
 - Fork this project.
Please refer to [Fork a repo](https://help.github.com/en/articles/fork-a-repo).
 - Clone your fork to your local computer.
 Please refer to [Cloning a repository](https://help.github.com/en/articles/cloning-a-repository).
 ~~~~
 $ git clone https://github.com/<Your github account>/bsafes-web.git
 ~~~~
 - Now, you should have a bsafes-web project directory on your local computer.
~~~~
$ ls
./  ../  bsafes-web/
~~~~
 - Change directory to bsafes-web
~~~~
$ cd bsafes-web
~~~~
 - You would see javascript and stylesheet files
~~~~
$ ls
./   .DS_Store  README.md  stylesheets/
../  .git/      javascripts/
~~~~
 - Run a localhost web server to serve javascript and css files for this project
 
 There might be multiple ways to host this folder over http at port 8000. You
 may chose whatever is convenient for you. Two methods are defined here.
 ##### Using Chrome Extension
 Install [Web Server for Chrome](https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb?hl=en) app.
 Enter `chrome://apps` in chrome's address bar and launch the Web Server for Chrom app.
 
 Chose your folder, specify the port `8000` and restart the web server by using
 the toggle switch under the chose folder button.
 
 You can check the files hosted over http server at [http://localhost:8000](http://localhost:8000)
 
 ![web server for chrome](https://i.ibb.co/mRNd4kS/screenshot-picture.png)
 ##### Using Python
 Or if you have already installed the python and want to run an http server through
 python, please run the following command.
~~~~ 
$ python -m SimpleHTTPServer 8000
Serving HTTP on 0.0.0.0 port 8000 ...
~~~~
 - Now, open your browser, and go to test server, https://developer.openbsafes.com
![https://developer.openbsafes.com](http://www.imareader.com/images/bsafes/developerOpenbsafes.png)
 - bsafes-web javascript and css files are now served from your local web. With Chrome developer tools opened, select sources tab, and expand localhost:8000, you would see javascripts and stylesheets.
![enter image description here](http://www.imareader.com/images/bsafes/developerOpenbsafesDebug.png)
 - Now you could debug javascripts, add features and test.
 - Please don't hesitate to ask if you have any question.
