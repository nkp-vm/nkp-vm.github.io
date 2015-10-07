/* --------------  DIRECTIVES ---------------- */
"use strict";
var GDirectives = angular.module('GDirectives', []);

/**
 * @ngdoc directive
 * @name hms.slidable
 * @restrict C
 * @description
 * Creates a div element capable of sliding open and closed
 */
GDirectives.directive('slideable', function () {
    return {
        restrict:'C',
        compile: function (element) {
            // wrap tag
            var contents = element.html();
            element.html('<div class="slideable_content" style="margin:0 !important; padding:0 !important">' + contents + '</div>');

            return function postLink(scope, element, attrs) {
                // default properties
                attrs.duration = (typeof attrs.duration === "undefined") ? '1s' : attrs.duration;
                attrs.easing = (typeof attrs.easing === "undefined") ? 'ease-in-out' : attrs.easing;
                attrs.delay = (typeof attrs.delay === "undefined") ? '1s' : attrs.delay;
                //element.addClass("section_content_closed");
                element.css({
                    'overflow': 'hidden',
                    'height': '0px',
                    'padding': '0',
                    'transitionProperty': 'height, padding',
                    'transitionDuration': attrs.duration,
                    'transitionTimingFunction': attrs.easing,
                    'transitionDelay': attrs.delay
                });
            };
        }
    };
});

/**
 * @ngdoc directive
 * @name hms.sliderToggle
 * @restrict A
 * @description
 * Listens for a click on this element to activate a slidable element.
 */
GDirectives.directive('sliderToggle', ['$timeout', '$window', function($timeout, $window) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            attrs.expanded = false;
            var target, content;
            var prevent_close = attrs.preventClose === "true";
            var section_detail_area = attrs.sectionDetailArea === "true";

            function slide() {
                if (!target) { target = document.querySelector(attrs.sliderToggle); }
                if (!content) { content = target.querySelector('.slideable_content'); }
                var elem = angular.element(target);
                if(!attrs.expanded) {
                    var y = content.clientHeight;
                    target.style.height = y + 'px';
                    target.style.padding = '10px 0';
                    if(section_detail_area) {
                        //var x = content.clientWidth;
                        var x = $window.innerWidth;
                        if(x >= 1280) {
                            target.style.padding = '50px 43% 50px 7%';
                        }
                        else if(x >= 1024) {
                            target.style.padding = '50px 30% 50px 7%';
                        }
                        else if(x >= 768) {
                            target.style.padding = '50px 15% 50px 7%';
                        }
                        else if(x >= 480) {
                            target.style.padding = '50px 5% 50px 5%';
                        }
                        else if(x >= 320) {
                            target.style.padding = '50px 7% 50px 7%';
                        }
                        $timeout(function () {
                            target.style.height = '100%';  // If height property is retained, any internal slidables will not expand this slidable's section
                            target.style.padding = null;
                            elem.addClass("sectionDetail_open");
                        }, 2000);
                    }
                }
                else if(!prevent_close) {
                    if(section_detail_area) {
                        elem.removeClass("sectionDetail_open");
                    }
                    target.style.height = '0px';
                    target.style.padding = '0';
                }
                attrs.expanded = !attrs.expanded;
            }

            if(attrs.clickToActivate === "true") {
                element.off("click").bind('click', slide);
            }
            // Slide a specific element ID called by broadcast event
            scope.$on('slideToggle', function(event, slideId) {
                if(slideId === attrs.sid) {
                    slide();
                }
            });
        }
    };
}]);

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

            if(scope.detailActive) {
                aTarget.addClass('notransition');
                target.style.height = contentHeight;  // Set height from 'auto' back to 'px' before reducing to '0px'
                var rcontent = target.querySelector('.content-selector');  // These two step necessary to flush browser cache so that animation is not run
                var rcontentHeight = rcontent.offsetHeight;  // Accessing the offsetHeight flushes broswer cache.  http://stackoverflow.com/questions/11131875/what-is-the-cleanest-way-to-disable-css-transition-effects-temporarily
                aTarget.removeClass('notransition');

                $timeout(function () {
                    target.style.height = '0';
                    if(scope.videoSrc !== "") {
                        video.style.height = '0';   // Video height interferes with slide closed - must set it's height also..
                    }
                }, 10);
            }
            else {
                if(scope.videoSrc !== "") {
                    video.style.height = 'auto';
                }
                target.style.height = contentHeight;
                $timeout(function () {
                    aTarget.addClass('notransition');
                    target.style.height = 'auto';  // If a fixed height property is retained, any internal slidables will not expand within this slidable's section
                    var rcontent = target.querySelector('.content-selector');
                    var rcontentHeight = rcontent.offsetHeight;
                    aTarget.removeClass('notransition');
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
                scope.noPreloadGifSrcPath = imagePath + scope.gifSrc;
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
            icon: '@',
            forceIphoneVideo: '@'
        },
        link: linker,
        templateUrl: 'views/templates/sectionbox.html'
    };
}]);


