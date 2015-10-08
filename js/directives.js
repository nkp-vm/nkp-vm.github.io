/* --------------  DIRECTIVES ---------------- */
"use strict";
var GDirectives = angular.module('GDirectives', []);

/**
 * @ngdoc directive
 * @name hms.ngEnter
 * @description
 * Listens for keypress Enter key and evals the given function call
 */
GDirectives.directive('ngEnter', ['$timeout', function ($timeout) {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if (event.which === 13) {
                $timeout(function () {
                    scope.$eval(attrs.ngEnter);
                });
                //element.blur();

                event.preventDefault();
            }
        });
    };
}]);


/**
 * @ngdoc directive
 * @name sectionBox
 * @restrict E
 * @description
 * Add this element anywhere to create a Video / GIF player box. Source material is taken from the current module route's corresponding 'img' subfolder
 *     * section-id:       Must match the ID of the connected folding information panel
 *     * text-xx-{open | closed}: Overlay text
 *     * poster-src:   Static JPG or PNG image displayed before click activates the video / GIF
 *     * video-src: Name of the MP4 file (encapsulating H264) to play
 *     * gif-src:   Name of the GIF file to play (mobile / small screen only)
 *     * force-iphone-video:  Set to force video play (rather than GIF) on iPhone's small screen   (true, false)
 *      <pre>
 *          <section-box></section-box>
 *      </pre>
 */
