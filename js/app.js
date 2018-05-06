// Variables
var locationTypes = ['Select Search Options', 'Bar', 'Lodging', 'Restaurant'],
  markerList = [],
  map = '',
  service = '',
  home = '',
  request = '',
  currentINW = null,
  currentmarker = null,
  error = ko.observable();


//Creates the initial Map
function initMap() {
  home = new google.maps.LatLng(24.553520, -81.795412);
  
  var goldStar = {
    path: 'M 125,5 155,90 245,90 175,145 200,230 125,180 50,230 75,145 5,90 95,90 z',
    fillColor: 'yellow',
    fillOpacity: 0.8,
    scale: 0.1,
    strokeColor: 'black',
    strokeWeight: 0.8,
  };
  
  map = new google.maps.Map(document.getElementById('map'), {
    center: home,
    zoom: 14,
  });

var marker = new google.maps.Marker({
    position: home,
    map: map,
    icon: goldStar,
  });

  request = {
    location: home,
    radius: '3000',
  };

  service = new google.maps.places.PlacesService(map);
  service.nearbySearch(request, callback);
  //retrieve results before binding
  setTimeout(function() {
    ko.applyBindings(new ViewModel());
  }, 1500);

   //process the Results returned from Google Places API
  function callback(results, status) {
    if (status !== google.maps.places.PlacesServiceStatus.OK || results.length < 1) {
      //wait for no results to populate return error message to user
      error = 'No Results Available';
      return;
    } else {
      for (var i = 0; i < results.length; i++) {
        var place = results[i];
        addMarker(place);
      }
    }
  }      
}

//KO View Model
var ViewModel = function() {
  this.locList = ko.observableArray(markerList);
  this.types = ko.observableArray(locationTypes);
  selectedType = ko.observable();
  this.locList.show = ko.observable(true);
  //this.reset = this.locList;
  this.onMouseover = function(Location) {
    google.maps.event.trigger(Location.marker, 'mouseover');
  };
  this.onMouseout = function(Location) {
    google.maps.event.trigger(Location.marker, 'mouseout');
  };
  this.showInfo = function(Location) {
    google.maps.event.trigger(Location.marker, 'click');
  };
  this.filter = function(obj) {
    this.locList.show = ko.observable(true);
    markerList.forEach(function(x) {
      if (selectedType() == 'Select Search Options') {
      //if (selectedType() == locationTypes) {
        x.show(true);
        x.marker.visible = true;
        x.marker.setMap(map);
      } else {
        if (x.place.types.indexOf(selectedType()) == -1) {
          x.show(false);
          x.marker.visible = false;
          x.marker.setMap(null);
        } else {
          x.show(true);
          x.marker.visible = true;
          x.marker.setMap(map);
        }
        this.locList = ko.observableArray(markerList);
      }
    });
  };
};

//hides list an search container the Nav Side Bar
function navToggle() {
  $('.options-box').toggle(function() {
    $('.options-box').css({
      height: '100%'
    });
  });
}

//Markers and eventhandlers
function addMarker(place) {
  var pinColor = 'FF0000'; //red
  var pinImage = new google.maps.MarkerImage('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + pinColor, new google.maps.Size(41, 54), new google.maps.Point(0, 0));
  var pinShadow = new google.maps.MarkerImage('http://chart.apis.google.com/chart?chst=d_map_pin_shadow', new google.maps.Size(41, 54), new google.maps.Point(0, 0), new google.maps.Point(10, 34));
  var pinColor3 = 'FFFF00'; //yellow
  var pinImage3 = new google.maps.MarkerImage('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + pinColor3, new google.maps.Size(41, 54), new google.maps.Point(0, 0));
  var pinColor2 = '008000'; //green
  var pinImage2 = new google.maps.MarkerImage('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + pinColor2, new google.maps.Size(41, 54), new google.maps.Point(0, 0));
  var streetViewUrl = 'https://maps.googleapis.com/maps/api/streetview?size=400x300&location=';
  var placeLoc = place.geometry.location;
  var marker = new google.maps.Marker({
    map: map,
    icon: pinImage,
    shadow: pinShadow,
    position: placeLoc,
    animation: google.maps.Animation.DROP,
    title: place.name
  });
  var currentIW = false;
  var lat = marker.getPosition().lat();
  var lng = marker.getPosition().lng();
  var streetview = streetViewUrl + lat + ',' + lng + '&fov=90&heading=235&pitch=10';
  var contentString = '<img src=' + streetview + 'alt="Street View Image of"' + place.name + '><div class="article"><br><hr style="margin-bottom: 5px"><strong>' + place.name + '</strong><br>' + place.vicinity + '<br><h3><img class= "NYT" src="/img/t_logo_291_black.png" alt="NYT logo" style="width:50px;height:50px;"> New York Times Articles:</h3><div class="news" + news + </div>';
  marker.place = place;
  marker.name = place.name;
  marker.lat = lat;
  marker.lng = lng;
  var index = 0;
  marker.place.types.forEach(function(x) {
    x = x.charAt(0).toUpperCase() + x.slice(1);
    marker.place.types[index] = x;
    index = index + 1;
  });
  marker.marker = marker;
  marker.contentString = contentString;
  marker.show = ko.observable(true);
  markerList.push(marker);
  marker.picked = false;
  marker.addListener('mouseover', function() {
    if (marker.picked === false) {
      this.setIcon(pinImage3);
    } else {
      this.setIcon(pinImage2);
    }
  });
  marker.addListener('mouseout', function() {
    if (marker.picked === false) {
      this.setIcon(pinImage);
    } else {
      this.setIcon(pinImage2);
    }
  });
  google.maps.event.addListener(marker, 'click', function() {
    if (currentINW !== null) {
      currentINW.close();
      currentmarker.picked = false;
      currentmarker.setIcon(pinImage);
    }
    var infowindow = new google.maps.InfoWindow({
      content: contentString,
      pixelOffset: new google.maps.Size(-10, -10),
      currentIW: true
    });
    map.panTo(marker.position);
    //infowindow.open(map, this);
    //debugger;
    marker.setAnimation(google.maps.Animation.BOUNCE);
    marker.picked = true;
    getNYTReviews(marker, infowindow);
    setTimeout(function() {
      marker.setAnimation(null);
    }, 1400);
    currentINW = infowindow;
    currentmarker = marker;
  });
}

var IWlocal;
var placelocal;
//NYT API data for Infowindows
function getNYTReviews(place, IW) {
  IWlocal = IW;
  placelocal = place.name;
  var url = 'https://api.nytimes.com/svc/search/v2/articlesearch.json';
  url += '?' + $.param({
    'api-key': 'c523f66570624de6979d7b789d8b84b6',
    'q': place.name + ' Key West'
  });
  $.ajax({
    url: url,
    method: 'GET',
  }).done(function(result) {
    //debugger;
    IW.open(map, place);
    articles = result.response.docs;
    if (articles.length < 1) {
      IW.setContent(IW.getContent() + 'No Articles Found</div>');
    }
    for (var i = 0; i < articles.length && i < 5; i++) {
      var article = articles[i];
      IW.setContent(IW.getContent() + '<li class="article"><a href=' + article.web_url + '>' + article.headline.main + '</a></li>');
      //$('.news').append();
    }
  }).fail(function(err) {
    IW.open(map, place);
    IW.setContent(IW.getContent() + 'No Articles Found</div>');
  });
}
//throws error to user if map can not load
function googleError() {
  alert("Map Could not load");
}

