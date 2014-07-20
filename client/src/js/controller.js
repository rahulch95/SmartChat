var chatApp = angular.module('chatApp', []);
chatApp.controller('ChatAppController', function($scope, $http, $location) {
  //LOAD PARSE AND VOCAB
  Parse.initialize("MWRSn7VKQRGSSQ9p64iXwjuXbqifQQ5tZ12kJzFe", "Zf0XMsZyzfsosuTDlpeORc9uHa8iQVzl0LJhVRIV");
  $scope.shortcuts = [['{wait}', 'Hello customer. We are current unavailable and will get back to you as soon as possible.'], ['{vacation}', 'Hello, thank you for reaching out to us, we will be available on January 3, 2015 when our business reseumes']];
  //$http.get('src/json/'+$routeParams[user]+'vocab.json')
  $http.get('src/json/Andyvocab.json')
  .then(function(res){
    $scope.dict = res.data;
    $scope.currentDict = $scope.dict;                
  });

  //AUTOCOMPLETE
  $scope.finishSentence = function (){
    $scope.query = $scope.suggestion;
  }

  $scope.resetAutocomplete = function(){
    $scope.currentDict = $scope.dict;
  }

  $scope.loadSentence = function(){
    var lastChar = $scope.query.slice(-1);
    if(lastChar == ' '){
      var listWords = $scope.query.split(' ');
      var string = listWords[listWords.length - 2];
      if (string in $scope.currentDict){
        $scope.currentDict = $scope.currentDict[string];
        $scope.maxFreq = 0;
        $scope.bestPath = [];
        maxDict($scope.currentDict, []);
        $scope.suggestion = $scope.query;
        for (var i = 0; i < $scope.bestPath.length; i++){
          if (i == 0){
            $scope.suggestion = $scope.suggestion + $scope.bestPath[i];
          } else {
            $scope.suggestion = $scope.suggestion + " " + $scope.bestPath[i];
          }
        }
      }
    }
  }

  function maxDict(dict, path){
    var listChildren = Object.keys(dict);
    for (var i = 0; i < listChildren.length; i++){
      if (!(isNaN(listChildren[i]))){
        if (listChildren[i] > $scope.maxFreq){
          $scope.maxFreq = listChildren[i];
          $scope.bestPath = path;
        }
      } else {
        var curPath = path.slice(0);
        curPath.push(listChildren[i]);
        maxDict(dict[listChildren[i]], curPath);
      }
    }
  }

  //add to dictionary
  $scope.addSentence = function(sentence){
    var words = sentence.split(' ');
    addAr(words, $scope.dict);
  }

  function addAr(lst, dict){
    if( lst.length == 1){
      var lastWord = lst[0];
      if (!(lastWord in dict)){
        dict[lastWord] = {1: null};
      } else {
        var listKeys = Object.keys(dict[lastWord]);
        var foundShortSentence = false;
        for (var j = 0; j < listKeys.length; j++){
          //if the short sentence exists as a number {3: null}
          if (!(isNaN(listKeys[j]))){
            var num = listKeys[j];
            delete dict[lastWord][num];
            dict[lastWord][parseInt(num)+1] = null;
            foundShortSentence = true;
          }
        }
        if (!foundShortSentence) {
          dict[lastWord][1] = null;
        }
      }
    } 
    //lots of words left
    else if (lst.length > 1) {
      var nextWord = lst[0];
      if ((dict == {}) || (!(nextWord in dict))){
        dict[nextWord] = {};
      }
      lst.shift();
      addAr(lst, dict[nextWord]);
    }
  }

  $scope.keyPress = function(eve) {
    if(eve.which === 40){
      $scope.query = $scope.suggestion;  
    } else if (eve.which === 13){
      $scope.addSentence($scope.query);
      $scope.currentDict = $scope.dict;
      $scope.suggestion = "";
      //filterInput($scope.query);
    } else if (eve.which === 39){
      filterInput($scope.query);
    }
  }

  function filterInput(sentence){
    if (sentence.indexOf("{weather}") > -1){
      $http({method: 'GET', url: 'http://api.worldweatheronline.com/free/v1/weather.ashx?q=toronto&format=json&num_of_days=1&key=309fa668804f8169624583163650d719a9f1c206'}).
      success(function(data, status, headers, config) {
        $scope.query = sentence.replace('{weather}', data.data.current_condition[0].temp_C+'C, Humidity:'+data.data.current_condition[0].humidity);
      }).
      error(function(data, status, headers, config) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });
    }
    for (var i = 0; i < $scope.shortcuts.length; i++){
      if (sentence.indexOf($scope.shortcuts[0][0]) > -1){
        $scope.query = sentence.replace($scope.shortcuts[0][0], $scope.shortcuts[0][1]);
      }
    }
  }

  $scope.saveVocab = function(){
    $http.defaults.useXDomain = true;
    $http.post('src/json/vocab.json', $scope.dict).then(function(data) {
      $scope.msg = 'Data saved';
    });
  }

  //API'S
  $scope.getWeather = function(city){
    $http({method: 'GET', url: 'http://api.worldweatheronline.com/free/v1/weather.ashx?q='+city+'&format=json&num_of_days=1&key=309fa668804f8169624583163650d719a9f1c206'}).
    success(function(data, status, headers, config) {
      $scope.weather = data;
      deferred.resolve(''+$scope.weather.data.current_condition[0].temp_C+'°C, Humidity:'+$scope.weather.data.current_condition[0].humidity);
    }).
    error(function(data, status, headers, config) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });
  }

  $scope.getUrl = function(){
    $http({method: 'POST', url: 'https://www.googleapis.com/urlshortener/v1/url?longUrl=http://www.google.com/'}).
    success(function(data, status, headers, config) {
      $scope.urlShort = data;
    }).
    error(function(data, status, headers, config) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });
  }

  $scope.getWolfram = function(expression){
    var xmlhttp=new XMLHttpRequest();
    xmlhttp.open("GET",'http://api.wolframalpha.com/v2/query?appid=E964LQ-J9PT3XGUJK&input=3%2B5&format=plaintext.xml',true);
    xmlhttp.send();
    var u = xmlhttp.responseText;
    var i = 0;

    // $http.get('http://api.wolframalpha.com/v2/query?appid=E964LQ-J9PT3XGUJK&input=3%2B5&format=plaintext').then(function(response) {
    //   var xml = x2js.xml_str2json(response.data);
    // // $http({method: 'GET', url: 'http://api.wolframalpha.com/v2/query?appid=E964LQ-J9PT3XGUJK&input=3%2B5&format=minput'}).
    // //   success(function(data, status, headers, config) {
    // //   var xml = x2js.xml_str2json(data);

    //   var result = xml.queryresult.pod[3].subpod.plaintext;
    //   $scope.wolframresult = result;
    // });
  }




});

