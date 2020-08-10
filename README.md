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
 
 ##### Using Python https server
 1. Download simple-https-server.py from https://gist.github.com/dergachev/7028596 to top directory of this project.
 2. Generate server.xml with the following command:  
    $ openssl req -new -x509 -keyout server.pem -out server.pem -days 365 -nodes
 3. Run the script  
    $ python simple-https-server.py

 - Now, open your browser, and go to test server, https://developer.openbsafes.com
![https://developer.openbsafes.com](https://statics.bsafes.com/openBSafes.png)
 - bsafes-web javascript and css files are now served from your local web. With Chrome developer tools opened, select sources tab, and expand localhost:4443, you would see javascripts and stylesheets.
![enter image description here](https://statics.bsafes.com/localHttps.png)
 - Now you could debug javascripts, add features and test.
 - Please don't hesitate to ask if you have any question.