GDirectives.directive("sectionBox", ['$window', '$animate', 'smoothScroll', '$route', '$sce', '$timeout', 'CONSTANTS', function($window, $animate, smoothScroll, $route, $sce, $timeout, CONSTANTS){
    var linker = function(scope, element, attrs) {
        var video;
        var notPlayed = true;
        var playing = false;
        var moduleNumber = $route.current.params.module;
        var imagePath = CONSTANTS.TOP_LEVEL_MODULE_PATH + 'img/';

        if (typeof scope.videosrc === "undefined") { scope.videosrc = ""; }
        if (typeof scope.posterSrc === "undefined") { scope.posterSrc = ""; }
        if (typeof scope.gifSrc === "undefined") { scope.gifSrc = ""; }

        scope.slideId = attrs.id+'_slide';
        scope.showVideo = false;
        scope.noPreloadGifSrcPath = imagePath + scope.posterSrc;
        scope.videoSrcPath = imagePath + scope.videoSrc;
        scope.imageSrcPath = imagePath + scope.posterSrc;
        scope.detailActive = false;
        scope.includeSrcPath = CONSTANTS.TOP_LEVEL_MODULE_PATH + $route.current.params.language + '/' + attrs.id + '.html';
        scope.slideOpen = false;

        // Controls open and close of the sliding section in this directive
        scope.slideToggle = function() {

            var target = document.getElementById(scope.slideId);
            var aTarget = angular.element(target);
            var content = target.querySelector('.content-selector');
            var contentHeight = content.offsetHeight+'px';

            if(scope.detailActive) {                // CLOSING
                // The CSS 'height: auto' property cannot be animated with CSS transitions. Only actual pixel values can be.
                // However 'height: auto' should be applied to affect proper page sizing when the content increases height.
                // Changing the 'height' from 'px' to 'auto' prompts a transition effect, therefore we need to disable/enable animations and trick the browser to flush its cache
                aTarget.addClass('notransition');
                target.style.height = contentHeight;  // Set height from 'auto' back to 'px' before reducing to '0px'
                var rcontent = target.querySelector('.content-selector');  // These two step necessary to flush browser cache so that transition is not run
                var rcontentHeight = rcontent.offsetHeight;  // Accessing the offsetHeight flushes broswer cache.  http://stackoverflow.com/questions/11131875/what-is-the-cleanest-way-to-disable-css-transition-effects-temporarily
                aTarget.removeClass('notransition');
                scope.slideOpen = false;
                $timeout(function () {
                    target.style.height = '0';   // prompt a transition to '0'
                    if(scope.videoSrc !== "") {
                        video.style.height = '0';   // Video height interferes with slide closed - must set it's height also..
                    }
                }, 10);
            }
            else {                                  // OPENING
                if(scope.videoSrc !== "") {
                    video.style.height = 'auto';
                }
                target.style.height = contentHeight;
                $timeout(function () {
                    aTarget.addClass('notransition');
                    target.style.height = 'auto';
                    var rcontent = target.querySelector('.content-selector');
                    var rcontentHeight = rcontent.offsetHeight;
                    aTarget.removeClass('notransition');
                    scope.slideOpen = true;
                }, 2100);
            }
            scope.detailActive = !scope.detailActive;
            pickLanguage();
        };

        // Run setup again if the route or language has changed
        scope.$on('$routeChangeSuccess', function() {
            scope.videoPath = CONSTANTS.TOP_LEVEL_MODULE_PATH + moduleNumber + '/img/';
            scope.noPreloadGifSrc = imagePath + scope.posterSrc;
            scope.imageSrc = "url("+(imagePath + scope.posterSrc)+")";
            pickLanguage();
        });

        // Choose language for overlay text - called automatically when language switches
        var pickLanguage = function() {
            if(scope.detailActive) {
                scope.overlayText = scope.textOpen;
            }
            else {
                scope.overlayText = scope.textClosed;
            }
        };

        scope.trustResource = function trustResource(resourceUrl) {
            return $sce.trustAsResourceUrl(resourceUrl);
        };

        // Play the video on click
        scope.activate = function() {
            scope.slideToggle();
            // If this is the first play, scroll to me and open the sliding section
            if(notPlayed) {
                $timeout(function () {
                    smoothScroll(element[0], {duration: 500});
                }, 100);
            }
            // Play the GIF if we are on mobile phone
            if(scope.gifSrc !== "" && scope.forceIphoneVideo === "false" && $window.innerWidth < CONSTANTS.GIF_MAX_WIDTH) {
                if(playing) {
                    scope.noPreloadGifSrcPath = imagePath + scope.posterSrc;
                    playing = false;
                }
                else {
                    scope.noPreloadGifSrcPath = imagePath + scope.gifSrc;
                    playing = true;
                }
            }
            // Otherwise play the video
            else if(scope.videoSrc !== "") {
                scope.showVideo = true;
                if(playing) {
                    video.pause();
                    video.currentTime = 0;
                    playing = false;
                }
                else {
                    video.play();
                    playing = true;
                }
            }
        };
        scope.bricks = [];
        // Setup on initial creation
        $timeout(function timeout() {
            pickLanguage();
            video = element.find('video')[0];
            getBricks();
        });

        function getBricks() {
            var i=1;
            while(i< 61) {
                var b = { src: 'views/content/img/samples/image0'+i+'.png' }
                scope.bricks.push(b);
                i++;
            }
        }
        /*
         function genBrick() {
         var height = ~~(Math.random() * 500) + 100;
         var id = ~~(Math.random() * 10000);
         return {
         src: 'http://lorempixel.com/g/280/' + height + '/?' + id
         };
         };
         scope.bricks = [
         genBrick(),
         genBrick(),
         genBrick(),
         genBrick(),
         genBrick()
         ];
         scope.add = function add() {
         scope.bricks.push(genBrick());
         };
         */
    };
    return {
        restrict: 'A',
        replace: true,
        scope:{
            posterSrc: '@',
            videoSrc: '@',
            gifSrc: '@',
            textClosed: '@',
            textOpen: '@',
            captionText: '@',
            icon: '@',
            forceIphoneVideo: '@'
        },
        link: linker,
        templateUrl: 'views/templates/sectionbox.html'
    };
}]);


/**
 * @ngdoc directive
 * @name readmore
 * @restrict A
 * @description
 * Add this attribute to make an element (use a div) containing 'read more' information.
 */
