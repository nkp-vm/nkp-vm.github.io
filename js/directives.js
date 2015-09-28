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
 * @name video
 * @restrict E
 * @description
 * Add this element anywhere to create a Video / GIF player. Source material is taken from the current module route's corresponding 'img' subfolder
 *     * sid:       Must match the ID of the connected folding information panel
 *     * text:     Overlay text
 *     * icon:     Overlay icon
 *     * poster:   Static image displayed before click activates the video / GIF
 *     * videosrc: Name of the MP4 file (encapsulating H264) to play
 *     * gifsrc:   Name of the GIF file to play (mobile / small screen only)
 *     * force-iphone-video:  Set to force video play (rather than GIF) on iPhone's small screen   (true, false)
 *      <pre>
 *          <hmsvideo sid="s1" text="1. Ute i felt" icon="hart.png" poster="4.3.jpg"
 *          videosrc="4.3.mp4" gifsrc=""></hmsvideo>
 *      </pre>
 */
GDirectives.directive("gVideo", ['$window', '$document', '$route', '$sce', '$timeout', 'smoothScroll', 'HMS_CONSTANTS', function($window, $document, $route, $sce, $timeout, smoothScroll, HMS_CONSTANTS){
    var linker = function(scope, element) {
        var moduleNumber = $route.current.params.module;
        scope.moduleColour = HMS_CONSTANTS.moduleColours[moduleNumber];
        //scope.forceVideo = scope.hVideosrc;
        scope.showVideo = false;
        var filePath = "";
        scope.noPreloadGifSrc = filePath + scope.poster;
        scope.backgroundImageSrc = "url("+(filePath + scope.poster)+")";
        scope.backgroundImageHeightSwitch = false;
        scope.overlayIconSrc = HMS_CONSTANTS.ICON_PATH + scope.icon;
        scope.videoSrc = "";
        scope.overlayText = "";
        var video;
        var notPlayed = true;
        var playing = false;

        if (typeof scope.videosrc === "undefined") { scope.videosrc = ""; }

        filePath = (HMS_CONSTANTS.USE_ALT_VIDEO_SERVER ? HMS_CONSTANTS.ALT_VIDEO_PATH : HMS_CONSTANTS.TOP_LEVEL_MODULE_PATH) + moduleNumber + '/img/';
        scope.videoSrc = filePath + scope.videosrc;
        scope.noPreloadGifSrc = filePath + scope.poster;
        scope.backgroundImageSrc = "url("+(filePath + scope.poster)+")";

        scope.$on('$routeChangeSuccess', function() {
            scope.videoPath = HMS_CONSTANTS.TOP_LEVEL_MODULE_PATH + moduleNumber + '/img/';
            scope.noPreloadGifSrc = filePath + scope.poster;
            scope.backgroundImageSrc = "url("+(filePath + scope.poster)+")";
            pickLanguage();
        });

        var pickLanguage = function() {
            if($route.current.params.lingo === "no") {
                scope.overlayText = scope.textNo;
            }
            else {
                scope.overlayText = scope.textEn;
            }
        };

        var endListener = function() {
            playing = false;
            notPlayed = true;
            video.pause();
            video.removeEventListener('ended', endListener);
            //$document.exitFullscreen();
        };

        scope.trustResource = function trustResource(resourceUrl) {
            return $sce.trustAsResourceUrl(resourceUrl);
        };

        // Play the video on click
        scope.play = function() {
            if($window.innerWidth >= HMS_CONSTANTS.CROP_MIN_WIDTH) {
                scope.backgroundImageHeightSwitch = true;
            }
            if(notPlayed) {
                $timeout(function () {
                    smoothScroll(element[0], {duration: 500});
                    scope.$broadcast('slideToggle', scope.sid);
                }, 100);
            }
            if(scope.gifsrc !== "" && scope.forceIphoneVideo === "false" && $window.innerWidth < HMS_CONSTANTS.GIF_MAX_WIDTH) {
                scope.noPreloadGifSrc = filePath + scope.gifsrc;
            }
            else if(scope.videosrc !== "") {
                scope.showVideo = true;
                if(playing) {
                    video.pause();
                    playing = false;
                }
                else {
                    if (notPlayed) {
                        video.addEventListener('ended', endListener);
                        video.currentTime = 0;
                    }
                    video.play();

                    notPlayed = false;
                    playing = true;
                }
            }
        };

        $timeout(function timeout() {
            pickLanguage();
            video = element.find('video')[0];
        });
    };
    return {
        restrict: 'E',
        replace: true,
        scope:{
            poster: '@',
            videosrc: '@',
            altVideosrc: '@',
            gifsrc: '@',
            sid: '@',
            module: '@',
            textNo: '@',
            textEn: '@',
            icon: '@',
            forceIphoneVideo: '@',
            broadcast: '&'
        },
        link: linker,
        templateUrl: 'views/templates/gvideo.html'
    };
}]);

