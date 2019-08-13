(function () {
    "use strict";

    /*-------------------------*/
    /* global variable         */
    /*-------------------------*/
    var deviceID,
        questID,
        music,
        map,
        usersInterval,
        usersPinArray = [],
        questInterval,
        questPinArray = [],
        watchID,
        gameCode = "123456",
        serverWS,
        cHPLoss = null,
        pHPLoss = null,
        cID;

    //change sound & music (pc = 1 or android = 0)
    var test = "1";

    /*-------------------------*/
    /* device ready 		   */
    /*-------------------------*/
    document.addEventListener('deviceready', onDeviceReady, false);

    function onDeviceReady() {

        //addEvent
        document.addEventListener("pause", onPause, false);
        document.addEventListener("resume", onResume, false);

        //get device uuid
        deviceID = device.uuid;

        //output
        $("#version").text("v.0.0.1"); //version
        $("title").text("LDQuest"); //title   

        //deferringImages
        deferringImages();

        //check connection
        checkConnection();

        //clickButtons
        click();
    }

    /*-------------------------*/
    /* on device pause  	   */
    /*-------------------------*/
    function onPause() {
        
    }

    /*-------------------------*/
    /* on device resume		   */
    /*-------------------------*/
    function onResume() {
        //check connection
        checkConnection();
    }

    /*-------------------------*/
    /*-------------------------*/
    /* system section 		   */
    /*-------------------------*/
    /*-------------------------*/

        /*-------------------------*/
        /* local storage  		   */
        /*-------------------------*/
        function localSettings() {

            //clear();
            var i,
                settings = [
                    { key: "sound", value: "1" },
                    { key: "voice", value: "1" },
                    { key: "music", value: "1" },
                    { key: "news", value: "1" },
                    { key: "vibration", value: "1" }
                ];

            //loop array for localStorage
            for (i = 0; i < settings.length; i++) {

                if (localStorage.getItem(settings[i].key) === null) {
                    localStorage.setItem(settings[i].key, settings[i].value);
                } 
            }
        }

        /*-------------------------*/
        /* check connection 	   */
        /*-------------------------*/
        function checkConnection() {

            var networkState = navigator.connection.type,
                states = {};

            //add to array "states"
            states[Connection.UNKNOWN] = 'Unknown connection';
            states[Connection.ETHERNET] = 'Ethernet connection';
            states[Connection.WIFI] = 'WiFi connection';
            states[Connection.CELL_2G] = 'Cell 2G connection';
            states[Connection.CELL_3G] = 'Cell 3G connection';
            states[Connection.CELL_4G] = 'Cell 4G connection';
            states[Connection.CELL] = 'Cell generic connection';
            states[Connection.NONE] = 'No network connection';

            //console.log('Connection type: ' + states[networkState]);

            if (states[networkState] === "No network connection") {
                //hide bodyWrapper
                cssStyle("#bodyWrapper", "display", "none");
                $("body").text("No Internet Connection...");
            } else {
                //show bodyWrapper
                cssStyle("#bodyWrapper", "display", "block");

                //localStorage
                localSettings();

                //check if user exist
                checkDevice();
 
            }
        }

        /*-------------------------*/
        /* check device id         */
        /*-------------------------*/
        function checkDevice() {

            var serverAddress = address("checkDeviceID.php");

            $.post(serverAddress, { "deviceID": deviceID }, "json")

                //callback if everything went okey
                .done(function (data) {

                    //if device id not exist
                    if (data.trim()) { 

                        //show protagonistCreation
                        cssStyle("#styleNewProtagonist", "display", "block");
                        cssStyle("#styleTop", "display", "none");

                        //music
                        musicFunction("viking");

                        //load data
                        protagonist();

                        //addProtagonistButton
                        buttons("protagonistButton");

                    //if device id exist already
                    } else {

                        //show protagonistCreation
                        cssStyle("#styleTop", "display", "block");
                        cssStyle("#styleNewProtagonist", "display", "none");

                        //music
                        musicFunction("viking");

                        //get news
                        //getNews();

                        //open connection to websocket
                        //webSocketConnection();

                        //get quest list
                        getQuest();

                        //menyButton
                        buttons("settingsButton", "accountButton");

                    }
                })

                .fail(function () { console.log("error: device check"); }) //callback if something went wrong
                .always(function () { console.log("success: device check"); }); //always do a callback      
        }

        /*---------------------------*/
        /* sound / music / vibration */
        /*---------------------------*/
        //vibration
        function vibrationFunction(value) {
            if (localStorage.getItem("vibration") === "1") {
                navigator.vibrate(value);
            }
        }

        //voice
        function voiceEffect(value) {
            if (localStorage.getItem("sound") === "1") {

                var voice;

                if (test === "0") {
                    voice = new Media("/android_asset/www/voice/" + value + ".mp3"); //android
                } else {
                    voice = new Media("/voice/" + value + ".mp3"); //pc test
                }

                voice.play();
            }
        }

        //sound
        function soundEffect(value) {
            if (localStorage.getItem("sound") === "1") {

                var audio;

                if (test === "0") {
                    audio = new Media("/android_asset/www/sound/" + value + ".mp3"); //android
                } else {
                    audio = new Media("/sound/" + value + ".mp3"); //pc test
                }

                audio.play();
            }
        }

        //music
        function musicFunction(value) {

            if (localStorage.getItem("music") === "1") {

                //android or PC
                if (test === "0") {
                    music = new Media("/android_asset/www/music/" + value + ".mp3", onSuccess, onError, onStatus); //android
                } else if (test === "1"){
                    music = new Media("/music/" + value + ".mp3", onSuccess, onError, onStatus); //pc test
                }

                music.setVolume(0.3);
                music.play();

            }

            // onSuccess Callback
            function onSuccess() {
                console.log("Music: success");
            }

            // onError Callback 
            function onError(error) {
                console.log("Music error: " + error);
            }

            // onStatus Callback 
            function onStatus(status) {
                if (status === Media.MEDIA_STOPPED) {
                    music.play();
                }
            }
        }

        /*-------------------------*/
        /* calculate distance	   */
        /*-------------------------*/
        function CalculateDistance(lat1, lon1, lat2, lon2) {
            var R = 6371; // Radius of the earth in kilometers
            var dLat = deg2rad(lat2 - lat1); // deg2rad below
            var dLon = deg2rad(lon2 - lon1);
            var a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = R * c; // Distance in KM
            return d;

            //6370981.162 meter
            //6367 km
            //3956 miles
        }

        function deg2rad(deg) { return deg * (Math.PI / 180); }

        /*-------------------------*/
        /* reverse geolocation     */
        /*-------------------------*/
        /*function cityCord(lat, lon, callback) {
            $.getJSON('http://nominatim.openstreetmap.org/reverse?json_callback=?&format=json', { lat: lat, lon: lon }, function (data) {
                callback(data.address.county);
            });
        }*/

        /*-------------------------*/
        /* Css style			   */
        /*-------------------------*/
        function cssStyle(style, value, value2) { $(style).css(value, value2); }

        /*-------------------------*/
        /* buttons  			   */
        /*-------------------------*/
        function buttons(b1, b2, b3) {

            //reset button container
            $("#buttonMenu").empty();

            //variable
            var bArray = [
                { key: "closeButton", img: "close" },
                { key: "checkPositionButton", img: "position_w" }, //checkQuestLocation
                { key: "settingsButton", img: "setup" }, //menu
                { key: "accountButton", img: "sex" }, //menu
                { key: "createQuestButton", img: "add" }, //styleAdd
                { key: "addMoreQuest", img: "people" }, //styleAdd
                { key: "protagonistButton", img: "add" }, //addProtagonist
                { key: "attackButton", img: "attack" } //agressive
            ];

            //loop array
            for (var i = 0; i < bArray.length; i++) (function (i) {

                if (bArray[i].key === b1){
                    $("#buttonMenu").append(
                        "<div class='col-4-12'><div class='wrap-col'>"
                        + "<div id=" + bArray[i].key + " class='styleButton'>"
                        + "<img src='images/svg/" + bArray[i].img + ".svg' alt=''>"
                        + "</div>"
                        + "</div></div>"
                    );
                }

                if (bArray[i].key === b2) {
                    $("#buttonMenu").append(
                        "<div class='col-4-12'><div class='wrap-col'>"
                        + "<div id=" + bArray[i].key + " class='styleButton'>"
                        + "<img src='images/svg/" + bArray[i].img + ".svg' alt=''>"
                        + "</div>"
                        + "</div></div>"
                    );
                }

                if (bArray[i].key === b3) {
                    $("#buttonMenu").append(
                        "<div class='col-4-12'><div class='wrap-col'>"
                        + "<div id=" + bArray[i].key + " class='styleButton'>"
                        + "<img src='images/svg/" + bArray[i].img + ".svg' alt=''>"
                        + "</div>"
                        + "</div></div>"
                    );
                }

            })(i);

        }

        /*-------------------------*/
        /* click buttons     	   */
        /*-------------------------*/
        function click() {

            //close
            $("body").on("click", "#closeButton", function () {

                //vibration
                vibrationFunction(100);

                //buttons
                buttons("settingsButton", "accountButton");

                //array hide
                var hide = ["#styleArena", "#styleTavern", "#styleMap", "#styleSettings", "#styleAccount", "#styleChat", "#styleFight"];

                //loop array for style, clicking on quest
                for (var i = 0; i < hide.length; i++) (function (i) {
                    cssStyle(hide[i], "display", "none");
                })(i);

                if ($("#styleTavern").css("display") === "none") {
                    //clear content div
                    $('#showAvailableQuest').empty();
                }

                if ($("#styleTop").css("display") === "none") {

                    //css
                    cssStyle("#styleTop", "display", "block");

                    //stop music and change music
                    music.release();
                    music.stop();
                    musicFunction("Viking");
                }

                //refresh
                getQuest();

                //turn of tracking position
                navigator.geolocation.clearWatch(watchID);

                //clear other users tracking
                clearInterval(usersInterval);

                //clear tracking of own quest
                clearInterval(questInterval);

                //run from creature
                if (typeof cAttackTimer !== "undefined") {
                    clearInterval(cAttackTimer);
                }

            });

            //get quest id
            $("body").on("click", "div.forumContent", function () {
                questID = $(this).attr('id'); //get id
                questBox();
            });

            //get available quest id
            $("body").on("click", "div.availableQuestClick", function () {
                var availableQuestID = $(this).attr('id'); //get id
                console.log(availableQuestID);
                addAvailableQuest(availableQuestID);
            });

            //Check position of user
            $("body").on("click", "#checkPositionButton", function () { checkUserPosition(questID); });

            //settings
            $("body").on("click", "#settingsButton", function () { settings(); cssStyle("#styleTop", "display", "none"); });

            //map
            $("#openMap").on("click", function () {
                cssStyle("#styleMap", "display", "block");
                cssStyle("#styleTop", "display", "none");
                buttons("closeButton");

                //track own
                watchMyPosition();

                //get other users pins
                usersInterval = setInterval(function () { updateUsersPosition(); }, 3000);

                //get other users pins
                questInterval = setInterval(function () { updateQuestPosition(); }, 3000);

            });

            //account
            $("body").on("click", "#accountButton", function () { account(); cssStyle("#styleTop", "display", "none"); });

            //fighting
            $("body").on("click", "#greenhornButton", function () { greenhorn(); cssStyle("#styleArena", "display", "none"); });

            //attack
            $("body").on("click", "#attackButton", function () { attack(); });

            //array points
            var bPointsArray = ["strength", "dexterity", "luck"];

            //add points
            for (var x = 0; x < bPointsArray.length; x++) (function (x) {
                $("#" + bPointsArray[x]).on("click", function () { console.log("update: " + bPointsArray[x]); addPoints(bPointsArray[x]); });  
            })(x);

            //tavern
            $("#tavernButton").on("click", function () { tavern(); cssStyle("#styleTop", "display", "none"); });

            //arena
            $("#arenaButton").on("click", function () { arena(); cssStyle("#styleTop", "display", "none"); });

            //take picture
            $("#p_camera").on("click", function () { getPicture(); });

            /* add code */
            $("#addQuestCodeButton").on("click", function () {

                //get value from div
                var code = $("#addQuestCode").val();

                //add code
                addQuestCode(code);

            });

            //create quest
            $("#addQuestButton").on("click", function () {
                addQuest();
                buttons("closeButton");
            });

            //chat
            $("#chatButton").on("click", function () {
                cssStyle("#styleChat", "display", "block");
                cssStyle("#styleTavern", "display", "none");
                buttons("closeButton");
            });

            //available quest
            $("#availableQuest").on("click", function () {
                getAvailablQuest();
            });

        }

        /*-------------------------*/
        /* messageBox			   */
        /*-------------------------*/
        function messageBox(data) {

            //variable
            var box = "#messageBox",
                time = 2000;

            //fade in message
            $(box).hide().html(data).fadeIn();

            //fade out message after time in sec
            setTimeout(function () {
                $(box).fadeOut("slow");
            }, time);
        }

        /*-------------------------*/
        /* Date			           */
        /*-------------------------*/
        function formatDate(date) {
            var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            var day = date.getDate();
            var monthIndex = date.getMonth();
            var year = date.getFullYear();

            return day + ' ' + monthNames[monthIndex] + ' ' + year;
        }

        /*-------------------------*/
        /* Deferring Images        */
        /*-------------------------*/
        function deferringImages() {

            var imgDefer = document.getElementsByTagName('img');

            for (var i = 0; i < imgDefer.length; i++) {
                if (imgDefer[i].getAttribute('data-src')) {
                    imgDefer[i].setAttribute('src', imgDefer[i].getAttribute('data-src'));
                }
            }
        }

        /*-------------------------*/
        /* serveraddress           */
        /*-------------------------*/
        function address(src) {

            var ip = "http://89.160.115.26",
                folder = "/LDQuest/",
                address = ip + folder + src;

            return address;
        }

    /*-------------------------*/
    /*-------------------------*/
    /* fighting section		   */
    /*-------------------------*/
    /*-------------------------*/

        /*-------------------------*/
        /* greenhorn		       */
        /*-------------------------*/
        function greenhorn() {

            //menyButton
            buttons("closeButton", "attackButton");

            //show
            cssStyle("#styleFight", "display", "block");

            //get creature
            creature(1);

            //get player
            cProtagonist();

        }

        /*-------------------------*/
        /* protagonist combat      */
        /*-------------------------*/
        function cProtagonist(){

            //variable
            var serverAddress = address("getProtagonist.php");

            //get post
            $.post(serverAddress, { "deviceID": deviceID }, function (data) { }, "json")

                //callback if everything went okey
                .done(function (data) {

                    //set hp that creature can lose
                    pHPLoss = data.hp;

                    //array
                    var protagonistArray = [
                        { style: ".cp_name", value: data.name },
                        { style: ".cp_hp", value: data.hp }
                    ];

                    //loop array with data
                    for (var i = 0; i < protagonistArray.length; i++) (function (i) {
                        $(protagonistArray[i].style).html(protagonistArray[i].value);
                    })(i);

                })

                .fail(function () { console.log("error: get protagonist fighting"); }) //callback if something went wrong

                .always(function () { console.log("success: get protagonist fighting"); }); //always do a callback  
        }

        /*-------------------------*/
        /* attacking 		       */
        /*-------------------------*/
        function attack() {

            //variable
            var serverAddress = address("getProtagonist.php"),
                lowestTime = 2000,
                maxTime = 3000;

            //vibration
            vibrationFunction(100);

            //Button
            buttons("closeButton");

            //get post
            $.post(serverAddress, { "deviceID": deviceID }, function (data) { }, "json")

                //callback if everything went okey
                .done(function (data) {

                    //if creatures hp still over 0
                    if (cHPLoss > 0) {

                        //damage done to other
                        var randBaseDmg = 10,
                            minDmg = parseInt(data.sword, 10),
                            dmgCalc = Math.floor(Math.random() * Math.floor(randBaseDmg)) + Math.floor(minDmg) * Math.floor((parseInt(data.level, 10) + parseInt(data.strength, 10))/2);

                        console.log(dmgCalc);
                        cHPLoss -= dmgCalc;

                        //output combat log
                        $(".c_combatLog").prepend("You did " + dmgCalc + " damage to the creature.<br>");

                        //change hp output
                        $(".c_hp").empty();
                        $(".c_hp").html(cHPLoss);

                        //attack button timer
                        setTimeout(function () { buttons("closeButton", "attackButton"); }, Math.floor(Math.random(lowestTime) + maxTime));

                        //creature attack back
                        creatureAttack(cID);
                    }
                })

                .fail(function () { console.log("error player attacking"); }) //callback if something went wrong

                .always(function () { console.log("success: player attacking"); }); //always do a callback  
        }

        /*-------------------------*/
        /* creature 		       */
        /*-------------------------*/
        function creature(cLevel) {

            //variable
            var serverAddress = address("getCreature.php");

            //get post
            $.post(serverAddress, { "deviceID": deviceID, "level": cLevel }, function (data) { }, "json")

                //callback if everything went okey
                .done(function (data) {

                    //variable
                    cID = data.id;

                    //set hp that creature can lose
                    cHPLoss = data.hp;

                    //array
                    var protagonistArray = [
                        { style: ".c_name", value: data.name },
                        { style: ".c_hp", value: data.hp },
                        { style: ".c_desc", value: data.description },
                        { style: ".c_portrait", value: "<img class='c_img' src='images/creatures/" + data.name + ".jpg' alt=''>" }
                    ];

                    //loop array with data
                    for (var i = 0; i < protagonistArray.length; i++) (function (i) {
                        $(protagonistArray[i].style).empty();
                        $(protagonistArray[i].style).html(protagonistArray[i].value);
                    })(i);

                })

                .fail(function () { console.log("error: get creature information"); }) //callback if something went wrong

                .always(function () { console.log("success: get creature information"); }); //always do a callback
        }

        /*-------------------------*/
        /* creature attack	       */
        /*-------------------------*/
        function creatureAttack(creatureID) {
            
            //variable
            var serverAddress = address("getCreatureAttack.php"),
                lowestTime = 2000,
                maxTime = 4000,
                timeCalc = Math.floor(Math.random(lowestTime) + Math.random(maxTime) + 2000);

            //get post
            $.post(serverAddress, { "creatureID": creatureID }, function (data) { }, "json")
            
                //callback if everything went okey
                .done(function (data) {

                    //start attackInterval
                    setTimeout(cAttack, timeCalc);

                    //creature attack
                    function cAttack() {

                        //variable
                        var LA = parseInt(data.lowAttack, 10),
                            MA = parseInt(data.maxAttack, 10),
                            dmgCalc = Math.floor(Math.random() * (MA - LA)) + LA;

                        //if creature die
                        if (cHPLoss <= 0) {

                            //give loot
                            creatureDead(data.experience, data.gold, data.level);

                        } else {

                            $(".c_combatLog").prepend("The " + data.name + " did " + dmgCalc + " damage to you.<br>");
                            pHPLoss -= dmgCalc;

                            //change hp output
                            $(".cp_hp").empty();
                            $(".cp_hp").html(pHPLoss);

                        }
                    }
                })

                .fail(function () { console.log("error: creature attack"); }) //callback if something went wrong

                .always(function () { console.log("success: creature attack"); }); //always do a callback
        }

        /*-------------------------*/
        /* creature is dead	       */
        /*-------------------------*/
        function creatureDead(exp, gold, level) {
            messageBox("Creature is dead.<br>You gained " + exp + " experience points.<br>You found " + gold + " gold");
            experienceGain(exp);
            goldGain(gold);

            //new creature
            creature(level);
        }

    /*-------------------------*/
    /*-------------------------*/
    /* account section		   */
    /*-------------------------*/
    /*-------------------------*/

        /*-------------------------*/
        /* account 			       */
        /*-------------------------*/
        function account() {

            //variable
            var serverAddress = address("getProtagonist.php");

            //vibration
            vibrationFunction(100);

            //empty
            $("#content").empty();

            //show
            cssStyle("#styleAccount", "display", "block");

            //Button
            buttons("closeButton");

            //get post
            $.post(serverAddress, { "deviceID": deviceID }, function (data) { }, "json")

            //callback if everything went okey
            .done(function (data) {

                //array
                var protagonistArray = [
                    { style: ".p_name", value: data.name },
                    { style: ".p_race", value: data.race },
                    { style: ".p_age", value: data.age },
                    { style: ".p_gender", value: data.gender },
                    { style: ".p_HP", value: data.hp },
                    { style: ".p_points", value: data.points },
                    { style: ".p_level", value: data.level },
                    { style: ".p_experience", value: data.experience },
                    { style: ".p_rank", value: "#" + data.rank },
                    { style: ".p_popularity", value: data.popularity },
                    { style: ".p_capital", value: data.capital + " gold" },
                    { style: ".p_strength", value: data.strength },
                    { style: ".p_dexterity", value: data.dexterity },
                    { style: ".p_luck", value: data.luck },
                    { style: ".p_dagger", value: data.dagger },
                    { style: ".p_sword", value: data.sword },
                    { style: ".p_axe", value: data.axe },
                    { style: ".p_mace", value: data.mace },
                    { style: ".p_fistWeapon", value: data.fist_weapon },
                    { style: ".p_staffWeapon", value: data.staff_weapon },
                    { style: ".p_polearms", value: data.polearms },
                    { style: ".p_trownWeapon", value: data.trown_weapon },
                    { style: ".p_bow", value: data.bow },
                    { style: ".p_crossbow", value: data.crossbow }
                ];

                 //loop array with data
                 for (var i = 0; i < protagonistArray.length; i++) (function (i) {
                    $(protagonistArray[i].style).html(protagonistArray[i].value);
                 })(i);

            })

            .fail(function () { console.log("error get protagonist information"); }) //callback if something went wrong

            .always(function () { console.log("success: get protagonist information"); }); //always do a callback
        }

        //add points 
        function addPoints(name) {

            //variable
            var serverAddress = address("updateStats.php");

            //vibration
            vibrationFunction(100);

            //get post
            $.post(serverAddress, { "deviceID": deviceID, "stats": name }, function (data) { }, "json")

                //callback if everything went okey
                .done(function (data) {

                    //array
                    var protagonistArray = [
                        { style: ".p_points", value: data.points },
                        { style: ".p_strength", value: data.strength },
                        { style: ".p_dexterity", value: data.dexterity },
                        { style: ".p_luck", value: data.luck }
                    ];

                    //loop array with data
                    for (var i = 0; i < protagonistArray.length; i++) (function (i) {
                        $(protagonistArray[i].style).empty();
                        $(protagonistArray[i].style).html(protagonistArray[i].value);
                    })(i);

                })

                .fail(function () { console.log("error update protagonist points"); }) //callback if something went wrong

                .always(function () { console.log("success: update protagonist points"); }); //always do a callback
        }

    /*-------------------------*/
    /*-------------------------*/
    /* arena section		   */
    /*-------------------------*/
    /*-------------------------*/

        /*-------------------------*/
        /* arena 			       */
        /*-------------------------*/
        function arena() {

            //vibration
            vibrationFunction(100);

            //empty
            $("#content").empty();

            //show
            cssStyle("#styleArena", "display", "block");

            //button
            buttons("closeButton");

            //change music
            music.release();
            music.stop();
            musicFunction("The War");
        }

    /*-------------------------*/
    /*-------------------------*/
    /* tavern section		   */
    /*-------------------------*/
    /*-------------------------*/

        /*-------------------------*/
        /* add available quest	   */
        /*-------------------------*/
        function addAvailableQuest(id) {

            console.log("added");

            var serverAddress = address("addAvailableQuest.php");

            //add game to private list
            $.post(serverAddress, { "deviceID": deviceID, "id": id }, function (data) {
                if (data !== "success") {

                    //play sound
                    soundEffect("error");

                    //output message
                    messageBox(data);

                } else if (data === "success") {

                    //after 1 sec
                    setTimeout(function () {

                        //play sound
                        soundEffect("success");

                        //message
                        messageBox("Quest added!");

                        getAvailablQuest();

                    }, 1000);
                }

            }, "json");
        }

        /*-------------------------*/
        /* add code	    		   */
        /*-------------------------*/
        function addGameCode(id) {

            var serverAddress = address("addQuestSub.php");

            //add game to private list
            $.post(serverAddress, { "deviceID": deviceID, "code": id }, function (data) {
                if (data !== "success") {
                    //play sound
                    soundEffect("error");

                    //output message
                    messageBox(data);
                } else if (data === "success") {

                    //after 1 sec
                    setTimeout(function () {

                        //play sound
                        soundEffect("success");

                        //message
                        messageBox("Game code added!");

                        //reset
                        $("#addGameCode").val("");

                        //get game
                        getQuest();

                    }, 1000);
                }

            }, "json");
        }

        /*-------------------------*/
        /* tavern 			       */
        /*-------------------------*/
        function tavern() {

            //vibration
            vibrationFunction(100);

            //empty
            $("#content").empty();

            //show
            cssStyle("#styleTavern", "display", "block");

            //button
            buttons("closeButton");

            //change music
            music.release();
            music.stop();
            musicFunction("The Red Fox Tavern");
        }

        /*-------------------------*/
        /* get Available Quest	   */
        /*-------------------------*/
        function getAvailablQuest() {

            var serverAddress = address("getAvailableQuest");

            //clear content div
            $('#showAvailableQuest').empty();

            console.log("getAvailablQuest");

            //vibration
            vibrationFunction(100);

            //menyButton
            buttons("closeButton");

            //get post
            $.post(serverAddress, { "deviceID": deviceID }, function (data) {

                for (var x in data) {

                    $("#showAvailableQuest").prepend(
                        "<div id='" + data[x].id + "'class='col-full availableQuestClick'><div class='wrap-col'>"

                        + "<div class='col-full boxButton'><div class='wrap-col'>"
                        + "<h3>" + data[x].title + "</h3>"
                        + "<img src='images/exclamation_point.svg' alt=''>"
                        + "</div></div>"

                        + "</div></div>");
                }
            }, "json");

        }

    /*-------------------------*/
    /*-------------------------*/
    /* settings section		   */
    /*-------------------------*/
    /*-------------------------*/

        /*-------------------------*/
        /* settings 			   */
        /*-------------------------*/
        function settings() {

            //vibration
            vibrationFunction(100);

            //empty
            $("#content").empty();

            //show
            cssStyle("#styleSettings", "display", "block");

            //button
            buttons("closeButton");

            //checkbox settings
            var checkboxSettings = [
                { key: "sound", style: "#sound" },
                { key: "music", style: "#music" },
                { key: "vibration", style: "#vibration" }
            ];

            //loop array for checkbox settings in beginning
            for (var i = 0; i < checkboxSettings.length; i++) (function (i) {

                //set checkbox to the right value
                if (localStorage.getItem(checkboxSettings[i].key) === "1") {
                    $(checkboxSettings[i].style).prop('checked', true);
                } else {
                    $(checkboxSettings[i].style).prop('checked', false);
                }

                /* checkbox click button */
                $(checkboxSettings[i].style).on("click", function () {

                    var checkBox = $('input[name=' + checkboxSettings[i].key + ']').attr("checked", "checked");

                    // If the checkbox is checked, display the output text
                    if (checkBox.is(":checked")) {
                        localStorage.setItem(checkboxSettings[i].key, "1");
                        soundEffect("checked");
                        if (checkboxSettings[i].key === "music") {
                            music.play();
                        }
                    } else {
                        localStorage.setItem(checkboxSettings[i].key, "0");
                        if (checkboxSettings[i].key === "music") {
                            music.pause();
                            music.seekTo(0);
                        }
                    }

                });

            })(i);

        }

    /*-------------------------*/
    /*-------------------------*/
    /* news section		       */
    /*-------------------------*/
    /*-------------------------*/

        /*-------------------------*/
        /* get news        	       */
        /*-------------------------*/
        function getNews() {

            var serverAddress = address("getNews.php");

            if (localStorage.getItem("news") === "1") {

                //get data
                $.post(serverAddress, function (data) {

                    for (var x in data) {

                        $("#newsMessage").prepend(
                            "<div class='col-full'><div class='wrap-col'>"
                            + "<div class='col-full box'><div class='wrap-col'>"

                            + "<div class='col-full field'><div class='wrap-col'>"
                            + "<h2>" + data[x].title + "</h2>"
                            + "<p>" + data[x].text + "</p>"
                            + "</div></div>"

                            + "</div></div>"
                            + "</div></div>");

                    }
                }, "json");
            } 
        }

    /*-------------------------*/
    /*-------------------------*/
    /* quest section		   */
    /*-------------------------*/
    /*-------------------------*/

        function customQuest() {

            /*-------------------------*/
            /* add quest 			   */
            /*-------------------------*/
            function addQuest() {

                //vibration
                vibrationFunction(100);

                //show
                cssStyle("#styleAdd", "display", "block");
                cssStyle("#styleTavern", "display", "none");

                //addGame
                $("#createQuestButton").on("click", function () {

                    //vibration
                    vibrationFunction(100);

                    var questCount;
                    var questArray = [];

                    //get value from div
                    var title = $("#questTitle").val();
                    var text = $("#questDescription").val();

                    //get value from quest and loop it into an array
                    $(".questline").each(function () {
                        questArray.push($(this).val());
                    });

                    //check to see how many quest there is
                    questCount = Object.keys(questArray).length;

                    //add post
                    addGameFunction(title, text, questArray, questCount); // title, text

                });

                //add more quest
                addMoreQuest();

                function addGameFunction(title, text, quest, questCount) {

                    var serverAddress = address("addQuest.php"),
                        newCode = "";

                    //get 6 random character from deviceID
                    while (newCode.length < 6) {
                        newCode += deviceID[Math.floor(Math.random() * deviceID.length)];
                    }

                    //if location found, countinue with the post
                    var onSuccess = function (position) {

                        $.post(serverAddress, {
                            "title": title,
                            "text": text,
                            "quest": JSON.stringify(quest),
                            "questNumber": questCount,
                            "deviceID": deviceID,
                            "code": newCode,
                            "latitude": position.coords.latitude,
                            "longitude": position.coords.longitude
                        }, function (data) {
                            if (data !== "success") {
                                soundEffect("error");
                                messageBox(data);
                            } else if (data === "success") { //if added game is successful

                                //after 1 sec
                                setTimeout(function () {

                                    //play sound
                                    soundEffect("success");

                                    //output game code
                                    messageBox("Your game code: " + newCode);

                                    //clear information from titleBox and textBox
                                    $("#gameTitle").val("");
                                    $("#gameText").val("");
                                    $(".gameQuestText").val("");

                                    //get new request for gamelist
                                    getQuest();

                                    //show list again
                                    cssStyle("#styleAdd", "display", "none");

                                }, 1000);
                            }

                        }, "json");

                    };

                    // onError Callback receives a PositionError object
                    function onError(error) {
                        soundEffect("error");
                        messageBox(error.code + error.message);
                    }

                    //get location
                    navigator.geolocation.getCurrentPosition(onSuccess, onError);
                }

            }

            /*-------------------------*/
            /* add side quest		   */
            /*-------------------------*/
            function addMoreQuest() {

                var questNumber = 1;

                //addMoreQuest
                $("#addMoreQuest").on("click", function () {

                    //vibration
                    vibrationFunction(100);

                    questNumber += 1;

                    $(".adding").append("<div class='col-full questBoxRemove'><div class='wrap-col'>"

                        + "<img src='images/svg/feedback.svg' alt=''>"
                        + "<img class='removeQuest' src='images/svg/close.svg' alt=''>"
                        + "<p>Quest #" + questNumber + "</p>"
                        + "<form>"
                        + "<textarea class='gameQuestText' placeholder='adding more quest...'></textarea>"

                        + "</form>"

                        + "</div></div>");
                });

                $(".adding").on("click", ".removeQuest", function () {
                    console.log("test");
                    $(this, ".questBoxRemove").remove();

                });
            }

        }

        /*-------------------------*/
        /* questBox    			   */
        /*-------------------------*/
        function questBox() {

            //vibration
            vibrationFunction(100);

            //menyButton
            buttons("closeButton", "checkPositionButton");

            //get thread data and show it
            getQuestSub(questID);
        }

        /*-------------------------*/
        /* check users position	   */
        /*-------------------------*/
        function checkUserPosition(id) {

            var serverAddress = address("getQuestSub.php"),
                serverAddress2 = address("updateQuest.php");

            //vibration
            vibrationFunction(100);

            //if location found, countinue with the post
            var onSuccess = function (position) {

                //varible
                var targetLat,
                    targetLong,
                    questExperience,
                    gold;

                //user location
                var lat = position.coords.latitude;
                var long = position.coords.longitude;

                //get quest location
                $.post(serverAddress, { "questID": id, "deviceID": deviceID }, function (data) {

                    for (var x in data) {

                        if (data[x].title === "Active") {
                            targetLat = data[x].latitude;
                            targetLong = data[x].longitude;
                            questExperience = data[x].experience;
                            gold = data[x].gold;
                        }
                    }

                    //distance calc
                    var distance = Math.round(CalculateDistance(targetLat, targetLong, lat, long) * 100) / 100;

                    // Is it in the right distance? (0.01km)
                    if (distance <= 0.02) {
                        soundEffect("success");
                        messageBox("Countinue with your next quest!");

                        //update quest database
                        //$.post(serverAddress2, { "questID": questID, "deviceID": deviceID }, "json");

                        //update content
                        setTimeout(function () {
                            getQuestSub(questID);
                            experienceGain(questExperience);
                            goldGain(gold);
                        }, 1000);
 
                    } else {
                        soundEffect("error");
                        messageBox("You're in the wrong area! <br>" + distance + " km to designated area");
                    }

                }, "json");

            };

            // onError Callback receives a PositionError object
            function onError(error) {
                soundEffect("error");
                messageBox(error.code + error.message);
            }

            //get location
            navigator.geolocation.getCurrentPosition(onSuccess, onError);
        }



        /*-------------------------*/
        /* get quest			   */
        /*-------------------------*/
        function getQuest() {

            var serverAddress = address("getQuest.php");

            //clear content div
            $('#content').empty();

            //get post
            $.post(serverAddress, { "deviceID": deviceID }, function (data) {

                for (var x in data) {

                    $("#content").prepend(
                        "<div id='" + data[x].id + "'class='col-full forumContent lastChild'><div class='wrap-col'>"

                        + "<div class='col-full boxButton'><div class='wrap-col'>"

                        + "<h3>" + data[x].title + "</h3>"
                        + "<img src='images/exclamation_point.svg' alt=''>"
                        + "<img class='subImg' src='images/svg/trophy.svg' alt=''>"
                        + "<p class='subP'>" + data[x].quest + "</p>"
                        
                        + "</div></div>"

                        + "</div></div>");
                }
            }, "json");
        }

        /*-------------------------*/
        /* get sub quest  	       */
        /*-------------------------*/
        function getQuestSub(id) {

            //music.setVolume(0.1);
            //voiceEffect(id);

            var serverAddress = address("getQuestSub");

            //clear content div
            $('#content').empty();

            //get data
            $.post(serverAddress, { "questID": id, "deviceID": deviceID }, function (data) {

                var viewQuestNumber = 0;

                for (var x in data) {

                    viewQuestNumber += 1;

                    $("#content").prepend(
                        "<div class='col-full lastChild " + data[x].title + "'><div class='wrap-col'>"
                        + "<div class='col-full box'><div class='wrap-col'>"

                        + "<h3>" + data[x].text + "</h3>"
                        + "<img class='subImg' src='images/svg/position.svg' alt=''>"
                        + "<p class='subP'>" + data[x].title + "</p>"
                        + "<img class='subImg' src='images/svg/star.svg' alt=''>"
                        + "<p class='subP'>" + data[x].experience + "</p>"
                        + "<img class='subImg' src='images/svg/trophy.svg' alt=''>"
                        + "<p class='subP'>" + viewQuestNumber + "</p>"

                        + "</div></div>"
                        + "</div></div>");
                }
            }, "json");
        }

    /*-------------------------*/
    /*-------------------------*/
    /* protagonist section	   */
    /*-------------------------*/
    /*-------------------------*/

        /*-------------------------*/
        /* new protagonist 		   */
        /*-------------------------*/
        function protagonist() {

            //variable
            var gender,
                race; 

            //button add protagonist
            $("body").on("click", "#protagonistButton", function () { addProt(); });

            //button choose race
            $("#selectRace").on("change", function () {

                //variable
                race = $(this).val();

                //get race information
                getDescription();     

            });

            //select gender female
            $("body").on("click", "#female", function () {
                $(this).addClass("highlight");
                $("#male").removeClass("highlight");
                gender = "female";
                console.log("female");
            });

            //select gender male
            $("body").on("click", "#male", function () {
                $(this).addClass("highlight");
                $("#female").removeClass("highlight");
                gender = "male";
                console.log("male");
            });

            //get protagonist race information
            function getDescription() {

                //variable
                var serverAddress = address("getRaceInformation.php");

                //post data
                $.post(serverAddress, { "race": race }, function (data) { }, "json")

                //callback if everything went okey
                .done(function (data) {

                    //variable
                    var des = data.description,
                        str = data.strength,
                        dex = data.dexterity,
                        lck = data.luck,
                        hp = data.hp,
                        pop = data.popularity,
                        cap = data.capital;

                    $("#p_description").text(des);

                    $("#p_stats").text("Str: " + str + " Dex: " + dex + " lck: " + lck + " HP: " + hp + " Pop: " + pop + " Cap: " + cap);
                        
                })

                .fail(function () { console.log("Error: get race data"); }) //callback if something went wrong
                .always(function () { console.log("Success: get race data"); }); //always do a callback

            }

            //add protagonist function
            function addProt() {

                //variable
                var serverAddress = address("addProtagonist.php"),
                    name = $("#pName").val(),
                    age = "16";

                //post data
                $.post(serverAddress, { "deviceID": deviceID, "name": name, "race": race, "age": age, "gender": gender }, "json")

                //callback if everything went okey
                .done(function (data) {

                    //error in data
                    if (data.trim()) {

                        //output message
                        messageBox(data);

                        //error sound
                        soundEffect("error");

                    //no error in data
                    } else {
                        checkDevice(); //check if device id exist in database
                    }
                })

                .fail(function () { console.log("error: add protagonist"); }) //callback if something went wrong
                .always(function () { console.log("success: add protagonist"); }); //always do a callback
            }
        }

        //get protagonist race pictures
        function getPicture() {

            //variable
            var pictureSource,   // picture source
                destinationType; // sets the format of returned value 
            
            pictureSource = navigator.camera.PictureSourceType;
            destinationType = navigator.camera.DestinationType;
            
            //start process
            navigator.camera.getPicture(cameraSuccess, cameraError, {
                quality: 50,
                destinationType: Camera.DestinationType.DATA_URL
            });

            function cameraSuccess(imageData) {

                $("#p_avatar").html("<img src=data:image/jpeg;base64," + imageData + ">");

                console.log("show picture");
            }

            function cameraError(message) {
                console.log('Error: ' + message);
            }

        }

        /*-------------------------*/
        /* experience gain 		   */
        /*-------------------------*/
        function experienceGain(newExperience) {
            
            //variable
            var serverAddress = address("updateExperience.php");

            $.post(serverAddress, { "deviceID": deviceID, "addExp": newExperience }, function (data) { }, "json")

            //callback if everything went okey
                .done(function (data) { levelUp(data.level); })

                .fail(function () { console.log("error update experience"); }) //callback if something went wrong

                .always(function () { console.log("success: update experience"); }); //always do a callback

            //check if protoganist got level up
            function levelUp(newLevel) {

                //variable
                var baseLevel,
                    addPoints = 2,
                    points = 0,
                    serverAddress = address("getProtagonist.php");

                //get post
                $.post(serverAddress, { "deviceID": deviceID }, function (data) { }, "json")

                    //callback if everything went okey
                    .done(function (data) {

                        baseLevel = data.level;

                        console.log("protLevel: " + baseLevel + " newLevel: " + newLevel);

                        if (baseLevel !== newLevel) {

                            //loop array with data
                            for (var i = baseLevel; i < newLevel; i++) {
                                points += addPoints;
                            }

                            //output message
                            messageBox("Congratulations<br>You are now level " + baseLevel);

                            //error sound
                            soundEffect("success");

                        }

                    })

                    .fail(function () { console.log("error get protagonist level"); }) //callback if something went wrong

                    .always(function () { console.log("success: get protagonist level"); }); //always do a callback

            }

        }

        /*-------------------------*/
        /* gold loot    		   */
        /*-------------------------*/
        function goldGain(addGold) {

            //variable
            var serverAddress = address("updateGold.php");

            $.post(serverAddress, { "deviceID": deviceID, "addGold": addGold }, function (data) { }, "json")

                //callback if everything went okey
                .done(function (data) { messageBox("You found " + addGold + " gold."); })

                .fail(function () { console.log("error update gold"); }) //callback if something went wrong

                .always(function () { console.log("success: update gold"); }); //always do a callback

        }

    /*-------------------------*/
    /*-------------------------*/
    /* map section	           */
    /*-------------------------*/
    /*-------------------------*/

        /*-------------------------*/
        /* initialize map          */
        /*-------------------------*/
        window.getMap = function () {

            //create map
            map = new Microsoft.Maps.Map('#mapContent', {
                credentials: 'yaUBbzkhEYiXdUP5JMGu~eWEOkhy1LA5VNJeXXxVXqw~AjGA6jHbUOVZt8oUEU-nzuzvD6zUS9yQStc8Ud4kiSAgY_z70_5ECE-1rHFdkY5c',
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

            //custom style
            var oldMap = {
                "version": "1.0",
                "settings": {
                    "landColor": "#bf9d70" //landskap
                },
                "elements": {
                    "mapElement": {
                        "labelVisible": false
                    },
                    "political": {
                        "borderStrokeColor": "#987D59",
                        "borderOutlineColor": "#987D59"
                    },
                    "point": {
                        "iconColor": "#987D59",
                        "fillColor": "#987D59",
                        "strokeColor": "#987D59"
                    },
                    "transportation": {
                        "strokeColor": "#987D59", //väg
                        "fillColor": "#987D59" //väg
                    },
                    "sand": {
                        "fillcolor": "#987D59"
                    },
                    "railway": {
                        "strokeColor": "#987D59",
                        "visible": false
                    },
                    "structure": {
                        "fillColor": "#987D59" //industri
                    },
                    "water": {
                        "fillColor": "#ecc080" //vatten
                    },
                    "area": {
                        "fillColor": "#987D59" //park
                    }
                }
            };

            //options
            map.setOptions({
                maxZoom: 15,
                minZoom: 12,
                customMapStyle: oldMap
            });

        };

        /*-------------------------*/
        /* track own position      */
        /*-------------------------*/
        function watchMyPosition() {

            var myPin,
                myPosition;

            var options = {
                maximumAge: 3600000,
                timeout: 30000,
                enableHighAccuracy: true
            };

            function onSuccess(position) {

                // create a new LatLng object for every position update
                myPosition = new Microsoft.Maps.Location(position.coords.latitude, position.coords.longitude);

                // build entire marker first time thru
                if (myPin === undefined) {

                    //users icon
                    myPin = new Microsoft.Maps.Pushpin(myPosition, { icon: "images/map/knight.png" });

                    //view myPosition
                    map.setView({ center: myPosition });

                    //Add the pushpin to the map
                    map.entities.push(myPin);

                } else {

                    //change myPin position on subsequent passes
                    myPin.setLocation(myPosition);

                }

                //update myPosition
                updateMyPosition(position);
            }

            function onError(error) { console.log('Kod: ' + error.code + '\n' + 'Meddelande: ' + error.message + '\n'); }
        
            watchID = navigator.geolocation.watchPosition(onSuccess, onError, options);
        }

        /*-------------------------*/
        /* update own position     */
        /*-------------------------*/
        function updateMyPosition(position) {

            var serverAddress = address("updateLocation.php");

            $.post(serverAddress, {
                "latitude": position.coords.latitude,
                "longitude": position.coords.longitude,
                "deviceID": deviceID
            }, "json");

        }

        /*-------------------------*/
        /* track users position    */
        /*-------------------------*/
        function getUsersPosition() {

            var usersPin;

            var serverAddress = address("getUserLocation.php");

            $.post(serverAddress, { "deviceID": deviceID }, function (data) {

                //loop users id who are online and not same id as the user
                for (var x in data) {

                    // create a new LatLng object for every position update
                    var usersPosition = new Microsoft.Maps.Location(data[x].latitude, data[x].longitude);

                    //users icon
                    usersPin = new Microsoft.Maps.Pushpin(usersPosition, {
                        icon: "images/map/footprints.png",
                        title: data[x].name
                    });

                    //Add the pushpin to the map
                    map.entities.push(usersPin);

                    // Push marker to markers array
                    usersPinArray.push(usersPin);
                }

            }, "json");
        }

        /*-------------------------*/
        /* reset user pins         */
        /*-------------------------*/
       function updateUsersPosition() {

           // Loop through markers and move usersPin
           for (var i = 0; i < usersPinArray.length; i++) {

               var index = map.entities.indexOf(usersPinArray[i]);

               if (index !== -1) { map.entities.removeAt(index); }
           }

           //other user array
           usersPinArray = [];

           //get position of other user
           getUsersPosition();

       }

        /*-------------------------*/
        /* track own quests        */
        /*-------------------------*/
        function getQuestPosition() {

            var questPin;

            var serverAddress = address("getQuestLocation.php");

            $.post(serverAddress, { "deviceID": deviceID }, function (data) {

                //loop users id who are online and not same id as the user
                for (var x in data) {

                    // create a new LatLng object for every position update
                    var questPosition = new Microsoft.Maps.Location(data[x].latitude, data[x].longitude);

                    //users icon
                    questPin = new Microsoft.Maps.Pushpin(questPosition, {
                        icon: "images/map/exclamation_point.png",
                        title: data[x].title
                    });

                    //Add the pushpin to the map
                    map.entities.push(questPin);

                    // Push marker to markers array
                    questPinArray.push(questPin);
                }

            }, "json");
        }

        /*-------------------------*/
        /* update own quest        */
        /*-------------------------*/
        function updateQuestPosition() {

            // Loop through markers and move usersPin
            for (var i = 0; i < questPinArray.length; i++) {

                var index = map.entities.indexOf(questPinArray[i]);

                if (index !== -1) { map.entities.removeAt(index); }
            }

            questPinArray = [];

            getQuestPosition();

        }

    /*-------------------------*/
    /*-------------------------*/
    /* chat section	           */
    /*-------------------------*/
    /*-------------------------*/

        /*-------------------------*/
        /* websocket        	   */
        /*-------------------------*/
        function webSocketConnection() {

            //variable
            var address = "89.160.115.26",
                port = "8090",
                clientID = [];

            //create webSocket connection
            serverWS = new WebSocket("ws://" + address + ":" + port);

            //connection is open
            serverWS.onopen = function () { console.log("Server connection established."); };

            //listen for data
            serverWS.onmessage = function (event) {
                var response = JSON.parse(event.data); //PHP sends Json data

                var type = response.type; //message type
                var message = response.message; //message
                var ip = response.ip; //client ip
                var room = response.room; //game room
                var name = response.name; //client name

                //switch
                switch (type) {
                    case 'client':

                        //check if not null before adding to array and output client name
                        if (ip !== null && name !== null && room !== null && gameCode === room) {

                            //output
                            $('#playerBox').append('<p class=' + name + '>' + name + '</p>');

                            //array push
                            var push = { "ip": ip, "name": name, "room": room };
                            clientID.push(push);
                            console.log(clientID);

                        }

                        break;
                    case 'system':

                        //$('#playerBox').append('<p class=' + name + '>' + "Server " + ip + '</p>');
                        //console.log("Server " + ip);

                        break;
                    case 'disconnect':

                        //loop array
                        for (var i = 0; i < clientID.length; i++) {

                            if (ip === clientID[i].ip && gameCode === clientID[i].room) {

                                console.log("Client: " + ip + " disconnected");

                                //remove client from playerlist
                                var el = document.querySelector('.' + clientID[i].name);
                                el.parentNode.removeChild(el);

                                //remove client from array
                                clientID.splice(i, 1);

                                //show array
                                console.log(clientID);

                            }
                        }
                        break;
                }
            };

            //error connection
            serverWS.onerror = function () { console.log("Server problem due to some Error."); };

            //close connection
            serverWS.onclose = function () { console.log("Server connection Closed."); };

        }

 //end
})();