GDirectives.directive("readmore", ['$timeout', function($timeout) {
    var linker = function(scope, elem, attrs) {
        scope.slideId = attrs.id+'_slide';
        scope.detailActive = false;
        scope.addlowerborder = true;
        scope.iconRef = "views/icons/body/readmore/746-plus-circle@2x.svg";
        // Controls open and close of the sliding section in this directive
        scope.slideToggle = function() {
            var target = document.getElementById(scope.slideId);
            var aTarget = angular.element(target);
            var content = target.querySelector('.content-selector');
            var contentHeight = content.offsetHeight+'px';
            if(scope.detailActive) {
                scope.addlowerborder = true;
                scope.iconRef = "views/icons/body/readmore/746-plus-circle@2x.svg";
                aTarget.addClass('notransition');
                target.style.height = contentHeight;  // Set height from 'auto' back to 'px' before reducing to '0px'
                var rcontent = target.querySelector('.content-selector');  // These two step necessary to flush browser cache so that animation is not run
                var rcontentHeight = rcontent.offsetHeight;  // Accessing the offsetHeight flushes broswer cache
                aTarget.removeClass('notransition');
                $timeout(function () {
                    target.style.height = '0';
                }, 10);
            }
            else {
                scope.addlowerborder = true;
                scope.iconRef = "views/icons/body/readmore/746-minus-circle-modified@2x.svg";
                target.style.height = contentHeight;
                $timeout(function () {
                    aTarget.addClass('notransition');
                    target.style.height = 'auto';  // If a fixed height property is retained, any internal slidables will not expand within this slidable's section
                    var rcontent = target.querySelector('.content-selector');
                    var rcontentHeight = rcontent.offsetHeight;
                    aTarget.removeClass('notransition');
                }, 1100);
            }
            scope.detailActive = !scope.detailActive;
        };
    }
    return {
        templateUrl: 'views/templates/readmore.html',
        restrict: 'A',
        transclude : true,
        link: linker,
        scope : {
            title : '@'
        }
    }
}]);

GDirectives.directive("mosaic", ['$http', '$window', '$timeout', function($http, $window, $timeout) {
    var linker = function(scope, elem, attr) {
        scope.detailTile = null;
        var savedTileSpanRow;
        var savedTileSpanCol;
        scope.currentColumns = 1;
        scope.currentRows = 1;
/*
        $http({ method: 'GET', url: 'json/photos.json'})
            .then(function successCallback(response) {
                scope.tiles = response.data.mosaic;
            });
*/
        scope.tiles = buildGridModel({
            src : "views/content/img/samples/",
            title: "Test Title ",
            background: "",
            detail: false
        });

        // These values should compliment those column values in the mosaic template, to display detail images without whitespace
        function getCurrentTotalColumns() {
            var width = $window.innerWidth;
            if(width <= 600) { scope.currentColumns = 2; scope.currentRows = 4}
            else if(width <= 960) { scope.currentColumns = 4; scope.currentRows = 2}
            else if(width <= 1200) { scope.currentColumns = 6; scope.currentRows = 3}
            else { scope.currentColumns = 8; scope.currentRows = 4 }
        };

        // Automatically reset columns when window changes width.  Currently however, md-grid-list cannot be triggered by a new md-cols value!
        angular.element($window).bind('resize', function() {
            getCurrentTotalColumns();
            if(scope.detailTile !== null) {
                scope.detailTile.span.row = scope.currentRows;
                scope.detailTile.span.col = scope.currentColumns;
            }
            scope.$apply();
        });

        function buildGridModel(tileTmpl) {
            var it, results = [ ];

            for (var j=1; j<60; j++) {
                it = angular.extend({},tileTmpl);
                it.src  = it.src + 'image'+j;
                it.title = it.title + (j);
                it.span  = { row : 1, col : 1 };
                results.push(it);
            }
            return results;
        }

        scope.showDetail = function(tile) {
            if(scope.detailTile !== null) {
                scope.detailTile.span.row = savedTileSpanRow;
                scope.detailTile.span.col = savedTileSpanCol;
                scope.detailTile.detail = false;
            }
            scope.detailTile = tile;
            savedTileSpanRow = tile.span.row;
            savedTileSpanCol = tile.span.col;
            tile.span.row = scope.currentRows;
            tile.span.col = scope.currentColumns;
            $timeout(function() {
                scope.detailTile.detail = true;
            }, 500);
        };
        getCurrentTotalColumns();
    };
    return {
        templateUrl: 'views/templates/mosaic.html',
        restrict: 'A',
        transclude : true,
        link: linker
    }
}]);

/**
 * @ngdoc directive
 * @name quickquestion
 * @restrict A
 * @description
 * Add this attribute to make an element (use a div) containing 'did you know?' comment.
 * The answer will be shown after clicking anywhere in the box
 *  * question:   The question being asked
 *  * answer:   The answer to the question
 * <pre><div quickquestion question="Did you know?" answer="No I didn't!"></div></pre>
 */
