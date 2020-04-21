/**
 * Copyright 2020 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

const cfenv = require("cfenv");
const params = require("./params.json");
var appEnv = cfenv.getAppEnv();

var express = require("express");
var bodyParser = require("body-parser"); // parser for post requests
var server = express().use(bodyParser.json()); // creates express http server

var AssistantV2 = require("ibm-watson/assistant/v2"); // watson sdk
var VisualRecognitionV3 = require("ibm-watson/visual-recognition/v3");
var postFacebook = require("./utils/postFacebook");
var sendResponse = require("./utils/sendResponse");
var cleanVRres = require("./utils/cleanVRres");

const {
  IamAuthenticator,
  BearerTokenAuthenticator
} = require("ibm-watson/auth");

// Using some globals for now
var assistant;
var MyAuthenticator;
var WASessionId;
var userRequest;
var watsonResponse;
const postUrl = "https://graph.facebook.com/v6.0/me/messages";
var context = {};
var vrResponse = "";

// Create the service wrapper
if (params.WA_API_KEY) {
  MyAuthenticator = new IamAuthenticator({
    apikey: params.WA_API_KEY
  });
} else if (params.WA_BEARER_TOKEN) {
  MyAuthenticator = new BearerTokenAuthenticator({
    bearerToken: params.WA_BEARER_TOKEN
  });
}

var assistant = new AssistantV2({
  version: "2020-02-05",
  authenticator: MyAuthenticator,
  url: params.WA_URL,
  disableSslVerification:
    params.DISABLE_SSL_VERIFICATION === "true" ? true : false
});

// Creates the endpoint for our webhook
server.post("/webhook", (req, res) => {
  return new Promise(function (resolve, reject) {
    try {
      // Checks this is an event from a page subscription
      if (req.body.object === "page") {
        watsonResponse = null;
        var userMsgBody = req.body;
        callVisualRecognition(userMsgBody)
          .then(() => assistantMessage(userRequest))
          .then(res => {

            if (res == "No session") {
              console.log("No hay sesión");
              createSession()
                .then(() => assistantMessage(userRequest))
                .then(() =>
                  postFacebook(watsonResponse, userMsgBody, postUrl, params)
                )
                .then(() => sendResponse(resolve))
                .catch(err => {
                  console.log(err);
                  reject(errorResponse(err));
                });
            } else {
              console.log("Retomando sesión...");
              postFacebook(watsonResponse, userMsgBody, postUrl, params)
                .then(() => sendResponse(resolve))
                .then(() => {
                  if (
                    watsonResponse.result.output.intents[0] &&
                    (watsonResponse.result.output.intents[0].intent ==
                      "General_Ending" ||
                      watsonResponse.result.output.intents[0].intent ==
                      "Bot_Control_Reject_Response"
                      ||
                      watsonResponse.result.output.generic[0].text.startsWith("De acuerdo, tu reclamación fue enviada")
                    )
                  ) {
                    console.log("Eliminando la sesión...");
                    deleteSession();
                  }
                })
                .catch(err => {
                  console.log(err);
                  reject(errorResponse(err));
                });
            }
          });
        // Returns a '200 OK' response to all requests
        res.status(200).send("EVENT_RECEIVED");
      } else {
        reject({
          text: 404,
          message:
            "Neither a page type request nor a verification type request detected"
        });
      }
    } catch (err) {
      console.error("Caught error: ");
      console.log(err);
      reject(errorResponse(err));
    }
  });
});

// Adds support for GET requests to our webhook
server.get("/webhook", (req, res) => {
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = params.FB_VERIFICATION_TOKEN;

  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

/**
 *  Realiza una evaluacion de una Imagen contra el Visual Recognition
 *  Hace una clasificación de la imagen contra el modelo especificado en la variable vr_model_id del archivo de parametros
 *
 *  @response  {JSON} Resultado con la clasificacion de la imagen
 *
 */