/**
 * @ngdoc directive
 * @name hms.readmore
 * @restrict A
 * @description
 * Add this attribute to make an element (use a div) containing 'read more' information.
 * Any HTML placed inside as children will be hidden until "Read More.." is clicked
 *  * rid:   Must be a unique ID
 *  * type:   'readmore' or 'task'
 *  * title:   Title of the box
 * <pre><div readmore rid="rm1" title="This is my title" type="readmore"></div></pre>
 */
GDirectives.directive("readmore", ['$timeout', function($timeout) {
    var linker = function(scope) {
        var openState = false;
        var iconClosed;
        var iconOpened;
        scope.addlowerborder = true;
        if (scope.type && scope.type === 'task') {
            iconClosed = iconOpened = "views/icons/widgets/oppgave/704-compose@2x.svg";
        }
        else {
            iconOpened = "views/icons/body/readmore/remove.svg";
            iconClosed = "views/icons/body/readmore/readmore.svg";
        }
        scope.readmoreImageSrc = iconClosed;

        scope.toggleIcon = function () {
            $timeout(function () {
                openState = !openState;
                if (openState) {
                    scope.readmoreImageSrc = iconOpened;
                    scope.addlowerborder = false;
                }
                else {
                    scope.readmoreImageSrc = iconClosed;
                    scope.addlowerborder = true;
                }
            }, 1000);
        };
    };
    return {
        templateUrl: 'views/templates/readmore.html',
        restrict: 'A',
        transclude : true,
        link: linker,
        scope : {
            rid : '@',
            title : '@',
            type : '@'
        }
    };
}]);

/**
 * @ngdoc directive
 * @name hms.quickquestion
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
 * @name moduletitle
 * @restrict E
 * @description
 * Add this attribute to define the module quote and subtitle in each language.
 * <pre>
 *      <moduletitle module-no="// 3. Lab-sikkerhet" module-en="// 3. Lab safety"
 *      quote-no="Vann i syre blir uhyre, syre i vann går an" quote-en="Water in acid
 *      is dangerous, acid in water is better"></moduletitle>
 * </pre>
 */
GDirectives.directive("moduletitle", ['$route', function($route) {
    var linker = function (scope) {
        if($route.current.params.lingo === "en") {
            scope.module = scope.hModuleEn;
            scope.quote = scope.hQuoteEn;
        }
        else {
            scope.module = scope.hModuleNo;
            scope.quote = scope.hQuoteNo;            }
    };
    return {
        template: '<div><div class="topQuoteMarks" aria-hidden="true"><span>“</span></div><div class="topQuoteText"><span class="topQuote">{{quote}}</span><p class="topSubtitle">{{module}}</p></div></div>',
        restrict: 'E',
        link: linker,
        scope : {
            hModuleNo: '@',
            hQuoteNo: '@',
            hModuleEn: '@',
            hQuoteEn: '@'
        }
    };
}]);

/**
 * @ngdoc directive
 * @name hmssection
 * @restrict A
 * @description
 * Add this attribute to define sublevel content. The content will be loaded from corresponding 'sx.html' file
 * id: sX matching the sX.html file
 * <pre><section hmssection id='sX'></section></pre>
 */
GDirectives.directive("hmssection", ['$route', 'HMS_CONSTANTS', function($route, HMS_CONSTANTS) {
    return {
        templateUrl: function(element, attrs) {
            var loc = HMS_CONSTANTS.TOP_LEVEL_MODULE_PATH + $route.current.params.module +'/sub/'+attrs.id+'_'+$route.current.params.lingo+'.html' || '/defaultContent.html';
            return loc;
        },
        restrict: 'A',
        scope : {
            id : '@'
        }
    };
}]);

/**
 * @ngdoc directive
 * @name poll
 * @restrict E
 * @description
 * Poll questions taken from poll.json located at root level
 *  * pid:       Must match the ID in the quiz data      ("id")
 * <pre><poll h-id="pollID1" h-feedback="true"></poll></pre>
 */