GDirectives.directive("quickquestion", [function() {
    var linker = function(scope) {
        scope.answerState = false;
        scope.answer = function() {
            scope.answerState = !scope.answerState;
        };
    };
    return {
        templateUrl: 'views/templates/quickquestion.html',
        restrict: 'A',
        transclude : true,
        link: linker,
        scope : {
            gQuestion : '@',
            gAnswer : '@'
        }
    };
}]);

/**
 * @ngdoc directive
 * @name greybox
 * @restrict A
 * @description
 * Add this attribute to make 'grey box' element.
 *  * type:   The type of box to create: '' (no icon) 'warning', or 'funfact'
 * <pre><div greybox type='warning'> This is the grey box content </div></pre>
 */
GDirectives.directive("greybox", [function() {
    var linker = function(scope) {
        scope.icon = "";
        if(scope.type) {
            if (scope.type === 'funfact') {
                scope.icon = "views/icons/body/greybox/870-smile@2x.svg";
            }
            else if (scope.type === 'warning') {
                scope.icon = "views/icons/body/greybox/791-warning@2x.svg";
            }
            else if (scope.type === 'story') {
                scope.icon = "views/icons/body/greybox/961-book-32@2x.svg";
            }
            else if (scope.type === 'quote') {
                scope.icon = "views/icons/body/greybox/quotation.svg";
            }
        }
    };
    return {
        templateUrl: 'views/templates/greybox.html',
        link: linker,
        restrict: 'A',
        transclude : true,
        scope: {
            type: '@'
        }
    };
}]);

/**
 * @ngdoc directive
 * @name quotebox
 * @restrict A
 * @description
 * Add this attribute to make 'quote box' element.
 *  * h-type:   The type of box to create: 'quote' or 'story'
 * <pre><div quotebox type="story"> This is the grey box content </div></pre>
 */
GDirectives.directive("quotebox", [function() {
    return {
        templateUrl: 'views/templates/quotebox.html',
        restrict: 'A',
        transclude : true,
        scope: {
            type: '@'
        }
    };
}]);

/**
 * @ngdoc directive
 * @name link
 * @restrict A
 * @description
 * Add this attribute to improve on the '<a>' link element showing an external link icon.
 * <pre><link href="..."></link></pre>
 */
GDirectives.directive("glink", [function() {
   var linker = function (scope) {
        scope.ipath = 'views/icons/body/702-share.svg';
    };
    return {
        template: '<a class="glink" href="{{href}}" target="_blank"><ng-transclude></ng-transclude><ng-include src="ipath"></ng-include></a>',
        restrict: 'E',
        transclude : true,
        link : linker,
        scope : {
            href : '@'
        }
    };
}]);


/**
 * @ngdoc directive
 * @name quiz
 * @restrict E
 * @description
 * Add this element anywhere to create a quiz. Quiz questions are taken from database using the 'h-id'.
 *     * qid:        Must match the ID in the quiz database              ("id")
 *     * shuffle-questions:   Shuffle the questions each time quiz is taken   (true, false)
 *      <pre><quiz></quiz></pre>
 */
