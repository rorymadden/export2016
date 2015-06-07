'use strict';

angular.module('genericServices', ['ngCookies'])
  .service('ParseService', ['$rootScope', '$http', '$q', 'server', '$cookies',
    function($rootScope, $http, $q, server, $cookies) {
    var appId = 'yWTZRz60WfymokTSxKeI11Lu7ZfZT0Ny3uT6GAV0';
    var jsKey = '7luLgXpWuaOMG8chT2UGGKV4FDcSheihVsM06r6Y';
    var restKey = 'Evs90NiRTkiT40wlSzmyPcO2gs5bjwQz8Gap4I7I';
    Parse.initialize(appId, jsKey);

    $http.defaults.headers.common['X-Parse-Application-Id'] = appId;
    $http.defaults.headers.common['X-Parse-REST-API-Key'] = restKey;

    var service = {
      setSession: function (session) {
        $http.defaults.headers.common['X-Parse-Session-Token'] = session;
      },
      getUserRoles: function (user) {
        var deferred = $q.defer();
        // check the roles cache
        if(user.roles) {
          deferred.resolve(user);
        }
        else {
          $http.post(server + '/functions/getRoles', user)
          .success(function (results) {
            // update the user with the roles
            user.roles = results.result.map(function (result) {
              return result.name;
            });
            $rootScope.currentUser = user;
            $rootScope.adminLoggedIn = true;
            $cookies.sessionToken = user.sessionToken || user.data.sessionToken;

            return deferred.resolve(user);

          })
          .error(function (err) {
            $rootScope.currentUser = null;
            return deferred.reject(err);
          });
        }
        return deferred.promise;
      },
      loginFromToken: function () {
        var deferred = $q.defer();
        var sessionToken = $cookies.sessionToken;
        var authenticated = Parse.User.current();

        if(!authenticated && sessionToken && sessionToken !== 'undefined' && sessionToken !== 'null') {
          service.setSession(sessionToken);

          $http.get(server + '/users/me').then(function (user) {
            // service.getUserRoles(user).then(function () {
            //   return deferred.resolve(user);
            // })

            return deferred.resolve(service.getUserRoles(user));
          }, function () {
            // The token could not be validated.
            service.setSession(null);
            $rootScope.adminLoggedIn = false;
            deferred.resolve(null);
          });
        }
        else {
          deferred.resolve(null);
        }
        return deferred.promise;
      },
      logout: function() {
        $rootScope.currentUser = null;
        $cookies.sessionToken = null;
        service.setSession(null);
        roles = [];
        Parse.User.logOut();
      }
    };

    // set the $rootScope.currentUser
    if (Parse.User.current()) {
      service.getUserRoles(Parse.User.current());
    }
    else {
      service.loginFromToken();
    }

    return service;
  }])
  .factory('dataService',['$http', '$q', 'server', function dataService ($http, $q, server) {
    var data = {};
    var serialize = function(obj, prefix) {
      var str = [];
      for(var p in obj) {
        if (obj.hasOwnProperty(p)) {
          var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
          str.push(typeof v == "object" ?
            serialize(v, k) :
            encodeURIComponent(k) + "=" + encodeURIComponent(v));
        }
      }
      return str.join("&");
    }

    function getClassName (className, options) {
      var def = $q.defer();

      if (data.className && data.className.length > 0) {
        def.resolve(data.className);
      }
      else {
        var optionString = '?' + serialize(options);
        $http.get(server + '/classes/' + className + optionString).then(function (results) {
          data[className] = results.data.results;
          def.resolve(data[className]);
        },
        function (err) {
          data[className] = [];
          def.reject(err);
        });
      }
      return def.promise;
    }
    var service = {
      getClassName: getClassName
    };
    return service;
  }])
  .factory('imageService', ['$http', 'cloudinaryDetails', '$window', 'server', 
    function ($http, cloudinaryDetails, $window, server) {
    return {
      uploadImage: function (details) {
        cloudinary.openUploadWidget({
          cloud_name: cloudinaryDetails.cloud_name,
          upload_preset: cloudinaryDetails.upload_preset,
          theme: 'minimal',
          sources: ['local'],
          multiple: false,
          folder: details.className,
          context: {
            alt: details.alt
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
            details.object.photo = photo;
            $http.put(server + '/classes/' + details.className + '/' + details.object.objectId, {photo: photo})
              .success(function (result) {
              })
              .error(function (err) {
                // TODO: show error to user
                details.object.photo = undefined;
                console.log(err);
              });
          }
        });
      },

      removeImage: function (details) {
        // alert the user
        if($window.confirm('Are you sure you want to delete ' + details.name + '\'s picture?')){
          $http.put(server + '/classes/Speaker/' + details.object.objectId, {photo: {'__op': 'Delete'}})
            .success(function () {
              details.object.photo = undefined;
            })
            .error(function (err) {
              self.formError = true;
            });
        }
      }
    }
  }]);