GDirectives.directive("poll", ['$http', '$route', 'DataService', 'HMS_CONSTANTS', function($http, $route, DataService, HMS_CONSTANTS) {
    var linker = function (scope) {
        var poll;
        var filePath;
        var moduleNumber;
        scope.chartData = "";
        scope.radioTempData = { state : -1};
        var requestData = {
            quizpoll_id: scope.hId,
            ids: []
        };

        scope.reload = function(startQuiz) {
            requestData.quizpoll_id = scope.hId;
            requestData.ids = [];
            DataService.serverRequest('getQuizPoll', requestData, HMS_CONSTANTS.QUIZPOLL_SS_PG_ABSOLUTE)
                .success(function(data) {
                    poll = data.data;
                    moduleNumber = $route.current.params.module;
                    scope.radioTempData = { state : -1};                // Holds the index of the selected radio button
                    scope.title = poll.title || "(placeholder title)";
                    scope.intro = poll.intro;
                    scope.summarypass = poll.summarypass;
                    scope.summaryfail = poll.summaryfail;
                    scope.image_url = poll.image_url;
                    scope.answers = [];
                    scope.currentQuestion = poll.questions[0];
                    scope.currentQuestion.answers.forEach(function(a) {
                        var newanswer = { aid: a.id, checked: false };
                        scope.answers.push(newanswer);
                    });
                    filePath = HMS_CONSTANTS.QUIZ_IMAGE_PATH;
                    scope.image_url = (scope.currentQuestion.image_url !== "") ? filePath + scope.currentQuestion.image_url : "";
                    if(startQuiz) {
                        scope.start();
                    }
                });

        };

        scope.check = function(index) {                                       // Update UI after selection
            scope.radioTempData.state = index;
            if(scope.currentQuestion.type === 'checkbox') {
                scope.answers[index].checked = !scope.answers[index].checked;
            }
            else if(scope.currentQuestion.type === 'radio') {
                for(var i=0; i<scope.currentQuestion.answers.length; i++ ) {
                    scope.answers[i].checked = false;
                }
                scope.answers[index].checked = true;
            }
        };

        scope.next = function() {
            scope.pieData = [];
            var totalTally = 0;
            scope.currentQuestion.answers.forEach(function(a, i){
                totalTally += a.tally + (scope.answers[i].checked ? 1 : 0);
            });
            scope.currentQuestion.answers.forEach(function(a, i) {
                var newValue = (scope.answers[i].checked ? 1 : 0) + a.tally;
                scope.chartData += newValue + ',';
                scope.pieData.push((newValue * 100 / totalTally).toFixed(2));
                if(scope.answers[i].checked) {
                    requestData.ids.push(a.id);
                }
            });
            scope.chartData = scope.chartData.substring(0, scope.chartData.length-1);  // otherwise the last item is empty string when array is split again

            DataService.serverRequest('incrementTally', requestData, HMS_CONSTANTS.QUIZPOLL_SS_PG_ABSOLUTE)
                .success(function() {
                    scope.state = "result";
                });
            scope.state = "result";

            var topDiv = angular.element( document.querySelector( '#poll-'+scope.hId ) );
            topDiv[0].focus();
        };

        scope.start = function() {
            scope.state = "question";
        };
        scope.reload(true);

    };
    return {
        restrict: 'E',
        scope: {
            hId: '=',
            hFeedback : '@'
        },
        link: linker,
        templateUrl: 'views/templates/poll.html'
    };
}])

    .directive('bars', function () {
        /*global d3:false */
        return {
            restrict: 'E',
            replace: true,
            link: function (scope, element, attrs) {
                scope.index = attrs.index;
                function dataTotal(data) {
                    var total = 0;
                    data.forEach(function(d) {
                        total += parseInt(d);
                    });
                    return total;
                }
                var data = attrs.data.split(','),
                    total = attrs.total || dataTotal(data);
                    d3.select(element[0])
                        .append("div").attr("class", "chart")
                        .selectAll('div')
                        .data(data).enter()
                        .append("div")
                        .transition().ease("elastic")
                        .style("width", function(d) {
                            return d*100/total + "%";
                        })
                        .text(function(d) {
                            if(d !== '0') { return d +'%'; }
                            else { return ''; }
                        });
            }
        };
    });


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