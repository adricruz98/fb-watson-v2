/**
 *  Cada vez que facebook usa el Webhook espera un texto "200"
 *
 *  @resolve - Status del request al POST API
 */
function sendResponse(resolve) {
  // Everytime facebook pings the "receive" endpoint/webhook, it expects a
  // "200" string/text response in return. In Cloud Functions, if we'd want to return
  // a string response, then it's necessary that we add a field "text" and the
  // response "200" as the value. The field "text" tells Cloud Functions that this
  // endpoint must return a "text" response.
  // Response code 200 only tells us that receive was able to execute it's code
  // successfully but it doesn't really tell us if the sub-pipeline or the
  // batched-messages pipeline that are invoked as a part of it returned a successful
  // response or not. Hence, we return the activation id of the appropriate action so
  // that the user can retrieve it's details for debugging purposes.
  resolve({
    text: 200,
    message: `Response code 200 above only tells you that receive action was invoked successfully.
      However, it does not really say if the Facebook API was invoked successfully. `
  });
}

module.exports = sendResponse;