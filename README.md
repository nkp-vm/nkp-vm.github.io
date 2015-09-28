HMS
===

This is the first iteration of HMS project. The following custom HTML tags can be used to manage content:


grunt
-----

A gruntfile is used to clean directories, create documentation, uglify javascript, and scan the 'views' tree for dictionary words
Run 'grunt' on command line to update these

META
----
`<meta>` tag should be the first tag in the document. 'name' must be 'module', 'content' must be module number, language code separated by ','

HMSQUIZ
-------
Add this element anywhere to create a quiz. Quiz questions are currently taken from quiz.json located at root level

* h-id:        Must match the ID in the quiz data              ("id")
* h-shuffle:   Shuffle the questions each time quiz is taken   (true, false)
* h-feedback:  Show feedback after question is answered        (true, false)
* h-explicit:  Show 'Correct!' and 'Incorrect!' in feedback    (true, false)     Not effective if -feedback="false"
* h-score:     Show the final score obtained                   (true, false)
* h-formal:    Request Student ID and submit results           (true, false)

```html
`<hmsquiz h-id="quizID1" h-feedback="true" h-shuffle="true" h-explicit="true" h-score="true" h-formal="true"></hmsquiz>`
```

HMSPOLL
-------
Poll questions taken from poll.json located at root level

* h-id:       Must match the ID in the quiz data              ("id")

```html
<hmspoll h-id="pollID1"></hmspoll>
```

HMSVIDEO
--------
Add this element anywhere to create a Video / GIF player. Source material is taken from the current module route's corresponding 'img' subfolder
h-videosrc is chosen in preference to h-gifsrc, if both attributes are set.

* h-id:       Must match the ID of the connected folding information panel
* h-text:     Overlay text
* h-icon:     Overlay icon
* h-poster:   Static image displayed before click activates the video / GIF
* h-videosrc: Name of the MP4 file (encapsulating H264) to play
* h-gifsrc:   Name of the GIF file to play (mobile / small screen only)

```html
<hmsvideo h-id="s1" h-text="1. Ute i felt" h-icon="hart.png" h-poster="4.3.jpg" h-videosrc="4.3.mp4" h-gifsrc=""></hmsvideo>
```

HMSREADMORE
-----------
Add this attribute to make an element (use a div) containing 'read more' information.
Any HTML placed inside as children will be hidden until "Read More.." is clicked

* h-id:       Must be a unique ID
* h-title:    The title shown before the element is opened

```html
<div hmsreadmore h-id="rm1" h-title="Click here to read more..">
```

HMSLINK
-------
Add this attribute to make an '<a>' element show the link-ext icon. External links must begin with 'http://'

```html
<a hmslink href="http://www.google.com">Go to Google</a>
```


--------------

HMSSECTION
----------
Add this attribute to define section content. The content will be loaded from corresponding 'sx.html' file

HMSMODULETITLE
--------------
Add this attribute to define the module quote and subtitle in each language.

# e-learning-generic
