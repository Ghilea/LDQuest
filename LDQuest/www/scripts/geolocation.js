////////////////////
/* initialize map */
////////////////////
function initMap() {
    "use strict";

    //Variable
    var map, myPin, usersPin, usersLocationInterval;
    var usersPinArray = [];

    //address
    var updateMyLocationLink = sessionStorage.serverIP + "/res/ajax/updateLocation.php";
    var updateUserLocationLink = sessionStorage.serverIP + "/res/ajax/getUserLocation.php";

    //custom style
    var pokemonMap = {
        "version": "1.0",
            "settings": {
            "landColor": "#AFFFA0" //landskap
            },
        "elements": {
            "mapElement": {
                "labelVisible": false
            },
            "political": {
                "borderStrokeColor": "#144B53",
                "borderOutlineColor": "#323232",
            },
            "point": {
                "iconColor": "#0C4152",
                "fillColor": "#EAFFE5",
                "strokeColor": "#EAFFE5",
            },
            "transportation": {
                "strokeColor": "#F0FF8D", //väg
                "fillColor": "#59A499", //väg
            },
            "sand": {
                "fillcolor": "#fabe46"
            },
            "railway": {
                "strokeColor": "#146474",
                "visible": false
            },
            "structure": {
                "fillColor": "#AFFFA0" //industri
            },
            "water": {
                "fillColor": "#1A87D6", //vatten
            },
            "area": {
                "fillColor": "#96d553", //park
            }
        }
    };

    //create map
    map = new Microsoft.Maps.Map(document.getElementById("map"), {
        credentials: 'yaUBbzkhEYiXdUP5JMGu~eWEOkhy1LA5VNJeXXxVXqw~AjGA6jHbUOVZt8oUEU-nzuzvD6zUS9yQStc8Ud4kiSAgY_z70_5ECE-1rHFdkY5c',
        mapTypeId: Microsoft.Maps.MapTypeId.road,
        showMapTypeSelector: false,
        showZoomButtons: false,
        showLocateMeButton: false,
        showScalebar: false,
        showTermsLink: false,
        showCopyright: false,
        allowHidingLabelsOfRoad: true,
        liteMode: true,
        zoom: 14
    });

    //options
    map.setOptions({
        maxZoom: 18,
        minZoom: 7,
        customMapStyle: pokemonMap
    });

    //startWatching my location
    watchMyPosition();

    //my location
    function watchMyPosition() {

        var options = {
            maximumAge: 3600000,
            timeout: 5000,
            enableHighAccuracy: true
        };

        var watchID = navigator.geolocation.watchPosition(onSuccess, onError, options);
        
        function onSuccess(position) {
            
            // create a new LatLng object for every position update
            var myPosition = new Microsoft.Maps.Location(position.coords.latitude, position.coords.longitude);

            // build entire marker first time thru
            if (myPin === undefined) {

                //users icon
                myPin = new Microsoft.Maps.Pushpin(myPosition, { icon: "images/myIcon.png" });

                //view myPosition
                map.setView({ center: myPosition });

                //Add the pushpin to the map
                map.entities.push(myPin);

                //update myPosition
                updateMyPosition(position);

                //get other users pins
                getUsersPosition();

            } else {

                //change myPin position on subsequent passes
                myPin.setLocation(myPosition);

                //update myPosition
                updateMyPosition(position);

            }
        }

        function onError(error) { errorMessage('Kod: ' + error.code + '\n' + 'Meddelande: ' + error.message + '\n'); }
    }

    
    if (!usersLocationInterval) {

        //get other users pins
        chatInterval = setInterval(function () { updateUsersPosition(); }, 3000);
    }

    //update my location
    function updateMyPosition(position) { $.post(updateMyLocationLink, { "latitude": position.coords.latitude, "longitude": position.coords.longitude, "id": sessionStorage.id }, "json"); }

    //get position for all other users
    function getUsersPosition() {

       
        $.post(updateUserLocationLink, { "id": sessionStorage.id }, function (data) { 

            var x;

            //loop users id who are online and not same id as the user
            for (x in data) {

                // create a new LatLng object for every position update
                var usersPosition = new Microsoft.Maps.Location(data[x].latitude, data[x].longitude);

                //users icon
                usersPin = new Microsoft.Maps.Pushpin(usersPosition, {
                    icon: "images/team/team" + data[x].teamTitle + ".png",
                    title: data[x].username
                });

               //Add the pushpin to the map
                map.entities.push(usersPin);

               // Push marker to markers array
                usersPinArray.push(usersPin);
                   
            }

        }, "json");
    }

    //remove and remake users pins
    function updateUsersPosition() {

        var i;

        // Loop through markers and move usersPin
        for (i = 0; i < usersPinArray.length; i++) {
                    
            var index = map.entities.indexOf(usersPinArray[i]);

            if (index !== -1) {
                map.entities.removeAt(index);
            }
        }

        usersPinArray = [];

        getUsersPosition();

    }

    //error message
    function errorMessage(data) {
        //fade in error message
        $(".error").hide().html(data).fadeIn();

        //fade out after 5 sec
        setTimeout(function () {
            $('.error').fadeOut("slow");
        }, 5000);
    }

}

