'use strict';

angular.module('admin', [])
     // .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
  .config(['$stateProvider', function ($stateProvider) {
    $stateProvider
      .state('admin', {
        url: '/admin',
        templateUrl: 'scripts/admin/admin.html',
        controller: 'AdminCtrl as admin',
        data: {
          roles: 'admin'
        },
        resolve: {
          $title: function () { return 'Admin'; }
        }
      })
      .state('admin.speakers', {
        url: '/speakers',
        templateUrl: 'scripts/admin/speakers.html',
        controller: 'AdminSpeakersCtrl as adminSpeakers',
        data: {
          roles: 'admin'
        },
        resolve: {
          $title: function () { return 'Admin: Speakers'; },
          speakers: ['dataService', function (dataService) {
            return dataService.getClassName('Speaker');
          }]
        }
      })
      .state('admin.partners', {
        url: '/partners',
        templateUrl: 'scripts/admin/partners.html',
        controller: 'AdminPartnersCtrl as adminPartners',
        data: {
          roles: 'admin'
        },
        resolve: {
          $title: function () { return 'Admin: Partners'; },
          speakers: ['adminService', function (adminService) {
            return adminService.getClassName('Sponsor');
          }]
        }
      })
      ;
  }])
  .service('adminService', ['server', '$http', function (server, $http) {
    return {
      getClassName: function (className) {
         return $http.get(server + '/classes/' + className).then(function (results) {
           return results.data.results;
         }, function () {
           return [];
         });
      }
    };
  }])
  .controller('AdminCtrl', ['ParseService', '$rootScope', '$state', 
    function (ParseService, $rootScope, $state) {
    $rootScope.adminLoggedIn = true;

    $rootScope.logout = function () {
      $rootScope.adminLoggedIn = false;
      ParseService.logout();
      $state.go('home');
    };

  }])
  .controller('AdminSpeakersCtrl', ['speakers', 'countries', 'cloudinaryDetails', 'server', '$http', '$window',
  function (speakers, countries, cloudinaryDetails, server, $http, $window) {

    var self = this;
    this.countries = countries;
    this.speakers = speakers;
    this.sourceSpeakers = [].concat(speakers);

    this.addSpeaker = function () {
      self.speaker = {};
      self.showSpeakerForm = !self.showSpeakerForm;
    };

    this.updateSpeaker = function (speaker) {
      self.showSpeakerForm = !self.showSpeakerForm;
      self.speaker = speaker;
    };

    // set the cloudinary values - see if this can be fixed  
    this.uploadImage = function (speaker) {
      cloudinary.openUploadWidget({ 
        cloud_name: cloudinaryDetails.cloud_name, 
        upload_preset: cloudinaryDetails.upload_preset,
        theme: 'minimal',
        sources: ['local'],
        multiple: false,
//         cropping: true,
//         cropping_aspect_ratio: 1,
        folder: 'speakers',
        context: {
          alt: speaker.first + ' ' + speaker.last + ': ' + speaker.company
        }
      }, 
      function(err, result) { 
        if (err) {
          // TODO: show error to user
          console.log(err);
        }
        else {
          // fileName
          var photo = {
            url: result[0].secure_url,
            public_id: result[0].public_id
          }; 
          speaker.photo = photo;
          $http.put(server + '/classes/Speaker/' + speaker.objectId, {photo: photo})
            .success(function (result) {
            })
            .error(function (err) {
              // TODO: show error to user
              speaker.photo = undefined;
              console.log(err); 
            });
        }
      });
    }

    this.removeImage = function (speaker) {
      // alert the user
      if($window.confirm('Are you sure you want to delete ' + speaker.first + '\'s picture?')){
        $http.put(server + '/classes/Speaker/' + speaker.objectId, {photo: {'__op': 'Delete'}})
          .success(function () {
            speaker.photo = undefined;
          })
          .error(function (err) {
            self.formError = true;
          });
      }
    }



    this.createOrUpdate = function () {
      var existingId = false;
      var speaker = {
        first: this.speaker.first,
        last: this.speaker.last,
        jobTitle: this.speaker.jobTitle,
        company: this.speaker.company,
        country: this.speaker.country,
        linkedIn: this.speaker.linkedIn,
        twitter: this.speaker.twitter,
        active: this.speaker.active !== undefined ? this.speaker.active: true
      };

      // is this an update of creation
      var query;
      if(this.speaker.objectId) {
        existingId = self.speaker.objectId;
        query = $http.put(server + '/classes/Speaker/' + this.speaker.objectId, speaker);
      }
      else {
        existingId = null;
        query = $http.post(server + '/classes/Speaker', speaker);
      }
      query
        .success(function (speakerObject) {
          // for a new object set the objectId
          speaker.objectId = existingId || speakerObject.objectId;
          if (!existingId) {
            //add a new speaker
            self.speakers.push(speaker);
          }
          
          self.speaker = {};
          self.showSpeakerForm = false;
        })
        .error(function (err) {
          self.formError = true;
        });
    };

    this.toggleSpeaker = function (speaker) {
      var action = speaker.active ? 'delete ' : 'restore ';
      if($window.confirm('Are you sure you want to ' + action + speaker.first + '?')){
        this.speaker = speaker;
        this.speaker.active = !this.speaker.active;
        this.createOrUpdate();       
      }
    }
  }])
  .controller('AdminPartnersCtrl', ['partners', function (partners) {
    this.partners = partners;
  }])
  .controller('AdminSessionsCtrl', ['locations', 'sessions', function (locations, sessions) {
    this.locations = locations;
    this.sessions = sessions;
  }])
  .controller('AdminSubscribersCtrl', ['subscribers', function (subscribers) {
    this.subscribers = subscribers;
  }]);
