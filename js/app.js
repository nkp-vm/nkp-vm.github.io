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
    TOP_LEVEL_MODULE_PATH : "views/m",
    ICON_PATH : "views/icons/",

    // Variables
    USE_ALT_VIDEO_SERVER : false,
    ALT_VIDEO_PATH : "",
    CROP_MIN_WIDTH : 1281,
    GIF_MAX_WIDTH : 768,
    MODULE_NAME_ARRAY : ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5', 'Module 6'],
    DICTIONARY_NAME : 'json/freetext_dictionary.json'
});

/* --------------  CONFIGURATION ---------------- */

// Routes are calculated from the module number and current language
GApp.config(['$routeProvider', function($routeProvider) {
    //module: module number e.g. '2'   lingo: language code e.g. 'en'    anchor:  optional id number of section e.g. '3'
    $routeProvider.when('/:module/:lingo/:anchor?', {
        templateUrl: function($routeParams) {
            return 'views/m'+$routeParams.module+'/m'+$routeParams.module+'.html';
        },
        controller: 'IndexCtrl'
    });
    $routeProvider.otherwise({redirectTo: '/1/no'});
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

// Angular Material themes can be configured with custom Palettes
GApp.config(['$mdThemingProvider', function($mdThemingProvider) {
    $mdThemingProvider.theme('main').primaryPalette('indigo');
    $mdThemingProvider.setDefaultTheme('main');
}]);

GApp.config(['$httpProvider', function($httpProvider) {
    //$httpProvider.defaults.useXDomain = true;
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
GApp.controller('IndexCtrl', ['$scope', '$translate', '$mdSidenav', '$location', '$routeParams', '$timeout', '$window', 'DataService', 'smoothScroll', 'CONSTANTS', function($scope, $translate, $mdSidenav, $location, $routeParams, $timeout, $window, DataService, smoothScroll, CONSTANTS) {
    $scope.modules = CONSTANTS.MODULE_NAME_ARRAY;
    $scope.currentLanguage = DataService.applicationVariable.currentLanguage;
    $scope.dymanicTheme = 'default';
    $scope.currentModule = "";
    $scope.searchWord = "";
    $scope.searchResults = [];
    $scope.uid = "";

    var menuIsOpen = false;
    var anchorToSeek = "";

    $scope.$on('$viewContentLoaded', function() {
        if(anchorToSeek !== "") {
            $timeout(function() {
                $scope.seekToAnchor(anchorToSeek);
            }, 500 );
        }
    });

    $scope.$on('$routeChangeSuccess', function(e, current) {
        $scope.closeMenu();
        $window.scrollTo(0,0);
        DataService.applicationVariable.currentModule = $scope.currentModule = current.params.module;
        if(current.params.anchor) {
            anchorToSeek = DataService.applicationVariable.anchorToSeek = 's' + current.params.anchor;
        }
        if(current.params.lingo !== $scope.currentLanguage) {
            $scope.changeLanguage(current.params.lingo);
        }

    });

    $scope.openMenu = function () {
        $mdSidenav('right').open();
        menuIsOpen = true;
    };
    $scope.closeMenu = function () {
        if(menuIsOpen) {
            $mdSidenav('right').close();
        }
        menuIsOpen = false;

        var topDiv = angular.element( document.querySelector( '#content' ) );
        if(typeof topDiv[0] !== 'undefined') {
            topDiv[0].focus();
        }
    };
    $scope.changeLanguage = function (lang) {
        if(typeof lang === 'undefined') {
            lang = 'en';
        }
        $scope.displayLanguage = $scope.currentLanguage = DataService.applicationVariable.currentLanguage = lang;
        $translate.use($scope.currentLanguage);
        $location.path($location.path().slice(0,-2)+$scope.currentLanguage);
    };
    $scope.playVideo = function (id) {
        var theVideo = angular.element('video')[id];
        if (theVideo.paused) {
            theVideo.play();
        }
        else {
            theVideo.pause();
        }
    };
    $scope.submit = function() {
        if ($scope.searchWord) {
            $scope.searchResults = DataService.getDictionaryValues($scope.searchWord.toLowerCase());
        }
    };
    $scope.seekToAnchor = function(elementId) {
        anchorToSeek = DataService.applicationVariable.anchorToSeek = "";
        var element = document.getElementById(elementId);
        smoothScroll(element, {duration: 700, easing: 'easeInQuad'});

        $timeout(function() {
            $scope.$broadcast('slideToggle', elementId);
        }, 1000);

    };
    $scope.seek = function(code) {
        if(code[0] && code[1] && code[2]) {
            $scope.closeMenu();
            if (DataService.applicationVariable.currentModule && DataService.applicationVariable.currentModule === code[1] && $scope.currentLanguage && $scope.currentLanguage === code[2]) {
                $scope.seekToAnchor('s' + code[0]);
            }
            else {
                $location.path('/' + code[1] + '/' + code[2] + '/' + code[0]);
            }
        }
    };
    $scope.orderItemByIdFunction = function(quizpoll){
        return parseInt(quizpoll.id);
    };
    $scope.orderItemByKandidatnrFunction = function(c){
        return parseInt(c.candidate_number);
    };

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
    var dictionary;

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

    // Request the search dictionary object
    $http.get(CONSTANTS.DICTIONARY_NAME)
        .then(function(res){
            dictionary = res.data;
        });

    return {
        serverRequest : serverRequest,
        getDictionary : function getDictionary() { return dictionary; },
        getDictionaryKeys : function getDictionaryKeys() { return Object.keys(dictionary); },
        getDictionaryValues : function getDictionaryValues(key) {
            return dictionary[key];
        },
        shuffle : shuffle,
        applicationVariable : applicationVariable
    };
}]);
