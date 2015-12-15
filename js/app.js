"use strict";

// Creates a new array, 'L' long filled with 'what'
/*jshint strict: true */
Array.prototype.repeat= function(what, L){
    while(L) {
        this[--L] = what;
        return this;
    }
};


/**
 * @ngdoc overview
 * @name hms
 * @description
 * Main app module.
 */
var GApp = angular.module("GApp", [
    'ngRoute',
    'ngAnimate',
    'ngAria',
    'ngMaterial',
    'ngSanitize',
    'pascalprecht.translate',
    'ngCookies',
    'smoothScroll',
    'ng.deviceDetector',
    'GDirectives'
]);

/* --------------  CONSTANTS ---------------- */

GApp.constant("CONSTANTS", {

    // Paths
    TOP_LEVEL_MODULE_PATH : "views/content/",
    ICON_PATH : "views/icons/",

    // Variables
    CROP_MIN_WIDTH : 1281,
    GIF_MAX_WIDTH : 768,
    MODULE_NAME_ARRAY : ['intro', 'context', 'timeline', 'collection', 'provenance', 'process', 'about'],
    TIMELINE_ITEMS : 25,
    TIMELINE_SCALE: 4
});


/* --------------  SERVICES ---------------- */

GApp.factory('NavListing', ['CONSTANTS', function(CONSTANTS) {
    var navList = [];

    var timelineStart = 0;
    var timeList = [];
    var timelineActive = false;
    // Set up the initial array by the preset menu items
    for(var c = 0; c < CONSTANTS.MODULE_NAME_ARRAY.length; c++) {
        navList.push({_id: CONSTANTS.MODULE_NAME_ARRAY[c], active: false, offset: 0, presenterHeight: 0});
    }
    navList[0].active = true;
    for(var d = 0; d < CONSTANTS.TIMELINE_ITEMS; d++) {
        timeList.push({text: "", active: false, hover_active: false, offset: 0, height: 0, x: 0});
    }

    return {
        // Modify an offset on an existing menu item
        setNavItem : function(item) {
            var i = CONSTANTS.MODULE_NAME_ARRAY.indexOf(item._id);
            if(i > -1) {
                // Set offset for the top of this section
                navList[i].offset = item.offset;
            }
            if(item._id === 'timeline') {
                timelineStart = navList[CONSTANTS.MODULE_NAME_ARRAY.indexOf(item._id)].offset + item.presenterHeight;
            }
        },
        setTimeItem : function(index, item) {
            timeList[index-1].offset = item.offset + timelineStart - 200;
            timeList[index-1].text = item.text;
            timeList[index-1].height = item.height;
            timeList[index-1].x = item.x;
            timeList[index-1]._id = item._id;
        },
        navList : navList,
        timeList : timeList,
        timelineActive : timelineActive
    }
}]);

/* --------------  CONFIGURATION ---------------- */

// Routes are calculated from the module number and current language
GApp.config(['$routeProvider', function($routeProvider) {
    //section: section name e.g. 'about'   language: language code e.g. 'en'    anchor:  optional id of section e.g. 'archival_process'
    $routeProvider.
    when('/overview/:language', {
        templateUrl: function($routeParams) {
            if($routeParams.language === 'no' || $routeParams.language === 'cs') {
                return 'views/content/' + $routeParams.language + '/overview.html';
            }
            else {
                return 'views/content/en/overview.html';
            }
        },
        controller: 'IndexCtrl'
    }).
    otherwise({
        redirectTo: '/overview/en'
    });
}]);

GApp.config(['$mdGestureProvider', function( $mdGestureProvider ) {
    $mdGestureProvider.skipClickHijack();
}]);

/**
 *
 * @description
 * Sets the translation engine.
 * Language files (in JSON format) are loaded from the languages folder. A language key is common to all language files and is translated based on $translate.use
 * In HTML, translation is obtained by using {{'KEY' | translate}}, where 'KEY' corresponds to a language key defined in the JSON files.
 *
 **/
GApp.config(['$translateProvider', function($translateProvider) {
    $translateProvider.useSanitizeValueStrategy('sanitizeParameters');
    $translateProvider.useLocalStorage();
    $translateProvider.useStaticFilesLoader({
        prefix: 'json/languages/',
        suffix: '.json'
    });
    $translateProvider.preferredLanguage('no');
}]);
/*
GApp.config(['$anchorScrollProvider', function($anchorScrollProvider) {
    $anchorScrollProvider.disableAutoScrolling();
}]);
*/
GApp.config(['$locationProvider', function($locationProvider) {
    //$locationProvider.html5Mode(true);
    //$locationProvider.hashPrefix('!');
  /*  $locationProvider.html5Mode({
        enabled : true,
        requireBase: false,
        rewriteLinks : false
    });
    */
}]);