chatApp.controller('LoginController', function($scope, $http, $location) {
  //LOGIN and REGISTER
  Parse.initialize("MWRSn7VKQRGSSQ9p64iXwjuXbqifQQ5tZ12kJzFe", "Zf0XMsZyzfsosuTDlpeORc9uHa8iQVzl0LJhVRIV");
  $scope.insertUser = function(username, email, password, password2){
    if (validateForm(email, password, password2)){
      var user = new Parse.User();
      user.set("username", username);
      user.set("password", password);
      user.set("email", email);

      user.signUp(null, {
        success: function(user) {
          alert("Signup successful " + user.get('username'));
          $scope.username = user.get("username");
          window.location.href = 'http://localhost:8888/client/Schat.html';
          //window.location.href = 'http://localhost:8888/client/index2.html?user=' + $scope.username;
      },
        error: function(user, error) {
      // Show the error message somewhere and let the user try again.
      alert("Error: " + error.code + " " + error.message);
    }
  });
    }
  }

  function validateForm(email, pass1, pass2) {
    if (pass1 != pass2){
      alert('Passwords do not match.'); 
      return false;
    }
    else if (email == "") { 
      alert('Email address is required.'); 
      return false; 
    }
    else if (email.indexOf("@") < 1 || email.indexOf(".") < 1) { 
      alert('Please enter a valid email address.'); 
      return false; 
    }
    return true;
  }

  $scope.login = function(username, password){
    Parse.initialize("MWRSn7VKQRGSSQ9p64iXwjuXbqifQQ5tZ12kJzFe", "Zf0XMsZyzfsosuTDlpeORc9uHa8iQVzl0LJhVRIV");
    Parse.User.logIn(username, password, {
      success: function(user) {
        $scope.username = user.get("username");
          window.location.href = 'http://localhost:8888/client/schat.html';
          //window.location.href = 'http://localhost:8888/client/index2.html?user='+$scope.username;    
        },
      error: function(user, error) {
        // The login failed. Check error to see why.
        alert('Incorrect credentials'); 
      }
    });
  }

  $scope.logout = function(){
    Parse.User.logOut();
  }
});