'use strict';

/**
 * @ngdoc overview
 * @name exportApp
 * @description
 * # exportApp
 *
 * Main module of the application.
 */
angular
  .module('exportApp', [
    'ngAnimate',
    'ngCookies',
    'ngMessages',
    'ngSanitize',
    'ngTouch',
    'ui.router',
    'ui.router.title',
    'smart-table',
    'uiGmapgoogle-maps',
    'ngFileUpload',

    'genericServices',
    'conferenceDirectives',
    'config',

    'user',
    'admin'
  ])
  // .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
  .config(['$stateProvider', '$urlRouterProvider', 'uiGmapGoogleMapApiProvider',
    function ($stateProvider, $urlRouterProvider, uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
      key: 'AIzaSyCTXMd0kGPwANDXeUPXQSdLS-C9dWbkJC0',
      v: '3.17',
      // libraries: 'weather,geometry,visualization'
    });
    // $locationProvider.html5Mode(true)
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'views/main.html',
        controller: 'MainCtrl as main',
        resolve: {
          $title: function () { return 'Home'; },
          speakers: ['dataService', function (dataService) {
            return dataService.getClassName('Speaker');
          }] ,
          partners: ['dataService', function (dataService) {
            return dataService.getClassName('Sponsor');
          }],
          streams: ['dataService', function (dataService) {
            return dataService.getClassName('Stream', 'order');
          }]
        }
      })
      .state('speakers', {
        url: '/speakers',
        controller: 'SpeakerController as main',
        templateUrl: 'views/speakers.html',
        resolve: {
          $title: function () { return 'Home'; },
          speakers: ['dataService', function (dataService) {
            return dataService.getClassName('Speaker');
          }]
        }
      })
      .state('partners', {
        url: '/partners',
        controller: 'PartnerController as main',
        templateUrl: 'views/partners.html',
        resolve: {
          $title: function () { return 'Partners'; },
          partners: ['dataService', function (dataService) {
            return dataService.getClassName('Sponsor');
          }]
        }
      })

      .state('venue', {
        url: '/venue',
        controller: 'VenueController as main',
        templateUrl: 'views/venue.html',
        resolve: {
          $title: function () { return 'Venue'; },
        }
      })
      .state('contact', {
        url: '/contact',
        controller: 'ContactController as contact',
        templateUrl: 'views/contact.html',
        resolve: {
          $title: function () { return 'Contact Us'; },
        }
      })
      .state('terms', {
        url: '/terms',
        templateUrl: 'views/terms.html',
        resolve: {
          $title: function () { return 'Terms and Conditions'; },
        }
      })
      .state('anti-harassment-policy', {
        url: '/anti-harassment-policy',
        templateUrl: 'views/anti-harassment.html',
        resolve: {
          $title: function () { return 'Anti-Harassment Policy'; },
        }
      })
      .state('faq', {
        url: '/faq',
        templateUrl: 'views/faq.html',
        resolve: {
          $title: function () { return 'FAQ'; },
        }
      })
      .state('media', {
        url: '/media',
        controller: 'MediaController as media',
        templateUrl: 'views/media.html',
        resolve: {
          $title: function () { return 'Media'; },
        }
      })

      // TODO
      .state('speaker', {
        url: '/speaker/:id',
        templateUrl: 'views/speaker.html'
      })
      // TODO - do we have a separate page for each partner?
      .state('partner', {
        url: '/partner/:id',
        controller: 'PartnerController as main',
        templateUrl: 'views/partner.html'
      })
      // TODO: Agenda
      .state('agenda', {
        url: '/agenda',
        templateUrl: 'views/agenda.html'
      })
      // TODO Probably have a separate blog
      .state('blog', {
        url: '/blog',
        templateUrl: 'views/blog.html',
        resolve: {
          $title: function () { return 'Blog'; },
        }
      })
      .state('article', {
        url: '/blog/:id',
        templateUrl: 'views/article.html'
      })
      ;

      // For any unmatched url, redirect to /
      $urlRouterProvider.otherwise('/');
  }])

  .run(['$rootScope', '$state', '$stateParams', 'userService',
    function($rootScope, $state, $stateParams, userService) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;


    // check for correct priviledges
    $rootScope.$on('$stateChangeStart', function(event, toState, toStateParams) {
      // track the state the user wants to go to; authorization service needs this
      $rootScope.toState = toState;
      $rootScope.toStateParams = toStateParams;
      // if the principal is resolved, do an authorization check immediately. otherwise,
      // it'll be done when the state it resolved.

      userService.authorize(event);
    });
  }])
  .controller('AppCtrl', ['$window', '$scope', function ($window, $scope) {
     this.navClass = 'top';
     var self = this;
     angular.element($window).bind('scroll', function() {
       if(window.pageYOffset >= 100) {
         self.navClass = 'notTop';
       } else {
         self.navClass = 'top';
       }
       $scope.$apply();
     });
  }])
  .controller('MainCtrl', ['uiGmapGoogleMapApi', 'speakers', 'partners', '$filter', 'streams', 'mapDetails',
    function ( uiGmapGoogleMapApi, speakers, partners, $filter, streams, mapDetails) {

      var self = this;
      this.speakers = speakers;
      this.streams = streams;

      var filterPartners = function (level) {
        return $filter('filter')(partners, {level: level});
      };
      this.partners = {
        platinum: filterPartners('Platinum'),
        gold: filterPartners('Gold')
      };

      // maps
      self.map = {};
      uiGmapGoogleMapApi.then(function() {
        self.map = mapDetails.map;

        self.marker = mapDetails.crokeParkLocation;
      });
  }])
  .controller('SpeakerController', ['speakers', function (speakers) {
    this.speakers = speakers;
  }])
  .controller('PartnerController', ['partners', '$filter', function (partners, $filter) {
    var filterPartners = function (level) {
      return $filter('filter')(partners, {level: level});
    };
    this.partners = {
      platinum: filterPartners('Platinum'),
      gold: filterPartners('Gold')
    };
  }])
  .controller('VenueController', ['uiGmapGoogleMapApi', 'mapDetails', function (uiGmapGoogleMapApi, mapDetails) {
    // maps
    var self = this;
    self.map = {};
    uiGmapGoogleMapApi.then(function() {
      self.map = mapDetails.map;

      self.marker = mapDetails.crokeParkLocation;
    });
  }])
  .controller('ContactController', ['$http', 'server', function ($http, server) {
    var self = this;
    this.showForm = true;
    this.formError = false;
    this.processing = false;

    this.zipRegex = /(?!.*)/;
    this.sendContact = function () {
      self.processing = true;
      // validate the form
      this.contactForm.subject = 'Website Form';
      $http.post(server + '/functions/contact', this.contactForm)
        .success(function () {
          self.showForm = false;
          self.processing = false;
        })
        .error(function (err) {
          console.log(err);
          self.formError = true;
          self.processing = false;
        });
    };
  }])
  .controller('MediaController', ['$http', 'server', 'countries', function ($http, server, countries) {
    var self = this;
    this.countries = countries;
    this.showForm = true;
    this.formError = false;
    this.processing = false;

    this.zipRegex = /(?!.*)/;
    this.sendMedia = function () {
      //validate the form
      if(!self.mediaForm.first || !self.mediaForm.last || !self.mediaForm.email || !self.mediaForm.jobTitle || !self.mediaForm.country || !self.mediaForm.phone) {
        self.formError = true;
      }
      else {
        self.processing = true;

        var media = {
          first: self.mediaForm.first,
          last: self.mediaForm.last,
          email: self.mediaForm.email,
          jobTitle: self.mediaForm.jobTitle,
          company: self.mediaForm.company,
          country: self.mediaForm.country.code,
          twitter: self.mediaForm.twitter,
          phone: self.mediaForm.phone
        };
        // save the media request
        $http.post(server + '/classes/Media', media)
          .success(function () {
            // send an email
            var email = {
              subject: 'Media Request',
              message: '<h1>New Media Request</h1>' +
                '<h3>Job Title:</h3> ' + media.jobTitle +
                '<h3>Company:</h3> ' + media.company +
                '<h3>Country:</h3> ' + media.country +
                '<h3>Email:</h3> ' + media.email +
                '<h3>Twitter:</h3> ' + media.twitter +
                '<h3>Phone:</h3> ' + media.phone,
              email: media.email,
              name: media.first + ' ' + media.last
            };


            $http.post(server + '/functions/contact', email)
              .success(function () {
                self.showForm = false;
                self.processing = false;
              })
              .error(function (err) {
                console.log(err);
                self.formError = true;
                self.processing = false;
              });
          })
          .error(function (err) {
            console.log(err);
            self.formError = true;
            self.processing = false;
          });
      }
    };
  }]);
