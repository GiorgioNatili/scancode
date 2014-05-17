/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var app = {
    // Application Constructor

    canSend: false,
    codeAcquired: false,
    position: null,
    initialize: function () {

        this.bindEvents();

    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function () {
        document.addEventListener('deviceready', this.onDeviceReady, false);

    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function () {

        $('#error-acquired').hide();
        $('#sendEmail').show();

        app.resetCodeFields();

        $('#page_0').bind('loadpanel', function (e) {

            app.resetCodeFields();

        });

        $('#page_1').bind('loadpanel', function (e) {

            app.acquireQRCode();

        });

        $('#page_2').bind('loadpanel', function (e) {

            app.clearForm();

        });

        $('#sendEmail').bind('submit', app.onSendData);

        $('#sendEmail input[type="text"]').bind('keypress', function (evt) {

            if (app.validateEmail(this.value) && app.codeAcquired === true) {

                app.canSend = true;

            } else {

                app.canSend = false

            }

        });

    },

    onSendData: function (evt) {

        evt.preventDefault();

        if (!app.canSend) {

            navigator.notification.alert('You can\'t send data if you don\'t acquire a code, insert an e-mail and allow the device to detect your position');
            return;

        }

        console.log('going to send data');

        var today = new Date(),
            data = {code: localStorage.getItem('lastCodeRead'), /* codice letto dal datamatrix */
                coords: app.position.coords.latitude + ' . ' + app.position.coords.longitude, /* coordinate gps */
                date: today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear() + '   ' + today.getHours() + ':' + today.getMinutes(), /* data e ora della lettura*/
                email: $('#sendEmail input[type="text"]').val(), /* indirizzo di destinazione specificato dell'utente*/
                token: 'edb1e70e6799475b12970e6323172f9a'}, /* questo mandalo sempre così */
            theData = JSON.stringify(data);

        console.log(theData);

        try {
            
            $.ui.showMask();

            $.ajax({
                type: "post",
                url: "http://gcm.qwertystudio.it/api/values/",
                contentType: "application/json; charset=utf-8",
                data: theData,// now data come in this function
                success: function (data) {

                    navigator.notification.alert("success");// write success in " "
                   $.ui.hideMask();
                   $.ui.loadContent('#page_0', false, false, 'left');
                   location.reload();
                   
                },

                error: function (xhr, err) {

                   // error handler
                   navigator.notification.alert(err.message);
                   $.ui.hideMask();
                   $.ui.loadContent('#page_0', false, false, 'left');
                   location.reload();
                   
                }

            });

        } catch (error) {

            navigator.notification.alert('something went wrong, ' + error.message);

        }


    },

    validateEmail: function (email) {

        // var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        var re = /\S+@\S+\.\S+/;
        return re.test(email);

    },

    clearForm: function () {

        $('#sendEmail input[type="text"]').val('');
        app.canSend = false;

    },

    resetCodeFields: function () {

        $('#page_0 .lastCodeRead span').text(localStorage.getItem('lastCodeRead') || '');
        $('#page_2 .lastCodeRead span').text('');

    },

    acquireQRCode: function () {

        var zoomFactor = '2.7';
        cordova.plugins.barcodeScanner.scan(app.onQRCodeSuccess, app.onQRCodeFailure, [zoomFactor]);

    },

    onQRCodeSuccess: function (result) {

        $('#page_0 .lastCodeRead span').text(result.text);
        $('#page_2 .lastCodeRead span').text(result.text);

        localStorage.setItem('lastCodeRead', result.text);

        $('#error-acquired').hide();

        app.codeAcquired = true;

        navigator.geolocation.getCurrentPosition(app.onCoordinateSuccess, app.onCoordinateFailure);

        /*
         alert("We got a barcode\n" +
         "Result: " + result.text + "\n" +
         "Format: " + result.format + "\n" +
         "Cancelled: " + result.cancelled);
         */

    },

    onCoordinateSuccess: function (position) {

        app.position = position;
        app.canSend = true;

        $.ui.loadContent('#page_2', false, false, 'up');

    },

    onCoordinateFailure: function (error) {

        navigator.notification.alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
        app.canSend = false;

    },

    onQRCodeFailure: function (error) {

        $('#error-acquired').show();
        $('#sendEmail').hide();

        navigator.notification.alert('error accessing the QRCode');

    }
};