function callVisualRecognition(userMsg) {
  return new Promise(function (resolve, reject) {
    if (
      userMsg.entry[0].messaging[0].message.attachments &&
      userMsg.entry[0].messaging[0].message.attachments[0].type == "image"
    ) {
      console.log("El mensaje es una imagen");
      userRequest = "image";

      var imgUrl =
        userMsg.entry[0].messaging[0].message.attachments[0].payload.url;

      const visualRecognition = new VisualRecognitionV3({
        version: "2018-03-19",
        authenticator: new IamAuthenticator({
          apikey: params.VR_API_KEY
        }),
        url: params.VR_URL
      });

      const classifyParams = {
        url: imgUrl,
        classifierIds: params.VR_MODEL_ID,
        threshold: 0.0
      };

      visualRecognition
        .classify(classifyParams)
        .then(res => cleanVRres(res))
        .then(res => {
          if (res != "") {
            vrResponse = res;
            resolve();
          } else {
            // Cuando no se pasa el filtro de score
            vrResponse = "askForAnother";
            resolve();
          }
        })
        .catch(err => {
          console.log("Error: Classify images: ", err);
          reject(err);
        });
    } else {
      var request = userMsg.entry[0].messaging[0].message.text;
      console.log("El mensaje es texto: " + request);
      userRequest = request;
      resolve();
    }
  });
}

/**
 *  Realiza el llamado al Watson Assistant
 *  Hace un llamado al WA con el texto de entrada
 *
 *  @request  {JSON} Resultado con la clasificacion de la imagen
 *  @return - Respuesta del Watson Assistant
 */
function assistantMessage(request) {
  return new Promise(function (resolve, reject) {
    const input = request ? request : "";

    if (input == "image") {
      console.log("Enviando \"image\" a Watson...");
      context = {
        skills: {
          "main skill": {
            user_defined: {
              vrRes: vrResponse
            }
          }
        },
        global: {
          system: {
            timezone: "America/Bogota"
          }
        }
      };
    } else {
      context = {
        global: {
          system: {
            timezone: "America/Bogota"
          }
        }
      };
    }



    console.log("Context sended: " + JSON.stringify(context, null, 2));

    try {
      assistant
        .message({
          assistantId: params.WA_ASSISTANT_ID,
          sessionId: WASessionId,
          context: context,
          input: {
            text: input,
            // Devolver contexto para monitoreo de las variables
            options: {
              return_context: true
            }
          }
        })
        .then(res => {
          watsonResponse = res;
          console.log("WatsonResponse: " + JSON.stringify(res, null, 2));
          resolve();
        })
        .catch(err => {
          //No hay sesión activa
          if ((err.message = "Invalid Session")) {
            resolve("No session");
          }
        });
    } catch (error) {
      reject(error);
    }
  });
}

// =========================================

function createSession() {
  return new Promise(function (resolve, reject) {
    try {
      assistant
        .createSession({
          assistantId: params.WA_ASSISTANT_ID
        })
        .then(res => {
          WASessionId = res.result.session_id;
          resolve();
        })
        .catch(err => {
          console.log("Create session error: " + err);
        });
    } catch (error) {
      reject(error);
    }
  });
}

// =========================================

function deleteSession() {
  return new Promise(function (resolve, reject) {
    try {
      context = {};
      assistant
        .deleteSession({
          assistantId: params.WA_ASSISTANT_ID,
          sessionId: WASessionId
        })
        .then(res => {
          console.log(JSON.stringify("Delete session: " + res, null, 2));
        })
        .catch(err => {
          console.log(err);
        });
    } catch (error) {
      reject(error);
    }
  });
}

// =========================================

function errorResponse(reason) {
  return {
    text: 400,
    message: reason || "An unexpected error occurred. Please try again later."
  };
}

server.listen(appEnv.port, "0.0.0.0", function () {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

module.exports = server;