// Angular Material themes can be configured with custom Palettes
GApp.config(function($mdThemingProvider) {
    $mdThemingProvider.definePalette('amazingPaletteName', {
        '50': 'ffebee',
        '100': 'ffcdd2',
        '200': 'ef9a9a',
        '300': 'e57373',
        '400': 'ef5350',
        '500': 'f44336',
        '600': 'e53935',
        '700': 'd32f2f',
        '800': 'c62828',
        '900': 'b71c1c',
        'A100': 'ff8a80',
        'A200': 'ff5252',
        'A400': 'ff1744',
        'A700': 'd50000',
        'contrastDefaultColor': 'light',    // whether, by default, text (contrast)
                                            // on this palette should be dark or light
        'contrastDarkColors': ['50', '100', //hues which contrast should be 'dark' by default
            '200', '300', '400', 'A100'],
        'contrastLightColors': undefined    // could also specify this if default was 'dark'
    });
    $mdThemingProvider.theme('default').primaryPalette('amazingPaletteName')
});


GApp.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.withCredentials = false;
    $httpProvider.defaults.headers.common.Accept = "application/json";
    $httpProvider.defaults.headers.common["Content-Type"] = "application/json";
}]);

/* --------------  CONTROLLERS ---------------- */

/**
 * @ngdoc object
 * @name hms.IndexCtrl
 * @requires  $scope
 * @description
 * Controller for basic site functionality. Takes care of common functions such as menu and language switching.
 */
GApp.controller('IndexCtrl', ['$scope', '$translate', '$mdSidenav', '$location', '$document', '$routeParams', '$timeout', '$window', 'smoothScroll', 'DataService', 'CONSTANTS', '$mdToast', '$cookies', 'NavListing', function($scope, $translate, $mdSidenav, $location, $document, $routeParams, $timeout, $window, smoothScroll, DataService, CONSTANTS, $mdToast, $cookies, NavListing) {
    $scope.modules = CONSTANTS.MODULE_NAME_ARRAY;
    $scope.currentLanguage = 'en';
    $scope.dymanicTheme = 'default';
    $scope.currentModule = "";
    var scrollPosition = 0;

    // Open and close menu can be chained to with '.then(function(){})'
    $scope.openMenu = function () {
        return $mdSidenav('right').open();
    };
    $scope.closeMenu = function () {
        return $mdSidenav('right').close();
    };
    $scope.changeLanguage = function (lang) {
        if(typeof lang === 'undefined') {
            lang = 'en';
        }
        $scope.displayLanguage = $scope.currentLanguage = DataService.applicationVariable.currentLanguage = lang;
        $translate.use($scope.currentLanguage);
        $location.path('/overview/'+$scope.currentLanguage);
    };
    $scope.seekToAnchor = function(elementId) {
        if(elementId === '') {
            elementId = 'content';  // Scroll to top
        }
        $scope.closeMenu().then(function() {
            var sElement = document.getElementById(elementId);
            smoothScroll(sElement, {duration: 500});
        });
    };

    $translate.use($routeParams.language);


    //detect whether client uses Chrome or Firefox, and display a gentle message if not
    /*var userAgent = $window.navigator.userAgent;
    var userAgentViewed = $cookies.get('userAgentViewed');

    if(userAgent.indexOf('Chrome') == -1 && userAgent.indexOf('Firefox') == -1 && userAgent.indexOf('Opera') == -1) {
        if(userAgentViewed !== "true") {
            var toast = $mdToast.simple()
                .content('This site is best viewed on Chrome, Firefox or Opera. You are currently using a different browser.')
                .action('OK')
                .hideDelay(false)
                .highlightAction(false);
            $mdToast.show(toast).then(function(response) {
                if ( response === 'ok' ) {
                    $cookies.put('userAgentViewed', true);
                }
            });
        }
    }*/


}]);

/* --------------  SERVICES ---------------- */

/**
 * @ngdoc interface
 * @name hms.DataService
 * @requires  $http
 * @description
 * Provide access to queries for Quiz and Poll. Provide dictionary file for site searching. Shuffle arrays.
 */
GApp.service('DataService', ['$http', 'CONSTANTS', function($http, CONSTANTS) {

    var applicationVariable = {
        currentModule : "1",
        currentLanguage : "no",
        anchorToSeek : ""
    };

    // Takes an array and returns a shuffled version of it
    var shuffle = function (array) {
        var currentIndex = array.length;
        var temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    };

    // General function to make a request for a resource
    var serverRequest = function(action, data, destination) {
        return $http({
            method: "post",
            url: destination,
            data: {
                action: action,
                data: data
            },
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        });
    };

    return {
        serverRequest : serverRequest,
        shuffle : shuffle,
        applicationVariable : applicationVariable
    };
}]);