GDirectives.directive("quiz", ['$http', '$route', '$timeout', '$sce', function($http, $route, $timeout, $sce) {
    var linker = function(scope) {
        var quiz;
        scope.filePath = "";
        scope.showLoginButton = false;
        scope.showAlreadyPassedDownloadButton = false;
        scope.showLanguageSwitch = false;
        scope.inSecondLanguage = false;
        scope.incorrectAnswers = [];
        scope.quizpoll = {};

        // Initialise attribute variables
        if (typeof scope.hShuffleQuestions === "undefined") { scope.hShuffleQuestions = false; }

        scope.trustResource = function getTrustedHtml(resourceUrl) {
            return $sce.trustAsHtml(resourceUrl);
        };

        // The following functions represent a state machine controlling the quiz template using 'scope.state'

        scope.chooseLanguage = function(toggle) {
            scope.inSecondLanguage = toggle;
            scope.reload(true);
        };
        scope.reload = function() {        // Load quiz from JSON, set up data structures
            // Load data file
            $http({ method: 'GET', url: 'json/quizpolls.json'})
                .then(function successCallback(response) {
                    scope.quizpoll = response.data.quizpolls[scope.qid];
                    quiz = scope.quizpoll;
                    scope.state = "begin";
                    scope.type = "radio";
                    scope.totalPages = quiz.questions.length;
                    scope.radioTempData = { state : -1};                // Holds the index of the selected radio button
                    scope.title = quiz.title || "(placeholder title)";
                    scope.intro = quiz.intro;
                    scope.percentScore = 0;
                    scope.diploma_link = "";
                    scope.passPercent = 80;
                    scope.summarypass = quiz.summarypass;
                    scope.summaryfail = quiz.summaryfail;
                    scope.image_url = quiz.image_url;
                    scope.currentQuestion = {};
                    scope.data = { answers: [], student_id: '', score: 0 };
                    scope.filePath = "img/quiz/";
                });
        };
        scope.check = function(index) {         // Update UI elements after selection
            if(scope.state !== 'question') { return; }
            if(scope.currentQuestion.type === 'checkbox') {
                scope.currentData[index] = !scope.currentData[index];
                scope.resultDisabled = true;
                for(var j=0; j<scope.currentData.length; j++) {
                    if (scope.currentData[j]) { scope.resultDisabled = false; }
                }
            }
            else if(scope.currentQuestion.type === 'radio') {
                scope.radioTempData.state = index;
                for(var i=0; i<scope.currentData.length; i++ ) {
                    scope.currentData[i] = false;
                }
                scope.currentData[index] = true;
                scope.resultDisabled = false;
            }
            scope.answer();
        };
        scope.clickStart = function() {
            scope.start();
        };
        scope.start = function() {      // Set up data structure for answers
            scope.pageIndex = -1;
            scope.currentData = null;
            scope.responseStatus = "";
            scope.resultDisabled = true;
            scope.maxscore = 0;
            scope.data.score = 0;
            scope.data.answers = [];     // Create an array that stores answers for each question
            quiz.questions.forEach(function(q) {                        // Set up a 2D array to store answers for each question
                var answerPage = [].repeat(false, q.answers.length);
                scope.data.answers.push(answerPage);
                for(var j=0; j<q.answers.length;j++) {
                    if (q.answers[j].correct) { scope.maxscore++ ; }          // Total of the correct answers for this quiz
                }
            });
            scope.next();
        };
        scope.answer = function() {     // Accumulate the score
            if(scope.currentQuestion.type === "radio") {                                           // Radio on correct gains a mark. Radio on incorrect scores 0.
                if (scope.currentQuestion.answers[scope.radioTempData.state].correct) {
                    scope.data.score++;                                                         // Only one possible correct answer
                }
                else {
                    scope.incorrectAnswers.push(scope.currentQuestion.text);
                }
            }
            else if(scope.currentQuestion.type === "checkbox") {                                 // Checking an incorrect box loses a mark. Checking a correct box gains a mark. Not checking a correct or incorrect box does nothing.
                for(var j=0; j<scope.currentQuestion.answers.length;j++) {                      // Multiple possibly correct answers, convert to boolean before comparing
                    if(scope.currentQuestion.answers[j].correct && scope.currentData[j]) {
                        scope.data.score++;
                    }
                    else if(scope.currentQuestion.answers[j].correct === false && scope.currentData[j] === true) {
                        scope.data.score--;
                        scope.incorrectAnswers.push(scope.currentQuestion.text);
                    }
                    else {
                        scope.incorrectAnswers.push(scope.currentQuestion.text);
                    }
                }
            }
            var theScore = Math.floor(scope.data.score / scope.maxscore * 100);
            scope.percentScore = theScore < 0 ? 0 : theScore;

            $timeout(function() {           // Safari will not reliably update the DOM if not using $timeout
                scope.state = "result";
            }, 0);

        };

        scope.next = function() {       // Prepare for the next question
            scope.state = "question";
            scope.pageIndex++;
            scope.resultDisabled = true;
            scope.radioTempData.state = -1;
            if(scope.pageIndex === scope.totalPages) {
                scope.state = "end";
            }
            else {
                scope.currentData = scope.data.answers[scope.pageIndex];
                scope.currentQuestion = quiz.questions[scope.pageIndex];
                scope.type = scope.currentQuestion.type;
                scope.image_url = (scope.currentQuestion.image_url !== "") ? scope.filePath + scope.currentQuestion.image_url : "";
            }

        };
        scope.reload(false); // true = start test after loading
    };
    return {
        restrict: 'E',
        link: linker,
        templateUrl: 'views/templates/quiz-template.html',
        scope: {
            qid : '@'
        }
    };
}]);