GDirectives.directive("myMasonry", function($parse, $timeout) {
    return {
        restrict: 'AC',
        link: function (scope, elem, attrs) {
            elem.masonry({ itemSelector: '.my-masonry-brick'});
            // Opitonal Params, delimited in class name like:
            // class="masonry:70;"
            //elem.masonry({ itemSelector: '.masonry-item', columnWidth: 140, gutterWidth: $parse(attrs.masonry)(scope) });
        },
        controller : function($scope,$element){
            var bricks = [];
            this.appendBrick = function(child, brickId, waitForImage){
                function addBrick() {
                    $element.masonry('appended', child, true);

                    // If we don't have any bricks then we're going to want to
                    // resize when we add one.
                    if (bricks.length === 0) {
                        // Timeout here to allow for a potential
                        // masonary timeout when appending (when animating
                        // from the bottom)
                        $timeout(function(){
                            $element.masonry('resize');
                        }, 2);
                    }

                    // Store the brick id
                    var index = bricks.indexOf(brickId);
                    if (index === -1) {
                        bricks.push(brickId);
                    }
                }

                if (waitForImage) {
                    child.imagesLoaded(addBrick);
                } else {
                    addBrick();
                }
            };

            // Removed bricks - we only want to call masonry.reload() once
            // if a whole batch of bricks have been removed though so push this
            // async.
            var willReload = false;
            function hasRemovedBrick() {
                if (!willReload) {
                    willReload = true;
                    $scope.$evalAsync(function(){
                        willReload = false;
                        $element.masonry("reload");
                    });
                }
            }

            this.removeBrick = function(brickId){
                hasRemovedBrick();
                var index = bricks.indexOf(brickId);
                if (index != -1) {
                    bricks.splice(index,1);
                }
            };

            this.reloadBricks = function() {
                $element.masonry('resize');
            }
        }
    };
})
    .directive('myMasonryBrick', function ($compile) {
        return {
            restrict: 'AC',
            require : '^my-masonry',
            link: function (scope, elem, attrs, MasonryCtrl) {

                elem.imagesLoaded(function () {
                    MasonryCtrl.appendBrick(elem, scope.$id, true);
                    MasonryCtrl.reloadBricks();
                });

                scope.$on("$destroy",function(){
                    MasonryCtrl.removeBrick(scope.$id);
                });
            }
        };
    });


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
                scope.addlowerborder = false;
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

GDirectives.directive("mosaic", ['$http', function($http) {
    var linker = function(scope, elem, attr) {
        scope.photos = [];
        scope.showingDetail = false;
        $http({ method: 'GET', url: 'json/photos.json'})
            .then(function successCallback(response) {
                scope.photos = response.data.mosaic;
            })
        scope.showDetail = function(card) {
            scope.showingDetail = true;
            scope.detailCard = card;
        };
        scope.hideDetail = function() {
            scope.showingDetail = false;
        };
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
 * @name hms.greybox
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