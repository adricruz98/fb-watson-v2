const request = require("request");
/**
 *  Poste la respuesta de la conversacion al messenger usando el Facebook API https://graph.facebook.com/v6.0/me/messages
 *
 *  @params  {JSON} Parametros para el post de Facebook
 *  @postUrl  {string} Url para postear la respuesta
 *  @access_token  {string} Token de autenticacion de la pagina en Facebook
 *
 *  @return - Status del request al POST API
 */

function postFacebook(response, usrMsg, postUrl, params) {

  const facebookParams = {
    recipient: {
      id: usrMsg.entry[0].messaging[0].sender.id
    },
    // Get payload for regular text message or interactive message
    message: getMessageType(response)
  };

  return new Promise(function(resolve, reject) {
    request(
      {
        url: postUrl,
        qs: { access_token: params.FB_PAGE_ACCESS_TOKEN },
        method: "POST",
        json: facebookParams
      },
      function(error, response) {
        if (error) {
          return reject(error.message);
        }
        if (response) {
          if (response.statusCode === 200) {
            // Facebook expects a "200" string/text response instead of a JSON.
            // With Cloud Functions if we have to return a string/text, then we'd have to specify
            // the field "text" and assign it a value that we'd like to return. In this case,
            // the value to be returned is a statusCode.
            return resolve({
              text: response.statusCode,
              params: usrMsg,
              url: postUrl
            });
          }
          return reject(
            `Action returned with status code ${response.statusCode}, message: ${response.statusMessage}`
          );
        }
        reject(`An unexpected error occurred when sending POST to ${postUrl}.`);
      }
    );
  });
}

/**
 * Evalua los mensajes para extraer el payload interactivo o el mensaje de texto
 *
 * @textMessage Respuesta final para ser enviada a Facebook
 * @response {JSON} - El archivo adjunto o el mensaje de texto
 */
function getMessageType(response) {
  var textMessage = "";
  var arr = [];
  try {
    for (var i of response.result.output.generic) {
      arr.push(i.text);
    }
    var textMessage = arr.join("\n\n");
  } catch (err) {
    reject(err);
  }
  //var textMessage = response.result.output.generic[0].text;
  const interactiveMessage = response.result.output.facebook;

  // If dialog node sends back output.facebook (used for interactive messages such as
  // buttons and templates)
  if (interactiveMessage) {
    // An acceptable interactive JSON could either be of form -> output.facebook or
    // output.facebook.message. Facebook's Send API accepts the "message" payload. So,
    // if you already wrap your interactive message inside "message" object, then we
    // accept it as-is. And if you don't wrap your interactive message inside "message"
    // object, then the code wraps it for you.
    if (interactiveMessage.message) {
      console.log("Output interactive: " + interactiveMessage.message);
      return interactiveMessage.message;
    }
    console.log("Output interactive: " + interactiveMessage);
    return interactiveMessage;
  }
  console.log("Output text: " + textMessage);
  // if regular text message is received
  return { text: textMessage };
}

module.exports = postFacebook;
